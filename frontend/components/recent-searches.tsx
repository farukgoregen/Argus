"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

const recentSearches = [
  {
    name: "iPhone",
    image: "/modern-smartphone.png",
    priceRange: "$699-$1,199",
  },
  {
    name: "Laptop",
    image: "/modern-laptop-workspace.png",
    priceRange: "$499-$2,499",
  },
  {
    name: "Headphone",
    image: "/diverse-people-listening-headphones.png",
    priceRange: "$49-$399",
  },
  {
    name: "Camera",
    image: "/vintage-camera-still-life.png",
    priceRange: "$299-$3,999",
  },
  {
    name: "Watch",
    image: "/modern-smartwatch.png",
    priceRange: "$199-$799",
  },
]

export function RecentSearches() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Recent Searches</h2>
      <div className="overflow-x-auto scrollbar-hide md:overflow-x-visible">
        <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-5 pb-2">
          {recentSearches.map((item) => (
            <Link key={item.name} href={`/search/${item.name.toLowerCase()}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer min-w-[160px] md:min-w-0">
                <CardContent className="p-4 space-y-2">
                  <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.priceRange}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
