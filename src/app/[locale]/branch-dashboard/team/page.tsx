"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { branchApi } from "@/lib/api";

export default function BranchTeamRedirectPage() {
  const router = useRouter();
  const locale = useLocale();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "super_admin") {
      router.replace(`/${locale}/admin/branches`);
      return;
    }

    if (role !== "branch_manager") {
      router.replace(`/${locale}/branch-dashboard`);
      return;
    }

    branchApi
      .dashboard()
      .then((r) => {
        const slug = r.data?.branch?.slug;
        if (slug) {
          router.replace(`/${locale}/admin/branches/${slug}/team`);
        } else {
          router.replace(`/${locale}/branch-dashboard`);
        }
      })
      .catch(() => {
        router.replace(`/${locale}/branch-dashboard`);
      })
      .finally(() => setLoading(false));
  }, [role, locale, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
