import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 mb-6 md:mb-8",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-slate-500 font-medium">
            {description}
          </p>
        )}
      </div>
      <div
        className={cn(
           "flex flex-wrap items-center justify-end gap-2 w-full",
        )}
      >
        {children}
      </div>
    </div>
  );
}
