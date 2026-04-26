"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  CreditCard,
  Banknote,
  CheckCircle,
  Package,
  AlertCircle,
  MapPin,
  Clock,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderApi } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useSession } from "@/lib/auth-client";
import { formatPrice, getImageUrl } from "@/lib/utils";
import Link from "next/link";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";

//  Pickup time helpers

function generatePickupSlots(
  todayLabel: string,
  tomorrowLabel: string,
  locale: string,
): { label: string; value: string }[] {
  const slots: { label: string; value: string }[] = [];
  const now = new Date();

  for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
    const date = new Date(now);
    date.setDate(now.getDate() + dayOffset);

    const dayLabel =
      dayOffset === 0
        ? todayLabel
        : dayOffset === 1
          ? tomorrowLabel
          : date.toLocaleDateString(locale, {
              weekday: "long",
              month: "short",
              day: "numeric",
            });

    for (let hour = 8; hour < 20; hour++) {
      for (const minute of [0, 30]) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        if (
          dayOffset === 0 &&
          slotDate.getTime() < now.getTime() + 60 * 60 * 1000
        ) {
          continue;
        }

        const timeLabel = slotDate.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        slots.push({
          label: `${dayLabel} — ${timeLabel}`,
          value: slotDate.toISOString(),
        });
      }
    }
  }

  return slots;
}

//  Types

type FormData = {
  fullName: string;
  phone: string;
  street: string;
  district: string;
  sector?: string;
  notes?: string;
};

