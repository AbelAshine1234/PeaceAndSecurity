
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
import { Switch } from "@/components/ui/switch"
import { cameraService } from "@/lib/services/camera-service"
import { toast } from "sonner"

const formSchema = z.object({
    cameraId: z.string().min(3, "Camera ID is required"),
    locationName: z.string().min(2, "Location name is required"),
    latitude: z.number(),
    longitude: z.number(),
    streamUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    isActive: z.boolean().default(true),
})

interface CameraFormProps {
    initialData?: any
    onSuccess: () => void
    onCancel: () => void
}

export function CameraForm({ initialData, onSuccess, onCancel }: CameraFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            cameraId: "",
            locationName: "",
            latitude: 0,
            longitude: 0,
            streamUrl: "",
            isActive: true,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)
            if (initialData?.id) {
                await cameraService.update(initialData.id, values)
                toast.success("Camera updated successfully")
            } else {
                await cameraService.create(values)
                toast.success("Camera registered successfully")
            }
            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save camera details")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="cameraId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Hardware ID / Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. CAM-001" {...field} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="locationName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Location Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Central Park North" {...field} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Latitude</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.000001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Longitude</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.000001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="streamUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold text-slate-700">Stream URL (HLS/RTSP)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://stream.ecoguard.com/hls/cam01.m3u8" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormDescription>Live feed URL for real-time monitoring</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel className="font-bold text-slate-700">Active Status</FormLabel>
                                <FormDescription>Whether this camera is currently online</FormDescription>
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
                        {loading ? "Saving..." : "Save Camera"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
