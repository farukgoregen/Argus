import { TrendingDown, TrendingUp, Eye, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const watchedProducts = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    image: "/iphone-15.jpg",
    supplier: "Alibaba",
    currentPrice: 899,
    targetPrice: 850,
    change30Day: -5.2,
    status: "PRICE ALERT",
    prediction: "Price dropping steadily, hit target in ~2 weeks.",
  },
  {
    id: "2",
    name: "MacBook Pro M3",
    image: "/silver-macbook-on-desk.png",
    supplier: "Amazon",
    currentPrice: 1999,
    targetPrice: 1899,
    change30Day: -2.1,
    status: "WATCHING",
    prediction: "Price stable, may drop during holiday season.",
  },
  {
    id: "3",
    name: "Sony WH-1000XM5",
    image: "/wireless-headphones.png",
    supplier: "DHGate",
    currentPrice: 349,
    targetPrice: 299,
    change30Day: 1.5,
    status: "WATCHING",
    prediction: "Price increased recently, wait for promotion.",
  },
]

export default function WatchlistPage() {
  return (
    <div className="space-y-6 pb-20">
      {/* AI Watch Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Actively tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Price Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">3</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drops Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">5</div>
            <p className="text-xs text-muted-foreground mt-1">Price decreased</p>
          </CardContent>
        </Card>
      </div>

      {/* Watched Products */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Watched Products</h2>
        {watchedProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Product Image & Info */}
                <div className="md:col-span-4 flex gap-4">
                  <div className="shrink-0">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">Supplier: {product.supplier}</p>
                    <Badge variant={product.status === "PRICE ALERT" ? "destructive" : "secondary"}>
                      {product.status === "PRICE ALERT" ? (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Eye className="mr-1 h-3 w-3" />
                      )}
                      {product.status}
                    </Badge>
                  </div>
                </div>

                {/* Price Info */}
                <div className="md:col-span-5 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">30-Day Change</p>
                    <div className="flex items-center gap-1 mt-1">
                      {product.change30Day < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-semibold ${product.change30Day < 0 ? "text-green-500" : "text-red-500"}`}>
                        {product.change30Day}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="font-semibold text-lg mt-1">${product.currentPrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Target Price</p>
                    <p className="font-semibold text-lg mt-1">${product.targetPrice}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    Compare Alerts
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit Alert
                  </Button>
                  <Button size="sm" variant="destructive">
                    Remove
                  </Button>
                </div>
              </div>

              {/* AI Prediction */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">AI Prediction:</span> {product.prediction}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
