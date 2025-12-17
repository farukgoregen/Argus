"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, SlidersHorizontal, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { publicProductService } from "@/lib/services/public-product-service"
import { homeFeedService } from "@/lib/services/home-feed-service"
import { watchlistService } from "@/lib/services/watchlist-service"
import { aiService } from "@/lib/services"
import type { PublicProductListItem, ProductCard, AllProductsSection, SearchSummaryResponse } from "@/lib/api-types"
import { ProductFilters, DELIVERY_OPTIONS, type FilterState } from "@/components/product-filters"
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

// Default filter values
const DEFAULT_FILTERS: FilterState = {
  suppliers: [],
  priceMin: 0,
  priceMax: 5000,
  minTrust: 0,
  deliveryTimes: [],
}

// Parse filters from URL search params
function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  return {
    suppliers: searchParams.get("suppliers")?.split(",").filter(Boolean) || [],
    priceMin: Number(searchParams.get("price_min")) || DEFAULT_FILTERS.priceMin,
    priceMax: Number(searchParams.get("price_max")) || DEFAULT_FILTERS.priceMax,
    minTrust: Number(searchParams.get("min_trust")) || DEFAULT_FILTERS.minTrust,
    deliveryTimes: searchParams.get("delivery")?.split(",").filter(Boolean) || [],
  }
}

