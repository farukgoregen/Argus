"use client"
import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import type React from "react"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      {/* Mobile sidebar overlay */}
      <div
        className={
          sidebarOpen
            ? "fixed inset-0 z-40 bg-black/40 md:hidden"
            : "hidden"
        }
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar */}
      <div
        className={
          sidebarOpen
            ? "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-200 md:static md:translate-x-0"
            : "-translate-x-full fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-200 md:static md:translate-x-0 md:translate-x-0"
        }
      >
        <DashboardSidebar onClose={() => setSidebarOpen(false)} />
      </div>
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
