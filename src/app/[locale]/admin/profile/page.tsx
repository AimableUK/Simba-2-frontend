"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useSession, signOut } from "@/lib/auth-client";
import { userApi } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Package, LogOut } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const t = useTranslations("admin.profile");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userApi.me().then((r) => r.data),
    enabled: !!session?.user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  useEffect(() => {
    if (profile) reset({ name: profile.name, phone: profile.phone || "" });
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => userApi.updateMe(data),
    onSuccess: () => {
      toast.success("Profile updated!");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">
          {t("signInPrompt")}
        </p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

  const role = (profile?.role || (session?.user as any)?.role) as string;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>

      <div className="grid gap-4 mb-8">
        {[
          {
            href: `/${locale}/admin/my-orders`,
            icon: Package,
            label: t("myOrders"),
            desc: t("trackOrders"),
          },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors"
          >
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Profile edit form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          {t("details")}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("fullName")}
              </label>
              <input
                {...register("name")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("email")}</label>
              <input
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-sm cursor-not-allowed text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("emailLocked")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("phoneNumber")}
              </label>
              <input
                {...register("phone")}
                placeholder={t("phonePlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("role")}</label>
              <div className="px-4 py-3 rounded-xl border border-border bg-muted text-sm capitalize text-muted-foreground">
                {role?.replace("_", " ")}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={mutation.isPending || !isValid}
                className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? t("saving") : t("save")}
              </button>
              <button
                type="button"
                onClick={() =>
                  signOut({
                    fetchOptions: {
                      onSuccess: () => router.push(`/${locale}`),
                    },
                  })
                }
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {tAuth("signOut")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
