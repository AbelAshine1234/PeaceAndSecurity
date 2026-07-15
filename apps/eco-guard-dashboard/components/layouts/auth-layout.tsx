import type React from "react";
import { cn } from "@/lib/utils";
import { EcoLogo } from "@/components/icons/logo";

export function AuthLayout({
  children,
  showBranding = true,
}: {
  children: React.ReactNode;
  showBranding?: boolean;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel - Branding */}
      {showBranding && (
        <div className="hidden lg:flex w-1/2 bg-[#00875a] relative overflow-hidden flex-col items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/20 blur-[100px] rounded-full" />

          <div className="relative z-10 flex flex-col items-center justify-center p-20 text-white text-center">
            <div className="scale-[2.5] mb-20">
              <EcoLogo className="[&_*]:!text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">Advanced Environmental Guard</h1>
            <p className="text-lg font-medium text-emerald-50 max-w-sm leading-relaxed opacity-80">
              Monitoring and protecting our environment through intelligent data and community action.
            </p>
          </div>
        </div>
      )}

      {/* Right Panel - Content */}
      <div
        className={cn(
          "flex-1 flex items-center justify-center bg-background p-8",
          !showBranding && "w-full"
        )}
      >
        <div className="w-full max-w-md space-y-8">{children}</div>
      </div>
    </div>
  );
}
