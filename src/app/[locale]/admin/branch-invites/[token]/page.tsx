"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { branchApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export default function BranchInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  const respond = useMutation({
    mutationFn: (action: "accept" | "decline") =>
      branchApi.respondInvite(params.token, action),
    onSuccess: (res: any) => {
      toast.success("Invite updated");
      const slug = res?.data?.branch?.slug;
      router.replace(slug ? `/${locale}/admin/branches/${slug}` : `/${locale}/admin/branches`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to update invite"),
    onSettled: () => setBusy(null),
  });

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl">
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Branch invite</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to view and respond to this invitation.
          </p>
          <Link
            href={`/${locale}/auth/sign-in`}
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 max-w-xl">
      <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
        <h1 className="text-2xl font-bold">Branch invite</h1>
        <p className="text-sm text-muted-foreground">
          You have a branch team invitation. Accept it to join the branch team,
          or decline it if it is not for you.
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
            {busy === "accept" ? "Accepting..." : "Accept invite"}
          </button>
          <button
            onClick={() => {
              setBusy("decline");
              respond.mutate("decline");
            }}
            disabled={busy !== null}
            className="border border-border px-5 py-3 rounded-xl font-medium hover:bg-muted disabled:opacity-50"
          >
            {busy === "decline" ? "Declining..." : "Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}
