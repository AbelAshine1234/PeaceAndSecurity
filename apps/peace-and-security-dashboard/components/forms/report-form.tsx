
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertCircle, Save, X, MapPin,
    AlertTriangle, Camera, Music,
    ShieldCheck, UserCircle, Phone
} from "lucide-react"
import { reportTypeService } from "@/lib/services/report-type-service"
import { DecibelGauge } from "@/components/reports/decibel-gauge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const reportSchema = z.object({
    reportTypeId: z.string().min(1, "Report type is required"),
    address: z.string().min(5, "Address is required"),
    latitude: z.number(),
    longitude: z.number(),
    description: z.string().optional(),
    severity: z.string().default("Medium"),
    reporterPhoneNumber: z.string().optional(),
    isAnonymous: z.boolean().default(false),
    decibelLevel: z.number().optional(),
    noiseAreaType: z.string().optional(),
    noisePollutionStatus: z.string().optional(),
    evidenceUrls: z.array(z.string()).default([]),
})

type ReportFormValues = z.infer<typeof reportSchema>

interface ReportFormProps {
    initialData?: any
    onSubmit: (data: ReportFormValues) => void
    isLoading?: boolean
    onCancel: () => void
    isEdit?: boolean
}

export function ReportForm({ initialData, onSubmit, isLoading, onCancel, isEdit }: ReportFormProps) {
    const [reportTypes, setReportTypes] = useState<any[]>([])
    const [selectedType, setSelectedType] = useState<any>(null)
    const [currentDb, setCurrentDb] = useState(0)

    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: initialData || {
            reportTypeId: "",
            address: "",
            latitude: 9.032, // Default to Addis for testing
            longitude: 38.746,
            description: "",
            severity: "Medium",
            isAnonymous: false,
            reporterPhoneNumber: "",
            noiseAreaType: "Residential",
            noisePollutionStatus: "Not Pollution",
            evidenceUrls: [],
        },
    })

    useEffect(() => {
        loadReportTypes()
    }, [])

    const loadReportTypes = async () => {
        try {
            const res = await reportTypeService.getAll()
            if (res && res.data) {
                setReportTypes(res.data)
                if (initialData?.reportTypeId) {
                    const found = res.data.find((v: any) => v.id === initialData.reportTypeId)
                    setSelectedType(found)
                }
            }
        } catch (error) {
            toast.error("Failed to load report types")
        }
    }

    const handleTypeChange = (value: string) => {
        const type = reportTypes.find(v => v.id === value)
        setSelectedType(type)
        form.setValue("reportTypeId", value)
        // Reset decibel if not needed
        if (!type?.requiresDecibel) {
            form.setValue("decibelLevel", undefined)
            form.setValue("noiseAreaType", undefined)
            form.setValue("noisePollutionStatus", undefined)
        } else {
            form.setValue("noiseAreaType", "Residential")
        }
    }

    const areaType = form.watch("noiseAreaType")
    const threshold = areaType === "Commercial" ? 55 : 45
    const isDecibelValid = !selectedType?.requiresDecibel || (currentDb >= threshold)

    // Update pollution status based on measurement
    useEffect(() => {
        if (selectedType?.requiresDecibel) {
            const status = currentDb >= threshold ? "Pollution" : "Not Pollution"
            form.setValue("noisePollutionStatus", status)
        }
    }, [currentDb, threshold, selectedType, form])

    const onFormSubmit = (data: ReportFormValues) => {
        if (selectedType?.requiresDecibel && !isDecibelValid) {
            toast.error(`Invalid Noise Level: Measured ${currentDb} dB is below the ${threshold} dB threshold for ${areaType} areas. Noise must exceed this limit to be reported as pollution.`)
            return
        }
        onSubmit(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8 max-w-5xl mx-auto pb-20">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Core Info */}
                        <Card className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden rounded-3xl">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Report Details</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="reportTypeId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-900">What happened?</FormLabel>
                                                <Select onValueChange={handleTypeChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-slate-700 px-6 focus:ring-primary/20">
                                                            <SelectValue placeholder="Select report type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                                        {reportTypes.map((v) => (
                                                            <SelectItem key={v.id} value={v.id} className="rounded-xl font-bold py-3 px-4">
                                                                {v.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="severity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-900">Severity</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-slate-700 px-6 focus:ring-primary/20">
                                                            <SelectValue placeholder="Select severity" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                                                        <SelectItem value="Low" className="rounded-xl font-bold py-3 px-4 focus:bg-emerald-50 focus:text-emerald-700">Low</SelectItem>
                                                        <SelectItem value="Medium" className="rounded-xl font-bold py-3 px-4 focus:bg-amber-50 focus:text-amber-700">Medium</SelectItem>
                                                        <SelectItem value="High" className="rounded-xl font-bold py-3 px-4 focus:bg-rose-50 focus:text-rose-700">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-900">Location Address</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                                                        <Input
                                                            {...field}
                                                            className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-primary/20"
                                                            placeholder="Where did this happen?"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-900">Additional Details</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        rows={4}
                                                        className="bg-slate-50 border-slate-100 rounded-2xl font-medium text-slate-700 p-6 focus:ring-primary/20"
                                                        placeholder="Describe what you see or hear..."
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Evidence Section */}
                        {(selectedType?.requiresMedia || selectedType?.requiresDecibel) && (
                            <Card className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden rounded-3xl bg-slate-50/30">
                                <CardHeader className="bg-white/50 border-b border-slate-100 p-8">
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <ShieldCheck className="w-6 h-6 text-primary" />
                                        Evidence Collection
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    {selectedType?.requiresDecibel && (
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                                <Music className="w-3 h-3" /> Noise Measurement
                                            </Label>
                                            <DecibelGauge
                                                threshold={threshold}
                                                isActive={true}
                                                onValueChange={(val) => {
                                                    setCurrentDb(val)
                                                    form.setValue("decibelLevel", val)
                                                }}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                                <FormField
                                                    control={form.control}
                                                    name="noiseAreaType"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-900">Area Type</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 bg-white border-slate-100 rounded-xl font-bold text-slate-700 px-6 focus:ring-primary/20">
                                                                        <SelectValue placeholder="Select area type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="rounded-xl border-slate-100 shadow-xl p-2">
                                                                    <SelectItem value="Residential" className="rounded-lg font-bold py-2 px-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <span>🏠 Residential</span>
                                                                            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Limit: 45 dB</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="Commercial" className="rounded-lg font-bold py-2 px-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <span>🏢 Commercial</span>
                                                                            <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Limit: 55 dB</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="flex flex-col justify-end">
                                                    <div className={cn(
                                                        "h-12 flex items-center justify-center rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                                                        currentDb >= threshold
                                                            ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse"
                                                            : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                                    )}>
                                                        {currentDb >= threshold ? (
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                Pollution Detected
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <ShieldCheck className="w-4 h-4" />
                                                                Acceptable Level
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Decibel Range Reference Panel */}
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                <div className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all",
                                                    areaType === "Residential"
                                                        ? "border-blue-300 bg-blue-50"
                                                        : "border-slate-100 bg-slate-50 opacity-60"
                                                )}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg">🏠</span>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Residential</p>
                                                    </div>
                                                    <p className="text-2xl font-black text-blue-600">45 dB</p>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-1">Max Permissible Limit</p>
                                                    <div className="mt-2 space-y-0.5">
                                                        <p className="text-[9px] text-slate-400 font-bold">▸ 0–44 dB → Acceptable</p>
                                                        <p className="text-[9px] text-rose-500 font-bold">▸ 45 dB+ → Pollution</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all",
                                                    areaType === "Commercial"
                                                        ? "border-amber-300 bg-amber-50"
                                                        : "border-slate-100 bg-slate-50 opacity-60"
                                                )}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg">🏢</span>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Commercial</p>
                                                    </div>
                                                    <p className="text-2xl font-black text-amber-600">55 dB</p>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-1">Max Permissible Limit</p>
                                                    <div className="mt-2 space-y-0.5">
                                                        <p className="text-[9px] text-slate-400 font-bold">▸ 0–54 dB → Acceptable</p>
                                                        <p className="text-[9px] text-rose-500 font-bold">▸ 55 dB+ → Pollution</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {!isDecibelValid && (
                                                <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                    <p className="text-xs font-bold leading-tight">
                                                        The sound level must be above {threshold} dB for {areaType} areas to submit a report of this type.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedType?.requiresMedia && (
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                                <Camera className="w-3 h-3" /> Photo / Video Evidence
                                            </Label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <button type="button" className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                                                    <Camera className="w-6 h-6" />
                                                    <span className="text-[10px] font-black uppercase">Capture</span>
                                                </button>
                                                {/* Placeholders */}
                                                <div className="aspect-square rounded-2xl bg-slate-100 animate-pulse"></div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* Reporter Profile */}
                        <Card className="border-none shadow-xl ring-1 ring-slate-200 overflow-hidden rounded-3xl">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">Reporter Info</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="isAnonymous"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-xl border border-slate-100 p-4 bg-slate-50/50">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-bold text-slate-700">Anonymous Report</FormLabel>
                                                <FormDescription className="text-[10px] leading-tight">Hide your identity from public records</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {!form.watch("isAnonymous") && (
                                    <FormField
                                        control={form.control}
                                        name="reporterPhoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-900">Phone Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                                                        <Input
                                                            {...field}
                                                            className="h-12 pl-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-700"
                                                            placeholder="+251 ..."
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div className="p-4 bg-slate-900 rounded-2xl text-white">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                            <UserCircle className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-bold">{form.watch("isAnonymous") ? "Anonymous mode" : "Public ID"}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                                        Admin staff will still see your details for verification unless otherwise specified.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-16 rounded-3xl bg-primary hover:bg-primary/95 text-white font-black text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100"
                            >
                                {isLoading ? "Submitting..." : "Submit Report"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancel}
                                className="w-full h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    )
}
