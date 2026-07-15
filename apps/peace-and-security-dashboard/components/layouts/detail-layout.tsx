"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailLayoutProps {
  backLink: {
    label: string;
    href?: string;
  };
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DetailLayout({
  backLink,
  title,
  subtitle,
  actions,
  children,
}: DetailLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backLink.href) {
      router.push(backLink.href);
    } else {
      router.back();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Standardized Header */}
      <div className="flex items-center justify-between px-6 md:px-8 py-5 shrink-0 bg-white border-b shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10 rounded-full hover:bg-primary hover:text-white text-slate-500 border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-sm font-medium text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pb-32">
          <div className="bg-white rounded border shadow shadow-slate-200/50 overflow-hidden">
            <div className="p-6 md:p-12 space-y-16">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function DetailSection({
  title,
  children,
  className,
  icon,
}: DetailSectionProps) {
  return (
    <div
      className={cn(
        "space-y-6 pb-2 border-b border-slate-50 last:border-0",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="text-primary/70">{icon}</div>}
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12 px-1 pb-8">
        {children}
      </div>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DetailItem({ label, value, className }: DetailItemProps) {
  return (
    <div className={cn("flex flex-col gap-1 transition-all group", className)}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <div className="text-sm md:text-base font-bold text-slate-900 leading-tight">
        {value || (
          <span className="text-slate-300 font-medium">Not Provided</span>
        )}
      </div>
    </div>
  );
}
