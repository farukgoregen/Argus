"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { publicProductService } from "@/lib/services/public-product-service"
import type { PublicProductListItem } from "@/lib/api-types"
import { ProductFilters } from "@/components/product-filters"
import { AISearchSummary } from "@/components/ai-search-summary"
import { mockProducts } from "@/lib/mock-data"

export default function SearchPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<PublicProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [total, setTotal] = useState(0)

  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setProducts([])
      setTotal(0)
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await publicProductService.searchProducts({
        q: query,
        page: 1,
        page_size: 20,
      })

      if (response.data) {
        setProducts(response.data.items)
        setTotal(response.data.total)
      } else {
        setProducts([])
        setTotal(0)
      }
    } catch {
      setProducts([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProducts(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length >= 2) {
      searchProducts(searchQuery)
    }
  }

  // Show mock data when no search has been performed
  const displayProducts = hasSearched ? products : []
  const displayTotal = hasSearched ? total : mockProducts.length

  return (
    <div className="p-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search for products (min 2 characters)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10 text-base" 
          />
        </div>
        <Button variant="outline" className="h-12 bg-transparent" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <X className="mr-2 h-4 w-4" /> : <SlidersHorizontal className="mr-2 h-4 w-4" />}
          Filters
        </Button>
      </form>

      {/* AI Summary - only show when searching */}
      {hasSearched && products.length > 0 && (
        <div className="mb-6">
          <AISearchSummary />
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Filters (Desktop) */}
        {showFilters && (
          <div className="hidden w-64 shrink-0 md:block">
            <ProductFilters />
          </div>
        )}

        {/* Mobile Filters Overlay */}
        {showFilters && (
          <div className="fixed inset-0 z-50 bg-background/95 p-6 md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ProductFilters />
            <Button className="mt-4 w-full" onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Searching..." : hasSearched ? `${total} products found` : `${mockProducts.length} products (showing demo data)`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasSearched && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search query</p>
            </div>
          ) : hasSearched ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link key={product.id} href={`/dashboard/product/${product.id}`}>
                  <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary hover:shadow-lg">
                    <div className="aspect-square overflow-hidden bg-secondary">
                      <Image
                        src={product.main_photo_url || "/placeholder.svg"}
                        alt={product.product_name}
                        width={400}
                        height={400}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge className="mb-2 bg-secondary text-secondary-foreground" variant="secondary">
                        {product.product_category}
                      </Badge>
                      <h3 className="mb-2 line-clamp-2 font-medium group-hover:text-primary">{product.product_name}</h3>
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-accent">${product.unit_price}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{product.seller_company_name}</span>
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
          ) : (
            // Show mock data when no search has been performed
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mockProducts.map((product) => (
                <Link key={product.id} href={`/dashboard/product/${product.id}`}>
                  <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary hover:shadow-lg">
                    <div className="aspect-square overflow-hidden bg-secondary">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge className="mb-2 bg-secondary text-secondary-foreground" variant="secondary">
                        {product.category}
                      </Badge>
                      <h3 className="mb-2 line-clamp-2 font-medium group-hover:text-primary">{product.name}</h3>
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-accent">${product.minPrice}</span>
                        <span className="text-sm text-muted-foreground">- ${product.maxPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{product.suppliers.length} suppliers</span>
                        <span className="flex items-center gap-1">
                          ⭐ {product.rating} ({product.reviews})
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
