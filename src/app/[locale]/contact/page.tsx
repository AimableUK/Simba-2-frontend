"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { contactApi } from "@/lib/api";
import { useState } from "react";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
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
    { icon: MapPin, label: t("address"), value: t("addressValue") },
    { icon: Mail, label: t("emailLabel"), value: "info@simbasupermarket.rw" },
    { icon: Phone, label: t("phoneLabel"), value: "+250 788 000 000" },
    {
      icon: Clock,
      label: t("hours"),
      value: `${t("hoursValue")}\n${t("hoursValueSun")}`,
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
            <h2 className="text-xl font-bold">Get in Touch</h2>
            <div className="space-y-5">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
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
              ))}
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mt-8">
              <p className="font-semibold text-primary mb-1">
                Kigali Delivery & Pick-up Only
              </p>
              <p className="text-sm text-muted-foreground">
                We currently serve within Kigali city at 9 branch locations.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">{t("success")}</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-primary hover:underline text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit((d) => mutation.mutate(d))}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold mb-5">Send a Message</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("name")}
                    error={errors.name?.message}
                    required
                  >
                    <FormInput
                      registration={register("name")}
                      error={!!errors.name}
                      placeholder="Enter your name"
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
                      placeholder="Enter your email"
                    />
                  </FormField>
                </div>

                <FormField
                  label={t("phone")}
                  error={errors.phone?.message}
                  optional
                >
                  <FormInput
                    registration={register("phone")}
                    type="tel"
                    placeholder="Enter your phone number"
                  />
                </FormField>

                <FormField
                  label={t("subject")}
                  error={errors.subject?.message}
                  required
                >
                  <FormInput
                    registration={register("subject")}
                    error={!!errors.subject}
                    placeholder="Order issue, feedback..."
                  />
                </FormField>

                <FormField
                  label={t("message")}
                  error={errors.message?.message}
                  required
                >
                  <FormTextarea
                    registration={register("message")}
                    error={!!errors.message}
                    rows={4}
                    placeholder="Tell us how we can help..."
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={mutation.isPending}
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
