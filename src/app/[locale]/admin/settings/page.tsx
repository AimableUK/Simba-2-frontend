"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { settingsApi } from "@/lib/api";
import { Skeleton } from "@/components/common/skeletons";

const SETTINGS_FIELDS = [
  { key: "store_name", label: "Store Name", placeholder: "Simba Super Market" },
  {
    key: "store_email",
    label: "Store Email",
    placeholder: "info@simbasupermarket.rw",
  },
  { key: "store_phone", label: "Store Phone", placeholder: "+250 788 000 000" },
  {
    key: "store_address",
    label: "Store Address",
    placeholder: "Kigali, Rwanda",
  },
  { key: "delivery_fee", label: "Delivery Fee (RWF)", placeholder: "1000" },
  {
    key: "free_delivery_threshold",
    label: "Free Delivery Threshold (RWF)",
    placeholder: "50000",
  },
  { key: "currency", label: "Currency Code", placeholder: "RWF" },
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get().then((r) => r.data),
  });

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => settingsApi.update(data),
    onSuccess: () => {
      toast.success("Settings saved!");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Store Configuration</h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {SETTINGS_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5">
                  {label}
                </label>
                <input
                  value={values[key] || ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>
            ))}

            <div className="pt-4">
              <button
                onClick={() => mutation.mutate(values)}
                disabled={mutation.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                {mutation.isPending ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
