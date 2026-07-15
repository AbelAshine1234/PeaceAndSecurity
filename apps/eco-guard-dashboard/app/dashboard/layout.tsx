"use client"

import type React from "react"
import { Sidebar } from "@/components/layouts/sidebar"
import { DashboardHeader } from "@/components/layouts/dashboard-header"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex bg-background">
        <div className="hidden md:flex flex-col h-screen"> {/* Wrapper for desktop sidebar */}
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden h-screen">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
