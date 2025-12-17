"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { TrendingDown, TrendingUp, Target, Sparkles, ChevronLeft, ChevronRight, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { watchlistService } from "@/lib/services/watchlist-service"
import type { WatchlistItem, WatchlistPagination } from "@/lib/api-types"

// Helper to build full photo URL
function getPhotoUrl(url: string | undefined): string {
  if (!url) return '/placeholder.svg'
  if (url.startsWith('http')) return url
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  const apiBase = baseUrl.replace(/\/api\/?$/, '')
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [pagination, setPagination] = useState<WatchlistPagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const fetchWatchlist = useCallback(async (page: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await watchlistService.getWatchlist({ page, page_size: 20 })
      
      if (response.error) {
        setError(response.error)
        return
      }
      
      if (response.data) {
        setItems(response.data.items)
        setPagination(response.data.pagination)
      }
    } catch (err) {
      setError('Failed to load watchlist')
      console.error('Watchlist fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWatchlist(currentPage)
  }, [currentPage, fetchWatchlist])

  const handleRemove = async (productId: string) => {
    setRemovingIds(prev => new Set(prev).add(productId))
    
    try {
      const response = await watchlistService.removeFromWatchlist(productId)
      
      if (response.error) {
        toast.error('Failed to remove item')
        return
      }
      
      toast.success('Removed from watchlist')
      
      // Optimistically update UI
      setItems(prev => prev.filter(item => item.product.id !== productId))
      
      // If we removed the last item on this page, go back a page
      if (items.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      } else {
        // Refetch to update pagination info
        fetchWatchlist(currentPage)
      }
    } catch (err) {
      toast.error('Failed to remove item')
      console.error('Remove from watchlist error:', err)
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const handlePrevPage = () => {
    if (pagination?.has_prev) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination?.has_next) {
      setCurrentPage(prev => prev + 1)
    }
  }

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="p-6">
        {/* Summary Cards Skeleton */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Items Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-[auto_1fr_auto]">
                  <Skeleton className="h-24 w-24 rounded-lg" />
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:w-32">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="mb-2 text-lg font-semibold">Failed to load watchlist</h3>
        <p className="mb-4 text-muted-foreground">{error}</p>
        <Button onClick={() => fetchWatchlist(currentPage)}>Try Again</Button>
      </div>
    )
  }

  const totalItems = pagination?.total || 0

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Price Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">—</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drops Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-chart-2">—</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Items */}
      {items.length > 0 ? (
        <>
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.product
              const mainPhoto = product.photos?.[0]
              const photoUrl = getPhotoUrl(mainPhoto?.url)
              const isRemoving = removingIds.has(product.id)

              return (
                <Card key={item.id} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-[auto_1fr_auto]">
                      {/* Product Image */}
                      <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-secondary">
                        <Image
                          src={photoUrl}
                          alt={product.product_name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder.svg'
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/dashboard/product/${product.id}`}
                              className="text-lg font-semibold hover:text-primary"
                            >
                              {product.product_name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              Added on {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              product.stock_status === 'out_of_stock'
                                ? "bg-destructive/10 text-destructive"
                                : product.stock_status === 'low_stock'
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-secondary text-secondary-foreground"
                            }
                          >
                            {product.stock_status === 'in_stock' && 'In Stock'}
                            {product.stock_status === 'low_stock' && 'Low Stock'}
                            {product.stock_status === 'out_of_stock' && 'Out of Stock'}
                          </Badge>
                        </div>

                        <div className="mb-4 grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="mb-1 text-xs text-muted-foreground">Current Price</p>
                            <p className="text-xl font-bold">${product.unit_price}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs text-muted-foreground">Category</p>
                            <p className="text-sm font-medium">{product.product_category}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs text-muted-foreground">Seller</p>
                            <p className="text-sm font-medium">{product.seller.display_name}</p>
                          </div>
                        </div>

                        {/* Description Preview */}
                        {product.description_preview && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description_preview}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 md:w-32">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/product/${product.id}`}>View Details</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 bg-transparent"
                          onClick={() => handleRemove(product.id)}
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-4 w-4" />
                          )}
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!pagination.has_prev || isLoading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.has_next || isLoading}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="mb-4 h-16 w-16 text-muted" />
            <h3 className="mb-2 text-xl font-semibold">No items in watchlist</h3>
            <p className="mb-4 text-muted-foreground">Start tracking products to get price alerts</p>
            <Button asChild>
              <Link href="/dashboard/search">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
