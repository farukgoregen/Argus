"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export function ProductFilters() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supplier Filter */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Supplier</h4>
          <div className="space-y-2">
            {["Alibaba", "Amazon", "Trendyol", "DHGate"].map((supplier) => (
              <div key={supplier} className="flex items-center space-x-2">
                <Checkbox id={`supplier-${supplier}`} />
                <Label htmlFor={`supplier-${supplier}`} className="text-sm font-normal">
                  {supplier}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Price Range</h4>
          <Slider defaultValue={[0, 2000]} max={2000} step={50} className="mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$2000</span>
          </div>
        </div>

        {/* Trust Score */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Min Trust Score</h4>
          <Slider defaultValue={[7]} max={10} step={0.1} className="mb-2" />
          <div className="text-center text-xs text-muted-foreground">7.0+</div>
        </div>

        {/* Delivery Time */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Delivery Time</h4>
          <div className="space-y-2">
            {["1-3 days", "4-7 days", "8-14 days", "15+ days"].map((time) => (
              <div key={time} className="flex items-center space-x-2">
                <Checkbox id={`delivery-${time}`} />
                <Label htmlFor={`delivery-${time}`} className="text-sm font-normal">
                  {time}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
