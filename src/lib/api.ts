import axios from "axios";

const API_URL =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth/sign-in";
      }
    }
    return Promise.reject(err);
  },
);

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
    api.get("/products/admin/all", { params }),
  create: (data: any) => api.post("/products/admin", data),
  update: (id: string, data: any) => api.put(`/products/admin/${id}`, data),
  delete: (id: string) => api.delete(`/products/admin/${id}`),
};

//  Categories

export const categoryApi = {
  list: (params?: Record<string, any>) => api.get("/categories", { params }),
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
    api.get("/orders/admin/all", { params }),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.put(`/orders/admin/${id}/status`, data),
  dashboard: () => api.get("/orders/admin/dashboard"),
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
    api.get("/blogs/admin/all", { params }),
  create: (data: any) => api.post("/blogs/admin", data),
  update: (id: string, data: any) => api.put(`/blogs/admin/${id}`, data),
  delete: (id: string) => api.delete(`/blogs/admin/${id}`),
};

//  Contact

export const contactApi = {
  submit: (data: any) => api.post("/contact", data),
  adminList: (params?: Record<string, any>) =>
    api.get("/contact/admin/all", { params }),
  markRead: (id: string) => api.put(`/contact/admin/${id}/read`),
};

//  Users

export const userApi = {
  me: () => api.get("/users/me"),
  updateMe: (data: any) => api.put("/users/me", data),
  adminList: (params?: Record<string, any>) =>
    api.get("/users/admin/all", { params }),
  updateRole: (id: string, role: string) =>
    api.put(`/users/admin/${id}/role`, { role }),
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

export const branchApi = {
  list: () => api.get("/branches"),
  get: (slug: string) => api.get(`/branches/${slug}`),
  stock: (branchId: string, params?: Record<string, any>) =>
    api.get(`/branches/${branchId}/stock`, { params }),
  createOrder: (data: any) => api.post("/branches/orders", data),
  payDeposit: (id: string, momoNumber: string) =>
    api.post(`/branches/orders/${id}/pay`, { momoNumber }),
  myOrders: (params?: Record<string, any>) =>
    api.get("/branches/orders/my", { params }),
  myOrder: (id: string) => api.get(`/branches/orders/my/${id}`),
  reviewBranch: (orderId: string, data: { rating: number; comment?: string }) =>
    api.post(`/branches/orders/${orderId}/review`, data),
  dashboard: (params?: Record<string, any>) =>
    api.get("/branches/dashboard", { params }),
  assignOrder: (id: string, staffId: string) =>
    api.post(`/branches/dashboard/orders/${id}/assign`, { staffId }),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.put(`/branches/dashboard/orders/${id}/status`, data),
  updateStock: (data: any) => api.put("/branches/dashboard/stock", data),
  adminList: (params?: Record<string, any>) =>
    api.get("/branches/admin/all", { params }),
  createBranch: (data: any) => api.post("/branches/admin", data),
  updateBranch: (id: string, data: any) =>
    api.put(`/branches/admin/${id}`, data),
  deleteBranch: (id: string) => api.delete(`/branches/admin/${id}`),
  assignStaff: (data: { userId: string; branchId: string; role: string }) =>
    api.post("/branches/admin/staff", data),
};

// Search

export const searchApi = {
  search: (q: string, branchId?: string) =>
    api.get("/search", { params: { q, ...(branchId && { branchId }) } }),
};
