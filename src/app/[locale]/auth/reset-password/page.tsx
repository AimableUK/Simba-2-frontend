"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle, Lock, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { resetPassword } from "@/lib/auth-client";
import { FormField, FormInput } from "@/components/ui/form-field";
import { toast } from "sonner";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const password = watch("password") || "";

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token");
    }
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({
        newPassword: data.password,
        token,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to reset password");
        return;
      }

      setDone(true);
      toast.success("Password updated successfully");
      setTimeout(() => {
        router.push(`/${locale}/auth/sign-in`);
        router.refresh();
      }, 1200);
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[#fc7d00] p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <ShoppingCart
                key={`${row}-${col}`}
                className="absolute h-16 w-16 text-white"
                style={{
                  top: `${row * 20}%`,
                  left: `${col * 30}%`,
                  transform: "rotate(-15deg)",
                }}
              />
            )),
          )}
        </div>

        <div className="relative z-10">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">
              Simba Super Market
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              {t("resetPassword")}
            </h2>
            <p className="text-white/80 mt-4 text-lg">
              Enter a new password and we'll update your account securely.
            </p>
          </div>

          <div className="w-fit rounded-2xl bg-white/15 px-4 py-3 text-white/90 text-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4" />
              <span>Use the secure link from your email to continue.</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-white/60 text-xs">
          &copy; 2025 Simba Super Market, Kigali Rwanda
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[420px]"
        >
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 mb-8 lg:hidden"
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Simba Super Market</span>
          </Link>

          <h1 className="mb-2 text-2xl font-bold text-foreground">
            {t("resetPassword")}
          </h1>
          <p className="text-muted-foreground text-sm mb-7">
            Enter your new password below to finish resetting your account.
          </p>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  Password updated
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  You can now sign in with your new password.
                </p>
                <Link
                  href={`/${locale}/auth/sign-in`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {!token && (
                  <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    The reset link is missing its token. Please request a new
                    reset email.
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    label={t("password")}
                    error={errors.password?.message}
                    required
                  >
                    <div className="relative">
                      <FormInput
                        registration={register("password", {
                          required: "Password is required",
                        })}
                        error={!!errors.password}
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="********"
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                      >
                        {showPw ? "Hide" : "Show"}
                      </button>
                    </div>
                  </FormField>

                  <FormField
                    label={t("confirmPassword")}
                    error={errors.confirmPassword?.message}
                    required
                  >
                    <div className="relative">
                      <FormInput
                        registration={register("confirmPassword", {
                          required: "Please confirm your password",
                        })}
                        error={!!errors.confirmPassword}
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="********"
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                      >
                        {showConfirm ? "Hide" : "Show"}
                      </button>
                    </div>
                  </FormField>

                  {password && (
                    <p className="text-xs text-muted-foreground">
                      Make sure your password is strong and easy for you to
                      remember.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !isValid || !token}
                    className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      t("resetPassword")
                    )}
                  </button>
                </form>

                <Link
                  href={`/${locale}/auth/sign-in`}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-6"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
