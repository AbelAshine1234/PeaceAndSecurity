"use client";

import { useState, useEffect } from "react";
import { Search, Bell, Menu, User, Settings, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/app/context/auth-context";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { useNotifications } from "@/app/context/notification-context";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<typeof notifications[number] | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 md:h-20 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 gap-4">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden hover:bg-muted/50 transition-colors">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none shadow-2xl">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Sidebar</SheetTitle>
            </SheetHeader>
            <Sidebar onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu onOpenChange={(isOpen) => { if (!isOpen) setSelectedNotification(null); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors relative">
              <Bell size={20} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-card animate-in zoom-in duration-300">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-sm overflow-hidden">
            {selectedNotification ? (
              /* ── Detail View ── */
              <div className="flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2 bg-muted/30">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Notification Details</h3>
                </div>
                <div className="p-5 space-y-4">
                  {/* Icon + type */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      selectedNotification.type.includes("REPORT") ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary"
                    )}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {selectedNotification.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {/* Title */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Title</p>
                    <p className="text-sm font-bold text-foreground leading-snug">{selectedNotification.title}</p>
                  </div>
                  {/* Message */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Message</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{selectedNotification.message}</p>
                  </div>
                  {/* Time */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Received</p>
                    <p className="text-xs text-muted-foreground">
                      {mounted
                        ? new Date(selectedNotification.createdAt).toLocaleString()
                        : "just now"}
                    </p>
                  </div>
                  {/* Extra data */}
                  {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Additional Info</p>
                      <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                        {Object.entries(selectedNotification.data).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2 text-xs">
                            <span className="text-muted-foreground font-bold capitalize">{k.replace(/_/g, " ")}:</span>
                            <span className="text-foreground font-bold truncate max-w-[160px]">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="w-full py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors"
                  >
                    Back to Notifications
                  </button>
                </div>
              </div>
            ) : (
              /* ── List View ── */
              <>
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Notifications</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-7 px-2 rounded-lg"
                      onClick={async (e) => {
                        e.preventDefault();
                        // Import inside for dynamic use or just fetch
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/test-notify`, {
                          headers: {
                            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').accessToken}`
                          }
                        });
                        const data = await res.json();
                        console.log("Test pushed:", data);
                      }}
                    >
                      Send Test
                    </Button>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/10 h-7 px-2 rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          markAllAsRead();
                        }}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  {(!notifications || !Array.isArray(notifications) || notifications.length === 0) ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">All caught up!</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">No new notifications at the moment.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                            !n.isRead && "bg-primary/5"
                          )}
                          onClick={() => {
                            markAsRead(n.id);
                            setSelectedNotification(n);
                          }}
                        >
                          {!n.isRead && (
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                          )}
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                              n.type.includes("REPORT") ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary"
                            )}>
                              <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className={cn("text-xs leading-tight", n.isRead ? "font-bold text-foreground/80" : "font-black text-foreground")}>
                                {n.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-normal">
                                {n.message}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider pt-1">
                                {mounted ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : "just now"}
                              </p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground/40 mt-1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {Array.isArray(notifications) && notifications.length > 0 && (
                  <div className="p-3 bg-muted/30 border-t border-border">
                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors h-8">
                      View All Activity
                    </Button>
                  </div>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-2 pl-4 border-l border-border flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all p-0"
              >
                <Avatar className="h-10 w-10 border border-border shadow-sm">
                  <AvatarImage
                    src={getImageUrl(user?.profileImage)}
                    alt={user?.fullName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-2 rounded-xl shadow-2xl border-border bg-card/95 backdrop-blur-sm"
            >
              <DropdownMenuLabel className="font-black text-muted-foreground uppercase text-[10px] px-2 py-1.5 tracking-[0.1em]">
                My Account
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="rounded-lg font-bold text-foreground/80 focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors py-2.5"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5 bg-border" />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg font-bold cursor-pointer transition-colors py-2.5"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-left hidden lg:block space-y-0.5">
            <p className="text-xs md:text-sm font-black text-foreground leading-tight truncate max-w-[150px]">
              {user?.fullName}
            </p>
            <div className="flex flex-col">
              <p className="text-[10px] text-muted-foreground font-bold leading-none tracking-tight">
                {user?.email}
              </p>
              {user?.phoneNumber && (
                <p className="text-[9px] text-primary/70 font-black mt-1 leading-none uppercase tracking-wider">
                  {user.phoneNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
