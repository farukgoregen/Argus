"use client"

import { Star, Shield } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const offers = [
  {
    supplier: "Alibaba",
    price: 899,
    vat: 135,
    shipping: 25,
    trustScore: 95,
    inStock: true,
    rating: 4.8,
  },
  {
    supplier: "DHGate",
    price: 920,
    vat: 138,
    shipping: 30,
    trustScore: 88,
    inStock: true,
    rating: 4.6,
  },
  {
    supplier: "Amazon",
    price: 999,
    vat: 150,
    shipping: 0,
    trustScore: 98,
    inStock: true,
    rating: 4.9,
  },
  {
    supplier: "Trendyol",
    price: 950,
    vat: 142,
    shipping: 20,
    trustScore: 82,
    inStock: false,
    rating: 4.5,
  },
]

export function PriceOffersTable() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Filter: In Stock
        </Button>
        <Button variant="outline" size="sm">
          Sort: Cheapest
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>VAT/Tax</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Trust Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{offer.supplier}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {offer.rating}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">${offer.price}</TableCell>
                <TableCell>${offer.vat}</TableCell>
                <TableCell>{offer.shipping === 0 ? "Free" : `$${offer.shipping}`}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>{offer.trustScore}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={offer.inStock ? "default" : "secondary"}>
                    {offer.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" disabled={!offer.inStock}>
                    Contact Seller
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
