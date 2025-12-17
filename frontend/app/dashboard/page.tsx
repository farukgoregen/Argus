"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, ImageIcon, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CurrencyTicker } from "@/components/currency-ticker"
import { PriceTrendChart } from "@/components/price-trend-chart"
import { AIInsightsCards } from "@/components/ai-insights-cards"
import { RecentSearches } from "@/components/recent-searches"
import { aiService } from "@/lib/services"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle text search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) {
      toast.error("Please enter a search term")
      return
    }
    console.log("[Dashboard] Navigating to search with query:", query)
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`)
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, WebP, or GIF)")
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 10MB")
      return
    }

    setIsAnalyzing(true)
    console.log("[Dashboard] Analyzing image:", file.name, file.type, file.size)

    try {
      const response = await aiService.extractKeywords(file)
      console.log("[Dashboard] Vision keywords response:", response)

      if (response.data && response.data.keywords.length > 0) {
        const keywords = response.data.keywords.join(" ")
        toast.success(`Found: ${keywords}`)
        setSearchQuery(keywords)
        
        // Navigate to search
        console.log("[Dashboard] Navigating to search with AI keywords:", keywords)
        router.push(`/dashboard/search?q=${encodeURIComponent(keywords)}`)
      } else {
        toast.error("Couldn't extract keywords. Try a different image.")
      }
    } catch (error) {
      console.error("[Dashboard] Image analysis error:", error)
      toast.error("Image analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="p-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mx-auto mb-8 max-w-3xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search for products, suppliers, or categories..." 
              className="h-12 pl-10 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <Button 
            type="button"
            variant="outline" 
            size="icon" 
            className="h-12 w-12 shrink-0 bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            title="Search by image"
          >
            {isAnalyzing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </Button>
          <Button type="submit" className="h-12 px-6" disabled={isAnalyzing}>
            Search
          </Button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageUpload}
        />
        
        {isAnalyzing && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Analyzing image with AI...
          </p>
        )}
      </form>

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

      {/* Note: AI Assistant widget is now global, mounted in providers.tsx */}
    </div>
  )
}
