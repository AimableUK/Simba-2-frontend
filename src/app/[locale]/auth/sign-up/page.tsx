"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ShoppingCart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { signUp, signIn } from "@/lib/auth-client";
import { FormField, FormInput } from "@/components/ui/form-field";
import { toast } from "sonner";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex gap-3 mt-2">
      {checks.map(({ label, ok }) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${ok ? "bg-green-500" : "bg-muted-foreground/40"}`}
          />
          <span
            className={`text-[11px] transition-colors ${ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SignUpPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const PERKS = [
    t("signup.features.feature1"),
    t("signup.features.feature2"),
    t("signup.features.feature3"),
    t("signup.features.feature4"),
  ];

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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: `/${locale}`,
      });
      if (result.error) {
        toast.error(result.error.message || "Sign up failed");
      } else {
        toast.success("Welcome to Simba Super Market! 🎉");
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch {
      toast.error("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    toast.error("Google sign in Currently Unavailable");
    // setGoogleLoading(true);
    // try {
    //   await signIn.social({ provider: "google", callbackURL: `/${locale}` });
    // } catch {
    //   toast.error("Google sign in failed");
    //   setGoogleLoading(false);
    // }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/*  Left panel: branding  */}
      <div className="hidden lg:flex flex-col justify-between bg-foreground p-12 relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)",
            backgroundSize: "32px 32px",
            opacity: 0.4,
          }}
        />

        <div className="relative z-10">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <span className="text-background font-bold text-xl">
              Simba Super Market
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">
              {t("signup.title")}
            </p>
            <h2 className="text-4xl font-bold text-background leading-tight">
              {t("signup.subtitle")}
            </h2>
            <p className="text-background/60 mt-4">{t("signup.description")}</p>
          </div>

          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-background/80 text-sm">{perk}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {["K", "A", "M", "J"].map((initial, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-primary/80 border-2 border-foreground flex items-center justify-center text-white text-xs font-bold"
                >
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-background/70 text-sm">
              <span className="text-background font-semibold">2,000+</span>{" "}
              {t("signup.customer")}
            </p>
          </div>
        </div>

        <p className="relative z-10 text-background/40 text-xs">
          &copy; 2025 Simba Super Market, Kigali Rwanda
        </p>
      </div>

      {/*  Right panel: form  */}
      <div className="flex items-center justify-center px-6 py-10 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 mb-8 lg:hidden"
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">Simba Super Market</span>
          </Link>

          <h1 className="mb-3 text-2xl font-bold text-foreground">
            {t("signUp")}
          </h1>

          {/* Google */}
          {/* <button
            onClick={handleGoogle}
            // disabled={googleLoading}
            disabled
            className="w-full flex items-center justify-center gap-3 border border-border bg-background hover:bg-muted py-3 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 mb-5"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {t("continueWithGoogle")}
          </button> */}

          {/* Divider */}
          {/* <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">
              {t("orContinueWith")}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div> */}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label={t("name")} error={errors.name?.message} required>
              <FormInput
                registration={register("name")}
                error={!!errors.name}
                placeholder={t("name")}
                autoComplete="name"
              />
            </FormField>

            <FormField
              label={t("email")}
              error={errors.email?.message}
              required
            >
              <FormInput
                registration={register("email")}
                error={!!errors.email}
                type="email"
                autoComplete="email"
                placeholder={t("email")}
              />
            </FormField>

            <FormField
              label={t("phone")}
              error={errors.phone?.message}
              optional
            >
              <FormInput
                registration={register("phone")}
                type="tel"
                autoComplete="tel"
                placeholder={t("phone")}
              />
            </FormField>

            {/* Password */}
            <FormField
              label={t("password")}
              error={errors.password?.message}
              required
            >
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("password")}
                  className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 text-sm pr-11 transition-all ${errors.password ? "border-destructive focus:ring-destructive/20 bg-destructive/5" : "border-border focus:ring-primary/40 focus:border-primary"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordStrength password={password} />
            </FormField>

            {/* Confirm password */}
            <FormField
              label={t("confirmPassword")}
              error={errors.confirmPassword?.message}
              required
            >
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 text-sm pr-11 transition-all ${errors.confirmPassword ? "border-destructive focus:ring-destructive/20 bg-destructive/5" : "border-border focus:ring-primary/40 focus:border-primary"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("loading")}
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mb-3">
            <p className="text-muted-foreground mt-1.5 text-sm">
              {t("hasAccount")}{" "}
              <Link
                href={`/${locale}/auth/sign-in`}
                className="text-primary font-semibold hover:underline"
              >
                {t("signInHere")}
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            {t("agreeTerms")}{" "}
            <Link
              href={`/${locale}/terms-of-service`}
              className="hover:text-primary underline underline-offset-2"
            >
              Terms of Service,
            </Link>{" "}
            <Link
              href={`/${locale}/privacy-policy`}
              className="hover:text-primary underline underline-offset-2"
            >
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
