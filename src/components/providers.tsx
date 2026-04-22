"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: "inherit" },
            classNames: {
              toast: "bg-card text-foreground border border-border shadow-lg",
              success: "!border-primary",
              error: "!border-destructive",
            },
          }}
          richColors
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