//  Main component

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const { data: session } = useSession();
  const {
    items,
    total,
    deliveryFee,
    grandTotal,
    isLoading: cartLoading,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<
    "dpo" | "cash_on_delivery"
  >("dpo");
  const [success, setSuccess] = useState<{
    orderNumber: string;
    orderId: string;
  } | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  // Branch state
  const [branches, setBranches] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchError, setBranchError] = useState("");

  // Pickup time state
  const [pickupSlots, setPickupSlots] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [pickupError, setPickupError] = useState("");

  // Build schema with translated error messages
  const schema = z.object({
    fullName: z.string().min(2, t("errors.fullNameMin")),
    phone: z.string().min(10, t("errors.phoneMin")),
    street: z.string().min(3, t("errors.streetMin")),
    district: z.string().min(2, t("errors.districtMin")),
    sector: z.string().optional(),
    notes: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  // Generate slots after mount so locale + translations are available
  useEffect(() => {
    const slots = generatePickupSlots(t("today"), t("tomorrow"), locale);
    setPickupSlots(slots);
    if (slots.length > 0) setSelectedPickupTime(slots[0].value);
  }, [locale, t]);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_BASE}/branches`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.branches || [];
        setBranches(list);
        if (list.length > 0) setSelectedBranchId(list[0].id);
      } catch {
        toast.error(t("errors.branchLoadFailed"));
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchBranches();
  }, [t]);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setServerErrors([]);

      let valid = true;
      if (!selectedBranchId) {
        setBranchError(t("errors.branchRequired"));
        valid = false;
      }
      if (!selectedPickupTime) {
        setPickupError(t("errors.pickupRequired"));
        valid = false;
      }
      if (!valid) throw new Error(t("errors.fillRequired"));

      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        branchId: selectedBranchId,
        pickupTime: selectedPickupTime,
        notes: formData.notes || undefined,
        paymentMethod,
      };

      const res = await orderApi.create(payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (paymentMethod === "dpo" && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setSuccess({
          orderNumber: data.order.orderNumber,
          orderId: data.order.id,
        });
      }
    },
    onError: (err: any) => {
      const response = err?.response?.data;

      if (response?.errors && Array.isArray(response.errors)) {
        const msgs: string[] = response.errors.map(
          (e: any) =>
            `${e.path?.join(".") || e.field || t("errors.field")}: ${e.message}`,
        );
        setServerErrors(msgs);
        toast.error(t("errors.fixErrors"));
        return;
      }

      const msg = response?.message || err?.message || t("errors.orderFailed");
      toast.error(msg);
      setServerErrors([msg]);
    },
  });

  //  Guards

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">{t("signInPrompt")}</p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("success")}</h1>
        <p className="text-muted-foreground mb-6">
          {t("successDesc", { number: success.orderNumber })}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={`/${locale}/account/orders/${success.orderId}`}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            {t("trackOrder")}
          </Link>
          <Link
            href={`/${locale}/shop`}
            className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  if (!cartLoading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <p className="text-muted-foreground mb-4">{t("emptyCart")}</p>
        <Link
          href={`/${locale}/shop`}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          {t("browseProducts")}
        </Link>
      </div>
    );
  }

  const onSubmit = (formData: FormData) => {
    if (items.length === 0) {
      toast.error(t("errors.cartEmpty"));
      return;
    }
    mutation.mutate(formData);
  };

  //  Render

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>

      {serverErrors.length > 0 && (
        <div className="mb-6 bg-destructive/10 border border-destructive/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive text-sm mb-1">
                {t("errors.fixErrors")}
              </p>
              <ul className="space-y-0.5">
                {serverErrors.map((e, i) => (
                  <li key={i} className="text-sm text-destructive/90">
                    • {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid lg:grid-cols-3 gap-8">
          {/*  Left: Form  */}
          <div className="lg:col-span-2 space-y-6">
            {/* Branch selector */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {t("selectBranch")}
              </h2>

              {branchesLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t("loadingBranches")}</span>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {branches.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        setSelectedBranchId(branch.id);
                        setBranchError("");
                      }}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedBranchId === branch.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <MapPin
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          selectedBranchId === branch.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight">
                          {branch.name?.replace("Simba Supermarket ", "") ||
                            branch.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {branch.address}
                        </p>
                        {branch.hours && (
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                            🕐 {branch.hours}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {branchError && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {branchError}
                </p>
              )}
            </div>

            {/* Pickup time */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t("pickupTime")}
              </h2>

              <div className="relative">
                <select
                  value={selectedPickupTime}
                  onChange={(e) => {
                    setSelectedPickupTime(e.target.value);
                    setPickupError("");
                  }}
                  className={`w-full appearance-none bg-background border-2 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-primary transition-colors ${
                    pickupError ? "border-destructive" : "border-border"
                  }`}
                >
                  <option value="">{t("selectPickupTime")}</option>
                  {pickupSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {pickupError && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {pickupError}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                {t("pickupNote")}
              </p>
            </div>

            {/* Contact info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t("delivery")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  label={t("fullName")}
                  error={errors.fullName?.message}
                  required
                  className="sm:col-span-2"
                >
                  <FormInput
                    registration={register("fullName")}
                    error={!!errors.fullName}
                    placeholder={t("placeholders.fullName")}
                    autoComplete="name"
                  />
                </FormField>

                <FormField
                  label={t("phone")}
                  error={errors.phone?.message}
                  required
                >
                  <FormInput
                    registration={register("phone")}
                    error={!!errors.phone}
                    type="tel"
                    placeholder={t("placeholders.phone")}
                    autoComplete="tel"
                  />
                </FormField>

                <FormField
                  label={t("street")}
                  error={errors.street?.message}
                  required
                >
                  <FormInput
                    registration={register("street")}
                    error={!!errors.street}
                    placeholder={t("placeholders.street")}
                  />
                </FormField>

                <FormField
                  label={t("district")}
                  error={errors.district?.message}
                  required
                >
                  <FormInput
                    registration={register("district")}
                    error={!!errors.district}
                    placeholder={t("placeholders.district")}
                  />
                </FormField>

                <FormField
                  label={t("sector")}
                  error={errors.sector?.message}
                  optional
                >
                  <FormInput
                    registration={register("sector")}
                    placeholder={t("placeholders.sector")}
                  />
                </FormField>

                <FormField
                  label={t("notes")}
                  error={errors.notes?.message}
                  optional
                  className="sm:col-span-2"
                >
                  <FormTextarea
                    registration={register("notes")}
                    rows={2}
                    placeholder={t("placeholders.notes")}
                  />
                </FormField>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {t("payment")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    {
                      value: "dpo",
                      label: t("dpo"),
                      icon: CreditCard,
                      desc: t("dpoDesc"),
                    },
                    {
                      value: "cash_on_delivery",
                      label: t("cod"),
                      icon: Banknote,
                      desc: t("codDesc"),
                    },
                  ] as const
                ).map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 shrink-0 ${
                        paymentMethod === value
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/*  Right: Order Summary  */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">{t("review")}</h2>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <Image
                        src={getImageUrl(item.product.images[0])}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        x{item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-semibold shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {selectedBranchId && branches.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("pickupBranch")}
                  </p>
                  <p className="text-xs font-medium">
                    {branches
                      .find((b) => b.id === selectedBranchId)
                      ?.name?.replace("Simba Supermarket ", "") || "—"}
                  </p>
                </div>
              )}

              {selectedPickupTime && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("pickupTime")}
                  </p>
                  <p className="text-xs font-medium">
                    {pickupSlots.find((s) => s.value === selectedPickupTime)
                      ?.label || "—"}
                  </p>
                </div>
              )}

              <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("deliveryFee")}</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>{t("totalAmount")}</span>
                  <span className="text-primary">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending || isSubmitting || branchesLoading}
                className="w-full mt-5 bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {mutation.isPending || isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {t("processing")}
                  </>
                ) : paymentMethod === "dpo" ? (
                  t("payNow")
                ) : (
                  t("placeOrder")
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                {t("termsPrefix")}{" "}
                <Link
                  href={`/${locale}/terms`}
                  className="hover:text-primary underline underline-offset-2"
                >
                  {t("terms")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
