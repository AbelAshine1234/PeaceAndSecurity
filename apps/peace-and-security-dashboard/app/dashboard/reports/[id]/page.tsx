
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { reportService } from "@/lib/services/report-service"
import { patrolService } from "@/lib/services/patrol-service"
import { userService } from "@/lib/services/user-service"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    MapPin,
    Calendar,
    User,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Phone,
    Mail,
    Edit,
    Trash2,
    Camera,
    Activity,
    AlertCircle,
    ArrowUpCircle,
    Play,
    FileVideo,
    FileAudio,
    Music,
    Video,
    X,
    Loader2,
    ImageIcon,
    Volume2,
    ChevronLeft,
    ChevronRight,
    ZoomIn
} from "lucide-react"
import { getImageUrl, cn } from "@/lib/utils"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EcoGoogleMap } from "@/components/maps/google-map"

export default function ReportDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const { user } = useAuth()

    const [report, setReport] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [patrols, setPatrols] = useState<any[]>([])
    const [selectedPatrol, setSelectedPatrol] = useState<string>("")
    const [assigning, setAssigning] = useState(false)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [reviewing, setReviewing] = useState(false)
    const [escalateNotes, setEscalateNotes] = useState("")
    const [escalating, setEscalating] = useState(false)
    const [followUpNotes, setFollowUpNotes] = useState("")
    const [followUpFiles, setFollowUpFiles] = useState<File[]>([])
    const [submittingFollowUp, setSubmittingFollowUp] = useState(false)

    useEffect(() => {
        if (id) {
            loadReportDetail()
        }
    }, [id])

    useEffect(() => {
        loadPatrols()
    }, [report])

    const loadReportDetail = async () => {
        try {
            setLoading(true)
            const [reportRes, historyRes] = await Promise.all([
                reportService.getById(id),
                reportService.getHistory(id)
            ])

            if (reportRes && reportRes.data) {
                setReport(reportRes.data)
            }
            if (historyRes && historyRes.data) {
                setHistory(historyRes.data)
            }
        } catch (error) {
            console.error("Failed to load report data:", error)
            toast.error("Failed to load report details")
        } finally {
            setLoading(false)
        }
    }

    const loadPatrols = async () => {
        try {
            // Get all patrols for the dropdown
            const response = await patrolService.getAllPatrols({
                limit: 100, // Get a good amount
                status: 'ACTIVE'
            })
            setPatrols(response.data || [])
        } catch (error) {
            console.error("Failed to load patrols:", error)
        }
    }

    const handleAssignPatrol = async () => {
        if (!selectedPatrol) return
        try {
            setAssigning(true)
            await reportService.assignPatrol(id, selectedPatrol)
            toast.success("Report assigned successfully")
            setIsAssignDialogOpen(false)
            loadReportDetail()
        } catch (error) {
            toast.error("Failed to assign report")
        } finally {
            setAssigning(false)
        }
    }

    const handleReview = async (status: string) => {
        try {
            setReviewing(true)
            await reportService.reviewReport(id, status, rejectionReason)
            toast.success(`Report evidence ${status === 'REJECTED' ? 'rejected' : 'approved'}`)
            loadReportDetail()
        } catch (error) {
            toast.error("Failed to review report")
        } finally {
            setReviewing(false)
        }
    }

    const handleEscalate = async () => {
        try {
            setEscalating(true)
            await reportService.escalateReport(id, escalateNotes)
            toast.success("Report escalated successfully")
            loadReportDetail()
        } catch (error) {
            toast.error("Failed to escalate report")
        } finally {
            setEscalating(false)
        }
    }

    const handlePatrolFollowUp = async () => {
        try {
            setSubmittingFollowUp(true)
            const formData = new FormData();
            formData.append('notes', followUpNotes);
            formData.append('latitude', String(report.latitude));
            formData.append('longitude', String(report.longitude));

            if (followUpFiles.length > 0) {
                followUpFiles.forEach(file => {
                    formData.append('patrolEvidence', file);
                });
            }

            await reportService.submitFollowUp(id, formData)
            toast.success("Follow-up submitted successfully")
            setFollowUpNotes("")
            setFollowUpFiles([])
            loadReportDetail()
        } catch (error) {
            toast.error("Failed to submit follow-up")
        } finally {
            setSubmittingFollowUp(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this report?")) return
        try {
            await reportService.deleteReport(id)
            toast.success("Report deleted successfully")
            router.push("/dashboard/reports")
        } catch (error) {
            toast.error("Failed to delete report")
        }
    }

    const getStatusBadge = (status: string) => {
        const colors: any = {
            'SUBMITTED': 'bg-blue-100 text-blue-700 border-blue-200',
            'UNDER_REVIEW': 'bg-amber-100 text-amber-700 border-amber-200',
            'ASSIGNED': 'bg-purple-100 text-purple-700 border-purple-200',
            'IN_PROGRESS': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'RESOLVED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'CLOSED': 'bg-slate-100 text-slate-700 border-slate-200',
            'REJECTED': 'bg-rose-100 text-rose-700 border-rose-200',
            'ESCALATED': 'bg-orange-100 text-orange-700 border-orange-200',
        }
        return (
            <Badge variant="outline" className={cn("uppercase font-bold px-3 py-1", colors[status?.toUpperCase()] || "bg-slate-100 text-slate-700")}>
                {status || 'UNKNOWN'}
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!report) return null

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {/* Minimalist Top Nav */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/dashboard/reports")}
                            className="h-9 w-9 rounded-full hover:bg-slate-50"
                        >
                            <ArrowLeft className="w-4 h-4 text-slate-400" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Case REP-{report.id.substring(0, 8).toUpperCase()}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Status:</span>
                                <span className={cn("text-[10px] font-black uppercase tracking-widest",
                                    report.status === 'RESOLVED' ? 'text-emerald-600' : 'text-primary')}>
                                    {report.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="h-9 px-4 rounded-xl font-bold text-[11px] uppercase tracking-wider"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete Case
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto py-10 px-6 space-y-12">

                    {/* DISPATCH CONTROL SECTION */}
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    {(!report.assignedPatrol || (report.status !== 'CLOSED' && report.status !== 'UNDER_REVIEW')) && (
                                        <h2 className="text-base font-bold text-slate-900">Assign to Patrol</h2>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {report.assignedPatrol ? (
                                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-100">
                                            <img src={report.assignedPatrol.profileImage ? getImageUrl(report.assignedPatrol.profileImage) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.assignedPatrol.id}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter leading-none mb-1">Active Unit</p>
                                            <p className="text-xs font-bold text-slate-900">{report.assignedPatrol.fullName}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-[10px] font-black uppercase text-primary hover:bg-primary/5 ml-2"
                                            onClick={() => setIsAssignDialogOpen(true)}
                                        >
                                            Reassign
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-64">
                                            <Select value={selectedPatrol} onValueChange={setSelectedPatrol}>
                                                <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 text-sm font-medium shadow-sm">
                                                    <SelectValue placeholder="Select Officer from Patrol Table..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200">
                                                    {patrols.map((p) => (
                                                        <SelectItem key={p.id} value={p.id} className="text-sm font-medium py-2">
                                                            {p.fullName} {p.assignedArea ? `— ${p.assignedArea}` : ''}
                                                        </SelectItem>
                                                    ))}
                                                    {patrols.length === 0 && <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">No Active Officers Found</div>}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                                            onClick={handleAssignPatrol}
                                            disabled={!selectedPatrol || assigning}
                                        >
                                            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign to Patrol"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FIELD LIST */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">

                        {/* Incident Identity */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-200 pb-2">Incident Identity</h3>

                            <div className="grid grid-cols-1 gap-6">
                                {(report.reportType?.name || report.violationType) && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Violation Type</label>
                                        <p className="text-sm font-bold text-slate-900 mt-1">{report.reportType?.name || report.violationType}</p>
                                    </div>
                                )}

                                {report.severity && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Severity Level</label>
                                        <div className="mt-1">
                                            <span className={cn(
                                                "text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                                report.severity === 'HIGH' ? 'bg-rose-50 text-rose-600' :
                                                    report.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-blue-50 text-blue-600'
                                            )}>
                                                {report.severity}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {report.decibelLevel && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Noise Intensity</label>

                                        {/* Measurement row */}
                                        <div className="flex items-center gap-3">
                                            <p className="text-2xl font-black text-slate-900">{report.decibelLevel} <span className="text-sm font-bold text-slate-400">dB</span></p>
                                            {report.noisePollutionStatus && (
                                                <Badge className={cn(
                                                    "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border-none",
                                                    report.noisePollutionStatus === 'Pollution'
                                                        ? "bg-rose-500 text-white animate-pulse"
                                                        : "bg-emerald-500 text-white"
                                                )}>
                                                    {report.noisePollutionStatus}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Area type + threshold display */}
                                        {report.noiseAreaType && (() => {
                                            const threshold = report.noiseAreaType === 'Commercial' ? 55 : 45
                                            const measured = Number(report.decibelLevel)
                                            const barPct = Math.min(100, Math.max(0, ((measured - 30) / 90) * 100))
                                            const threshPct = ((threshold - 30) / 90) * 100
                                            const exceeded = measured >= threshold
                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{report.noiseAreaType === 'Commercial' ? '🏢' : '🏠'}</span>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            {report.noiseAreaType} Area · {threshold} dB limit
                                                        </p>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-visible">
                                                        {/* Threshold marker */}
                                                        <div
                                                            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10 rounded-full"
                                                            style={{ left: `${threshPct}%` }}
                                                        />
                                                        {/* Fill bar */}
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all",
                                                                exceeded ? "bg-rose-500" : "bg-emerald-500"
                                                            )}
                                                            style={{ width: `${barPct}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                                        <span>30 dB</span>
                                                        <span className={exceeded ? 'text-rose-500' : 'text-slate-400'}>Limit: {threshold} dB</span>
                                                        <span>120 dB</span>
                                                    </div>

                                                    {/* Reference cards for both area types */}
                                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                                        <div className={cn(
                                                            "p-3 rounded-xl border-2 transition-all",
                                                            report.noiseAreaType === 'Residential'
                                                                ? "border-blue-200 bg-blue-50"
                                                                : "border-slate-100 bg-slate-50 opacity-50"
                                                        )}>
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <span className="text-sm">🏠</span>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Residential</p>
                                                            </div>
                                                            <p className="text-lg font-black text-blue-600">45 dB</p>
                                                            <p className="text-[8px] text-slate-400 font-bold">Max Permissible</p>
                                                            <div className="mt-1 space-y-0.5">
                                                                <p className="text-[8px] text-slate-400 font-bold">▸ 0–44 dB → OK</p>
                                                                <p className="text-[8px] text-rose-500 font-bold">▸ 45 dB+ → Pollution</p>
                                                            </div>
                                                        </div>
                                                        <div className={cn(
                                                            "p-3 rounded-xl border-2 transition-all",
                                                            report.noiseAreaType === 'Commercial'
                                                                ? "border-amber-200 bg-amber-50"
                                                                : "border-slate-100 bg-slate-50 opacity-50"
                                                        )}>
                                                            <div className="flex items-center gap-1.5 mb-1">
                                                                <span className="text-sm">🏢</span>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Commercial</p>
                                                            </div>
                                                            <p className="text-lg font-black text-amber-600">55 dB</p>
                                                            <p className="text-[8px] text-slate-400 font-bold">Max Permissible</p>
                                                            <div className="mt-1 space-y-0.5">
                                                                <p className="text-[8px] text-slate-400 font-bold">▸ 0–54 dB → OK</p>
                                                                <p className="text-[8px] text-rose-500 font-bold">▸ 55 dB+ → Pollution</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}

                                {report.createdAt && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Case Timestamp</label>
                                        <p className="text-sm font-bold text-slate-900 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Data */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-200 pb-2">Location Data</h3>

                            <div className="grid grid-cols-1 gap-6">
                                {(report.location || report.address || report.area) && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Primary Address / Area</label>
                                        <p className="text-sm font-bold text-slate-900 mt-1">{report.location || report.address || report.area}</p>
                                    </div>
                                )}

                                {report.latitude && report.longitude && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Tactical Coordinates</label>
                                        <p className="text-[11px] font-mono font-medium text-slate-600 mt-1">{Number(report.latitude).toFixed(6)}, {Number(report.longitude).toFixed(6)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Case Description */}
                        {(report.reportDescription || report.description) && (
                            <div className="md:col-span-2 space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Incident Narrative</label>
                                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                    {report.reportDescription || report.description}
                                </p>
                            </div>
                        )}

                        {/* Media Gallery */}
                        {((
                            (report.imageUrls && report.imageUrls.length > 0) ||
                            (report.videoUrls && report.videoUrls.length > 0) ||
                            (report.audioUrls && report.audioUrls.length > 0) ||
                            (report.patrolImageUrls && report.patrolImageUrls.length > 0) ||
                            (report.patrolVideoUrls && report.patrolVideoUrls.length > 0) ||
                            (report.patrolAudioUrls && report.patrolAudioUrls.length > 0) ||
                            (report.evidenceUrls && report.evidenceUrls.length > 0) ||
                            (report.patrolEvidenceUrls && report.patrolEvidenceUrls.length > 0)
                        )) && (
                                <div className="md:col-span-2 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-200 pb-2">Media Evidence Gallery</h3>
                                    <MediaGallery report={report} />
                                </div>
                            )}

                        {/* Spatial Map */}
                        {report.latitude && report.longitude && (
                            <div className="md:col-span-2 rounded-3xl overflow-hidden border border-slate-100 h-[400px] shadow-sm">
                                <EcoGoogleMap
                                    center={{ lat: Number(report.latitude), lng: Number(report.longitude) }}
                                    zoom={15}
                                    markers={[
                                        { id: 'loc', lat: Number(report.latitude), lng: Number(report.longitude), title: 'Incident', icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' },
                                        ...(report.assignedPatrol?.latitude && report.assignedPatrol?.longitude ? [{
                                            id: 'unit',
                                            lat: Number(report.assignedPatrol.latitude),
                                            lng: Number(report.assignedPatrol.longitude),
                                            title: 'Active Unit',
                                            icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                        }] : [])
                                    ]}
                                />
                            </div>
                        )}

                        {/* REPORTER & LOGS */}
                        <div className="space-y-6">
                            {(report.reporter || report.reporterPhoneNumber) && (
                                <>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-200 pb-2">Submitting Source</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        {report.reporter?.fullName && (
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Reporter Identity</label>
                                                <p className="text-sm font-bold text-slate-900 mt-1">{report.reporter.fullName}</p>
                                            </div>
                                        )}
                                        {(report.reporterPhoneNumber || report.reporter?.phoneNumber) && (
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-700">Contact Line</label>
                                                <p className="text-sm font-bold text-slate-900 mt-1">{report.reporterPhoneNumber || report.reporter?.phoneNumber}</p>
                                            </div>
                                        )}
                                        {report.isAnonymous && (
                                            <div>
                                                <Badge className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-tighter">Reporting Anonymously</Badge>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-6">
                            {history && history.length > 0 && (
                                <>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-200 pb-2">Operational Audit</h3>
                                    <div className="space-y-5">
                                        {history.slice(0, 5).map((log, i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-200 shrink-0" />
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{log.status}</p>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-tight">{log.notes || "No additional status notes provided"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                </div>

                {/* Reassignment Modal */}
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogContent className="max-w-xl rounded-3xl p-8 bg-white border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900">Assign Patrol</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500 font-medium">Select an officer from the patrol table to manage this case.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 mt-6 max-h-[400px] overflow-y-auto pr-2">
                            {patrols.map((patrol) => (
                                <div
                                    key={patrol.id}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4",
                                        selectedPatrol === patrol.id ? "border-primary bg-primary/5" : "border-slate-50 hover:border-slate-100"
                                    )}
                                    onClick={() => setSelectedPatrol(patrol.id)}
                                >
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                        <img src={patrol.profileImage ? getImageUrl(patrol.profileImage) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${patrol.id}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 text-sm">{patrol.fullName}</p>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                            {patrol.assignedArea || "Ready for Dispatch"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <DialogFooter className="mt-8">
                            <Button
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                                disabled={!selectedPatrol || assigning}
                                onClick={handleAssignPatrol}
                            >
                                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign to Patrol"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

function MediaGallery({ report }: { report: any }) {
    const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'audio'>('photos')
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

    // Merge citizen + patrol evidence by type
    // Support both new typed arrays and legacy evidenceUrls
    const allImages: string[] = [
        ...(report.imageUrls || []),
        ...(report.patrolImageUrls || []),
        // legacy fallback: pull images from combined evidenceUrls if typed arrays are empty
        ...((report.imageUrls?.length === 0 && report.patrolImageUrls?.length === 0)
            ? [
                ...(report.evidenceUrls || []).filter((u: string) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(u)),
                ...(report.patrolEvidenceUrls || []).filter((u: string) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(u)),
            ]
            : []
        ),
    ]
    const allVideos: string[] = [
        ...(report.videoUrls || []),
        ...(report.patrolVideoUrls || []),
        ...((report.videoUrls?.length === 0 && report.patrolVideoUrls?.length === 0)
            ? [
                ...(report.evidenceUrls || []).filter((u: string) => /\.(mp4|mov|webm|ogg|avi)$/i.test(u)),
                ...(report.patrolEvidenceUrls || []).filter((u: string) => /\.(mp4|mov|webm|ogg|avi)$/i.test(u)),
            ]
            : []
        ),
    ]
    const allAudio: string[] = [
        ...(report.audioUrls || []),
        ...(report.patrolAudioUrls || []),
        ...((report.audioUrls?.length === 0 && report.patrolAudioUrls?.length === 0)
            ? [
                ...(report.evidenceUrls || []).filter((u: string) => /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(u)),
                ...(report.patrolEvidenceUrls || []).filter((u: string) => /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(u)),
            ]
            : []
        ),
    ]

    const tabs = [
        { key: 'photos' as const, label: 'Photos', icon: Camera, count: allImages.length },
        { key: 'videos' as const, label: 'Videos', icon: Video, count: allVideos.length },
        { key: 'audio' as const, label: 'Audio', icon: Volume2, count: allAudio.length },
    ]

    const lightboxImages = allImages

    return (
        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-200 bg-white">
                {tabs.map(({ key, label, icon: Icon, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        disabled={count === 0}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all",
                            activeTab === key
                                ? "border-primary text-primary bg-primary/3"
                                : "border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200",
                            count === 0 && "opacity-40 cursor-not-allowed"
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                        {count > 0 && (
                            <span className={cn(
                                "rounded-full text-[9px] font-black px-1.5 py-0.5 ml-0.5",
                                activeTab === key ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Panel */}
            <div className="p-5">
                {/* Photos */}
                {activeTab === 'photos' && (
                    allImages.length === 0
                        ? <EmptyMedia label="No photos attached to this report" />
                        : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {allImages.map((url, idx) => (
                                <div
                                    key={idx}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200 cursor-pointer border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all"
                                    onClick={() => setLightboxIdx(idx)}
                                >
                                    <img
                                        src={getImageUrl(url)}
                                        alt={`Evidence ${idx + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                    </div>
                                    <div className="absolute bottom-1.5 right-1.5 bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                        {idx + 1}/{allImages.length}
                                    </div>
                                </div>
                            ))}
                        </div>
                )}

                {/* Videos */}
                {activeTab === 'videos' && (
                    allVideos.length === 0
                        ? <EmptyMedia label="No videos attached to this report" />
                        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {allVideos.map((url, idx) => (
                                <div key={idx} className="rounded-xl overflow-hidden bg-black border border-slate-800 shadow-md">
                                    <div className="bg-slate-900 px-3 py-1.5 flex items-center gap-2">
                                        <FileVideo className="w-3 h-3 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Video {idx + 1}</span>
                                    </div>
                                    <video
                                        src={getImageUrl(url)}
                                        controls
                                        className="w-full max-h-72 bg-black"
                                        playsInline
                                    />
                                </div>
                            ))}
                        </div>
                )}

                {/* Audio */}
                {activeTab === 'audio' && (
                    allAudio.length === 0
                        ? <EmptyMedia label="No audio recordings attached to this report" />
                        : <div className="space-y-3">
                            {allAudio.map((url, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Volume2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Recording {idx + 1}</p>
                                        <audio src={getImageUrl(url)} controls className="w-full h-9" />
                                    </div>
                                    <a
                                        href={getImageUrl(url)}
                                        download
                                        className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                                        title="Download"
                                    >
                                        <FileAudio className="w-4 h-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxIdx !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxIdx(null)}
                >
                    <button
                        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                        onClick={() => setLightboxIdx(null)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {lightboxImages.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                                onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i! <= 0 ? lightboxImages.length - 1 : i! - 1) }}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                                onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => i! >= lightboxImages.length - 1 ? 0 : i! + 1) }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
                        <img
                            src={getImageUrl(lightboxImages[lightboxIdx])}
                            alt="Evidence preview"
                            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                        />
                        <span className="text-white/60 text-xs font-bold">
                            {lightboxIdx + 1} / {lightboxImages.length}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptyMedia({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest">{label}</p>
        </div>
    )
}

function MediaRenderer({ url }: { url: string }) {
    const fullUrl = getImageUrl(url);
    const extension = url.split('.').pop()?.toLowerCase();

    const isVideo = ['mp4', 'mov', 'webm', 'ogg'].includes(extension || '');
    const isAudio = ['mp3', 'wav', 'm4a', 'aac'].includes(extension || '');

    if (isVideo) {
        return (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-2">
                <video src={fullUrl} controls className="w-full h-full" />
            </div>
        );
    }

    if (isAudio) {
        return (
            <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 col-span-1 md:col-span-2 lg:col-span-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Music className="w-5 h-5" />
                </div>
                <audio src={fullUrl} controls className="flex-1 h-8" />
            </div>
        );
    }

    return (
        <div className="group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow" onClick={() => window.open(fullUrl, '_blank')}>
            <img src={fullUrl} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-300 scale-100 group-hover:scale-105" />
        </div>
    );
}
