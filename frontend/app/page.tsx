import { Search, TrendingUp, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceTrendChart } from "@/components/price-trend-chart"
import { AIInsightsCard } from "@/components/ai-insights-card"
import { RecentSearches } from "@/components/recent-searches"
import { CurrencyTracker } from "@/components/currency-tracker"
import { AIChat } from "@/components/ai-chat"
import { RandomProductGrid } from "@/components/random-product-grid"

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Search Section */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-center">Find the Best Supplier Prices</h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search for products..." className="pl-10 h-12 text-lg" />
              </div>
              <Button size="lg" className="h-12">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" size="sm">
                <ImageIcon className="mr-2 h-4 w-4" />
                Search by Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CurrencyTracker />

      {/* AI Daily Insights */}
      <AIInsightsCard />

      {/* Price Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Price Trends (7 Days)</CardTitle>
            </div>
            <Button variant="link" className="text-sm">
              Full Report →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PriceTrendChart />
        </CardContent>
      </Card>

      <RecentSearches />

      <RandomProductGrid />

      {/* AI Assistant */}
      <AIChat />
    </div>
  )
}
