"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Search, Send, UserPlus, Trash2, Users } from "lucide-react";
import { branchApi, userApi } from "@/lib/api";
import Image from "next/image";

export default function BranchTeamPage() {
  const router = useRouter();
  const locale = useLocale();
  const qc = useQueryClient();
  const t = useTranslations("branchDashboard");
  const tTeam = useTranslations("admin.branchTeam");
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteRole, setInviteRole] = useState<"branch_staff" | "driver">(
    "branch_staff",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (role === "super_admin") {
      router.replace(`/${locale}/admin/branches`);
      return;
    }
    if (role !== "branch_manager") {
      router.replace(`/${locale}/branch-dashboard`);
    }
  }, [role, locale, router]);

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ["branch-dashboard"],
    queryFn: () => branchApi.dashboard().then((r) => r.data),
  });

  const branch = dashData?.branch;
  const branchId = branch?.id;

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["branch-team-users", search],
    queryFn: () =>
      userApi.adminList({ page: 1, limit: 10, search }).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: invites, isLoading: invitesLoading } = useQuery({
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
      toast.success(tTeam("sent"));
      setSelectedUser(null);
      setMessage("");
      qc.invalidateQueries({ queryKey: ["branch-team-invites"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || tTeam("failed")),
  });

  if (role !== "branch_manager") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (dashLoading || !branchId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{t("team")}</h1>
          <p className="text-sm text-muted-foreground">{branch?.name}</p>
        </div>
      </div>

      {/* Current team */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">
            {tTeam("teamMembers", { count: branch?.staff?.length || 0 })}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {(branch?.staff || []).map((member: any) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                  {member.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.user?.email}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  member.role === "branch_manager"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                }`}
              >
                {member.role.replace("_", " ")}
              </span>
            </div>
          ))}
          {!(branch?.staff || []).length && (
            <div className="px-5 py-8 text-sm text-muted-foreground text-center">
              {tTeam("noTeamMembers")}
            </div>
          )}
        </div>
      </div>

      {/* Invite new member */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold mb-4">{tTeam("inviteNew")}</h2>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tTeam("searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {usersData?.data?.length > 0 && !selectedUser && (
            <div className="border border-border rounded-xl overflow-hidden">
              {usersData.data.slice(0, 5).map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedUser && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {selectedUser.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
          <select
            value={inviteRole}
            onChange={(e) =>
              setInviteRole(e.target.value as "branch_staff" | "driver")
            }
            disabled={!selectedUser}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            <option value="branch_staff">{tTeam("branchStaff")}</option>
            <option value="driver">{tTeam("driver")}</option>
          </select>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={tTeam("optionalNote")}
            disabled={!selectedUser}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={() =>
              selectedUser &&
              inviteMutation.mutate({
                branchId: branch!.id,
                userId: selectedUser.id,
                role: inviteRole,
                message: message || undefined,
              })
            }
            disabled={!selectedUser || inviteMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            {inviteMutation.isPending ? tTeam("sending") : tTeam("sendInvite")}
          </button>
        </div>
      </div>

      {/* Pending invites */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">{tTeam("pendingInvites")}</h2>
        </div>
        {invitesLoading ? (
          <div className="px-5 py-8 text-sm text-muted-foreground text-center">
            Loading...
          </div>
        ) : invites?.length === 0 ? (
          <div className="px-5 py-8 text-sm text-muted-foreground text-center">
            {tTeam("noPendingInvites")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invites?.map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium">{inv.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.user?.email}
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      inv.status === "pending"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : inv.status === "accepted"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
