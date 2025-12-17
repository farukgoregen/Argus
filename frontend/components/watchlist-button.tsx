"use client"

import { useState } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { watchlistService } from "@/lib/services/watchlist-service"
import { toast } from "sonner"

interface WatchlistButtonProps {
  productId: string
  initialInWatchlist?: boolean
  onToggle?: (inWatchlist: boolean) => void
  variant?: "icon" | "button"
  size?: "sm" | "default" | "lg"
  className?: string
}

export function WatchlistButton({
  productId,
  initialInWatchlist = false,
  onToggle,
  variant = "icon",
  size = "default",
  className,
}: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsLoading(true)

    try {
      if (inWatchlist) {
        const response = await watchlistService.removeFromWatchlist(productId)
        if (response.error) {
          toast.error('Failed to remove from watchlist')
          return
        }
        toast.success('Removed from watchlist')
        setInWatchlist(false)
        onToggle?.(false)
      } else {
        const response = await watchlistService.addToWatchlist(productId)
        if (response.error) {
          // Check if it's already in watchlist (409 conflict)
          const errorDetail = response.error.detail || ''
          if (errorDetail.includes('already')) {
            setInWatchlist(true)
            onToggle?.(true)
          } else {
            toast.error('Failed to add to watchlist')
          }
          return
        }
        toast.success('Added to watchlist')
        setInWatchlist(true)
        onToggle?.(true)
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full transition-colors",
          inWatchlist 
            ? "text-red-500 hover:text-red-600" 
            : "text-muted-foreground hover:text-red-500",
          className
        )}
        onClick={handleToggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSize, "animate-spin")} />
        ) : (
          <Heart className={cn(iconSize, inWatchlist && "fill-current")} />
        )}
        <span className="sr-only">
          {inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        </span>
      </Button>
    )
  }

  return (
    <Button
      variant={inWatchlist ? "secondary" : "outline"}
      size={size}
      className={cn(
        inWatchlist && "border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20",
        className
      )}
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className={cn("mr-2", iconSize, "animate-spin")} />
      ) : (
        <Heart className={cn("mr-2", iconSize, inWatchlist && "fill-current")} />
      )}
      {inWatchlist ? "Watching" : "Watch"}
    </Button>
  )
}
