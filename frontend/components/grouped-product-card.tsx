"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronUp, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WatchlistButton } from "@/components/watchlist-button"
import type { ProductGroup, OfferInfo } from "@/lib/product-grouping"
import { getOfferPhotoUrl, formatPrice } from "@/lib/product-grouping"

// ============================================
// Props
// ============================================

interface GroupedProductCardProps {
  group: ProductGroup
  watchlistIds: Set<string>
  onWatchlistToggle: (productId: string, inWatchlist: boolean) => void
}

// ============================================
// Other Sellers Section
// ============================================

interface OtherSellerRowProps {
  offer: OfferInfo
  isWatched: boolean
  onWatchlistToggle: (productId: string, inWatchlist: boolean) => void
}

function OtherSellerRow({ offer, isWatched, onWatchlistToggle }: OtherSellerRowProps) {
  return (
    <Link 
      href={`/dashboard/product/${offer.product_id}`}
      className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-secondary"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded bg-secondary">
          <Image
            src={getOfferPhotoUrl(offer)}
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {offer.seller_display_name}
        </span>
      </div>
      <span className="shrink-0 text-xs font-medium">
        ${formatPrice(offer.unit_price)}
      </span>
    </Link>
  )
}

// ============================================
// Main Component
// ============================================

export function GroupedProductCard({ 
  group, 
  watchlistIds, 
  onWatchlistToggle 
}: GroupedProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const { cheapest_offer, offers, seller_count, product_name, product_category } = group
  
  // Other offers (excluding cheapest)
  const otherOffers = offers.slice(1)
  const hasOtherOffers = otherOffers.length > 0
  
  // Show first 3 sellers inline, rest in expanded
  const inlineOffers = otherOffers.slice(0, 3)
  const expandedOffers = otherOffers.slice(3)
  const hasMoreOffers = expandedOffers.length > 0
  
  // Watchlist: use cheapest offer's product_id for heart button
  const isWatched = watchlistIds.has(cheapest_offer.product_id)

  return (
    <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary hover:shadow-lg">
      {/* Product Image */}
      <Link href={`/dashboard/product/${cheapest_offer.product_id}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Image
            src={getOfferPhotoUrl(cheapest_offer)}
            alt={product_name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg"
            }}
          />
          
          {/* Seller count badge */}
          {seller_count > 1 && (
            <div className="absolute left-2 top-2">
              <Badge className="bg-blue-500/90 text-white text-xs">
                <Users className="mr-1 h-3 w-3" />
                {seller_count} sellers
              </Badge>
            </div>
          )}
          
          {/* Watchlist button */}
          <div className="absolute right-2 top-2">
            <WatchlistButton
              productId={cheapest_offer.product_id}
              initialInWatchlist={isWatched}
              onToggle={(inWatchlist) => onWatchlistToggle(cheapest_offer.product_id, inWatchlist)}
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
            />
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4">
        {/* Category */}
        <Badge className="mb-2 bg-secondary text-secondary-foreground" variant="secondary">
          {product_category}
        </Badge>
        
        {/* Title */}
        <Link href={`/dashboard/product/${cheapest_offer.product_id}`}>
          <h3 className="mb-2 line-clamp-2 font-medium group-hover:text-primary">
            {product_name}
          </h3>
        </Link>
        
        {/* Price from cheapest */}
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-accent">
            ${formatPrice(cheapest_offer.unit_price)}
          </span>
          {seller_count > 1 && (
            <span className="text-xs text-muted-foreground">lowest</span>
          )}
        </div>
        
        {/* Main seller info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{cheapest_offer.seller_display_name}</span>
          <Badge 
            variant="secondary" 
            className={
              cheapest_offer.stock_status === 'in_stock' 
                ? 'bg-green-500/20 text-green-500' 
                : cheapest_offer.stock_status === 'low_stock'
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'bg-red-500/20 text-red-500'
            }
          >
            {cheapest_offer.stock_status.replace('_', ' ')}
          </Badge>
        </div>
        
        {/* Other Sellers Section */}
        {hasOtherOffers && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Other sellers ({otherOffers.length})
            </p>
            
            {/* Inline sellers (up to 3) */}
            <div className="space-y-1">
              {inlineOffers.map((offer) => (
                <OtherSellerRow
                  key={offer.product_id}
                  offer={offer}
                  isWatched={watchlistIds.has(offer.product_id)}
                  onWatchlistToggle={onWatchlistToggle}
                />
              ))}
            </div>
            
            {/* Expanded sellers */}
            {hasMoreOffers && (
              <>
                {isExpanded && (
                  <div className="mt-1 space-y-1">
                    {expandedOffers.map((offer) => (
                      <OtherSellerRow
                        key={offer.product_id}
                        offer={offer}
                        isWatched={watchlistIds.has(offer.product_id)}
                        onWatchlistToggle={onWatchlistToggle}
                      />
                    ))}
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full text-xs"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsExpanded(!isExpanded)
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      +{expandedOffers.length} more
                    </>
                  )}
                </Button>
              </>
            )}
            
            {/* Link to view all offers */}
            {otherOffers.length > 5 && (
              <Link 
                href={`/dashboard/product/${cheapest_offer.product_id}`}
                className="mt-2 block text-center text-xs text-primary hover:underline"
              >
                View all {offers.length} offers →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GroupedProductCard
