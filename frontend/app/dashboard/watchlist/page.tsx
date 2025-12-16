import Image from "next/image"
import Link from "next/link"
import { TrendingDown, TrendingUp, Target, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { mockWatchlist } from "@/lib/mock-data"

export default function WatchlistPage() {
  const totalItems = mockWatchlist.length
  const priceAlerts = mockWatchlist.filter((item) => item.status === "alert").length
  const dropsToday = 2

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Price Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{priceAlerts}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drops Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-chart-2">{dropsToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-4">
        {mockWatchlist.map((item) => {
          const percentToTarget = ((item.currentPrice - item.targetPrice) / item.targetPrice) * 100
          const progressValue = Math.max(0, 100 - percentToTarget)

          return (
            <Card key={item.id} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-[auto_1fr_auto]">
                  {/* Product Image */}
                  <div className="h-24 w-24 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={item.productImage || "/placeholder.svg"}
                      alt={item.productName}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/dashboard/product/${item.productId}`}
                          className="text-lg font-semibold hover:text-primary"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Added on {new Date(item.addedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={item.status === "alert" ? "default" : "secondary"}
                        className={
                          item.status === "alert"
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {item.status === "alert" ? "Price Alert" : "Watching"}
                      </Badge>
                    </div>

                    <div className="mb-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Current Price</p>
                        <p className="text-xl font-bold">${item.currentPrice}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">Target Price</p>
                        <p className="flex items-center gap-1 text-xl font-bold text-accent">
                          <Target className="h-4 w-4" />${item.targetPrice}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">30-Day Change</p>
                        <p
                          className={`flex items-center gap-1 text-xl font-bold ${
                            item.priceChange30Days < 0 ? "text-accent" : "text-destructive"
                          }`}
                        >
                          {item.priceChange30Days < 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : (
                            <TrendingUp className="h-4 w-4" />
                          )}
                          {item.priceChange30Days}%
                        </p>
                      </div>
                    </div>

                    {/* Progress to Target */}
                    <div className="mb-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress to target</span>
                        <span className="font-medium">{progressValue.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                    </div>

                    {/* AI Prediction */}
                    <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm text-foreground">{item.prediction}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:w-32">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/product/${item.productId}`}>View Details</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 bg-transparent"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State (if needed) */}
      {mockWatchlist.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="mb-4 h-16 w-16 text-muted" />
            <h3 className="mb-2 text-xl font-semibold">No items in watchlist</h3>
            <p className="mb-4 text-muted-foreground">Start tracking products to get price alerts</p>
            <Button asChild>
              <Link href="/dashboard/search">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