// Build URL search params from filters
function buildFilterParams(filters: FilterState): Record<string, string> {
  const params: Record<string, string> = {}
  
  if (filters.suppliers.length > 0) {
    params.suppliers = filters.suppliers.join(",")
  }
  if (filters.priceMin > 0) {
    params.price_min = String(filters.priceMin)
  }
  if (filters.priceMax < 5000) {
    params.price_max = String(filters.priceMax)
  }
  if (filters.minTrust > 0) {
    params.min_trust = String(filters.minTrust)
  }
  if (filters.deliveryTimes.length > 0) {
    params.delivery = filters.deliveryTimes.join(",")
  }
  
  return params
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlQuery = searchParams.get("q") || ""
  
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  
  // Filter state - initialized from URL
  const [filters, setFilters] = useState<FilterState>(() => 
    parseFiltersFromURL(searchParams)
  )
  
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
  const [hasSearched, setHasSearched] = useState(!!urlQuery)
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set())
  
  // AI Summary state
  const [aiSummary, setAiSummary] = useState<SearchSummaryResponse | null>(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null)

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.suppliers.length > 0 ||
      filters.priceMin > 0 ||
      filters.priceMax < 5000 ||
      filters.minTrust > 0 ||
      filters.deliveryTimes.length > 0
    )
  }, [filters])

  // Sync URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (searchQuery.length >= 2) {
      params.set("q", searchQuery)
    }
    
    const filterParams = buildFilterParams(filters)
    Object.entries(filterParams).forEach(([key, value]) => {
      params.set(key, value)
    })
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [filters, searchQuery, router])

  // Sync search query with URL
  useEffect(() => {
    setSearchQuery(urlQuery)
    if (urlQuery) {
      setHasSearched(true)
    }
  }, [urlQuery])

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
  const searchProductsFn = useCallback(async (query: string, page: number = 1, currentFilters: FilterState) => {
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
          // Pass price filters to backend
          price_min: currentFilters.priceMin > 0 ? currentFilters.priceMin : undefined,
          price_max: currentFilters.priceMax < 5000 ? currentFilters.priceMax : undefined,
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

      // Apply client-side filters (supplier, trust score, delivery time)
      let filteredItems = allItems

      // Supplier filter (client-side - match seller_display_name)
      if (currentFilters.suppliers.length > 0) {
        const lowerSuppliers = currentFilters.suppliers.map(s => s.toLowerCase())
        filteredItems = filteredItems.filter(item => {
          const sellerName = item.seller_display_name.toLowerCase()
          return lowerSuppliers.some(supplier => sellerName.includes(supplier))
        })
      }

      // Trust score filter (client-side - use deterministic score based on seller)
      if (currentFilters.minTrust > 0) {
        filteredItems = filteredItems.filter(item => {
          // Generate deterministic trust score from seller name
          const hash = item.seller_display_name.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
          }, 0)
          const trustScore = 5 + (Math.abs(hash) % 50) / 10 // 5.0 - 9.9
          return trustScore >= currentFilters.minTrust
        })
      }

      // Delivery time filter (client-side - use deterministic delivery based on product)
      if (currentFilters.deliveryTimes.length > 0) {
        filteredItems = filteredItems.filter(item => {
          // Generate deterministic delivery days from product id
          const hash = item.id.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
          }, 0)
          const deliveryDays = 1 + (Math.abs(hash) % 20) // 1-20 days
          
          return currentFilters.deliveryTimes.some(timeId => {
            const option = DELIVERY_OPTIONS.find(o => o.id === timeId)
            if (!option) return false
            return deliveryDays >= option.minDays && deliveryDays <= option.maxDays
          })
        })
      }

      // Group and paginate filtered items
      const allGroups = groupPublicProducts(filteredItems)
      const startIndex = (page - 1) * GROUPS_PER_PAGE
      const endIndex = startIndex + GROUPS_PER_PAGE
      const pageGroups = allGroups.slice(startIndex, endIndex)

      setSearchGroups(pageGroups)
      setSearchTotalGroups(allGroups.length)
      setSearchHasMore(endIndex < allGroups.length || hasMore)

      // Fetch AI summary for these results
      if (allItems.length > 0 && page === 1) {
        fetchAiSummary(query, allItems)
      }

    } catch {
      setSearchProducts([])
      setSearchGroups([])
      setSearchTotalGroups(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch AI summary for search results
  const fetchAiSummary = useCallback(async (query: string, items: PublicProductListItem[]) => {
    setAiSummaryLoading(true)
    setAiSummaryError(null)
    setAiSummary(null)

    try {
      // Map items to the format expected by the API
      const results = items.slice(0, 20).map(item => ({
        id: item.id,
        product_name: item.product_name,
        product_category: item.product_category,
        unit_price: item.unit_price,
        sell_quantity: item.sell_quantity,
        seller_name: item.seller_display_name,
        updated_at: item.updated_at || new Date().toISOString(),
      }))

      const response = await aiService.getSearchSummary({
        query,
        results,
        destination: "search",
      })

      if (response.data) {
        setAiSummary(response.data)
      } else if (response.error) {
        // Extract error message from error object
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error.detail || "Failed to generate AI summary"
        setAiSummaryError(errorMsg)
      }
    } catch (err) {
      console.error("Error fetching AI summary:", err)
      setAiSummaryError("Failed to generate AI summary")
    } finally {
      setAiSummaryLoading(false)
    }
  }, [])

  // Debounced search - re-run when query or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProductsFn(searchQuery, searchPage, filters)
      } else if (searchQuery.length === 0) {
        setHasSearched(false)
        setSearchProducts([])
        setSearchGroups([])
        setAiSummary(null)
        setAiSummaryError(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchPage, filters, searchProductsFn])

  // Initial search from URL
  useEffect(() => {
    if (urlQuery && urlQuery.length >= 2) {
      searchProductsFn(urlQuery, 1, filters)
    }
  }, []) // Only run once on mount

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length >= 2) {
      setSearchPage(1)
      searchProductsFn(searchQuery, 1, filters)
    }
  }

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    setSearchPage(1) // Reset to first page when filters change
  }, [])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSearchPage(1)
  }, [])

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
        <Button 
          type="button"
          variant="outline" 
          className={`h-12 bg-transparent ${hasActiveFilters ? 'border-primary text-primary' : ''}`} 
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <X className="mr-2 h-4 w-4" /> : <SlidersHorizontal className="mr-2 h-4 w-4" />}
          Filters
          {hasActiveFilters && <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">•</span>}
        </Button>
      </form>

      {/* AI Summary - only show when searching */}
      {hasSearched && (searchGroups.length > 0 || aiSummaryLoading) && (
        <div className="mb-6">
          <AISearchSummary 
            summary={aiSummary} 
            isLoading={aiSummaryLoading} 
            error={aiSummaryError || undefined} 
          />
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Filters (Desktop) */}
        {showFilters && (
          <div className="hidden w-64 shrink-0 md:block">
            <ProductFilters filters={filters} onFiltersChange={handleFiltersChange} />
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
            <ProductFilters filters={filters} onFiltersChange={handleFiltersChange} />
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
