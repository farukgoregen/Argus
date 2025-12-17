"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Package, AlertCircle } from "lucide-react"
import { homeFeedService } from "@/lib/services/home-feed-service"
import type { 
  ProductCard, 
  RecentSearchItem, 
  HomeFeedPagination,
  AllProductsSection,
  RecentSearchesSection 
} from "@/lib/api-types"

// Build full URL for product photo
function getPhotoUrl(photos: ProductCard['photos']): string {
  if (!photos || photos.length === 0) return "/placeholder.svg"
  const photo = photos[0]
  if (!photo.url) return "/placeholder.svg"
  if (photo.url.startsWith('http')) return photo.url
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
  return `${baseUrl}${photo.url}`
}

export function RecentSearches() {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([])
  const [pagination, setPagination] = useState<HomeFeedPagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHomeFeed = useCallback(async (page: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await homeFeedService.getHomeFeed({
        page,
        page_size: 20,
      })

      if (response.error) {
        setError(response.error.detail || 'Failed to load products')
        return
      }

      if (response.data) {
        // Find sections by key
        const allProductsSection = response.data.sections.find(
          (s): s is AllProductsSection => s.key === 'all_products'
        )
        const recentSearchesSection = response.data.sections.find(
          (s): s is RecentSearchesSection => s.key === 'recent_searches'
        )

        if (allProductsSection) {
          setProducts(allProductsSection.items)
          setPagination(allProductsSection.pagination)
        }

        if (recentSearchesSection) {
          setRecentSearches(recentSearchesSection.items)
        }
      }
    } catch (err) {
      console.error('Error fetching home feed:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHomeFeed(currentPage)
  }, [currentPage, fetchHomeFeed])

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

  // Loading skeleton
  if (isLoading && products.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent Searches</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border bg-card">
              <CardContent className="p-4">
                <Skeleton className="mb-3 aspect-video w-full rounded-lg" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error && products.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent Searches</h3>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">Unable to load products</p>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => fetchHomeFeed(currentPage)} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty state
  if (!isLoading && products.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent Searches</h3>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No products available</p>
            <p className="text-sm text-muted-foreground">Products will appear here once suppliers add them.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* Recent Search Queries (chips) */}
      {recentSearches.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Your Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <Link 
                key={index} 
                href={`/dashboard/search?q=${encodeURIComponent(search.query)}`}
              >
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80"
                >
                  {search.query}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Section Header with Pagination */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          All Products
          {pagination && (
            <span className="ml-2 text-xs">
              ({pagination.total} total)
            </span>
          )}
        </h3>
        
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevPage}
              disabled={!pagination.has_prev || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={!pagination.has_next || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${isLoading ? 'opacity-50' : ''}`}>
        {products.map((product) => (
          <Link key={product.id} href={`/dashboard/product/${product.id}`} className="group">
            <Card className="h-full border-border bg-card transition-colors hover:border-primary">
              <CardContent className="p-4">
                <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={getPhotoUrl(product.photos)}
                    alt={product.product_name}
                    width={280}
                    height={160}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                </div>
                <Badge 
                  variant="secondary" 
                  className="mb-2 bg-secondary text-secondary-foreground"
                >
                  {product.product_category}
                </Badge>
                <h4 className="mb-2 line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {product.product_name}
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-accent">${product.unit_price}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.seller.display_name}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={
                      product.stock_status === 'in_stock' 
                        ? 'bg-green-500/20 text-green-500' 
                        : product.stock_status === 'low_stock'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-red-500/20 text-red-500'
                    }
                  >
                    {product.stock_status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bottom Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={!pagination.has_prev || isLoading}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!pagination.has_next || isLoading}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
