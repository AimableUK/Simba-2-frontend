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
  Loader2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderApi, branchApi, cartApi, userApi } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { useSession } from "@/lib/auth-client";
import { formatPrice, getImageUrl } from "@/lib/utils";
import Link from "next/link";
import { CalendarWithTime } from "@/components/common/CalendarWithTime";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { useBranchStore } from "@/store";

//  Types

type FormData = {
  fullName: string;
  phone: string;
  street?: string;
  district?: string;
  sector?: string;
  notes?: string;
};

//  Main component

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const { data: session } = useSession();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => userApi.me().then((r) => r.data),
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5,
  });
  const {
    items,
    total,
    deliveryFee,
    grandTotal,
    isLoading: cartLoading,
  } = useCart();
  const qc = useQueryClient();

  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [paymentMethod, setPaymentMethod] = useState<"dpo" | "cash">("dpo");
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
  const [branchSwitchPending, setBranchSwitchPending] = useState<{
    branch: any;
    available: Array<{
      productId: string;
      quantity: number;
    }>;
    unavailable: Array<{
      productId: string;
      name: string;
      requested: number;
      available: number;
    }>;
  } | null>(null);
  const [branchChecking, setBranchChecking] = useState(false);
  const { selectedBranchId: storedBranchId, setBranch } = useBranchStore();

  // Pickup time state
  const [selectedPickupDate, setSelectedPickupDate] = useState<Date | undefined>(
    undefined,
  );
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [pickupError, setPickupError] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const isPickup = fulfillmentType === "pickup";
  const notesLabel = isPickup ? t("pickupNotes") : t("deliveryNotes");
  const cashLabel = isPickup ? t("cashOnArrival") : t("cashOnDelivery");
  const cashDesc = isPickup ? t("cashOnArrivalDesc") : t("cashOnDeliveryDesc");

  // Build schema with translated error messages
  const schema = z.object({
    fullName: z.string().min(2, t("errors.fullNameMin")),
    phone: z.string().min(10, t("errors.phoneMin")),
    street: z.string().optional(),
    district: z.string().optional(),
    sector: z.string().optional(),
    notes: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  useEffect(() => {
    if (!session?.user) return;

    reset((current) => ({
      ...current,
      fullName: profile?.name || (session.user as any)?.name || "",
      phone: profile?.phone || (session.user as any)?.phone || "",
    }));
  }, [profile, reset, session?.user]);

  useEffect(() => {
    if (storedBranchId) {
      setSelectedBranchId(storedBranchId);
    }
  }, [storedBranchId]);

  const migrateCartToBranch = async (
    branch: any,
    keepItems: Array<{
      productId: string;
      quantity: number;
    }>,
  ) => {
    const currentBranchId = storedBranchId || selectedBranchId;

    if (currentBranchId && currentBranchId !== branch.id) {
      await cartApi.clear(currentBranchId);
    }

    if (!keepItems.length) {
      await qc.invalidateQueries({ queryKey: ["cart"] });
      return;
    }

    for (const item of keepItems) {
      await cartApi.add({
        productId: item.productId,
        quantity: item.quantity,
        branchId: branch.id,
      });
    }

    await qc.invalidateQueries({ queryKey: ["cart"] });
  };

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
        if (storedBranchId) {
          setSelectedBranchId(storedBranchId);
        } else if (list.length > 0) {
          setSelectedBranchId(list[0].id);
          setBranch(list[0].id, list[0].slug, list[0].name);
        }
      } catch {
        toast.error(t("errors.branchLoadFailed"));
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchBranches();
  }, [t, storedBranchId, setBranch]);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setServerErrors([]);
      setDeliveryError("");

      let valid = true;
      if (!selectedBranchId) {
        setBranchError(t("errors.branchRequired"));
        valid = false;
      }
      if (fulfillmentType === "pickup") {
        if (!selectedPickupDate || !selectedPickupTime) {
          setPickupError(t("errors.pickupRequired"));
          valid = false;
        }
      } else {
        if (!formData.street?.trim()) {
          setDeliveryError(t("errors.streetMin"));
          valid = false;
        }
        if (!formData.district?.trim()) {
          setDeliveryError(t("errors.districtMin"));
          valid = false;
        }
      }
      if (!valid) throw new Error(t("errors.fillRequired"));

      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        branchId: selectedBranchId,
        fulfillmentType,
        ...(fulfillmentType === "pickup"
          ? { pickupTime: selectedPickupTime }
          : {
              deliveryStreet: formData.street?.trim(),
              deliveryDistrict: formData.district?.trim(),
              deliverySector: formData.sector?.trim(),
            }),
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

  const verifyBranchAvailability = async (branch: any) => {
    if (!items.length) {
      setSelectedBranchId(branch.id);
      setBranch(branch.id, branch.slug, branch.name);
      setBranchError("");
      return;
    }

    setBranchChecking(true);
    try {
      const productIds = items.map((item) => item.productId).join(",");
      const res = await branchApi.stock(branch.id, { productIds });
      const branchItems = Array.isArray(res.data?.data) ? res.data.data : [];
      const stockMap = new Map<string, { stock: number }>(
        branchItems.map((entry: any) => [
          entry.productId,
          { stock: Number(entry.stock) || 0 },
        ]),
      );

      const unavailable = items
        .map((item) => {
          const stockEntry = stockMap.get(item.productId);
          const available = stockEntry?.stock ?? 0;
          if (!stockEntry || available < item.quantity) {
            return {
              productId: item.productId,
              name: item.product.name,
              requested: item.quantity,
              available,
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{
        productId: string;
        name: string;
        requested: number;
        available: number;
      }>;

      const availableItems = items
        .filter((item) => {
          const stockEntry = stockMap.get(item.productId);
          const available = stockEntry?.stock ?? 0;
          return stockEntry && available >= item.quantity;
        })
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

      if (unavailable.length === 0) {
        await migrateCartToBranch(branch, availableItems);
        setSelectedBranchId(branch.id);
        setBranch(branch.id, branch.slug, branch.name);
        setBranchError("");
        toast.success(
          t("branchSwitched", {
            branch: branch.name.replace("Simba Supermarket ", ""),
          }),
        );
        return;
      }

      setBranchSwitchPending({ branch, available: availableItems, unavailable });
      setBranchError("");
    } catch {
      toast.error(t("errors.branchLoadFailed"));
    } finally {
      setBranchChecking(false);
    }
  };

  const confirmBranchSwitch = () => {
    if (!branchSwitchPending) return;
    void (async () => {
      await migrateCartToBranch(branchSwitchPending.branch, branchSwitchPending.available);
      setSelectedBranchId(branchSwitchPending.branch.id);
      setBranch(
        branchSwitchPending.branch.id,
        branchSwitchPending.branch.slug,
        branchSwitchPending.branch.name,
      );
      setBranchSwitchPending(null);
      toast.success(
        t("branchSwitchedRemoved", {
          branch: branchSwitchPending.branch.name.replace(
            "Simba Supermarket ",
            "",
          ),
        }),
      );
    })();
  };

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
            href={`/${locale}/admin/my-orders/${success.orderId}`}
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
                      onClick={() => verifyBranchAvailability(branch)}
                      disabled={branchChecking}
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

            {/* Fulfillment type */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t("delivery")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    {
                      value: "pickup",
                      label: t("pickupOrder"),
                      desc: t("pickupOrderDesc"),
                    },
                    {
                      value: "delivery",
                      label: t("deliveryOrder"),
                      desc: t("deliveryOrderDesc"),
                    },
                  ] as const
                ).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFulfillmentType(value);
                      setPickupError("");
                      setDeliveryError("");
                    }}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      fulfillmentType === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${
                        fulfillmentType === value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
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

            {fulfillmentType === "pickup" ? (
              <>
                {/* Pickup time */}
                <CalendarWithTime
                  title={t("pickupTime")}
                  description={t("pickupNote")}
                  selectedDate={selectedPickupDate}
                  selectedTime={selectedPickupTime}
                  onDateChange={(date) => {
                    setSelectedPickupDate(date);
                    setPickupError("");
                  }}
                  onTimeChange={(time) => {
                    setSelectedPickupTime(time);
                    setPickupError("");
                  }}
                  dateLabel={t("pickupDate")}
                  timeLabel={t("pickupTime")}
                  note={t("pickupNote")}
                  locale={locale}
                  openingHour={8}
                  closingHour={20}
                  leadTimeMinutes={60}
                  maxDaysAhead={3}
                />
                {pickupError && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {pickupError}
                  </p>
                )}
              </>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t("deliveryAddress")}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    label={t("street")}
                    error={errors.street?.message}
                    required
                    className="sm:col-span-2"
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
                </div>
                {deliveryError && (
                  <p className="text-sm text-destructive mt-3 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {deliveryError}
                  </p>
                )}
              </div>
            )}

            {/* Contact info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t("contact")}
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
                  label={notesLabel}
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
                      value: "cash",
                      label: cashLabel,
                      icon: Banknote,
                      desc: cashDesc,
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

              {fulfillmentType === "pickup" && selectedPickupDate && selectedPickupTime && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("pickupDateTime")}
                  </p>
                  <p className="text-xs font-medium">
                    {selectedPickupDate.toLocaleDateString(locale, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(selectedPickupTime).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              )}
              {fulfillmentType === "delivery" && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("deliveryAddress")}
                  </p>
                  <p className="text-xs font-medium">
                    {[watch("street"), watch("district")]
                      .filter(Boolean)
                      .join(", ") || "—"}
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
                disabled={
                  mutation.isPending ||
                  isSubmitting ||
                  branchesLoading ||
                  branchChecking ||
                  !isValid ||
                  !selectedBranchId ||
                  (fulfillmentType === "pickup" && !selectedPickupTime) ||
                  (fulfillmentType === "delivery" &&
                    (!watch("street") || !watch("district"))) ||
                  items.length === 0
                }
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

      {branchSwitchPending && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setBranchSwitchPending(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2">
              {t("branchSwitchTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t("branchSwitchDescription", {
                branch: branchSwitchPending.branch.name.replace(
                  "Simba Supermarket ",
                  "",
                ),
              })}
            </p>

            <div className="space-y-3 mb-5">
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  If you switch to this branch,{" "}
                  {branchSwitchPending.unavailable.length} item
                  {branchSwitchPending.unavailable.length === 1 ? "" : "s"}{" "}
                  will be removed because they are not available there.
                </p>
              </div>
              {branchSwitchPending.unavailable.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("branchSwitchRequestedAvailable", {
                        requested: item.requested,
                        available: item.available,
                      })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-destructive shrink-0">
                    {t("branchSwitchRemove")}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmBranchSwitch}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors"
              >
                {t("branchSwitchConfirm")}
              </button>
              <button
                type="button"
                onClick={() => setBranchSwitchPending(null)}
                className="flex-1 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                {t("branchSwitchCancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


