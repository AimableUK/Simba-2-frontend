"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Edit,
  Trash2,
  X,
  MapPin,
  Clock,
  Star,
  Phone,
  Users,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { branchApi } from "@/lib/api";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Skeleton } from "@/components/common/skeletons";

const schema = z.object({
  name: z.string().min(2, "Branch name is required"),
  address: z.string().min(3, "Address is required"),
  district: z.enum(["Gasabo", "Kicukiro", "Nyarugenge"], {
    error: () => ({ message: "Select a valid Kigali district" }),
  }),
  lat: z.coerce.number().min(-3).max(-1).optional().or(z.literal("")),
  lng: z.coerce.number().min(29).max(31).optional().or(z.literal("")),
  phone: z.string().optional(),
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format: HH:MM")
    .default("08:00"),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format: HH:MM")
    .default("20:00"),
  sortOrder: z.coerce.number().int().default(0),
});
type FormData = z.infer<typeof schema>;

const SEED_BRANCHES = [
  {
    name: "Simba Supermarket Remera",
    address: "Remera, Kigali",
    district: "Gasabo",
    lat: -1.9441,
    lng: 30.1178,
    sortOrder: 1,
  },
  {
    name: "Simba Supermarket Kimironko",
    address: "Kimironko, Kigali",
    district: "Gasabo",
    lat: -1.9355,
    lng: 30.1274,
    sortOrder: 2,
  },
  {
    name: "Simba Supermarket Kacyiru",
    address: "Kacyiru, Kigali",
    district: "Gasabo",
    lat: -1.9423,
    lng: 30.0942,
    sortOrder: 3,
  },
  {
    name: "Simba Supermarket Nyamirambo",
    address: "Nyamirambo, Kigali",
    district: "Nyarugenge",
    lat: -1.9836,
    lng: 30.0434,
    sortOrder: 4,
  },
  {
    name: "Simba Supermarket Gikondo",
    address: "Gikondo, Kigali",
    district: "Kicukiro",
    lat: -1.9897,
    lng: 30.081,
    sortOrder: 5,
  },
  {
    name: "Simba Supermarket Kanombe",
    address: "Kanombe, Kigali",
    district: "Kicukiro",
    lat: -1.9688,
    lng: 30.1388,
    sortOrder: 6,
  },
  {
    name: "Simba Supermarket Kinyinya",
    address: "Kinyinya, Kigali",
    district: "Gasabo",
    lat: -1.9099,
    lng: 30.1201,
    sortOrder: 7,
  },
  {
    name: "Simba Supermarket Kibagabaga",
    address: "Kibagabaga, Kigali",
    district: "Gasabo",
    lat: -1.9298,
    lng: 30.1145,
    sortOrder: 8,
  },
  {
    name: "Simba Supermarket Nyanza",
    address: "Nyanza, Kigali",
    district: "Kicukiro",
    lat: -2.0082,
    lng: 30.0583,
    sortOrder: 9,
  },
];

