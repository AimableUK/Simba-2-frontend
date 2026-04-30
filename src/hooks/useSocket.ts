"use client";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useNotificationStore } from "@/store";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let globalSocket: Socket | null = null;

function getSocket() {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, { withCredentials: true, autoConnect: true });
  }
  return globalSocket;
}

function buildNotification(data: {
  type?: string;
  message?: string;
  title?: string;
  link?: string;
  createdAt?: string;
}) {
  const message = data.message || data.title || "Notification";
  return {
    type: data.type || "info",
    title: data.title || message,
    message,
    link: data.link,
    createdAt: data.createdAt,
  };
}

function joinRoomsForUser(socket: Socket, user: any) {
  if (!user) return;
  socket.emit("join:user", user.id);
  const role = user.role;
  if (role === "admin" || role === "super_admin" || role === "poster") {
    socket.emit("join:admin");
  }
}

export function useSocket() {
  const { data: session } = useSession();

  useEffect(() => {
    const socket = getSocket();
    const handleConnect = () => joinRoomsForUser(socket, session?.user);

    handleConnect();
    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [session?.user?.id, (session?.user as any)?.role]);

  return getSocket();
}

export function useOrderSocket(
  orderId: string | null,
  onUpdate: (data: any) => void,
) {
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    const handleConnect = () => socket.emit("join:order", orderId);

    handleConnect();
    socket.on("connect", handleConnect);
    socket.on("order:updated", onUpdate);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("order:updated", onUpdate);
    };
  }, [orderId, onUpdate]);
}

export function useNotifications(userId?: string) {
  const socket = useSocket();
  const push = useNotificationStore((s) => s.push);

  useEffect(() => {
    if (!userId) return;
    const handler = (data: any) => {
      const notification = buildNotification(data);
      push(notification);
      toast(notification.message, {
        icon: notification.type === "payment_success" ? "💳" : "📦",
      });
    };
    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, [socket, userId, push]);
}

export function useAdminSocket(handlers: {
  onNewOrder?: (data: any) => void;
  onOrderUpdated?: (data: any) => void;
  onNewContact?: (data: any) => void;
  onProductUpdated?: (data: any) => void;
}) {
  const socket = useSocket();
  const push = useNotificationStore((s) => s.push);

  useEffect(() => {
    const cleanup: Array<() => void> = [];

    if (handlers.onNewOrder) {
      const fn = (data: any) => {
        push(
          buildNotification({
            type: "order_new",
            title: "New order",
            message:
              `New order: ${data.orderNumber || data.orderId || ""}`.trim(),
            link: "/admin/orders",
            createdAt: data.createdAt,
          }),
        );
        handlers.onNewOrder?.(data);
      };
      socket.on("order:new", fn);
      cleanup.push(() => socket.off("order:new", fn));
    }

    if (handlers.onOrderUpdated) {
      const fn = (data: any) => {
        push(
          buildNotification({
            type: "order_updated",
            title: "Order updated",
            message: `Order updated: ${data.orderId || ""}`.trim(),
            link: "/admin/orders",
            createdAt: data.createdAt,
          }),
        );
        handlers.onOrderUpdated?.(data);
      };
      socket.on("order:updated", fn);
      cleanup.push(() => socket.off("order:updated", fn));
    }

    if (handlers.onNewContact) {
      const fn = (data: any) => {
        push(
          buildNotification({
            type: "contact_new",
            title: "New message",
            message: data.subject || "New contact message",
            link: "/admin/contacts",
            createdAt: data.createdAt,
          }),
        );
        handlers.onNewContact?.(data);
      };
      socket.on("contact:new", fn);
      cleanup.push(() => socket.off("contact:new", fn));
    }

    if (handlers.onProductUpdated) {
      const fn = (data: any) => {
        push(
          buildNotification({
            type: "product_updated",
            title: "Product updated",
            message: "Product catalog updated",
            link: "/admin/products",
            createdAt: data.createdAt,
          }),
        );
        handlers.onProductUpdated?.(data);
      };
      socket.on("product:updated", fn);
      cleanup.push(() => socket.off("product:updated", fn));
    }

    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, [socket, handlers, push]);
}

// added
export function joinCompanyRoom(companyId: string): void {
  getSocket().emit("join:company", companyId);
}

export function leaveCompanyRoom(companyId: string): void {
  getSocket().emit("leave:company", companyId);
}
