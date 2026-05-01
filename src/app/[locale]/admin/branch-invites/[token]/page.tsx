"use client";

import { use } from "react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { branchApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export default function BranchInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations("admin.branchInvite");
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  const respond = useMutation({
    mutationFn: (action: "accept" | "decline") =>
      branchApi.respondInvite(token, action),
    onSuccess: (res: any) => {
      toast.success(t("updated"));
      const slug = res?.data?.branch?.slug;
      const role = res?.data?.role;
      if (role === "branch_staff" || role === "branch_manager") {
        router.replace(`/${locale}/branch-dashboard`);
        return;
      }
      router.replace(slug ? `/${locale}/admin/branches/${slug}` : `/${locale}/admin/branches`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || t("failed")),
    onSettled: () => setBusy(null),
  });

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl">
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("signInPrompt")}
          </p>
          <Link
            href={`/${locale}/auth/sign-in`}
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium"
          >
            {t("signIn")}
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl">
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("invalidToken")}
          </p>
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium"
          >
            {t("goBack")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 max-w-xl">
      <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => {
              setBusy("accept");
              respond.mutate("accept");
            }}
            disabled={busy !== null}
            className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {busy === "accept" ? t("accepting") : t("accept")}
          </button>
          <button
            onClick={() => {
              setBusy("decline");
              respond.mutate("decline");
            }}
            disabled={busy !== null}
            className="border border-border px-5 py-3 rounded-xl font-medium hover:bg-muted disabled:opacity-50"
          >
            {busy === "decline" ? t("declining") : t("decline")}
          </button>
        </div>
      </div>
    </div>
  );
}
