
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ReportForm } from "@/components/forms/report-form"
import { reportService } from "@/lib/services/report-service"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CreateReportPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        try {
            setLoading(true)
            await reportService.create(data)
            toast.success("Report submitted successfully")
            router.push("/dashboard/reports")
            router.refresh()
        } catch (error: any) {
            console.error("Failed to submit report:", error)
            toast.error(error?.response?.data?.message || "Failed to submit report. Please check required fields.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen space-y-8">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full bg-white shadow-sm border border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">New Environmental Report</h1>
                    <p className="text-sm text-slate-500 font-medium">Capture and report a violation in real-time.</p>
                </div>
            </div>

            <ReportForm
                onSubmit={handleSubmit}
                isLoading={loading}
                onCancel={() => router.back()}
            />
        </div>
    )
}
