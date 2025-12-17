/**
 * Product Grouping Utility
 * 
 * Groups products by normalized name + category to show one card per unique product
 * with multiple seller offers underneath.
 */

import type { ProductCard, PublicProductListItem, ProductCardPhoto, StockStatus } from './api-types';

// ============================================
// Types
// ============================================

export interface OfferInfo {
  product_id: string;
  unit_price: number;
  photos: ProductCardPhoto[];
  seller_id: string;
  seller_display_name: string;
  stock_quantity: number;
  stock_status: StockStatus;
  updated_at: string;
}

export interface ProductGroup {
  /** Normalized key: lowercase trimmed name + category */
  key: string;
  product_name: string;
  product_category: string;
  /** The cheapest offer (used for card display) */
  cheapest_offer: OfferInfo;
  /** All offers sorted by price ascending */
  offers: OfferInfo[];
  /** Number of unique sellers */
  seller_count: number;
}

// ============================================
// Normalization
// ============================================

/**
 * Normalize a string for comparison:
 * - trim whitespace
 * - collapse multiple spaces to single
 * - lowercase
 * - remove punctuation for stability
 */
function normalize(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
}

/**
 * Generate a unique group key from product name and category
 */
function getGroupKey(name: string, category: string): string {
  return `${normalize(name)}::${normalize(category)}`
}

// ============================================
// Conversion Functions
// ============================================

/**
 * Convert ProductCard (from home feed) to OfferInfo
 */
function productCardToOffer(product: ProductCard): OfferInfo {
  return {
    product_id: product.id,
    unit_price: parseFloat(product.unit_price) || 0,
    photos: product.photos || [],
    seller_id: product.seller.id,
    seller_display_name: product.seller.display_name || 'Seller',
    stock_quantity: product.stock_quantity,
    stock_status: product.stock_status,
    updated_at: product.updated_at,
  }
}

/**
 * Convert PublicProductListItem (from search) to OfferInfo
 */
function publicProductToOffer(product: PublicProductListItem): OfferInfo {
  // Map photos from PublicProductListItem format
  const photos: ProductCardPhoto[] = product.photos?.map(p => ({
    id: p.id,
    url: p.url,
    sort_order: p.sort_order,
  })) || []

  return {
    product_id: product.id,
    unit_price: parseFloat(product.unit_price) || 0,
    photos,
    seller_id: product.seller_id,
    seller_display_name: product.seller_display_name || 'Seller',
    stock_quantity: product.stock_quantity,
    stock_status: product.stock_status,
    updated_at: product.updated_at,
  }
}

// ============================================
// Grouping Functions
// ============================================

/**
 * Sort offers by price ascending, with tie-breaker on updated_at (newest first) then id
 */
function sortOffers(offers: OfferInfo[]): OfferInfo[] {
  return [...offers].sort((a, b) => {
    // Primary: price ascending
    if (a.unit_price !== b.unit_price) {
      return a.unit_price - b.unit_price
    }
    // Secondary: newest first (descending updated_at)
    const dateA = new Date(a.updated_at).getTime()
    const dateB = new Date(b.updated_at).getTime()
    if (dateA !== dateB) {
      return dateB - dateA
    }
    // Tertiary: deterministic by id
    return a.product_id.localeCompare(b.product_id)
  })
}

/**
 * Group ProductCard items (from home feed) into ProductGroups
 */
export function groupProductCards(products: ProductCard[]): ProductGroup[] {
  const groupMap = new Map<string, {
    name: string;
    category: string;
    offers: OfferInfo[];
  }>()

  for (const product of products) {
    const key = getGroupKey(product.product_name, product.product_category)
    const offer = productCardToOffer(product)

    if (groupMap.has(key)) {
      groupMap.get(key)!.offers.push(offer)
    } else {
      groupMap.set(key, {
        name: product.product_name,
        category: product.product_category,
        offers: [offer],
      })
    }
  }

  const groups: ProductGroup[] = []

  for (const [key, data] of groupMap.entries()) {
    const sortedOffers = sortOffers(data.offers)
    const uniqueSellers = new Set(sortedOffers.map(o => o.seller_id))

    groups.push({
      key,
      product_name: data.name,
      product_category: data.category,
      cheapest_offer: sortedOffers[0],
      offers: sortedOffers,
      seller_count: uniqueSellers.size,
    })
  }

  // Sort groups by cheapest price
  return groups.sort((a, b) => a.cheapest_offer.unit_price - b.cheapest_offer.unit_price)
}

/**
 * Group PublicProductListItem items (from search) into ProductGroups
 */
