"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, SlidersHorizontal, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { publicProductService } from "@/lib/services/public-product-service"
import { homeFeedService } from "@/lib/services/home-feed-service"
import { watchlistService } from "@/lib/services/watchlist-service"
import type { PublicProductListItem, ProductCard, AllProductsSection } from "@/lib/api-types"
import { ProductFilters } from "@/components/product-filters"
import { AISearchSummary } from "@/components/ai-search-summary"
import { GroupedProductCard } from "@/components/grouped-product-card"
import { 
  groupProductCards, 
  groupPublicProducts, 
  type ProductGroup,
} from "@/lib/product-grouping"

// Over-fetch configuration
const GROUPS_PER_PAGE = 20
const BACKEND_PAGE_SIZE = 60
const MAX_EXTRA_FETCHES = 5

export default function SearchPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Search results (raw items for grouping)
  const [searchProducts, setSearchProducts] = useState<PublicProductListItem[]>([])
  const [searchGroups, setSearchGroups] = useState<ProductGroup[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchTotalGroups, setSearchTotalGroups] = useState(0)
  
  // Default products (home feed, raw items for grouping)
  const [defaultProducts, setDefaultProducts] = useState<ProductCard[]>([])
  const [defaultGroups, setDefaultGroups] = useState<ProductGroup[]>([])
  const [defaultPage, setDefaultPage] = useState(1)
  const [defaultHasMore, setDefaultHasMore] = useState(false)
  const [defaultTotalGroups, setDefaultTotalGroups] = useState(0)
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDefault, setIsLoadingDefault] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set())

  // Fetch watchlist IDs on mount
  useEffect(() => {
    async function fetchWatchlistIds() {
      try {
        const response = await watchlistService.getWatchlistIds()
        if (response.data) {
          setWatchlistIds(new Set(response.data.product_ids))
        }
      } catch (err) {
        console.error('Error fetching watchlist IDs:', err)
      }
    }
    fetchWatchlistIds()
  }, [])

  // Watchlist toggle handler
  const handleWatchlistToggle = useCallback((productId: string, inWatchlist: boolean) => {
    setWatchlistIds(prev => {
      const next = new Set(prev)
      if (inWatchlist) next.add(productId)
      else next.delete(productId)
      return next
    })
  }, [])

  // Fetch default products with over-fetch grouping
  const fetchDefaultProducts = useCallback(async (page: number) => {
    setIsLoadingDefault(true)
    try {
      const allItems: ProductCard[] = []
      let backendPage = 1
      let hasMore = true
      let fetchCount = 0
      let backendTotal = 0

      // Over-fetch until we have enough groups
      while (hasMore && fetchCount < MAX_EXTRA_FETCHES) {
        const response = await homeFeedService.getHomeFeed({
          page: backendPage,
          page_size: BACKEND_PAGE_SIZE,
        })

        if (response.data) {
          const allProductsSection = response.data.sections.find(
            (s): s is AllProductsSection => s.key === 'all_products'
          )
          if (allProductsSection) {
            allItems.push(...allProductsSection.items)
            hasMore = allProductsSection.pagination.has_next
            backendTotal = allProductsSection.pagination.total
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }

        backendPage++
        fetchCount++

        // Check if we have enough groups
        const groups = groupProductCards(allItems)
        const targetCount = page * GROUPS_PER_PAGE
        if (groups.length >= targetCount || !hasMore) {
          break
        }
      }

      // Store all raw items for re-grouping on page change
      setDefaultProducts(allItems)

      // Group and paginate
      const allGroups = groupProductCards(allItems)
      const startIndex = (page - 1) * GROUPS_PER_PAGE
      const endIndex = startIndex + GROUPS_PER_PAGE
      const pageGroups = allGroups.slice(startIndex, endIndex)

      setDefaultGroups(pageGroups)
      setDefaultTotalGroups(allGroups.length)
      setDefaultHasMore(endIndex < allGroups.length || hasMore)

    } catch (err) {
      console.error('Error fetching default products:', err)
    } finally {
      setIsLoadingDefault(false)
    }
  }, [])

  // Fetch default products on mount and page change
  useEffect(() => {
    if (!hasSearched) {
      fetchDefaultProducts(defaultPage)
    }
  }, [defaultPage, hasSearched, fetchDefaultProducts])

  // Search with over-fetch grouping
  const searchProductsFn = useCallback(async (query: string, page: number = 1) => {
    if (query.length < 2) {
      setSearchProducts([])
      setSearchGroups([])
      setSearchTotalGroups(0)
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const allItems: PublicProductListItem[] = []
      let backendPage = 1
      let hasMore = true
      let fetchCount = 0
      let backendTotal = 0

      // Over-fetch until we have enough groups
      while (hasMore && fetchCount < MAX_EXTRA_FETCHES) {
        const response = await publicProductService.searchProducts({
          q: query,
          page: backendPage,
          page_size: BACKEND_PAGE_SIZE,
        })

        if (response.data) {
          allItems.push(...response.data.items)
          hasMore = response.data.page < response.data.pages
          backendTotal = response.data.total
        } else {
          hasMore = false
        }

        backendPage++
        fetchCount++

        // Check if we have enough groups
        const groups = groupPublicProducts(allItems)
        const targetCount = page * GROUPS_PER_PAGE
        if (groups.length >= targetCount || !hasMore) {
          break
        }
      }

      // Store raw items
      setSearchProducts(allItems)

      // Group and paginate
      const allGroups = groupPublicProducts(allItems)
      const startIndex = (page - 1) * GROUPS_PER_PAGE
      const endIndex = startIndex + GROUPS_PER_PAGE
      const pageGroups = allGroups.slice(startIndex, endIndex)

      setSearchGroups(pageGroups)
      setSearchTotalGroups(allGroups.length)
      setSearchHasMore(endIndex < allGroups.length || hasMore)

    } catch {
      setSearchProducts([])
      setSearchGroups([])
      setSearchTotalGroups(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProductsFn(searchQuery, searchPage)
      } else if (searchQuery.length === 0) {
        setHasSearched(false)
        setSearchProducts([])
        setSearchGroups([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchPage, searchProductsFn])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length >= 2) {
      setSearchPage(1)
      searchProductsFn(searchQuery, 1)
    }
  }

  // Calculate display counts
  const displayTotal = hasSearched ? searchTotalGroups : defaultTotalGroups
  const displayGroups = hasSearched ? searchGroups : defaultGroups
  const currentPage = hasSearched ? searchPage : defaultPage
  const totalPages = Math.ceil(displayTotal / GROUPS_PER_PAGE)
  const hasNext = hasSearched ? searchHasMore : defaultHasMore
  const hasPrev = currentPage > 1

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
      {hasSearched && searchGroups.length > 0 && (
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
              {isLoading || isLoadingDefault 
                ? "Loading..." 
                : `${displayTotal} unique products`
              }
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => hasSearched ? setSearchPage(p => p - 1) : setDefaultPage(p => p - 1)}
                  disabled={!hasPrev || isLoading || isLoadingDefault}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => hasSearched ? setSearchPage(p => p + 1) : setDefaultPage(p => p + 1)}
                  disabled={!hasNext || isLoading || isLoadingDefault}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {isLoading || (isLoadingDefault && !hasSearched) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {hasSearched ? "No products found" : "No products available"}
              </h3>
              <p className="text-muted-foreground">
                {hasSearched 
                  ? "Try adjusting your search query" 
                  : "Products will appear here once suppliers add them."
                }
              </p>
            </div>
          ) : (
            // Grouped product grid
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayGroups.map((group) => (
                <GroupedProductCard
                  key={group.key}
                  group={group}
                  watchlistIds={watchlistIds}
                  onWatchlistToggle={handleWatchlistToggle}
                />
              ))}
            </div>
          )}

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => hasSearched ? setSearchPage(p => p - 1) : setDefaultPage(p => p - 1)}
                disabled={!hasPrev || isLoading || isLoadingDefault}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => hasSearched ? setSearchPage(p => p + 1) : setDefaultPage(p => p + 1)}
                disabled={!hasNext || isLoading || isLoadingDefault}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
