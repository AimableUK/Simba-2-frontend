"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { userApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { TableRowSkeleton } from "@/components/common/skeletons";
import { Pagination } from "@/components/common/pagination";
import { useSession } from "@/lib/auth-client";
import type { User } from "@/types";

const ROLES = [
  "user",
  "poster",
  "admin",
  "super_admin",
  "branch_manager",
  "branch_staff",
];
const ROLE_COLORS: Record<string, string> = {
  user: "bg-muted text-muted-foreground",
  poster: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  admin:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  super_admin:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  branch_manager:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  branch_staff:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const t = useTranslations("admin.users");
  const { data: session } = useSession();
  const canEditRoles = (session?.user as any)?.role === "super_admin";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: () =>
      userApi
        .adminList({ page, limit: 20, search, role: roleFilter })
        .then((r) => r.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      userApi.updateRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      setSelectedUser(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t("allRoles")}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {formatRole(r)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  t("cols.user"),
                  t("cols.email"),
                  t("cols.phone"),
                  t("cols.role"),
                  t("cols.orders"),
                  t("cols.joined"),
                  t("cols.actions"),
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                : data?.data?.map((user: User) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.phone || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role]}`}
                        >
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user._count?.branchOrders || 0}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {canEditRoles && user.id !== session?.user?.id && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                            }}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                          >
                            <Shield className="h-3.5 w-3.5" /> {t("changeRole")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
      />

      {/* Role change modal */}
      {selectedUser && canEditRoles && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-1">{t("changeRole")}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedUser.name} · {selectedUser.email}
            </p>
            <div className="space-y-3 mb-6">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setNewRole(role)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all text-sm ${
                    newRole === role
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${newRole === role ? "bg-primary" : "bg-muted-foreground"}`}
                  />
                  <span className="capitalize">{formatRole(role)}</span>
                  {role === "super_admin" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t("roles.super_admin")}
                    </span>
                  )}
                  {role === "admin" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t("roles.admin")}
                    </span>
                  )}
                  {role === "poster" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t("roles.poster")}
                    </span>
                  )}
                  {role === "branch_manager" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t("roles.branch_manager")}
                    </span>
                  )}
                  {role === "branch_staff" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t("roles.branch_staff")}
                    </span>
                  )}
                  {role === "user" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t("roles.user")}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  roleMutation.mutate({ id: selectedUser.id, role: newRole })
                }
                disabled={
                  roleMutation.isPending || newRole === selectedUser.role
                }
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {roleMutation.isPending ? t("saving") : t("updateRole")}
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-3 border border-border rounded-xl hover:bg-muted transition-colors font-medium"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
