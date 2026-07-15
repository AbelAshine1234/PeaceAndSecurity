
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { reportTypeService } from "@/lib/services/report-type-service"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    residentialDecibelThreshold: z.coerce.number().min(0).max(140).default(45.0),
    commercialDecibelThreshold: z.coerce.number().min(0).max(140).default(55.0),
})

interface ReportTypeFormProps {
    initialData?: any
    onSuccess: () => void
    onCancel: () => void
}

export function ReportTypeForm({ initialData, onSuccess, onCancel }: ReportTypeFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            isActive: initialData?.isActive ?? true,
            residentialDecibelThreshold: initialData?.residentialDecibelThreshold ?? 45.0,
            commercialDecibelThreshold: initialData?.commercialDecibelThreshold ?? 55.0,
        },
    })

    const name = form.watch("name")
    const isNoiseType = name.toLowerCase().includes("noise") || name.toLowerCase().includes("sound")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)
            if (initialData?.id) {
                await reportTypeService.update(initialData.id, values)
                toast.success("Report type updated successfully")
            } else {
                await reportTypeService.create(values)
                toast.success("Report type created successfully")
            }
            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold text-slate-700">Type Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Noise pollution, Littering" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormDescription>The name as it will appear to citizens.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold text-slate-700">Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Explain what constitutes this violation..." {...field} className="rounded-xl min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {isNoiseType && (
                    <div className="grid grid-cols-2 gap-4 bg-rose-50/30 p-4 rounded-xl border border-rose-100 animate-in slide-in-from-top-2 duration-300">
                        <FormField
                            control={form.control}
                            name="residentialDecibelThreshold"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-rose-700">Residential (dB)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} className="rounded-xl bg-white border-rose-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="commercialDecibelThreshold"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-rose-700">Commercial (dB)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} className="rounded-xl bg-white border-rose-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <p className="col-span-2 text-[10px] text-rose-600/70 font-medium">Define sound limits for different zone types.</p>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel className="font-bold text-slate-700">Active Status</FormLabel>
                                <FormDescription>Whether this report type is available for selection.</FormDescription>
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
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl font-bold">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="rounded-xl font-bold px-8">
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
