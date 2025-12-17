"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, AlertTriangle } from "lucide-react"
import type { SearchSummaryResponse } from "@/lib/api-types"
import Link from "next/link"

interface AISearchSummaryProps {
  summary: SearchSummaryResponse | null
  isLoading: boolean
  error?: string | null
}

export function AISearchSummary({ summary, isLoading, error }: AISearchSummaryProps) {
  if (isLoading) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-4">
          <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-start gap-4 p-4">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="flex items-start gap-4 p-4">
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-medium">AI Search Summary</h3>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30" variant="secondary">
              AI Generated
            </Badge>
          </div>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            {summary.best_deal && (
              <div>
                <span className="text-muted-foreground">Best Deal: </span>
                {summary.best_deal.product_id ? (
                  <Link 
                    href={`/dashboard/product/${summary.best_deal.product_id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {summary.best_deal.title} at ${summary.best_deal.price.toFixed(2)}
                  </Link>
                ) : (
                  <span className="font-medium text-accent">
                    {summary.best_deal.title} at ${summary.best_deal.price.toFixed(2)}
                  </span>
                )}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Avg Price: </span>
              <span className="font-medium">
                ${summary.avg_price.toFixed(2)} across {summary.suppliers_count} supplier{summary.suppliers_count !== 1 ? 's' : ''}
              </span>
            </div>
            {summary.moq_warning ? (
              <div>
                <span className="text-muted-foreground">MOQ Warning: </span>
                <span className="font-medium text-chart-3">{summary.moq_warning}</span>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground">MOQ: </span>
                <span className="font-medium text-green-600">No minimum order required</span>
              </div>
            )}
          </div>
          {summary.highlights && summary.highlights.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {summary.highlights.map((h, i) => (
                <span key={i}>
                  {i > 0 && ' • '}
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
