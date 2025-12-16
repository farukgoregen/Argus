import { Star, Package, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  product: {
    id: string
    name: string
    image: string
    supplier: string
    price: number
    landedCost: number
    moq: number
    rating: number
    trustScore: number
    delivery: string
    stock: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>
          <div className="col-span-2 space-y-2">
            <h3 className="font-semibold line-clamp-2">{product.name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{product.rating}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Trust: {product.trustScore}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Supplier: {product.supplier}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">
                <Package className="mr-1 h-3 w-3" />
                MOQ: {product.moq}
              </Badge>
              <Badge variant="secondary">
                <Truck className="mr-1 h-3 w-3" />
                {product.delivery}
              </Badge>
            </div>
            <div className="pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">${product.price}</span>
                <span className="text-sm text-muted-foreground">Landed: ${product.landedCost}</span>
              </div>
            </div>
            <Link href={`/product/${product.id}`}>
              <Button className="w-full" size="sm">
                Click for Detail
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
