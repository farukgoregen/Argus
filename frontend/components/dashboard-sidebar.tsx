"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Bookmark, MessageSquare, Settings, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Search",
    href: "/dashboard/search",
    icon: Search,
  },
  {
    title: "Watchlist",
    href: "/dashboard/watchlist",
    icon: Bookmark,
  },
  {
    title: "Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

const supplierNavItems = [
  {
    title: "Home",
    href: "/dashboard/supplier",
    icon: Home,
  },
  {
    title: "Products",
    href: "/dashboard/supplier/products",
    icon: Package,
  },
  {
    title: "Settings",
    href: "/dashboard/supplier/settings",
    icon: Settings,
  },
]

export function DashboardSidebar({ isSupplier = false }: { isSupplier?: boolean }) {
  const pathname = usePathname()
  const items = isSupplier ? supplierNavItems : navItems

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link href={isSupplier ? "/dashboard/supplier" : "/dashboard"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="font-bold text-primary-foreground">A</span>
          </div>
          <span className="font-bold text-sidebar-foreground">Argus</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-sm font-medium text-primary-foreground">JD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">{isSupplier ? "Supplier" : "Buyer"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