const DISTRICT_COLORS: Record<string, string> = {
  Gasabo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Kicukiro:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Nyarugenge:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AdminBranchesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const { data: branches, isLoading } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => branchApi.list().then((r: any) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { openTime: "08:00", closeTime: "20:00", sortOrder: 0 },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/branches/admin", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Branch created!");
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin-branches", "branches"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to create branch"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`/api/branches/admin/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Branch updated!");
      closeForm();
      qc.invalidateQueries({ queryKey: ["admin-branches", "branches"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to update branch"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/branches/admin/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Branch deactivated");
      setDeleteConfirm(null);
      qc.invalidateQueries({ queryKey: ["admin-branches", "branches"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  const openEdit = (branch: any) => {
    setEditing(branch);
    reset({
      name: branch.name,
      address: branch.address,
      district: branch.district,
      lat: branch.lat || "",
      lng: branch.lng || "",
      phone: branch.phone || "",
      openTime: branch.openTime || "08:00",
      closeTime: branch.closeTime || "20:00",
      sortOrder: branch.sortOrder || 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    reset();
  };

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      lat: data.lat ? Number(data.lat) : undefined,
      lng: data.lng ? Number(data.lng) : undefined,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all Simba Supermarket locations in Kigali
          </p>
        </div>
        <button
          onClick={() => {
            reset({
              openTime: "08:00",
              closeTime: "20:00",
              sortOrder: (branches?.length || 0) + 1,
            });
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {/* Stats bar */}
      {!isLoading && branches && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Branches",
              value: branches.length,
              color: "text-primary",
            },
            {
              label: "Active",
              value: branches.filter((b: any) => b.isActive).length,
              color: "text-green-600",
            },
            {
              label: "Districts",
              value: new Set(branches.map((b: any) => b.district)).size,
              color: "text-blue-600",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-2xl p-4 text-center"
            >
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Branch grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches?.map((branch: any) => (
            <div
              key={branch.id}
              className={`bg-card border rounded-2xl p-5 transition-all ${branch.isActive ? "border-border" : "border-border opacity-60"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${DISTRICT_COLORS[branch.district] || "bg-muted text-muted-foreground"}`}
                  >
                    {branch.district}
                  </span>
                  {!branch.isActive && (
                    <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-sm mb-1">{branch.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3 shrink-0" /> {branch.address}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {branch.openTime}–{branch.closeTime}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  {branch.rating > 0 ? branch.rating.toFixed(1) : "New"} (
                  {branch.reviewCount})
                </span>
                {branch.phone && (
                  <span className="flex items-center gap-1 col-span-2">
                    <Phone className="h-3 w-3" />
                    {branch.phone}
                  </span>
                )}
                {branch._count && (
                  <>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {branch._count.orders} orders
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {branch._count.staff} staff
                    </span>
                  </>
                )}
              </div>

              {branch.lat && branch.lng && (
                <a
                  href={`https://www.google.com/maps?q=${branch.lat},${branch.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline mb-3"
                >
                  <ExternalLink className="h-3 w-3" /> View on Maps
                </a>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => openEdit(branch)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-border py-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(branch)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-destructive/30 text-destructive py-2 rounded-xl hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />{" "}
                  {branch.isActive ? "Deactivate" : "Deleted"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Branch form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={closeForm}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">
                {editing ? "Edit Branch" : "Add New Branch"}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick-fill from known branches (only for new) */}
            {!editing && (
              <div className="mb-5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Quick fill from known branches:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SEED_BRANCHES.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() =>
                        reset({
                          name: b.name,
                          address: b.address,
                          district: b.district as any,
                          lat: b.lat,
                          lng: b.lng,
                          sortOrder: b.sortOrder,
                          openTime: "08:00",
                          closeTime: "20:00",
                        })
                      }
                      className="text-[11px] bg-muted hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-full border border-border transition-colors"
                    >
                      {b.name.replace("Simba Supermarket ", "")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Branch Name"
                error={errors.name?.message}
                required
              >
                <FormInput
                  registration={register("name")}
                  error={!!errors.name}
                  placeholder="Simba Supermarket Remera"
                />
              </FormField>

              <FormField
                label="Address"
                error={errors.address?.message}
                required
              >
                <FormInput
                  registration={register("address")}
                  error={!!errors.address}
                  placeholder="Remera, Kigali"
                />
              </FormField>

              <FormField
                label="District"
                error={errors.district?.message}
                required
              >
                <select
                  {...register("district")}
                  className={`w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 transition-all ${errors.district ? "border-destructive focus:ring-destructive/20 bg-destructive/5" : "border-border focus:border-primary focus:ring-primary/20"}`}
                >
                  <option value="">Select district</option>
                  <option value="Gasabo">Gasabo</option>
                  <option value="Kicukiro">Kicukiro</option>
                  <option value="Nyarugenge">Nyarugenge</option>
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Latitude"
                  error={errors.lat?.message}
                  optional
                  hint="e.g. -1.9441"
                >
                  <FormInput
                    registration={register("lat")}
                    error={!!errors.lat}
                    type="number"
                    step="0.0001"
                    placeholder="-1.9441"
                  />
                </FormField>
                <FormField
                  label="Longitude"
                  error={errors.lng?.message}
                  optional
                  hint="e.g. 30.1178"
                >
                  <FormInput
                    registration={register("lng")}
                    error={!!errors.lng}
                    type="number"
                    step="0.0001"
                    placeholder="30.1178"
                  />
                </FormField>
              </div>

              <FormField label="Phone" error={errors.phone?.message} optional>
                <FormInput
                  registration={register("phone")}
                  placeholder="+250 788 000 000"
                  type="tel"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Opens At"
                  error={errors.openTime?.message}
                  required
                >
                  <FormInput
                    registration={register("openTime")}
                    error={!!errors.openTime}
                    type="time"
                  />
                </FormField>
                <FormField
                  label="Closes At"
                  error={errors.closeTime?.message}
                  required
                >
                  <FormInput
                    registration={register("closeTime")}
                    error={!!errors.closeTime}
                    type="time"
                  />
                </FormField>
              </div>

              <FormField
                label="Sort Order"
                error={errors.sortOrder?.message}
                hint="Lower = appears first"
              >
                <FormInput
                  registration={register("sortOrder")}
                  type="number"
                  min="0"
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editing
                      ? "Update Branch"
                      : "Create Branch"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-3 border border-border rounded-xl hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-2">Deactivate Branch?</h2>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium text-foreground">
                {deleteConfirm.name}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This will hide the branch from the public store. Existing orders
              won't be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-destructive text-destructive-foreground font-semibold py-2.5 rounded-xl hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Processing..." : "Deactivate"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
