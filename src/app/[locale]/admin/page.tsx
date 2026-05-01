"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function AdminIndexPage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const role = (session?.user as any)?.role || "user";

  useEffect(() => {
    if (isPending || !session?.user) return;

    const target =
      role === "branch_staff"
        ? `/${locale}/admin/account`
        : `/${locale}/admin/dashboard`;

    router.replace(target);
  }, [isPending, locale, role, router, session?.user]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
