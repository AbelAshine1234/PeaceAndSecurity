
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/auth-context"
import { dashboardService } from "@/lib/services/dashboard-service"
import { EcoGoogleMap } from "@/components/maps/google-map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Map as MapIcon, Shield, User, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FleetMapPage() {
    const [locations, setLocations] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadLocations = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            const res = await dashboardService.getFleetLocations()
            if (res && res.data) {
                setLocations(res.data)
            }
        } catch (error) {
            console.error("Failed to load fleet locations:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadLocations()
        const interval = setInterval(() => loadLocations(true), 15000) // Auto refresh every 15s
        return () => clearInterval(interval)
    }, [])

    const markers = [
        ...(locations?.patrols || []).map((p: any) => ({
            id: `patrol-${p.id}`,
            lat: Number(p.latitude || p.officeLatitude),
            lng: Number(p.longitude || p.officeLongitude),
            title: `Patrol: ${p.fullName}`,
            icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            data: { type: 'PATROL', ...p }
        })),
        ...(locations?.citizens || []).map((c: any) => ({
            id: `citizen-${c.id}`,
            lat: Number(c.latitude),
            lng: Number(c.longitude),
            title: `Citizen: ${c.fullName}`,
            icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            data: { type: 'CITIZEN', ...c }
        })),
        ...(locations?.reports || []).map((r: any) => ({
            id: `report-${r.id}`,
            lat: Number(r.latitude),
            lng: Number(r.longitude),
            title: `Report: ${r.violationType}`,
            icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            data: { type: 'REPORT', ...r }
        }))
    ].filter(m => !isNaN(m.lat) && !isNaN(m.lng))

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-8 min-h-screen flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <MapIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        Live Fleet & Report Map
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium tracking-tight">Real-time GPS tracking of active patrol units and reported violations.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => loadLocations(true)}
                    disabled={refreshing}
                    className="rounded-xl font-bold gap-2 w-full sm:w-auto mt-2 sm:mt-0"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 min-h-0">
                <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative min-h-[400px] md:min-h-0">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Initializing Map...</p>
                            </div>
                        </div>
                    ) : null}
                    <EcoGoogleMap
                        markers={markers}
                        zoom={13}
                        center={{ lat: 9.03, lng: 38.74 }}
                    />
                </div>

                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Live Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-bold text-slate-700">Active Patrols</span>
                                </div>
                                <span className="text-lg font-black text-slate-900">{locations?.patrols?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-bold text-slate-700">Tracking Citizens</span>
                                </div>
                                <span className="text-lg font-black text-slate-900">{locations?.citizens?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                                    <span className="text-sm font-bold text-slate-700">Open Incidents</span>
                                </div>
                                <span className="text-lg font-black text-slate-900">{locations?.reports?.length || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Map Legend</h4>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-xs font-bold text-slate-600">Patrol Officer</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="text-xs font-bold text-slate-600">Active Citizen</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                <span className="text-xs font-bold text-slate-600">Open Violation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
