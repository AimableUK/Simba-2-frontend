"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { settingsApi } from "@/lib/api";
import { Skeleton } from "@/components/common/skeletons";
import { useSession } from "@/lib/auth-client";
import { FormField, FormInput } from "@/components/ui/form-field";

const SETTINGS_FIELDS = [
  { key: "store_name", labelKey: "storeName", placeholder: "Simba Super Market" },
  {
    key: "store_email",
    labelKey: "storeEmail",
    placeholder: "info@simbasupermarket.rw",
  },
  { key: "store_phone", labelKey: "storePhone", placeholder: "+250 788 000 000" },
  {
    key: "store_address",
    labelKey: "storeAddress",
    placeholder: "Kigali, Rwanda",
  },
  { key: "delivery_fee", labelKey: "deliveryFee", placeholder: "1000" },
  {
    key: "free_delivery_threshold",
    labelKey: "freeDeliveryThreshold",
    placeholder: "50000",
  },
  { key: "currency", labelKey: "currencyCode", placeholder: "RWF" },
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const t = useTranslations("admin.settings");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = ["admin", "super_admin"].includes(
    ((session?.user as any)?.role || "") as string,
  );

  useEffect(() => {
    if (session?.user && !canEdit) {
      router.replace(`/${locale}/admin/account`);
    }
  }, [canEdit, locale, router, session?.user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<Record<string, string>>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: Object.fromEntries(
      SETTINGS_FIELDS.map((field) => [field.key, ""]),
    ),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then((r) => r.data),
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => settingsApi.update(data),
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error(t("failed")),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      {!canEdit && (
        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          You do not have access to system settings.
        </div>
      )}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">{t("storeConfiguration")}</h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((vals) => mutation.mutate(vals))}
            className="space-y-4"
          >
            {SETTINGS_FIELDS.map(({ key, labelKey, placeholder }) => (
              <FormField
                key={key}
                label={t(`fields.${labelKey}`)}
                error={errors[key]?.message}
                required
              >
                <FormInput
                  registration={register(key, {
                    required: `${t(`fields.${labelKey}`)} is required`,
                  })}
                  error={!!errors[key]}
                  disabled={!canEdit}
                  placeholder={placeholder}
                />
              </FormField>
            ))}

            {canEdit && (
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={mutation.isPending || !isValid}
                  className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {mutation.isPending ? t("saving") : t("save")}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
