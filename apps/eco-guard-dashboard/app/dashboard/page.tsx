
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import {
  Users, FileText, AlertTriangle, Camera,
  CheckCircle2, Clock, ShieldAlert,
  BarChart3, PieChart as PieChartIcon, Activity,
  ArrowUpRight, ListMusic, Volume2, Trash2, Wind, Droplets,
  Eye, MapPin
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PERMISSIONS } from "@/lib/permissions"
import { dashboardService, EcoGuardStats } from "@/lib/services/dashboard-service"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['var(--primary)', 'oklch(0.6 0.15 180)', 'oklch(0.5 0.15 140)', 'oklch(0.65 0.15 60)', 'oklch(0.7 0.15 30)', 'oklch(0.45 0.15 200)'];

function StatCard({ label, value, icon, trend }: { label: string, value: string | number, icon: any, trend?: string }) {
  return (
    <div className="flex flex-col p-4 md:p-6 space-y-1 md:space-y-2 hover:bg-muted/30 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{label}</span>
        <div className="text-primary/70 group-hover:text-primary group-hover:scale-110 transition-all duration-300 scale-75 md:scale-100">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl md:text-2xl font-black text-foreground tracking-tight">{value}</span>
        {trend && <span className="text-[9px] md:text-[10px] font-bold text-primary bg-primary/10 px-1 md:px-2 py-0.5 rounded-full border border-primary/10">
          {trend}
        </span>}
      </div>
    </div>
  )
}

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded ${className || ''}`} />
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, hasPermission } = useAuth()
  const [stats, setStats] = useState<EcoGuardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
      router.replace("/dashboard/reports");
    }
  }, [user, hasPermission, router]);

  useEffect(() => {
    if (user && hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
      loadStats()
      const interval = setInterval(loadStats, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadStats = async () => {
    if (!user) return
    try {
      const [statsRes, reportsRes] = await Promise.allSettled([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentReports()
      ])
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data)
      }
      if (reportsRes.status === 'fulfilled' && reportsRes.value?.data) {
        setRecentReports((reportsRes.value.data || []).slice(0, 5))
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Render always - use loading state inline for skeleton UI

  // Formatting chart data (safe: stats may be null during loading)
  const statusData = (stats?.reports?.byStatus || []).map(item => ({
    name: item.status.replace('_', ' '),
    value: Number(item.count)
  }));

  const typeData = (stats?.reports?.byType || []).map(item => ({
    name: item.name,
    count: Number(item.count)
  }));

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 w-full mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col gap-1" style={{ minHeight: 0 }}>
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">EcoGuard Overview</h1>
        <p className="text-xs md:text-sm text-muted-foreground font-medium tracking-tight">Real-time status of environmental monitoring and reports.</p>
      </div>

      {/* PRIMARY STATS GRID */}
      <div className="bg-card rounded-2xl border border-border shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-border grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 w-full overflow-hidden">
        {hasPermission(PERMISSIONS.REPORT_VIEW) && (
          loading ? <div className="p-6 space-y-3"><SkeletonBox className="h-3 w-24" /><SkeletonBox className="h-8 w-16" /></div> :
            <StatCard
              label="Total Reports"
              value={stats?.reports?.total ?? 0}
              icon={<FileText className="w-5 h-5" />}
              trend={`${stats?.reports?.pending ?? 0} pending`}
            />
        )}
        {hasPermission(PERMISSIONS.REPORT_VIEW) && (
          loading ? <div className="p-6 space-y-3"><SkeletonBox className="h-3 w-24" /><SkeletonBox className="h-8 w-16" /></div> :
            <StatCard
              label="Resolved Reports"
              value={stats?.reports?.resolved ?? 0}
              icon={<CheckCircle2 className="w-5 h-5" />}
            />
        )}
        {hasPermission(PERMISSIONS.CAMERA_VIEW) && (
          loading ? <div className="p-6 space-y-3"><SkeletonBox className="h-3 w-24" /><SkeletonBox className="h-8 w-16" /></div> :
            <StatCard
              label="Active Cameras"
              value={stats?.cameras?.active ?? 0}
              icon={<Camera className="w-5 h-5" />}
              trend={`${stats?.cameras?.total ?? 0} total`}
            />
        )}
        {hasPermission(PERMISSIONS.USER_VIEW) && (
          loading ? <div className="p-6 space-y-3"><SkeletonBox className="h-3 w-24" /><SkeletonBox className="h-8 w-16" /></div> :
            <StatCard
              label="System Admins"
              value={stats?.users?.admins ?? 0}
              icon={<ShieldAlert className="w-5 h-5" />}
            />
        )}
        {hasPermission(PERMISSIONS.USER_VIEW) && (
          loading ? <div className="p-6 space-y-3"><SkeletonBox className="h-3 w-24" /><SkeletonBox className="h-8 w-16" /></div> :
            <StatCard
              label="Patrol Officers"
              value={stats?.users?.patrols ?? 0}
              icon={<Users className="w-5 h-5" />}
            />
        )}
        {hasPermission(PERMISSIONS.USER_VIEW) && (
          loading ? <div className="p-6 space-y-3"><SkeletonBox className="h-3 w-24" /><SkeletonBox className="h-8 w-16" /></div> :
            <StatCard
              label="Registered Citizens"
              value={stats?.users?.citizens ?? 0}
              icon={<Users className="w-5 h-5" />}
            />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* TREND CHART - NOW AN AREA CHART */}
        <Card className="xl:col-span-8 border-none shadow-sm ring-1 ring-border bg-card rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border px-6 py-5 bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" /> Reporting Velocity
              </CardTitle>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">Volume of environmental reports over the last 7 days</p>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              {loading || !stats ? (
                <div className="h-full w-full animate-pulse bg-slate-50 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.reports.trend}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(value) => mounted ? new Date(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }) : ""}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'black', marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DISTRIBUTION PIE CHART - STATUS */}
        <Card className="xl:col-span-4 border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-5 bg-slate-50/30">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" /> Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* VIOLATION TYPES BAR CHART - Better for comparison */}
        <Card className="xl:col-span-12 border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-5 bg-slate-50/30">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Violation Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              {loading || !stats ? (
                <div className="h-full w-full animate-pulse bg-slate-50 rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RECENT ENVIRONMENTAL REPORTS */}
        <Card className="xl:col-span-12 border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-6 py-5 bg-slate-50/30 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Recent Citizen Reports
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest text-[#2563eb] hover:bg-[#eff6ff] transition-all"
              onClick={() => router.push('/dashboard/reports')}
            >
              View All Reports <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-widest">Report ID</th>
                    <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-widest">Assigned Patrol</th>
                    <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[11px] font-black text-foreground uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                        {report.caseId || `REP-${report.id.substring(0, 6)}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{report.violationType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-[12px] truncate font-medium">{report.address || 'Unknown Address'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600">
                          {report.assignedPatrol?.fullName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 italic">
                        {mounted ? new Date(report.createdAt).toLocaleDateString() : '...'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn(
                          "rounded-lg font-black uppercase text-[9px] border px-2 py-0.5",
                          report.status === 'SUBMITTED' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            report.status === 'ASSIGNED' ? "bg-purple-50 text-purple-600 border-purple-100" :
                              report.status === 'IN_PROGRESS' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                report.status === 'RESOLVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                          onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {recentReports.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No recent reports submitted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
