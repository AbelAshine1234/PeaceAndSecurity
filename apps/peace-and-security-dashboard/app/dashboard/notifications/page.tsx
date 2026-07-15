"use client"

import { useState } from "react"
import { useNotifications as useNotifContext } from "@/app/context/notification-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Bell,
    Send,
    Shield,
    UserCircle,
    AlertCircle,
    Trash2,
    Search
} from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export default function NotificationsTestPage() {
    const { notifications, markAsRead, markAllAsRead } = useNotifContext()
    const [title, setTitle] = useState("EcoGuard Alert")
    const [message, setMessage] = useState("This is a test notification for the mobile app.")
    const [targetRole, setTargetRole] = useState<"PATROL" | "CITIZEN">("PATROL")
    const [sending, setSending] = useState(false)
    const [filter, setFilter] = useState("all")

    const handleBroadcast = async () => {
        if (!title || !message) {
            toast.error("Please provide title and message")
            return
        }

        setSending(true)
        const loadingToast = toast.loading(`Broadcasting to all ${targetRole.toLowerCase()}s...`)
        try {
            await apiClient.post("/notifications/broadcast", {
                role: targetRole,
                title,
                message,
                type: "GENERAL"
            })
            toast.success("Broadcast successful", { id: loadingToast })
        } catch (error: any) {
            toast.error(error?.message || "Broadcast failed", { id: loadingToast })
        } finally {
            setSending(false)
        }
    }

    const handleTestSelf = async () => {
        const loadingToast = toast.loading("Sending test to self...")
        try {
            await apiClient.get("/notifications/test-notify")
            toast.success("Self-test triggered", { id: loadingToast })
        } catch (error: any) {
            toast.error("Self-test failed", { id: loadingToast })
        }
    }

    return (
        <div className="p-6 md:p-8 space-y-8 bg-[#F8FAFC] min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Notification Control Center</h1>
                    <p className="text-sm text-slate-500 font-medium">Test and mock push notifications for Flutter mobile apps.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleTestSelf}
                        className="rounded-xl font-bold border-slate-200"
                    >
                        Test Dashboard (Self)
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* CONFIGURATION PANEL */}
                <div className="xl:col-span-1 space-y-6">
                    <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                Broadcast Simulator
                            </CardTitle>
                            <CardDescription className="text-[11px] font-bold text-slate-500 uppercase">
                                Dispatch to all mobile devices
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Segment</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTargetRole("PATROL")}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                            targetRole === "PATROL"
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100"
                                        )}
                                    >
                                        <Shield className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Patrols</span>
                                    </button>
                                    <button
                                        onClick={() => setTargetRole("CITIZEN")}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2",
                                            targetRole === "CITIZEN"
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-100"
                                        )}
                                    >
                                        <UserCircle className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Citizens</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notif Title</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="rounded-xl border-slate-200 h-11 font-medium bg-slate-50/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Payload</label>
                                    <Textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="rounded-xl border-slate-200 min-h-[100px] font-medium bg-slate-50/50"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                onClick={handleBroadcast}
                                disabled={sending}
                            >
                                {sending ? "Broadcasting..." : `Send to all ${targetRole}s`}
                            </Button>

                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                    <AlertCircle className="w-3 h-3 inline mr-1 mb-0.5" />
                                    This will send actual push notifications via Firebase Cloud Messaging to all registered devices in this role.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* LOGS PANEL */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Audit Log</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Real-time notification history</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAllAsRead()}
                                    className="text-[10px] font-black uppercase text-slate-400 hover:text-primary"
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search log history..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {(!notifications || notifications.length === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                        <Bell className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest">No activity recorded</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className="group flex gap-4 p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all animate-in fade-in slide-in-from-top-2"
                                        >
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                                                n.type === "REPORT_SUBMITTED" ? "bg-blue-50 text-blue-500" :
                                                    n.type === "REPORT_ASSIGNED" ? "bg-purple-50 text-purple-500" :
                                                        "bg-slate-100 text-slate-500"
                                            )}>
                                                <Bell className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{n.title}</h4>
                                                    <span className="text-[10px] font-bold text-slate-300 whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">{n.message}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-slate-50 border-none text-[9px] font-black uppercase tracking-tighter text-slate-400">
                                                        {n.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
