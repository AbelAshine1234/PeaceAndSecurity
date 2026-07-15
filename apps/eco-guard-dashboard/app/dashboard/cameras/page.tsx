
"use client"

import { useEffect, useState } from "react"
import { cameraService } from "@/lib/services/camera-service"
import { Button } from "@/components/ui/button"
import {
    Camera,
    Plus,
    Settings2,
    Trash2,
    Video,
    MapPin,
    Wifi,
    WifiOff,
    Map as MapIcon,
    LayoutGrid,
    Activity
} from "lucide-react"
import { EcoGoogleMap } from "@/components/maps/google-map"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CameraForm } from "@/components/forms/camera-form"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"

export default function CamerasPage() {
    const [cameras, setCameras] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCamera, setSelectedCamera] = useState<any>(null)
    const [view, setView] = useState<'grid' | 'map'>('grid')
    const [viewingCamera, setViewingCamera] = useState<any>(null)

    const cameraMarkers = cameras.map(cam => ({
        id: cam.id,
        lat: Number(cam.latitude),
        lng: Number(cam.longitude),
        title: cam.locationName,
        data: cam
    }))

    useEffect(() => {
        loadCameras()
    }, [])

    const loadCameras = async () => {
        try {
            setLoading(true)
            const response = await cameraService.getAll()
            setCameras(response.data || [])
        } catch (error) {
            console.error("Failed to load cameras:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this camera?")) return
        try {
            await cameraService.deleteCamera(id)
            toast.success("Camera removed")
            loadCameras()
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const openCreateDialog = () => {
        setSelectedCamera(null)
        setIsDialogOpen(true)
    }

    const openEditDialog = (camera: any) => {
        setSelectedCamera(camera)
        setIsDialogOpen(true)
    }

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Environmental Surveillance</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage and monitor AI-powered environmental cameras.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl font-bold gap-2" onClick={openCreateDialog}>
                            <Plus className="w-4 h-4" />
                            Register Camera
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-3xl p-8 border-none shadow-2xl">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black text-slate-900">{selectedCamera ? 'Edit Camera' : 'Register New Camera'}</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                Configure surveillance hardware and location settings.
                            </DialogDescription>
                        </DialogHeader>
                        <CameraForm
                            initialData={selectedCamera}
                            onSuccess={() => {
                                setIsDialogOpen(false)
                                loadCameras()
                            }}
                            onCancel={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="grid" className="w-full" onValueChange={(v) => setView(v as any)}>
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger value="grid" className="rounded-lg gap-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <LayoutGrid className="w-4 h-4" />
                            Grid View
                        </TabsTrigger>
                        <TabsTrigger value="map" className="rounded-lg gap-2 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <MapIcon className="w-4 h-4" />
                            Map View
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="grid">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {cameras.map((cam) => (
                            <Card key={cam.id} className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden rounded-2xl group transition-all hover:ring-primary/40">
                                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                                    {cam.isActive ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Video className="w-12 h-12 text-white/20" />
                                            <div className="absolute top-4 left-4 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Feed</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center gap-2">
                                            <WifiOff className="w-8 h-8 text-slate-600" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Offline</span>
                                        </div>
                                    )}

                                    <div className="absolute top-4 right-4">
                                        <Badge className={cn("rounded-lg font-black uppercase text-[9px]", cam.isActive ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300")}>
                                            {cam.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900">{cam.locationName}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{cam.cameraId}</p>
                                        </div>
                                        <div className={cn("p-2 rounded-xl", cam.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400")}>
                                            {cam.isActive ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-xs font-medium">{cam.latitude}, {cam.longitude}</span>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            Last Maintenance: {cam.lastMaintenanceDate ? new Date(cam.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setViewingCamera(cam)}
                                            className="flex-1 font-bold rounded-lg gap-2 bg-slate-900 text-white hover:bg-slate-800"
                                            disabled={!cam.isActive}
                                        >
                                            <Video className="w-4 h-4" />
                                            View Feed
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(cam)} className="text-slate-500 font-bold hover:text-primary hover:bg-primary/5 rounded-lg">
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cam.id)} className="w-10 text-red-400 font-bold hover:text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="map">
                    <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden rounded-2xl h-[400px] md:h-[600px]">
                        <EcoGoogleMap
                            markers={cameraMarkers}
                            onMarkerClick={(m) => console.log('Camera selected:', m)}
                            zoom={12}
                        />
                    </Card>
                </TabsContent>
            </Tabs>

            {loading && cameras.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[300px] rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && cameras.length === 0 && (
                <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl border border-dashed border-slate-200 max-w-2xl mx-auto mt-10">
                    <Camera className="w-16 h-16 text-slate-200" />
                    <div>
                        <p className="text-xl font-black text-slate-900">No cameras registered</p>
                        <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Start by adding your first AI-enabled environmental surveillance camera.</p>
                    </div>
                    <Button onClick={openCreateDialog} className="rounded-xl font-bold px-8">Add Camera</Button>
                </div>
            )}
            {/* Camera Feed Dialog */}
            <Dialog open={!!viewingCamera} onOpenChange={() => setViewingCamera(null)}>
                <DialogContent className="max-w-4xl rounded-3xl p-0 border-none shadow-2xl overflow-hidden bg-slate-950">
                    {viewingCamera && (
                        <div className="flex flex-col">
                            <div className="aspect-video bg-black relative flex items-center justify-center">
                                {/* Simulated Live Feed */}
                                <div className="absolute inset-0 opacity-40">
                                    <div className="w-full h-full bg-[radial-gradient(circle,_#333_1px,_transparent_1px)] bg-[size:20px_20px]" />
                                </div>
                                <div className="z-10 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-primary font-black uppercase tracking-[0.3em] text-xs">Connecting to Secure Feed...</p>
                                </div>

                                {/* HUD Overlays */}
                                <div className="absolute top-8 left-8 flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                                        <span className="text-white font-black uppercase tracking-widest text-sm">REC ● LIVE</span>
                                    </div>
                                    <span className="text-white/60 font-mono text-xs">{viewingCamera.cameraId} | {viewingCamera.locationName}</span>
                                </div>
                                <div className="absolute top-8 right-8 font-mono text-white/60 text-xs">
                                    {new Date().toISOString()}
                                </div>
                                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                    <div className="flex gap-4">
                                        <div className="bg-black/50 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                                            <p className="text-[10px] text-white/40 uppercase font-black mb-1">AI Detection</p>
                                            <p className="text-emerald-400 font-bold text-xs flex items-center gap-2">
                                                <Activity className="w-3 h-3" /> ACTIVE_SCANNING
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-primary/90 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                                        4K ULTRA HD
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 md:p-8 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{viewingCamera.locationName}</h2>
                                    <p className="text-xs md:text-sm text-slate-500 font-medium">{viewingCamera.latitude}, {viewingCamera.longitude}</p>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button variant="outline" className="flex-1 sm:flex-none rounded-xl font-bold border-slate-200">Playback</Button>
                                    <Button onClick={() => setViewingCamera(null)} className="flex-1 sm:flex-none rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 px-8">Close</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
