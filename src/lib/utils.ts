import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "RWF"): string {
  return `${currency} ${amount.toLocaleString("en-RW")}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getImageUrl(path: string): string {
  if (!path) return "https://placehold.co/400x400/f5f5f5/999?text=No+Image";
  if (path.startsWith("http")) return path;
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";
  return `${base}${path}`;
}

export function resolveLocalizedPath(path: string, locale: string): string {
  if (!path.startsWith("/")) return path;
  const localePrefix = `/${locale}`;
  if (path === localePrefix || path.startsWith(`${localePrefix}/`)) {
    return path;
  }
  return `${localePrefix}${path}`;
}

export function truncate(text: string, length = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "…";
}

export function getDiscountPercent(
  price: number,
  comparePrice?: number,
): number | null {
  if (!comparePrice || comparePrice <= price) return null;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export const ORDER_STATUS_STEPS = [
  "pending",
  "confirmed",
  "packaged",
  "on_the_way",
  "delivered",
] as const;

export function getOrderStatusIndex(status: string): number {
  return ORDER_STATUS_STEPS.indexOf(status as any);
}
