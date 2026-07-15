"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/auth-context"
import { reportService } from "@/lib/services/report-service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Search,
    MapPin,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { DashboardPagination } from "@/components/tables/dashboard-pagination"

const statusFilters = ["All", "SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"]

export default function ReportsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination State
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        loadReports(page)
        const interval = setInterval(() => loadReports(page), 30000)
        return () => clearInterval(interval)
    }, [page, limit, activeFilter, searchQuery])

    const loadReports = async (targetPage = 1) => {
        try {
            setLoading(true)
            let params: any = {
                page: targetPage,
                limit,
                status: activeFilter === "All" ? undefined : activeFilter,
                search: searchQuery || undefined
            }

            // If user is a patrol, try to get their location for nearest sorting
            if (user?.role === 'PATROL') {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject)
                    })
                    params.lat = pos.coords.latitude
                    params.lng = pos.coords.longitude
                } catch (e) {
                    console.log("Location access denied or unavailable")
                }
            }

            const response = await reportService.getAll(params)
            setReports(response.data || [])
            setTotal(response.total || (response.data?.length || 0))
            setTotalPages(response.totalPages || 1)
        } catch (error) {
            console.error("Failed to load reports:", error)
            toast.error("Failed to load reports")
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'SUBMITTED': return 'bg-blue-50 text-blue-600 border-blue-100'
            case 'UNDER_REVIEW': return 'bg-amber-50 text-amber-600 border-amber-100'
            case 'ASSIGNED': return 'bg-purple-50 text-purple-600 border-purple-100'
            case 'IN_PROGRESS': return 'bg-indigo-50 text-indigo-600 border-indigo-100'
            case 'RESOLVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'CLOSED': return 'bg-slate-50 text-slate-600 border-slate-100'
            case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100'
            default: return 'bg-slate-100 text-slate-600 border-slate-200'
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'high': return 'bg-rose-50 text-rose-600 border-rose-100'
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-100'
            case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            default: return 'bg-slate-100 text-slate-600 border-slate-200'
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this report?")) return
        try {
            await reportService.deleteReport(id)
            toast.success("Report deleted successfully")
            loadReports()
        } catch (error) {
            toast.error("Failed to delete report")
        }
    }

    const filteredReports = reports

    const handleExportCSV = () => {
        const headers = ["ID", "Type", "Location", "Status", "Severity", "Assigned To", "Date", "Description"]
        const csvContent = [
            headers.join(","),
            ...filteredReports.map(r => [
                `REP-${r.id.substring(0, 8).toUpperCase()}`,
                `"${r.violationType || 'Unknown'}"`,
                `"${r.location || r.address || 'Unknown'}"`,
                r.status,
                r.severity || 'Medium',
                `"${r.assignedPatrol?.fullName || 'Unassigned'}"`,
                new Date(r.createdAt).toLocaleDateString(),
                `"${(r.description || '').replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `environmental_reports_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Report history exported successfully")
    }

    return (
        <div className="flex flex-col bg-[#F8FAFC] min-h-screen p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1E293B]">Reporting Management</h1>
                    <p className="text-sm text-slate-500">Track and manage environmental violation reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="rounded-xl font-bold gap-2 border-slate-200"
                    >
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by type or location..."
                            className="pl-10 h-10 bg-[#F8FAFC] border-slate-200 rounded-lg text-sm focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-slate-100 overflow-x-auto w-full xl:w-auto no-scrollbar">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap",
                                    activeFilter === filter
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-slate-500 hover:text-primary"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Area</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned To</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredReports.length > 0 ? filteredReports.map((report) => (
                                <tr
                                    key={report.id}
                                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-slate-700 text-sm whitespace-nowrap">{report.violationType || 'Unknown'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] uppercase">
                                            {report.noiseAreaType || report.area || 'General Area'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-500 max-w-[150px]">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <span className="text-[13px] truncate">{report.address || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap",
                                            getStatusColor(report.status)
                                        )}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap",
                                            getSeverityColor(report.severity || 'Medium')
                                        )}>
                                            {report.severity || 'Medium'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                                        {report.assignedPatrol?.fullName || 'Unassigned'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/reports/${report.id}`)} className="cursor-pointer gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(report.id)}
                                                    className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                                        No reports found fitting the criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {loading && (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching reports...</p>
                        </div>
                    )}
                </div>
            </div>

            <DashboardPagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
            />
        </div>
    )
}
