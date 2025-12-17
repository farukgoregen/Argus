"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { 
  Package, ArrowLeft, Loader2, AlertCircle, Truck, 
  MapPin, Star, Clock, Calculator, Sparkles, ChevronDown,
  Globe, CheckCircle2 
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { publicProductService } from "@/lib/services/public-product-service"
import { watchlistService } from "@/lib/services/watchlist-service"
import { WatchlistButton } from "@/components/watchlist-button"
import type { PublicProductDetail, PublicProductListItem } from "@/lib/api-types"

// ============================================
// Constants
// ============================================

const DESTINATION_STORAGE_KEY = 'argus_destination'

// Mock shipping destinations
const COUNTRIES = [
  { code: 'US', name: 'United States', regions: ['California', 'New York', 'Texas', 'Florida', 'Washington'] },
  { code: 'DE', name: 'Germany', regions: ['Bavaria', 'Berlin', 'Hamburg', 'North Rhine-Westphalia'] },
  { code: 'UK', name: 'United Kingdom', regions: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
  { code: 'FR', name: 'France', regions: ['Île-de-France', 'Provence', 'Normandy', 'Brittany'] },
  { code: 'TR', name: 'Turkey', regions: ['Istanbul', 'Ankara', 'Izmir', 'Antalya'] },
] as const

interface Destination {
  country: string
  region: string
}

// ============================================
// Mock Data Functions
// ============================================

// Mock shipping availability based on seller + destination
function getMockShippingInfo(sellerId: string, destination: Destination | null): {
  available: boolean
  estimatedDays: number
  shippingCost: number
  shippingMethod: string
} {
  if (!destination) {
    return { available: false, estimatedDays: 0, shippingCost: 0, shippingMethod: '' }
  }
  
  // Mock logic: Use seller ID hash to determine shipping availability
  const sellerHash = sellerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const destHash = destination.country.charCodeAt(0) + destination.region.charCodeAt(0)
  const combined = (sellerHash + destHash) % 100
  
  // ~75% of sellers can ship to a given destination
  const available = combined < 75
  
  if (!available) {
    return { available: false, estimatedDays: 0, shippingCost: 0, shippingMethod: '' }
  }
  
  // Mock shipping cost based on destination
  const baseCost = destination.country === 'US' ? 15 : destination.country === 'UK' ? 20 : 25
  const shippingCost = baseCost + (combined % 30)
  
  // Mock delivery time
  const estimatedDays = destination.country === 'US' ? 3 + (combined % 5) : 5 + (combined % 10)
  
  const methods = ['Express', 'Standard', 'Economy', 'Air Freight']
  const shippingMethod = methods[combined % methods.length]
  
  return { available, estimatedDays, shippingCost, shippingMethod }
}

// Mock customs/import duty
function getMockCustomsDuty(unitPrice: number, destination: Destination | null): number {
  if (!destination) return 0
  
  // Mock duty rates by country
  const dutyRates: Record<string, number> = {
    'US': 0.05,
    'DE': 0.12,
    'UK': 0.08,
    'FR': 0.12,
    'TR': 0.18,
  }
  
  const rate = dutyRates[destination.country] || 0.10
  return unitPrice * rate
}

// Calculate landed cost
function calculateLandedCost(
  unitPrice: number,
  shippingCost: number,
  customsDuty: number
): number {
  return unitPrice + shippingCost + customsDuty
}

// ============================================
// Helper Functions
// ============================================

function getPhotoUrl(photos: { url: string }[]): string {
  if (!photos || photos.length === 0) return "/placeholder.svg"
  const photo = photos[0]
  if (!photo.url) return "/placeholder.svg"
  if (photo.url.startsWith('http')) return photo.url
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
  return `${baseUrl}${photo.url}`
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Updated today'
  if (diffDays === 1) return 'Updated yesterday'
  if (diffDays < 7) return `Updated ${diffDays} days ago`
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`
  return `Updated ${Math.floor(diffDays / 30)} months ago`
}

// ============================================
// Components
// ============================================

interface OfferWithLandedCost extends PublicProductListItem {
  shippingInfo: ReturnType<typeof getMockShippingInfo>
  customsDuty: number
  landedCost: number
}

function DestinationSelector({
  destination,
  onDestinationChange
}: {
  destination: Destination | null
  onDestinationChange: (dest: Destination | null) => void
}) {
  const [selectedCountry, setSelectedCountry] = useState(destination?.country || '')
  const [selectedRegion, setSelectedRegion] = useState(destination?.region || '')
  
  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry)
  
  const handleCountryChange = (code: string) => {
    setSelectedCountry(code)
    setSelectedRegion('')
    if (!code) {
      onDestinationChange(null)
    }
  }
  
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    if (selectedCountry && region) {
      const newDest = { country: selectedCountry, region }
      onDestinationChange(newDest)
      // Save to localStorage
      localStorage.setItem(DESTINATION_STORAGE_KEY, JSON.stringify(newDest))
    }
  }
  
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Ship to:</span>
      </div>
      <Select value={selectedCountry} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map(country => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedCountryData && (
        <Select value={selectedRegion} onValueChange={handleRegionChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {selectedCountryData.regions.map(region => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

function AIBestSellerCard({ 
  bestOffer,
  destination
}: { 
  bestOffer: OfferWithLandedCost | null
  destination: Destination | null 
}) {
  if (!destination || !bestOffer) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-primary">AI Best Seller Recommendation</p>
            <p className="text-sm text-muted-foreground">
              Select a destination above to see the best offer including landed cost
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const country = COUNTRIES.find(c => c.code === destination.country)
  
  return (
    <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-primary">AI Recommended Best Offer</span>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            Lowest Landed Cost
          </Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-secondary">
              <Image
                src={getPhotoUrl(bestOffer.photos)}
                alt={bestOffer.product_name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-medium">{bestOffer.seller_display_name}</p>
              <p className="text-sm text-muted-foreground">
                Ships to {country?.name}, {destination.region}
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Truck className="h-3 w-3" />
                <span>{bestOffer.shippingInfo.estimatedDays} days via {bestOffer.shippingInfo.shippingMethod}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-6">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Unit Price</p>
              <p className="font-medium">${formatPrice(bestOffer.unit_price)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Shipping</p>
              <p className="font-medium">${formatPrice(bestOffer.shippingInfo.shippingCost)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Customs</p>
              <p className="font-medium">${formatPrice(bestOffer.customsDuty)}</p>
            </div>
            <div className="rounded-lg bg-primary px-4 py-2 text-right">
              <p className="text-xs text-primary-foreground/80">Landed Cost</p>
              <p className="text-xl font-bold text-primary-foreground">
                ${formatPrice(bestOffer.landedCost)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OfferRow({ 
  offer,
  isCheapest,
  isBestLanded,
  destination
}: { 
  offer: OfferWithLandedCost
  isCheapest: boolean
  isBestLanded: boolean
  destination: Destination | null
}) {
  const canShip = offer.shippingInfo.available
  
  return (
    <div className={`
      rounded-lg border p-4 transition-colors
      ${isBestLanded && destination ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}
      ${!canShip && destination ? 'opacity-60' : ''}
    `}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Seller Info */}
        <div className="flex min-w-[200px] flex-1 items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-secondary">
            <Image
              src={getPhotoUrl(offer.photos)}
              alt={offer.product_name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{offer.seller_display_name}</p>
              {isCheapest && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-xs">
                  Lowest Price
                </Badge>
              )}
              {isBestLanded && destination && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Sparkles className="mr-1 h-3 w-3" /> Best Value
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {getRelativeTime(offer.updated_at)}
            </p>
          </div>
        </div>
        
        {/* Stock Info */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Stock</p>
          <p className="font-medium">{offer.stock_quantity.toLocaleString('en-US')}</p>
        </div>
        
        {/* Min Order */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Min Order</p>
          <p className="font-medium">{offer.sell_quantity.toLocaleString('en-US')}</p>
        </div>
        
        {/* Unit Price */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Unit Price</p>
          <p className="text-lg font-bold">${formatPrice(offer.unit_price)}</p>
        </div>
        
        {/* Shipping Info (if destination selected) */}
        {destination && (
          <>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Shipping</p>
              {canShip ? (
                <>
                  <p className="font-medium">${formatPrice(offer.shippingInfo.shippingCost)}</p>
                  <p className="text-xs text-muted-foreground">{offer.shippingInfo.estimatedDays}d</p>
                </>
              ) : (
                <p className="text-sm text-red-500">N/A</p>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Customs</p>
              {canShip ? (
                <p className="font-medium">${formatPrice(offer.customsDuty)}</p>
              ) : (
                <p className="text-sm text-red-500">N/A</p>
              )}
            </div>
            
            <div className="min-w-[100px] text-right">
              <p className="text-sm text-muted-foreground">Landed Cost</p>
              {canShip ? (
                <p className="text-lg font-bold text-primary">${formatPrice(offer.landedCost)}</p>
              ) : (
                <p className="text-sm text-red-500">Cannot ship</p>
              )}
            </div>
          </>
        )}
        
        {/* Action */}
        <Button size="sm" variant={canShip || !destination ? "default" : "outline"} disabled={!canShip && !!destination}>
          Contact
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [product, setProduct] = useState<PublicProductDetail | null>(null)
  const [offers, setOffers] = useState<PublicProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [destination, setDestination] = useState<Destination | null>(null)

  // Load saved destination from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DESTINATION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Destination
        if (parsed.country && parsed.region) {
          setDestination(parsed)
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch product detail, offers, and watchlist status in parallel
        const [productResponse, offersResponse, watchlistResponse] = await Promise.all([
          publicProductService.getProduct(id),
          publicProductService.getProductOffers(id, 1, 50),
          watchlistService.getWatchlistIds(),
        ])
        
        if (productResponse.error) {
          setError(productResponse.error.detail || 'Failed to load product')
          return
        }

        if (productResponse.data) {
          setProduct(productResponse.data)
          
          // Check if in watchlist
          if (watchlistResponse.data) {
            setIsInWatchlist(watchlistResponse.data.product_ids.includes(id))
          }
        }
        
        if (offersResponse.data) {
          setOffers(offersResponse.data.items)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  // Calculate offers with landed costs
  const offersWithLandedCost: OfferWithLandedCost[] = useMemo(() => {
    return offers.map(offer => {
      const unitPrice = parseFloat(offer.unit_price)
      const shippingInfo = getMockShippingInfo(offer.seller_id, destination)
      const customsDuty = getMockCustomsDuty(unitPrice, destination)
      const landedCost = shippingInfo.available 
        ? calculateLandedCost(unitPrice, shippingInfo.shippingCost, customsDuty)
        : Infinity
      
      return {
        ...offer,
        shippingInfo,
        customsDuty,
        landedCost,
      }
    })
  }, [offers, destination])

  // Sort offers by price (cheapest first)
  const sortedOffers = useMemo(() => {
    return [...offersWithLandedCost].sort((a, b) => {
      const priceA = parseFloat(a.unit_price)
      const priceB = parseFloat(b.unit_price)
      return priceA - priceB
    })
  }, [offersWithLandedCost])

  // Find cheapest offer (by unit price)
  const cheapestOffer = sortedOffers[0] || null

  // Find best landed cost offer (among shippable offers)
  const bestLandedOffer = useMemo(() => {
    if (!destination) return null
    const shippable = offersWithLandedCost.filter(o => o.shippingInfo.available)
    if (shippable.length === 0) return null
    return shippable.reduce((best, curr) => 
      curr.landedCost < best.landedCost ? curr : best
    , shippable[0])
  }, [offersWithLandedCost, destination])

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-4 h-10 w-24" />
        <Card className="mb-6 border-border bg-card">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Skeleton className="mb-4 h-20 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="p-6">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">{error || 'Product not found'}</p>
            <p className="mb-4 text-sm text-muted-foreground">
              The product you&apos;re looking for may not be available.
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Product Hero - Shows cheapest offer */}
      <Card className="mb-6 border-border bg-card">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
              <Image
                src={getPhotoUrl(product.photos)}
                alt={product.product_name}
                width={600}
                height={600}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>
            <div>
              <Badge className="mb-3 bg-secondary text-secondary-foreground" variant="secondary">
                {product.product_category}
              </Badge>
              <h1 className="mb-2 text-3xl font-bold">{product.product_name}</h1>
              
              {product.description && (
                <p className="mb-4 text-muted-foreground">{product.description}</p>
              )}

              {/* Offers Summary */}
              <div className="mb-4 flex items-center gap-4">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
                  <Globe className="mr-1 h-3 w-3" />
                  {offers.length} Seller{offers.length !== 1 ? 's' : ''}
                </Badge>
                {cheapestOffer && (
                  <span className="text-sm text-muted-foreground">
                    From <span className="font-semibold text-foreground">${formatPrice(cheapestOffer.unit_price)}</span>
                  </span>
                )}
              </div>

              {/* Cheapest Offer Highlight */}
              {cheapestOffer && (
                <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">Lowest Price Offer</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">by {cheapestOffer.seller_display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cheapestOffer.stock_quantity.toLocaleString('en-US')} in stock • Min order: {cheapestOffer.sell_quantity.toLocaleString('en-US')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${formatPrice(cheapestOffer.unit_price)}</p>
                      <p className="text-xs text-muted-foreground">per unit</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Link */}
              <div className="mb-4">
                <Link 
                  href={`/dashboard/search?category=${encodeURIComponent(product.product_category)}`}
                  className="text-sm text-primary hover:underline"
                >
                  View similar products in {product.product_category}
                </Link>
              </div>

              {/* Watchlist Button */}
              <WatchlistButton
                productId={product.id}
                initialInWatchlist={isInWatchlist}
                onToggle={(inWatchlist) => setIsInWatchlist(inWatchlist)}
                variant="button"
                size="lg"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destination Selector */}
      <Card className="mb-4 border-border bg-card">
        <CardContent className="p-4">
          <DestinationSelector 
            destination={destination}
            onDestinationChange={setDestination}
          />
        </CardContent>
      </Card>

      {/* AI Best Seller Recommendation */}
      <div className="mb-6">
        <AIBestSellerCard bestOffer={bestLandedOffer} destination={destination} />
      </div>

      {/* All Offers */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Offers</CardTitle>
              <CardDescription>
                Compare prices from {offers.length} seller{offers.length !== 1 ? 's' : ''} 
                {destination && ' • Sorted by unit price'}
              </CardDescription>
            </div>
            {destination && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calculator className="h-4 w-4" />
                <span>Showing landed costs for {COUNTRIES.find(c => c.code === destination.country)?.name}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No offers available for this product</p>
            </div>
          ) : (
            sortedOffers.map((offer, index) => (
              <OfferRow
                key={offer.id}
                offer={offer}
                isCheapest={index === 0}
                isBestLanded={bestLandedOffer?.id === offer.id}
                destination={destination}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Product Details */}
      {product.features && Object.keys(product.features).length > 0 && (
        <Card className="mt-6 border-border bg-card">
          <CardHeader>
            <CardTitle>Product Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {Object.entries(product.features).map(([key, value]) => (
                <div key={key} className="flex justify-between rounded-lg bg-secondary/50 px-4 py-2">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
