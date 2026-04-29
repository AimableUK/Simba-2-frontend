"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus, Edit, Trash2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { bannerApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import Image from "next/image";
import type { Banner } from "@/types";

export default function AdminBannersPage() {
  const qc = useQueryClient();
  const t = useTranslations("admin.banners");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    isActive: true,
    sortOrder: 0,
  });

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => bannerApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => bannerApi.create(data),
    onSuccess: () => {
      toast.success(t("created"));
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      bannerApi.update(id, data),
    onSuccess: () => {
      toast.success(t("updated"));
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannerApi.delete(id),
    onSuccess: () => {
      toast.success(t("deleted"));
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      link: banner.link || "",
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({
      title: "",
      subtitle: "",
      image: "",
      link: "",
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!form.title || !form.image) return;
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" /> {t("add")}
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : banners?.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners?.map((banner: Banner) => (
            <div
              key={banner.id}
              className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row"
            >
              <div className="relative h-36 sm:w-64 shrink-0 bg-muted">
                <Image
                  src={getImageUrl(banner.image)}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  sizes="256px"
                />
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base">{banner.title}</h3>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${banner.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                    >
                      {banner.isActive ? t("active") : t("inactive")}
                    </span>
                  </div>
                  {banner.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.link && (
                    <p className="text-xs text-primary mt-1 truncate">
                      {banner.link}
                    </p>
                  )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("sortOrder")}: {banner.sortOrder}
                    </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEdit(banner)}
                    className="flex items-center gap-1.5 text-sm text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" /> {t("edit")}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(banner.id)}
                    className="flex items-center gap-1.5 text-sm text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t("delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={closeForm}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">
                {editing ? t("editBanner") : t("addBanner")}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                {
                  key: "title",
                  label: t("fields.title"),
                  placeholder: "Fresh Groceries...",
                  required: true,
                },
                {
                  key: "subtitle",
                  label: t("fields.subtitle"),
                  placeholder: "Shop the freshest...",
                  required: false,
                },
                {
                  key: "image",
                  label: t("fields.imageUrl"),
                  placeholder: "https://...",
                  required: true,
                },
                {
                  key: "link",
                  label: t("fields.linkUrl"),
                  placeholder: "/shop",
                  required: false,
                },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5">
                    {label}
                  </label>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t("sortOrder")}
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isActive: e.target.checked }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm font-medium">{t("fields.active")}</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    !form.title.trim() ||
                    !form.image.trim()
                  }
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? t("saving")
                    : editing
                      ? t("update")
                      : t("create")}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-3 border border-border rounded-xl hover:bg-muted transition-colors font-medium"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
