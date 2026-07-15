"use client";

import { useState } from "react";
import { Check, ChevronDown, Search, Shield, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSION_LABELS } from "@/lib/permissions";

interface PermissionSelectorProps {
  permissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  categories: Record<string, string[]>;
  placeholder?: string;
  className?: string;
}

export function PermissionSelector({
  permissions,
  onPermissionsChange,
  categories,
  placeholder = "Select permissions...",
  className,
}: PermissionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const togglePermission = (permission: string) => {
    const newPermissions = permissions.includes(permission)
      ? permissions.filter((p) => p !== permission)
      : [...permissions, permission];
    onPermissionsChange(newPermissions);
  };

  const toggleCategory = (categoryPermissions: string[]) => {
    const allSelected = categoryPermissions.every((p) =>
      permissions.includes(p),
    );
    if (allSelected) {
      onPermissionsChange(
        permissions.filter((p) => !categoryPermissions.includes(p)),
      );
    } else {
      const newPerms = [...permissions];
      categoryPermissions.forEach((p) => {
        if (!newPerms.includes(p)) newPerms.push(p);
      });
      onPermissionsChange(newPerms);
    }
  };

  const filteredCategories = Object.entries(categories).reduce(
    (acc, [category, perms]) => {
      const filtered = perms.filter(
        (p) =>
          PERMISSION_LABELS[p]?.toLowerCase().includes(search.toLowerCase()) ||
          p.toLowerCase().includes(search.toLowerCase()),
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-14 px-4 py-3 rounded-2xl border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all text-left flex items-start"
          >
            <div className="flex flex-wrap gap-1.5 items-center flex-1 max-h-24 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {permissions.length === 0 && (
                <span className="text-slate-700 font-bold">
                  {placeholder}
                </span>
              )}
              {permissions.map((p) => (
                <Badge
                  key={p}
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 border-none font-bold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0"
                >
                  {PERMISSION_LABELS[p] || p}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePermission(p);
                    }}
                  />
                </Badge>
              ))}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-80 mt-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[320px] md:min-w-[480px] p-0 rounded-2xl shadow-2xl border-slate-200 overflow-hidden z-[9999] flex flex-col"
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions={false}
        >
          <div className="p-4 border-b bg-slate-50/50 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700" />
              <Input
                placeholder="Search capabilities..."
                className="pl-10 h-11 rounded border-slate-200 bg-white focus:ring-slate-400/20 font-bold text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                {permissions.length} selected
              </span>
              <button
                onClick={() => onPermissionsChange([])}
                className="text-[10px] font-black text-slate-600 hover:text-slate-900 uppercase tracking-widest transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          <ScrollArea className="h-[300px] overflow-y-auto">
            <div className="p-2 space-y-4">
              {Object.entries(filteredCategories).map(([category, perms]) => {
                const allSelected = perms.every((p) => permissions.includes(p));
                const someSelected = perms.some((p) => permissions.includes(p));

                return (
                  <div
                    key={category}
                    className="space-y-2 bg-slate-50/50 p-2 rounded-2xl border border-slate-100"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded transition-colors cursor-pointer group",
                        allSelected ? "bg-slate-100" : "hover:bg-white",
                      )}
                      onClick={() => toggleCategory(perms)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={
                            allSelected
                              ? true
                              : someSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={() => toggleCategory(perms)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                        />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">
                          {category}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-700 group-hover:text-slate-900 transition-colors">
                        {perms.filter((p) => permissions.includes(p)).length} /{" "}
                        {perms.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-1">
                      {perms.map((p) => {
                        const isChecked = permissions.includes(p);
                        return (
                          <div
                            key={p}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer",
                              isChecked
                                ? "bg-white shadow-sm text-slate-900"
                                : "hover:bg-white text-slate-500",
                            )}
                            onClick={() => togglePermission(p)}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(p)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-3.5 w-3.5 rounded-sm border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                            />
                            <span className="text-[11px] font-bold truncate">
                              {PERMISSION_LABELS[p] || p}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <p className="text-[9px] text-white/80 font-black leading-tight uppercase tracking-widest">
              Access capabilities define operational scope.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
