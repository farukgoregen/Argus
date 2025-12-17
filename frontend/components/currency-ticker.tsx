"use client"

import { useState, useEffect, useRef } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { marketService } from "@/lib/services"
import type { MarketIndicatorItem } from "@/lib/api-types"

export function CurrencyTicker() {
  const [indicators, setIndicators] = useState<MarketIndicatorItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tickerRef = useRef<HTMLDivElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch market indicators
  const fetchIndicators = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await marketService.getIndicators()
      setIndicators(data.items || [])
    } catch (err) {
      console.error("[CurrencyTicker] Failed to fetch indicators:", err)
      setError(err instanceof Error ? err.message : "Failed to load market indicators")
      // Keep previous data on error
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and setup auto-refresh (7 minutes to match backend cache)
  useEffect(() => {
    fetchIndicators()

    // Auto-refresh every 7 minutes (420000 ms)
    refreshIntervalRef.current = setInterval(() => {
      fetchIndicators()
    }, 420000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  // Check for prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setPrefersReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches)
      }

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  // Format currency value
  const formatValue = (value: number, symbol: string): string => {
    if (symbol === "USD") {
      return "1.00"
    }
    // For JPY and CNY, show fewer decimals
    if (symbol === "JPY" || symbol === "CNY") {
      return value.toFixed(2)
    }
    // For EUR and GBP, show 2-4 decimals
    return value.toFixed(4)
  }

  // Get currency symbol for display
  const getCurrencySymbol = (symbol: string): string => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CNY: "¥",
    }
    return symbols[symbol] || symbol
  }

  if (isLoading && indicators.length === 0) {
    return (
      <div className="overflow-hidden">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Market Indicators</h3>
        <div className="flex h-16 items-center justify-center rounded-lg bg-black/5 dark:bg-black/20">
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    )
  }

  if (error && indicators.length === 0) {
    return (
      <div className="overflow-hidden">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Market Indicators</h3>
        <div className="flex h-16 items-center justify-center rounded-lg bg-black/5 dark:bg-black/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (indicators.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Market Indicators</h3>
      <div className="relative overflow-hidden rounded-lg bg-black">
        {/* Scrolling ticker container */}
        <div
          ref={tickerRef}
          className={cn(
            "flex gap-6 py-4",
            prefersReducedMotion
              ? "flex-wrap justify-center"
              : "animate-scroll hover:[animation-play-state:paused]"
          )}
        >
          {/* Duplicate items for seamless loop */}
          {[...indicators, ...indicators, ...indicators].map((item, index) => (
            <div
              key={`${item.symbol}-${index}`}
              className="flex min-w-fit shrink-0 items-center gap-3 px-4 text-white"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.symbol}</span>
                <span className="text-lg font-bold">
                  {getCurrencySymbol(item.symbol)}
                  {formatValue(item.value, item.symbol)}
                </span>
              </div>
              {item.change_pct !== null && item.change_pct !== undefined && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    item.change_pct >= 0 ? "text-green-400" : "text-red-400"
                  )}
                >
                  {item.change_pct >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {Math.abs(item.change_pct).toFixed(2)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
