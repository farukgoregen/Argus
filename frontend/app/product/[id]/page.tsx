import { Star, TrendingDown, Package, Truck, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PriceOffersTable } from "@/components/price-offers-table"
import Image from "next/image"

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-6 pb-20">
      {/* Product Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-center items-center bg-muted rounded-lg p-8">
              <Image
                src="/modern-smartphone.png"
                alt="Product"
                width={400}
                height={400}
                className="object-contain"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">iPhone 15 Pro Max 256GB</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-muted-foreground">(2,341 reviews)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Package className="mr-1 h-3 w-3" />
                  1,200 in stock
                </Badge>
                <Badge variant="outline">
                  <Truck className="mr-1 h-3 w-3" />
                  Fast shipping
                </Badge>
                <Badge variant="outline">
                  <Shield className="mr-1 h-3 w-3" />
                  Verified suppliers
                </Badge>
              </div>

              {/* Price Comparison Showcase */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Cheapest Seller</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">$899</span>
                    <span className="text-muted-foreground line-through">$999</span>
                    <Badge variant="secondary">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      10% off
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Landed Cost:</span> $925 (incl. shipping & taxes)
                    </p>
                    <p>
                      <span className="text-muted-foreground">USD:</span> $899 |{" "}
                      <span className="text-muted-foreground">EUR:</span> €825
                    </p>
                    <p>
                      <span className="text-muted-foreground">Historical Average:</span> $950
                    </p>
                  </div>
                  <Button className="w-full">Contact Seller</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Price Offers */}
      <Card>
        <CardHeader>
          <CardTitle>All Price Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceOffersTable />
        </CardContent>
      </Card>
    </div>
  )
}
