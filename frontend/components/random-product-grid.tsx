import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

const products = Array.from({ length: 30 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Product ${i + 1}`,
  category: ["Electronics", "Fashion", "Home & Garden", "Sports", "Toys"][i % 5],
  price: Math.floor(Math.random() * 500) + 50,
  image: `/placeholder.svg?height=300&width=300&query=${["smartphone", "laptop", "headphones", "camera", "watch", "tablet", "keyboard", "mouse", "monitor", "speaker"][i % 10]}`,
  rating: (Math.random() * 2 + 3).toFixed(1),
}))

export function RandomProductGrid() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Explore Products</h2>
        <Link href="/search/all" className="text-sm text-primary hover:underline">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 space-y-3">
                <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                  <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">${product.price}</span>
                    <span className="text-sm text-muted-foreground">★ {product.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
