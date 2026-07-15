"use client";

import { StoreProvider } from "@/components/providers/store-provider";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Toaster position="top-right" />
      {children}
    </StoreProvider>
  );
}