export function groupPublicProducts(products: PublicProductListItem[]): ProductGroup[] {
  const groupMap = new Map<string, {
    name: string;
    category: string;
    offers: OfferInfo[];
  }>()

  for (const product of products) {
    const key = getGroupKey(product.product_name, product.product_category)
    const offer = publicProductToOffer(product)

    if (groupMap.has(key)) {
      groupMap.get(key)!.offers.push(offer)
    } else {
      groupMap.set(key, {
        name: product.product_name,
        category: product.product_category,
        offers: [offer],
      })
    }
  }

  const groups: ProductGroup[] = []

  for (const [key, data] of groupMap.entries()) {
    const sortedOffers = sortOffers(data.offers)
    const uniqueSellers = new Set(sortedOffers.map(o => o.seller_id))

    groups.push({
      key,
      product_name: data.name,
      product_category: data.category,
      cheapest_offer: sortedOffers[0],
      offers: sortedOffers,
      seller_count: uniqueSellers.size,
    })
  }

  // Sort groups by cheapest price
  return groups.sort((a, b) => a.cheapest_offer.unit_price - b.cheapest_offer.unit_price)
}

// ============================================
// Over-fetch Pagination Helper
// ============================================

export interface GroupedPaginationState {
  /** Groups to display on current page */
  groups: ProductGroup[];
  /** Total unique groups found so far */
  totalGroups: number;
  /** Whether there are more backend pages to fetch */
  hasMore: boolean;
  /** Current UI page (1-indexed) */
  currentPage: number;
  /** Total UI pages (estimated) */
  totalPages: number;
}

/**
 * Configuration for over-fetch grouping
 */
export interface OverFetchConfig {
  /** Target number of unique groups per UI page */
  targetGroupsPerPage: number;
  /** Backend page size to request */
  backendPageSize: number;
  /** Maximum backend pages to fetch per UI page load */
  maxExtraFetches: number;
}

export const DEFAULT_OVERFETCH_CONFIG: OverFetchConfig = {
  targetGroupsPerPage: 20,
  backendPageSize: 60,
  maxExtraFetches: 5,
}

/**
 * Fetches and groups products with over-fetch strategy
 * Returns enough unique groups to fill the target page
 * 
 * @param fetchFn - Function to fetch a backend page, returns items and hasNextPage
 * @param config - Over-fetch configuration
 */
export async function fetchAndGroupProducts<T extends ProductCard | PublicProductListItem>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; hasNext: boolean; total: number }>,
  groupFn: (items: T[]) => ProductGroup[],
  uiPage: number,
  config: OverFetchConfig = DEFAULT_OVERFETCH_CONFIG
): Promise<GroupedPaginationState> {
  const allItems: T[] = []
  let backendPage = 1
  let hasMore = true
  let backendTotal = 0
  let fetchCount = 0

  // Keep fetching until we have enough groups or no more data
  while (hasMore && fetchCount < config.maxExtraFetches) {
    const result = await fetchFn(backendPage, config.backendPageSize)
    allItems.push(...result.items)
    hasMore = result.hasNext
    backendTotal = result.total
    backendPage++
    fetchCount++

    // Check if we have enough groups
    const groups = groupFn(allItems)
    const targetCount = uiPage * config.targetGroupsPerPage

    if (groups.length >= targetCount || !hasMore) {
      break
    }
  }

  // Group all fetched items
  const allGroups = groupFn(allItems)

  // Calculate pagination
  const startIndex = (uiPage - 1) * config.targetGroupsPerPage
  const endIndex = startIndex + config.targetGroupsPerPage
  const pageGroups = allGroups.slice(startIndex, endIndex)

  // Estimate total pages
  // Rough estimate: if we have X raw items giving Y groups, 
  // then total raw items should give approximately (total/X)*Y groups
  const estimatedTotalGroups = allItems.length > 0
    ? Math.ceil((backendTotal / allItems.length) * allGroups.length)
    : allGroups.length
  const totalPages = Math.ceil(estimatedTotalGroups / config.targetGroupsPerPage)

  return {
    groups: pageGroups,
    totalGroups: allGroups.length,
    hasMore: endIndex < allGroups.length || hasMore,
    currentPage: uiPage,
    totalPages: Math.max(totalPages, 1),
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get photo URL with fallback
 */
export function getOfferPhotoUrl(offer: OfferInfo): string {
  if (!offer.photos || offer.photos.length === 0) return '/placeholder.svg'
  const photo = offer.photos[0]
  if (!photo.url) return '/placeholder.svg'
  if (photo.url.startsWith('http')) return photo.url
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
  return `${baseUrl}${photo.url}`
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
