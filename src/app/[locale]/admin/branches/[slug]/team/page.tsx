"use client";

import { use, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Search, Send, UserPlus, Users } from "lucide-react";
import { branchApi, userApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { Skeleton } from "@/components/common/skeletons";
import type { BranchStaffInvite, User } from "@/types";

export default function BranchTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const qc = useQueryClient();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.branchTeam");
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteRole, setInviteRole] = useState<"branch_manager" | "branch_staff">(
    "branch_staff",
  );
  const [message, setMessage] = useState("");

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ["admin-branch-team", resolvedParams.slug],
    queryFn: () => branchApi.get(resolvedParams.slug).then((r) => r.data),
  });
  const branchId = branch?.id as string | undefined;

  const { data: managerScope } = useQuery({
    queryKey: ["branch-team-scope", role],
    queryFn: () => branchApi.dashboard().then((r) => r.data),
    enabled: role === "branch_manager",
  });

  useEffect(() => {
    if (
      role === "branch_manager" &&
      managerScope?.branch?.slug &&
      branch?.slug &&
      managerScope.branch.slug !== branch.slug
    ) {
      router.replace(`/${locale}/admin/branches/${managerScope.branch.slug}/team`);
    }
  }, [branch?.slug, locale, managerScope?.branch?.slug, role, router]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["branch-team-users", search],
    queryFn: () =>
      userApi.adminList({ page: 1, limit: 10, search }).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: invites } = useQuery({
    queryKey: ["branch-team-invites", branchId],
    queryFn: () => branchApi.adminInvites(branchId!).then((r) => r.data),
    enabled: !!branchId,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: {
      branchId: string;
      userId: string;
      role: string;
      message?: string;
    }) => branchApi.createInvite(data),
    onSuccess: () => {
      toast.success(t("sent"));
      setSelectedUser(null);
      setMessage("");
      qc.invalidateQueries({ queryKey: ["branch-team-invites"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("failed")),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/admin/branches/${resolvedParams.slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBranch")}
        </Link>
      </div>

      {branchLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">{branch?.name} {t("teamTitle")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("inviteDescription")}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t("inviteTeamMember")}</h2>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {usersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[22rem] overflow-y-auto pr-1">
              {usersData?.data?.map((user: User) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selectedUser?.id === user.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                        {user.role.replace("_", " ")}
                      </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">{t("role")}</span>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "branch_manager" | "branch_staff")
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="branch_staff">{t("branchStaff")}</option>
                <option value="branch_manager">{t("branchManager")}</option>
              </select>
            </label>
            <label className="block">
                <span className="block text-sm font-medium mb-1.5">
                {t("optionalNote")}
              </span>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("shortMessage")}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          <button
            onClick={() =>
              selectedUser &&
              branchId &&
              inviteMutation.mutate({
                branchId,
                userId: selectedUser.id,
                role: inviteRole,
                message: message.trim() || undefined,
              })
            }
            disabled={!selectedUser || inviteMutation.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            {inviteMutation.isPending ? t("sending") : t("sendInvite")}
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t("pendingInvites")}</h2>
          </div>

          <div className="space-y-3">
            {(invites || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noPendingInvites")}</p>
            ) : (
              (invites as BranchStaffInvite[]).map((invite) => (
                <div
                  key={invite.id}
                  className="border border-border rounded-xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      {invite.invitee?.name || invite.inviteeEmail}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                        invite.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : invite.status === "accepted"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {invite.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {invite.role.replace("_", " ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
