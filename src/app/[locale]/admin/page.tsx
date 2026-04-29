import { redirect } from "next/navigation";
import { use } from "react";

export default function AdminIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  redirect(`/${locale}/admin/dashboard`);
}
