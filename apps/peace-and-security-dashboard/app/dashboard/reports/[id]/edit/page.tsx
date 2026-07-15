"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { reportService } from "@/lib/services/report-service"
import { ReportForm } from "@/components/forms/report-form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function EditReportPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (id) {
            loadReport()
        }
    }, [id])

    const loadReport = async () => {
        try {
            setLoading(true)
            const response = await reportService.getById(id)
            if (response && response.data) {
                setReport(response.data)
            } else {
                toast.error("Report not found")
                router.push("/dashboard/reports")
            }
        } catch (error) {
            console.error("Failed to load report:", error)
            toast.error("Failed to load report data")
            router.push("/dashboard/reports")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (data: any) => {
        try {
            setSaving(true)
            await reportService.updateReport(id, data)
            toast.success("Report updated successfully")
            router.push(`/dashboard/reports/${id}`)
            router.refresh()
        } catch (error) {
            console.error("Failed to update report:", error)
            toast.error("Failed to update report")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen">
            <ReportForm
                initialData={report}
                onSubmit={handleSubmit}
                isLoading={saving}
                onCancel={() => router.push(`/dashboard/reports/${id}`)}
                isEdit={true}
            />
        </div>
    )
}
