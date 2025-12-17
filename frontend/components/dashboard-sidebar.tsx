"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Search, Bookmark, MessageSquare, Settings, Package, UserCog, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { profileService } from "@/lib/services/profile-service"

// Shared navigation items for both buyer and supplier
const sharedNavItems = [
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
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserCog,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

// Supplier-only navigation items (shown after shared items)
const supplierOnlyItems = [
  {
    title: "Supplier Dashboard",
    href: "/dashboard/supplier",
    icon: LayoutDashboard,
  },
  {
    title: "My Products",
    href: "/dashboard/supplier/products",
    icon: Package,
  },
]

export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const [profileLogo, setProfileLogo] = useState<string | null>(null)
  
  // Determine if user is supplier from auth context
  const isSupplier = user?.user_type === 'supplier'
  
  // Build nav items: shared items + supplier-only items for suppliers
  const items = isSupplier 
    ? [...sharedNavItems, ...supplierOnlyItems]
    : sharedNavItems

  // Function to fetch profile logo
  const fetchProfileLogo = async () => {
    if (!isAuthenticated || !user) {
      setProfileLogo(null)
      return
    }

    try {
      const response = isSupplier
        ? await profileService.getSupplierProfile()
        : await profileService.getBuyerProfile()
      
      if (response.data?.logo) {
        // Build full URL for the logo with cache busting
        const baseUrl = response.data.logo.startsWith('http')
          ? response.data.logo
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${response.data.logo}`
        const separator = baseUrl.includes('?') ? '&' : '?'
        setProfileLogo(`${baseUrl}${separator}t=${Date.now()}`)
      } else {
        setProfileLogo(null)
      }
    } catch (error) {
      console.error('Failed to fetch profile for logo:', error)
      setProfileLogo(null)
    }
  }

  // Fetch profile logo on mount and when user changes
  useEffect(() => {
    fetchProfileLogo()
  }, [isAuthenticated, user, isSupplier])

  // Listen for profile updates from the profile edit page
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfileLogo()
    }

    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-updated', handleProfileUpdate)
  }, [isAuthenticated, user, isSupplier])

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "?"
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  return (
    <nav className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4 justify-between">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          onClick={onClose}
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary">
            <Image
              src="/logo.webp"
              alt="Argus"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              onError={(e) => {
                // Fallback to letter if logo fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.parentElement!.innerHTML = '<span class="font-bold text-primary-foreground">A</span>'
              }}
            />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">Argus</span>
        </Link>
        {/* Mobile close button */}
        {onClose && (
          <button
            className="md:hidden ml-2 p-2 rounded hover:bg-sidebar-accent"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          // Check for exact match or if it's a parent route (for nested routes)
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
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
              onClick={onClose}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </div>

      {/* User Info */}
      <div className="border-t border-sidebar-border p-4 mt-auto">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary overflow-hidden ring-1 ring-border/50">
            {profileLogo ? (
              <Image
                src={profileLogo}
                alt="Profile"
                fill
                className="object-cover"
                onError={() => setProfileLogo(null)}
                unoptimized
              />
            ) : (
              <span className="text-sm font-medium text-primary-foreground">
                {isAuthenticated ? getUserInitials() : "?"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">
              {isAuthenticated && user ? user.username : "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAuthenticated && user ? (user.user_type === 'supplier' ? 'Supplier' : 'Buyer') : "Not signed in"}
            </p>
          </div>
        </div>
      </div>
    </nav>
  )
}
