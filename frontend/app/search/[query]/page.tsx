import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductFilters } from "@/components/product-filters"
import { ProductCard } from "@/components/product-card"
import { AISearchSummary } from "@/components/ai-search-summary"
import { AIChat } from "@/components/ai-chat"

// Mock product data
const products = [
  {
    id: "1",
    name: "iPhone 15 Pro Max 256GB",
    image: "/modern-smartphone.png",
    supplier: "Alibaba",
    price: 899,
    landedCost: 925,
    moq: 50,
    rating: 4.8,
    trustScore: 95,
    delivery: "15-20 days",
    stock: 1200,
  },
  {
    id: "2",
    name: "iPhone 15 Pro 128GB",
    image: "/iphone-pro.jpg",
    supplier: "DHGate",
    price: 799,
    landedCost: 820,
    moq: 100,
    rating: 4.6,
    trustScore: 88,
    delivery: "20-25 days",
    stock: 800,
  },
  {
    id: "3",
    name: "iPhone 14 Pro Max 512GB",
    image: "/iphone-14.jpg",
    supplier: "Amazon",
    price: 1099,
    landedCost: 1120,
    moq: 10,
    rating: 4.9,
    trustScore: 98,
    delivery: "5-7 days",
    stock: 350,
  },
  {
    id: "4",
    name: "iPhone 13 128GB",
    image: "/iphone-13.jpg",
    supplier: "Trendyol",
    price: 599,
    landedCost: 615,
    moq: 75,
    rating: 4.5,
    trustScore: 82,
    delivery: "18-22 days",
    stock: 950,
  },
]

export default function SearchPage({ params }: { params: { query: string } }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-20">
      {/* Filters Sidebar */}
      <aside className="lg:w-64 shrink-0">
        <ProductFilters />
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* AI Search Summary */}
        <AISearchSummary query={decodeURIComponent(params.query)} />

        {/* Products Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Everything containing "{decodeURIComponent(params.query)}"</h2>
          <Button variant="outline" size="sm" className="lg:hidden bg-transparent">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* AI Chat */}
      <AIChat />
    </div>
  )
}
