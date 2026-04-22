"use client";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:5000";

let globalSocket: Socket | null = null;

function getSocket() {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, { withCredentials: true, autoConnect: true });
  }
  return globalSocket;
}

export function useSocket() {
  const { data: session } = useSession();

  useEffect(() => {
    const socket = getSocket();
    if (session?.user) {
      socket.emit("join:user", session.user.id);
      const role = (session.user as any).role;
      if (role === "admin" || role === "super_admin") {
        socket.emit("join:admin");
      }
    }
  }, [session]);

  return getSocket();
}

export function useOrderSocket(
  orderId: string | null,
  onUpdate: (data: any) => void,
) {
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    socket.emit("join:order", orderId);
    socket.on("order:updated", onUpdate);
    return () => {
      socket.off("order:updated", onUpdate);
    };
  }, [orderId, onUpdate]);
}

export function useNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return; // optional: only connect when logged in
    const socket = getSocket();
    const handler = (data: { type: string; message: string }) => {
      toast(data.message, {
        icon: data.type === "payment_success" ? "💳" : "📦",
      });
    };
    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, [userId]);
}

export function useAdminSocket(handlers: {
  onNewOrder?: (data: any) => void;
  onOrderUpdated?: (data: any) => void;
  onNewContact?: (data: any) => void;
  onProductUpdated?: (data: any) => void;
}) {
  useEffect(() => {
    const socket = getSocket();
    if (handlers.onNewOrder) socket.on("order:new", handlers.onNewOrder);
    if (handlers.onOrderUpdated)
      socket.on("order:updated", handlers.onOrderUpdated);
    if (handlers.onNewContact) socket.on("contact:new", handlers.onNewContact);
    if (handlers.onProductUpdated)
      socket.on("product:updated", handlers.onProductUpdated);
    return () => {
      if (handlers.onNewOrder) socket.off("order:new", handlers.onNewOrder);
      if (handlers.onOrderUpdated)
        socket.off("order:updated", handlers.onOrderUpdated);
      if (handlers.onNewContact)
        socket.off("contact:new", handlers.onNewContact);
      if (handlers.onProductUpdated)
        socket.off("product:updated", handlers.onProductUpdated);
    };
  }, []);
}
