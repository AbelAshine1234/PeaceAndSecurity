import type React from "react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: number;
  description: string;
}

export function StatCard({
  icon,
  label,
  value,
  change,
  description,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-white/60 transition-all duration-500 group rounded ring-1 ring-slate-200/50">
      {/* Interactive Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Animated Accent line */}
      <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-500" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2 relative">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {label}
        </div>
        <div className="p-2.5 rounded-2xl bg-white shadow-sm text-primary ring-1 ring-slate-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          <div className="scale-90">{icon}</div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-2 relative">
        <div className="text-3xl font-black tracking-tighter text-slate-900 group-hover:translate-x-1 transition-transform duration-500">
          {value}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500 font-bold tracking-tight line-clamp-1">
            {description}
          </p>
          <div className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-black border border-emerald-500/20 whitespace-nowrap">
            <ArrowUpRight size={12} strokeWidth={3} />
            <span>{change}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
