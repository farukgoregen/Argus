import Image from "next/image"
import { Star, TrendingDown, Package, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockProducts, mockOffers } from "@/lib/mock-data"
import { OffersTable } from "@/components/offers-table"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = mockProducts.find((p) => p.id === id) || mockProducts[0]

  return (
    <div className="p-6">
      {/* Product Header */}
      <Card className="mb-6 border-border bg-card">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                width={600}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <Badge className="mb-3 bg-secondary text-secondary-foreground" variant="secondary">
                {product.category}
              </Badge>
              <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-accent text-accent" : "text-muted"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  {product.stock} in stock
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-secondary p-4">
                  <p className="mb-1 text-sm text-muted-foreground">Average Price</p>
                  <p className="text-2xl font-bold">${product.avgPrice}</p>
                </div>
                <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
                  <p className="mb-1 text-sm text-primary">Best Price</p>
                  <p className="text-2xl font-bold text-primary">${product.minPrice}</p>
                  <p className="text-xs text-muted-foreground">
                    {(((product.avgPrice - product.minPrice) / product.avgPrice) * 100).toFixed(1)}% below average
                  </p>
                </div>
              </div>

              <Button className="w-full" size="lg">
                <TrendingDown className="mr-2 h-4 w-4" />
                Add to Watchlist
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Showcase */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cheapest Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-1 text-2xl font-bold text-accent">$1,089</p>
            <p className="text-sm text-muted-foreground">Amazon Business</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historical Average</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-1 text-2xl font-bold">$1,150</p>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Price Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-1 flex items-center gap-2 text-2xl font-bold text-accent">
              <TrendingDown className="h-5 w-5" />
              -5.3%
            </p>
            <p className="text-sm text-muted-foreground">Decreasing</p>
          </CardContent>
        </Card>
      </div>

      {/* Offers Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Offers</CardTitle>
              <CardDescription>Compare prices from verified suppliers</CardDescription>
            </div>
            <Badge className="bg-accent/20 text-accent hover:bg-accent/30">
              <Shield className="mr-1 h-3 w-3" />4 Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <OffersTable offers={mockOffers} />
        </CardContent>
      </Card>
    </div>
  )
}
