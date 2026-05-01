"use client";

import { useMemo, useState } from "react";
import { MapPin, LocateFixed, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  lat?: number | string | null;
  lng?: number | string | null;
  onChange: (value: { lat: string; lng: string }) => void;
  label?: string;
  hint?: string;
};

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapSrc(lat: number, lng: number) {
  const delta = 0.008;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
  label,
  hint,
}: Props) {
  const t = useTranslations("admin.profile");
  const [loading, setLoading] = useState(false);
  const parsedLat = toNumber(lat);
  const parsedLng = toNumber(lng);

  const iframeSrc = useMemo(() => {
    if (parsedLat !== null && parsedLng !== null) {
      return mapSrc(parsedLat, parsedLng);
    }
    return "";
  }, [parsedLat, parsedLng]);

  const useCurrentLocation = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      !window.isSecureContext
    ) {
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{label || t("deliveryMap")}</p>
          <p className="text-xs text-muted-foreground">
            {hint || t("deliveryMapHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          {t("useCurrentLocation")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Latitude
          </span>
          <input
            type="number"
            step="any"
            value={lat ?? ""}
            onChange={(e) => onChange({ lat: e.target.value, lng: String(lng ?? "") })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="-1.95"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Longitude
          </span>
          <input
            type="number"
            step="any"
            value={lng ?? ""}
            onChange={(e) => onChange({ lat: String(lat ?? ""), lng: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="30.06"
          />
        </label>
      </div>

      {parsedLat !== null && parsedLng !== null ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <iframe
            title="Selected location map"
            src={iframeSrc}
            className="h-72 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("deliveryMapEmpty")}
          </span>
        </div>
      )}
    </div>
  );
}
