"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ShoppingCart, Truck, Shield, Star } from "lucide-react";
import { motion } from "framer-motion";
import { signIn } from "@/lib/auth-client";
import { FormField, FormInput } from "@/components/ui/form-field";
import { toast } from "sonner";

type FormData = {
  email: string;
  password: string;
};

export default function SignInPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const TRUST_ITEMS = [
    { icon: Truck, text: t("signin.features.feature1") },
    { icon: Shield, text: t("signin.features.feature2") },
    { icon: Star, text: t("signin.features.feature3") },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({ mode: "onBlur", reValidateMode: "onBlur" });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: `/${locale}`,
      });
      if (result.error) {
        toast.error(result.error.message || "Invalid email or password");
      } else {
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch {
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    toast.error("Google sign in Currently Unavailable");
    // setGoogleLoading(true);
    // try {
    //   await signIn.social({
    //     provider: "google",
    //     callbackURL: `/${locale}`,
    //   });
    // } catch {
    //   toast.error("Google sign in failed");
    //   setGoogleLoading(false);
    // }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/*  Left panel: branding  */}
      <div className="hidden lg:flex flex-col justify-between bg-[#fc7d00] p-12 relative overflow-hidden">
        {/* Background pattern */}
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
              {t("signin.title")}
            </h2>
            <p className="text-white/80 mt-4 text-lg">
              {t("signin.description")}
            </p>
          </div>

          <div className="space-y-4">
            {TRUST_ITEMS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/60 text-xs">
          &copy; 2025 Simba Super Market, Kigali Rwanda
        </p>
      </div>

      {/*  Right panel: form  */}
      <div className="flex items-center justify-center px-6 py-12 bg-background">
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

          <h1 className=" mt-3 text-2xl font-bold text-foreground">
            {t("signIn")}
          </h1>

          {/* Google button */}
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

          {/* Email form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label={t("email")}
              error={errors.email?.message}
              required
            >
              <FormInput
                registration={register("email", {
                  required: "Please enter your email",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email",
                  },
                })}
                error={!!errors.email}
                type="email"
                autoComplete="email"
                placeholder={t("email")}
              />
            </FormField>

            <FormField
              label={t("password")}
              error={errors.password?.message}
              required
            >
              <div className="relative">
                <FormInput
                  registration={register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  error={!!errors.password}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-11"
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
            </FormField>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 rounded-xl transition-all mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("loading")}
                </>
              ) : (
                t("signIn")
              )}
            </button>
          </form>
          <div className="mt-3">
            <p className="text-muted-foreground mt-1.5 text-sm">
              {t("noAccount")}{" "}
              <Link
                href={`/${locale}/auth/sign-up`}
                className="text-primary font-semibold hover:underline"
              >
                {t("signUpHere")}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
