
"use client";

import { useAuth } from "@/app/context/auth-context";
import { PERMISSIONS } from "@/lib/permissions";
import { EcoLogo } from "@/components/icons/logo";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Settings,
  AlertTriangle,
  BarChart3,
  Camera,
  Users,
  Shield,
  ShieldAlert,
  LogOut,
  UserCircle,
  Map,
  Bell,
} from "lucide-react";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    exact: true,
  },
  {
    label: "Live Map",
    href: "/dashboard/map",
    icon: Map,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    label: "Reporting",
    href: "/dashboard/reports",
    icon: AlertTriangle,
    permission: PERMISSIONS.REPORT_VIEW,
  },
  {
    label: "Report Types",
    href: "/dashboard/report-types",
    icon: ShieldAlert,
    permission: PERMISSIONS.VIOLATION_VIEW,
  },
  {
    label: "Surveillance",
    href: "/dashboard/cameras",
    icon: Camera,
    permission: PERMISSIONS.CAMERA_VIEW,
  },
  {
    label: "Patrols",
    href: "/dashboard/patrols",
    icon: Shield,
    permission: PERMISSIONS.USER_VIEW,
  },
  {
    label: "Citizens",
    href: "/dashboard/citizens",
    icon: UserCircle,
    permission: PERMISSIONS.USER_VIEW,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
    permission: PERMISSIONS.USER_VIEW,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    label: "Push Testing",
    href: "/dashboard/notifications",
    icon: Bell,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

interface SidebarProps {
  onItemClick?: () => void;
}

export function Sidebar({ onItemClick }: SidebarProps) {
  const { user, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const filteredItems = navigationItems.filter((item) => {
    return hasPermission(item.permission);
  });

  return (
    <div className="w-full md:w-64 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 md:h-20 flex items-center px-4 md:px-6 border-b border-sidebar-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 md:gap-3 group"
        >
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 overflow-hidden group-hover:scale-105 transition-transform">
            <EcoLogo />
          </div>
          <div>
            <span className="font-black text-sm md:text-lg tracking-tight text-sidebar-foreground group-hover:text-primary transition-colors block truncate uppercase">
              EcoGuard
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 md:px-4 py-4 md:py-8 space-y-1 md:space-y-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = (item.href === "/dashboard")
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <button
                onClick={() => {
                  onItemClick?.();
                }}
                className={cn(
                  "w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-bold transition-all my-0.5 md:my-1 text-left",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:pl-5 md:hover:pl-7",
                )}
              >
                <div className={cn("flex items-center justify-center w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")}>
                  <Icon className="w-5 h-5" />
                </div>
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
