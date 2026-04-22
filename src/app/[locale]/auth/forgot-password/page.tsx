"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
      });
      setSent(true);
    } catch {
      toast.error("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Simba Super Market</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-1">
            {t("forgotPassword")}
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email to receive a reset link
          </p>
        </div>

        {sent ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
            <p className="font-semibold text-green-700 dark:text-green-400 mb-2">
              Email Sent!
            </p>
            <p className="text-sm text-muted-foreground">{t("resetSent")}</p>
            <Link
              href={`/${locale}/auth/sign-in`}
              className="mt-4 inline-block text-primary hover:underline text-sm"
            >
              ← {t("signIn")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? t("loading") : "Send Reset Link"}
            </button>
            <Link
              href={`/${locale}/auth/sign-in`}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t("signIn")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
