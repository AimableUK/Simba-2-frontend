"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart, ArrowLeft, MailCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    if (!email.trim()) return;
    setLoading(true);
    try {
      await requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
      });
      setSent(true);
    } catch {
      toast.error(t("errors.sendResetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px]"
      >
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg">Simba Super Market</span>
        </Link>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <MailCheck className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {t("forgotPage.sentTitle")}
              </h1>
              <p className="text-muted-foreground text-sm mb-1">
                {t("forgotPage.sentDescription")}
              </p>
              <p className="font-semibold text-foreground mb-6">{email}</p>
              <p className="text-xs text-muted-foreground mb-8">
                {t("forgotPage.spamHint")}{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-primary hover:underline font-medium"
                >
                  {t("forgotPage.tryAgain")}
                </button>
              </p>
              <Link
                href={`/${locale}/auth/sign-in`}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t("backToSignIn")}
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h1 className="text-2xl font-bold mb-2">{t("forgotPassword")}</h1>
              <p className="text-muted-foreground text-sm mb-7">
                {t("forgotPage.description")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("placeholders.email")}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all placeholder:text-muted-foreground/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {t("forgotPage.sending")}
                    </>
                  ) : (
                    t("forgotPage.sendLink")
                  )}
                </button>
              </form>

              <Link
                href={`/${locale}/auth/sign-in`}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-6"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t("backToSignIn")}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
