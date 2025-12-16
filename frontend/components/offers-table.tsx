"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import type { ProductOffer } from "@/lib/mock-data"

export function OffersTable({ offers }: { offers: ProductOffer[] }) {
  const [sortedOffers, setSortedOffers] = useState(offers)
  const [sortBy, setSortBy] = useState<"price" | "totalPrice" | "trustScore">("totalPrice")

  const handleSort = (column: "price" | "totalPrice" | "trustScore") => {
    setSortBy(column)
    const sorted = [...sortedOffers].sort((a, b) => {
      if (column === "trustScore") {
        return b[column] - a[column]
      }
      return a[column] - b[column]
    })
    setSortedOffers(sorted)
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort("price")} className="h-8 px-2">
                Price
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>VAT (18%)</TableHead>
            <TableHead>Shipping</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort("totalPrice")} className="h-8 px-2">
                Total
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>MOQ</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>
              <Button variant="ghost" size="sm" onClick={() => handleSort("trustScore")} className="h-8 px-2">
                Trust Score
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOffers.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">{offer.supplierName}</TableCell>
              <TableCell>${offer.price}</TableCell>
              <TableCell className="text-muted-foreground">${offer.vat.toFixed(2)}</TableCell>
              <TableCell>
                {offer.shipping === 0 ? <Badge variant="outline">Free</Badge> : `$${offer.shipping}`}
              </TableCell>
              <TableCell className="font-bold">${offer.totalPrice.toFixed(2)}</TableCell>
              <TableCell>{offer.moq} units</TableCell>
              <TableCell>{offer.deliveryDays} days</TableCell>
              <TableCell>
                <Badge
                  className={
                    offer.trustScore >= 9
                      ? "bg-accent/20 text-accent"
                      : offer.trustScore >= 8
                        ? "bg-chart-3/20 text-chart-3"
                        : "bg-muted text-muted-foreground"
                  }
                >
                  {offer.trustScore}
                </Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline">
                  Contact Seller
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
