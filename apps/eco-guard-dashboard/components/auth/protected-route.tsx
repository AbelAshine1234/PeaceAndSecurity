"use client";

import { useAuth } from "@/app/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip protection for public routes (e.g., portal/guest mode)
    if (pathname.startsWith("/portal")) {
      return;
    }

    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  // If we are on a portal route, just render children
  if (pathname.startsWith("/portal")) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">Redirecting to login...</p>
      </div>
    );
  }

  return <>{children}</>;
}
