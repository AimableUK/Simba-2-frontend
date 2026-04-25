"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, X, Star, Package } from "lucide-react";
import { toast } from "sonner";
import { productApi, categoryApi } from "@/lib/api";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { TableRowSkeleton } from "@/components/common/skeletons";
import { Pagination } from "@/components/common/pagination";
import type { Product, Category } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  shortDescription: z.string().optional(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().min(1, "Category required"),
  images: z.string().min(1, "At least one image URL"),
  unit: z.string().optional(),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isAlcohol: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () =>
      productApi.adminList({ page, limit: 20, search }).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list().then((r) => r.data),
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
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productApi.create(data),
    onSuccess: () => {
      toast.success("Product created!");
      setShowForm(false);
      reset();
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productApi.update(id, data),
    onSuccess: () => {
      toast.success("Product updated!");
      setEditing(null);
      reset();
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeleteConfirm(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const openEdit = (product: Product) => {
    setEditing(product);
    reset({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription || "",
      price: product.price,
      comparePrice: product.comparePrice,
      stock: product.stock,
      categoryId: product.categoryId,
      images: product.images.join("\n"),
      unit: product.unit || "",
      tags: product.tags.join(", "),
      isFeatured: product.isFeatured,
      isAlcohol: product.isAlcohol,
      isActive: product.isActive,
    });
    setShowForm(true);
  };

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      images: data.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: data.tags
        ? data.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => {
            reset();
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Product",
                  "Price",
                  "Stock",
                  "Category",
                  "Status",
                  "Sales",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                : data?.data?.map((product: Product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                            <Image
                              src={getImageUrl(product.images[0])}
                              alt={product.name}
                              fill
                              className="object-contain p-0.5"
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[180px]">
                              {product.name}
                            </p>
                            {product.isFeatured && (
                              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">
                          {formatPrice(product.price)}
                        </p>
                        {product.comparePrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.comparePrice)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            product.stock === 0
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : product.stock <= product.lowStockAlert
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {(product.category as any)?.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${product.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.salesCount}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={data?.pagination?.totalPages || 1}
        onPageChange={setPage}
      />

      {/* Product Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={closeForm}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">
                {editing ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  label="Product Name"
                  error={errors.name?.message}
                  required
                  className="sm:col-span-2"
                >
                  <FormInput
                    registration={register("name")}
                    error={!!errors.name}
                    placeholder="e.g. Premium Basmati Rice 5kg"
                  />
                </FormField>

                <FormField
                  label="Price (RWF)"
                  error={errors.price?.message}
                  required
                >
                  <FormInput
                    registration={register("price")}
                    error={!!errors.price}
                    type="number"
                    placeholder="Enter price e.g. 8500"
                  />
                </FormField>

                <FormField
                  label="Compare Price (RWF)"
                  error={errors.comparePrice?.message}
                  optional
                >
                  <FormInput
                    registration={register("comparePrice")}
                    type="number"
                    placeholder="Enter compare price e.g. 10000"
                  />
                </FormField>

                <FormField label="Stock" error={errors.stock?.message} required>
                  <FormInput
                    registration={register("stock")}
                    error={!!errors.stock}
                    type="number"
                    placeholder="Enter current stock e.g. 100"
                  />
                </FormField>

                <FormField
                  label="Category"
                  error={errors.categoryId?.message}
                  required
                >
                  <select
                    {...register("categoryId")}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 transition-all ${errors.categoryId ? "border-destructive focus:ring-destructive/20 bg-destructive/5" : "border-border focus:border-primary focus:ring-primary/20"}`}
                  >
                    <option value="">Select category</option>
                    {categories?.map((c: Category) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Unit" error={errors.unit?.message} optional>
                  <FormInput
                    registration={register("unit")}
                    placeholder="enter units e.g. 500ml, 5kg, pack"
                  />
                </FormField>

                <FormField
                  label="Tags (comma separated)"
                  error={errors.tags?.message}
                  optional
                >
                  <FormInput
                    registration={register("tags")}
                    placeholder="Enter tags e.g. fresh, organic, local"
                  />
                </FormField>

                <FormField
                  label="Short Description"
                  error={errors.shortDescription?.message}
                  optional
                  className="sm:col-span-2"
                >
                  <FormInput
                    registration={register("shortDescription")}
                    placeholder="enter one line summary"
                  />
                </FormField>

                <FormField
                  label="Description"
                  error={errors.description?.message}
                  required
                  className="sm:col-span-2"
                >
                  <FormTextarea
                    registration={register("description")}
                    error={!!errors.description}
                    rows={3}
                    placeholder="Enter full product description..."
                  />
                </FormField>

                <FormField
                  label="Image URLs (one per line)"
                  error={errors.images?.message}
                  required
                  className="sm:col-span-2"
                >
                  <FormTextarea
                    registration={register("images")}
                    error={!!errors.images}
                    rows={3}
                    placeholder="https://example.com/image.jpg"
                    className="font-mono"
                  />
                </FormField>

                <div className="sm:col-span-2 flex flex-wrap gap-6">
                  {[
                    { name: "isFeatured", label: "Featured Product" },
                    { name: "isAlcohol", label: "Contains Alcohol (18+)" },
                    { name: "isActive", label: "Active (visible in store)" },
                  ].map(({ name, label }) => (
                    <label
                      key={name}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        {...register(name as any)}
                        type="checkbox"
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

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
                      ? "Update Product"
                      : "Create Product"}
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
            <h2 className="font-bold text-lg mb-2">Delete Product?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This will deactivate the product. It won't appear in the store
              anymore.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-destructive text-destructive-foreground font-semibold py-2.5 rounded-xl hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
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
