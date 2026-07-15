"use client"

import { useAuth } from "@/app/context/auth-context"
import { ServerDown } from "@/components/ui/server-down"
import { Loader2 } from "lucide-react"

export function SystemLivenessWrapper({ children }: { children: React.ReactNode }) {
    const { isServerActive, isCheckingServer } = useAuth()

    if (isCheckingServer) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-lg font-bold text-foreground">Initializing System</h3>

                    </div>
                </div>
            </div>
        )
    }

    // if (!isServerActive) {
    //     return <ServerDown />
    // }

    return <>{children}</>


}
