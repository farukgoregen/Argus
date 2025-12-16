import { Search, ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CurrencyTicker } from "@/components/currency-ticker"
import { PriceTrendChart } from "@/components/price-trend-chart"
import { AIInsightsCards } from "@/components/ai-insights-cards"
import { RecentSearches } from "@/components/recent-searches"
import { AIAssistant } from "@/components/ai-assistant"

export default function DashboardPage() {
  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mx-auto mb-8 max-w-3xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search for products, suppliers, or categories..." className="h-12 pl-10 text-base" />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 bg-transparent">
            <ImageIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Currency Tracker */}
      <div className="mb-8">
        <CurrencyTicker />
      </div>

      {/* Price Trend Chart */}
      <div className="mb-8">
        <PriceTrendChart />
      </div>

      {/* AI Insights */}
      <div className="mb-8">
        <AIInsightsCards />
      </div>

      {/* Recent Searches */}
      <div className="mb-8">
        <RecentSearches />
      </div>

      {/* AI Assistant Widget */}
      <AIAssistant />
    </div>
  )
}
