"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { contactApi } from "@/lib/api";
import { useState } from "react";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";

type FormData = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<FormData>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => contactApi.submit(data),
    onSuccess: () => {
      setSent(true);
      reset();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to send message"),
  });

  const info = [
    {
      icon: MapPin,
      label: t("address"),
      value: t("addressValue"),
      href: `https://maps.google.com/?q=${encodeURIComponent(t("addressValue"))}`,
    },
    {
      icon: Mail,
      label: t("emailLabel"),
      value: "info@simbasupermarket.rw",
      href: "mailto:info@simbasupermarket.rw",
    },
    {
      icon: Phone,
      label: t("phoneLabel"),
      value: "+250 788 000 000",
      href: "tel:+250788000000",
    },
    {
      icon: Clock,
      label: t("hours"),
      value: `${t("hoursValue")}\n${t("hoursValueSun")}`,
      href: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/5 border-b border-border py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-xl font-bold">{t("touch")}</h2>
            <div className="space-y-5">
              {info.map(({ icon: Icon, label, value, href }) => {
                const content = (
                  <div className="flex gap-4 group pb-2">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      {value.split("\n").map((v, i) => (
                        <p key={i} className="text-muted-foreground text-sm">
                          {v}
                        </p>
                      ))}
                    </div>
                  </div>
                );

                return href ? (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="cursor-pointer"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={label}>{content}</div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t("messageSent")}</h3>
                <p className="text-muted-foreground">{t("success")}</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-primary hover:underline text-sm"
                >
                  {t("sendOtherMessage")}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit((d) => mutation.mutate(d))}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold mb-5">{t("send")}</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("name")}
                    error={errors.name?.message}
                    required
                  >
                  <FormInput
                      registration={register("name", {
                        required: "Name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters",
                        },
                      })}
                      error={!!errors.name}
                      placeholder={t("name")}
                    />
                  </FormField>
                  <FormField
                    label={t("email")}
                    error={errors.email?.message}
                    required
                  >
                  <FormInput
                      registration={register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Please enter a valid email address",
                        },
                      })}
                      error={!!errors.email}
                      type="email"
                      placeholder={t("email")}
                    />
                  </FormField>
                </div>

                <FormField
                  label={t("phone")}
                  error={errors.phone?.message}
                  optional
                >
                  <FormInput
                    registration={register("phone", {
                      pattern: {
                        value: /^[0-9+()\-\s]{7,20}$/,
                        message: "Please enter a valid phone number",
                      },
                    })}
                    error={!!errors.phone}
                    type="tel"
                    placeholder={t("phone")}
                  />
                </FormField>

                <FormField
                  label={t("subject")}
                  error={errors.subject?.message}
                  required
                >
                  <FormInput
                    registration={register("subject", {
                      required: "Subject is required",
                      minLength: {
                        value: 3,
                        message: "Subject must be at least 3 characters",
                      },
                    })}
                    error={!!errors.subject}
                    placeholder={t("subject")}
                  />
                </FormField>

                <FormField
                  label={t("message")}
                  error={errors.message?.message}
                  required
                >
                  <FormTextarea
                    registration={register("message", {
                      required: "Message is required",
                      minLength: {
                        value: 10,
                        message: "Message must be at least 10 characters",
                      },
                    })}
                    error={!!errors.message}
                    rows={4}
                    placeholder={t("messagePlaceholder")}
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={mutation.isPending || !isValid}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {mutation.isPending ? t("sending") : t("send")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
