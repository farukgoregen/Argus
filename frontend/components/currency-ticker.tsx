"use client"

import { mockCurrencies } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function CurrencyTicker() {
  return (
    <div className="overflow-hidden">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Market Indicators</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {mockCurrencies.map((currency) => (
          <Card
            key={currency.code}
            className="flex min-w-[180px] items-center justify-between gap-3 border-border bg-card p-4"
          >
            <div>
              <p className="text-xs text-muted-foreground">{currency.code}</p>
              <p className="text-lg font-bold">
                {currency.symbol}
                {currency.rate.toFixed(2)}
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                currency.change >= 0 ? "text-accent" : "text-destructive",
              )}
            >
              {currency.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(currency.change)}%
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
