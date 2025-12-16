"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockProducts } from "@/lib/mock-data"
import { ProductFilters } from "@/components/product-filters"
import { AISearchSummary } from "@/components/ai-search-summary"

export default function SearchPage() {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search for products..." defaultValue="iPhone" className="h-12 pl-10 text-base" />
        </div>
        <Button variant="outline" className="h-12 bg-transparent" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <X className="mr-2 h-4 w-4" /> : <SlidersHorizontal className="mr-2 h-4 w-4" />}
          Filters
        </Button>
      </div>

      {/* AI Summary */}
      <div className="mb-6">
        <AISearchSummary />
      </div>

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
            <p className="text-sm text-muted-foreground">{mockProducts.length} products found</p>
          </div>
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
        </div>
      </div>
    </div>
  )
}
