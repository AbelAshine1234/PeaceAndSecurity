
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import {
    FileText, AlertTriangle,
    BarChart3, PieChart as PieChartIcon, Activity,
    TrendingUp, Calendar, Filter
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PERMISSIONS } from "@/lib/permissions"
import { dashboardService, EcoGuardStats } from "@/lib/services/dashboard-service"
import { cn } from "@/lib/utils"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { Button } from "@/components/ui/button"

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
    const router = useRouter()
    const { user, hasPermission } = useAuth()
    const [stats, setStats] = useState<EcoGuardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!loading && !hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
            router.replace("/dashboard/reports");
        }
    }, [loading, hasPermission, router]);

    useEffect(() => {
        if (hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
            loadStats()
        }
    }, [user, hasPermission])

    const loadStats = async () => {
        try {
            setLoading(true)
            const res = await dashboardService.getDashboardStats()
            if (res && res.data) {
                setStats(res.data)
            }
        } catch (error) {
            console.error("Failed to load analytics data:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || !stats) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    const statusData = stats.reports.byStatus.map(item => ({
        name: item.status.replace('_', ' '),
        value: Number(item.count)
    }));

    const typeData = stats.reports.byType.map(item => ({
        name: item.name,
        count: Number(item.count)
    }));

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Environmental Analytics</h1>
                    <p className="text-sm text-slate-500 font-medium">Detailed insights and trends for violation reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold gap-2">
                        <Calendar className="w-4 h-4" />
                        Last 30 Days
                    </Button>
                    <Button variant="outline" className="rounded-xl font-bold gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolution Rate</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">
                            {stats.reports.total > 0 ? ((stats.reports.resolved / stats.reports.total) * 100).toFixed(1) : 0}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${stats.reports.total > 0 ? (stats.reports.resolved / stats.reports.total) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="text-[10px] mt-2 font-bold text-slate-500 uppercase">
                            {stats.reports.resolved} out of {stats.reports.total} reports resolved
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Growth</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-emerald-500" />
                            +12.5%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                            Increase in reports compared to last week
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg. Response Time</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-900">
                            4.2h
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                            Time from submission to patrol assignment
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Trend Bar Chart */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Reporting Velocity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.reports.trend}>
                                    <defs>
                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9', radius: 4 }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="url(#trendGradient)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution Bar Chart */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Violation Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={typeData} layout="vertical">
                                    <defs>
                                        <linearGradient id="distGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
                                        width={110}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="url(#distGradient)" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Pie Chart */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4" /> Report Life Cycle
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistical Summary */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Statistical Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            {typeData.map((type, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="text-sm font-bold text-slate-700">{type.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-slate-400">{(Number(type.count) / stats.reports.total * 100).toFixed(0)}%</span>
                                        <span className="text-sm font-black text-slate-900 w-8 text-right">{type.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
