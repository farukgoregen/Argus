import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { mockRecentSearches } from "@/lib/mock-data"
import { Star } from "lucide-react"

export function RecentSearches() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent Searches</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {mockRecentSearches.map((product) => (
          <Link key={product.id} href={`/dashboard/product/${product.id}`} className="group">
            <Card className="min-w-[280px] border-border bg-card transition-colors hover:border-primary">
              <CardContent className="p-4">
                <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={280}
                    height={160}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h4 className="mb-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Price Range</p>
                    <p className="font-semibold">
                      ${product.minPrice} - ${product.maxPrice}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    {product.rating}
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
