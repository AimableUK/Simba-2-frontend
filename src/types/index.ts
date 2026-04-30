export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stock: number;
  lowStockAlert: number;
  images: string[];
  categoryId: string;
  category?: Category;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  isAlcohol: boolean;
  weight?: number;
  unit?: string;
  viewCount: number;
  salesCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  reviews?: Review[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
  _count?: { products: number };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Pick<
    Product,
    "id" | "name" | "slug" | "price" | "comparePrice" | "images" | "stock"
  >;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  branchId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  deliveryAddress: DeliveryAddress;
  dpoToken?: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusLogs: OrderStatusLog[];
  user?: { id: string; name: string; email: string; phone?: string };
  branch?: { id: string; name: string; address?: string };
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packaged"
  | "on_the_way"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  product?: Partial<Product>;
}

export interface OrderStatusLog {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  district: string;
  sector?: string;
  notes?: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: { id: string; name: string; image?: string };
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image?: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  comments?: BlogComment[];
  likes?: BlogLike[];
  _count?: { comments: number; likes: number };
  likedByMe?: boolean;
}

export interface BlogComment {
  id: string;
  blogId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { id: string; name: string; image?: string };
}

export interface BlogLike {
  id: string;
  blogId: string;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role:
    | "user"
    | "poster"
    | "admin"
    | "super_admin"
    | "branch_manager"
    | "branch_staff";
  image?: string;
  emailVerified: boolean;
  createdAt: string;
  _count?: { orders: number };
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BranchStaffInvite {
  id: string;
  branchId: string;
  inviterId: string;
  inviteeId?: string | null;
  inviteeEmail: string;
  role: "branch_manager" | "branch_staff";
  token: string;
  status: "pending" | "accepted" | "declined" | "expired";
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  respondedAt?: string | null;
  branch?: { id: string; name: string; slug: string };
  inviter?: { id: string; name: string; email: string };
  invitee?: { id: string; name: string; email: string; role: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  monthOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  topProducts: Partial<Product>[];
  recentOrders: Order[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  period?: string;
  from?: string;
  to?: string;
}
