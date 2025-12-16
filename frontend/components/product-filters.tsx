"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export function ProductFilters() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supplier */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Supplier</h3>
          {["Alibaba", "Amazon", "DHGate", "Trendyol"].map((supplier) => (
            <div key={supplier} className="flex items-center space-x-2">
              <Checkbox id={supplier} />
              <Label htmlFor={supplier} className="text-sm cursor-pointer">
                {supplier}
              </Label>
            </div>
          ))}
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Price Range</h3>
          <Slider defaultValue={[0, 2000]} max={2000} step={50} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$2,000</span>
          </div>
        </div>

        {/* MOQ Range */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">MOQ Range</h3>
          <Slider defaultValue={[0, 500]} max={500} step={10} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>500</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Delivery Time</h3>
          {["1-7 days", "8-15 days", "16-30 days", "30+ days"].map((time) => (
            <div key={time} className="flex items-center space-x-2">
              <Checkbox id={time} />
              <Label htmlFor={time} className="text-sm cursor-pointer">
                {time}
              </Label>
            </div>
          ))}
        </div>

        {/* Trust Score */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Trust Score</h3>
          <Slider defaultValue={[70]} max={100} step={5} />
          <div className="text-xs text-muted-foreground">Minimum: 70%</div>
        </div>
      </CardContent>
    </Card>
  )
}
