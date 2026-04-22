import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/auth")
      ) {
        // Optionally redirect to sign in
      }
    }
    return Promise.reject(err);
  },
);

//  Products

export const productApi = {
  list: (params?: Record<string, any>) => api.get("/products", { params }),
  get: (slug: string) => api.get(`/products/${slug}`),
  similar: (slug: string) => api.get(`/products/${slug}/similar`),
  featured: () => api.get("/products/featured"),
  top: () => api.get("/products/top"),
  recommendations: () => api.get("/products/recommendations"),
  adminList: (params?: Record<string, any>) =>
    api.get("/admin/products", { params }),
  create: (data: any) => api.post("/admin/products", data),
  update: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
};

//  Categories

export const categoryApi = {
  list: () => api.get("/categories"),
  get: (slug: string) => api.get(`/categories/${slug}`),
  adminList: (params?: Record<string, any>) =>
    api.get("/admin/categories", { params }),
  create: (data: any) => api.post("/admin/categories", data),
  update: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

//  Cart

export const cartApi = {
  get: () => api.get("/cart"),
  add: (data: { productId: string; quantity: number }) =>
    api.post("/cart", data),
  update: (productId: string, quantity: number) =>
    api.put(`/cart/${productId}`, { quantity }),
  remove: (productId: string) => api.delete(`/cart/${productId}`),
  clear: () => api.delete("/cart"),
};

//  Wishlist

export const wishlistApi = {
  get: () => api.get("/wishlist"),
  toggle: (productId: string) => api.post(`/wishlist/${productId}`),
};

//  Orders

export const orderApi = {
  create: (data: any) => api.post("/orders", data),
  myOrders: (params?: Record<string, any>) => api.get("/orders/my", { params }),
  myOrder: (id: string) => api.get(`/orders/my/${id}`),
  adminList: (params?: Record<string, any>) =>
    api.get("/admin/orders", { params }),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.put(`/admin/orders/${id}/status`, data),
  dashboard: () => api.get("/admin/dashboard"),
};

//  Blogs

export const blogApi = {
  list: (params?: Record<string, any>) => api.get("/blogs", { params }),
  get: (slug: string) => api.get(`/blogs/${slug}`),
  like: (id: string) => api.post(`/blogs/${id}/like`),
  addComment: (id: string, content: string) =>
    api.post(`/blogs/${id}/comments`, { content }),
  deleteComment: (id: string, commentId: string) =>
    api.delete(`/blogs/${id}/comments/${commentId}`),
  adminList: (params?: Record<string, any>) =>
    api.get("/admin/blogs", { params }),
  create: (data: any) => api.post("/admin/blogs", data),
  update: (id: string, data: any) => api.put(`/admin/blogs/${id}`, data),
  delete: (id: string) => api.delete(`/admin/blogs/${id}`),
};

//  Contact

export const contactApi = {
  submit: (data: any) => api.post("/contact", data),
  adminList: (params?: Record<string, any>) =>
    api.get("/admin/contacts", { params }),
  markRead: (id: string) => api.put(`/admin/contacts/${id}/read`),
};

//  Users

export const userApi = {
  me: () => api.get("/me"),
  updateMe: (data: any) => api.put("/me", data),
  adminList: (params?: Record<string, any>) =>
    api.get("/admin/users", { params }),
  updateRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }),
};

//  Reviews

export const reviewApi = {
  add: (productId: string, data: { rating: number; comment?: string }) =>
    api.post(`/products/${productId}/reviews`, data),
};

//  Banners

export const bannerApi = {
  list: () => api.get("/banners"),
  create: (data: any) => api.post("/admin/banners", data),
  update: (id: string, data: any) => api.put(`/admin/banners/${id}`, data),
  delete: (id: string) => api.delete(`/admin/banners/${id}`),
};

//  Settings

export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data: Record<string, string>) => api.put("/admin/settings", data),
};

//  Upload

export const uploadApi = {
  upload: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    return api.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
