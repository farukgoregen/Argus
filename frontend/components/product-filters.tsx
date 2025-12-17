"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// Available suppliers for filtering
const SUPPLIERS = ["Alibaba", "Amazon", "Trendyol", "DHGate"] as const
type SupplierName = typeof SUPPLIERS[number]

// Delivery time options
const DELIVERY_OPTIONS = [
  { id: "1-3", label: "1-3 days", minDays: 1, maxDays: 3 },
  { id: "4-7", label: "4-7 days", minDays: 4, maxDays: 7 },
  { id: "8-14", label: "8-14 days", minDays: 8, maxDays: 14 },
  { id: "15+", label: "15+ days", minDays: 15, maxDays: 999 },
] as const

// Default filter values
const DEFAULT_FILTERS: FilterState = {
  suppliers: [],
  priceMin: 0,
  priceMax: 5000,
  minTrust: 0,
  deliveryTimes: [],
}

export interface FilterState {
  suppliers: string[]
  priceMin: number
  priceMax: number
  minTrust: number
  deliveryTimes: string[]
}

interface ProductFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  // Local state for sliders (to avoid too many updates while dragging)
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([filters.priceMin, filters.priceMax])
  const [localTrustScore, setLocalTrustScore] = useState<number>(filters.minTrust)

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.suppliers.length > 0 ||
      filters.priceMin > 0 ||
      filters.priceMax < 5000 ||
      filters.minTrust > 0 ||
      filters.deliveryTimes.length > 0
    )
  }, [filters])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS)
  }, [onFiltersChange])

  // Sync local state when props change
  useEffect(() => {
    setLocalPriceRange([filters.priceMin, filters.priceMax])
    setLocalTrustScore(filters.minTrust)
  }, [filters.priceMin, filters.priceMax, filters.minTrust])

  // Debounced price range update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localPriceRange[0] !== filters.priceMin || localPriceRange[1] !== filters.priceMax) {
        onFiltersChange({
          ...filters,
          priceMin: localPriceRange[0],
          priceMax: localPriceRange[1],
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localPriceRange, filters, onFiltersChange])

  // Debounced trust score update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTrustScore !== filters.minTrust) {
        onFiltersChange({
          ...filters,
          minTrust: localTrustScore,
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localTrustScore, filters, onFiltersChange])

  // Supplier toggle
  const handleSupplierToggle = useCallback((supplier: string, checked: boolean) => {
    const newSuppliers = checked
      ? [...filters.suppliers, supplier]
      : filters.suppliers.filter(s => s !== supplier)
    onFiltersChange({ ...filters, suppliers: newSuppliers })
  }, [filters, onFiltersChange])

  // Delivery time toggle
  const handleDeliveryToggle = useCallback((deliveryId: string, checked: boolean) => {
    const newDeliveryTimes = checked
      ? [...filters.deliveryTimes, deliveryId]
      : filters.deliveryTimes.filter(d => d !== deliveryId)
    onFiltersChange({ ...filters, deliveryTimes: newDeliveryTimes })
  }, [filters, onFiltersChange])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Filters</CardTitle>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClearFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supplier Filter */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Supplier</h4>
          <div className="space-y-2">
            {SUPPLIERS.map((supplier) => (
              <div key={supplier} className="flex items-center space-x-2">
                <Checkbox 
                  id={`supplier-${supplier}`}
                  checked={filters.suppliers.includes(supplier)}
                  onCheckedChange={(checked) => handleSupplierToggle(supplier, checked === true)}
                />
                <Label htmlFor={`supplier-${supplier}`} className="text-sm font-normal cursor-pointer">
                  {supplier}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Price Range</h4>
          <Slider 
            value={localPriceRange} 
            onValueChange={(value) => setLocalPriceRange(value as [number, number])}
            max={5000} 
            min={0}
            step={50} 
            className="mb-2" 
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${localPriceRange[0]}</span>
            <span>${localPriceRange[1]}</span>
          </div>
        </div>

        {/* Trust Score */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Min Trust Score</h4>
          <Slider 
            value={[localTrustScore]} 
            onValueChange={(value) => setLocalTrustScore(value[0])}
            max={10} 
            min={0}
            step={0.5} 
            className="mb-2" 
          />
          <div className="text-center text-xs text-muted-foreground">
            {localTrustScore.toFixed(1)}+
          </div>
          <p className="mt-1 text-xs text-muted-foreground/70 text-center">
            Trust score filtering applied client-side
          </p>
        </div>

        {/* Delivery Time */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Delivery Time</h4>
          <div className="space-y-2">
            {DELIVERY_OPTIONS.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`delivery-${option.id}`}
                  checked={filters.deliveryTimes.includes(option.id)}
                  onCheckedChange={(checked) => handleDeliveryToggle(option.id, checked === true)}
                />
                <Label htmlFor={`delivery-${option.id}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Delivery time filtering applied client-side
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Export for use in filtering logic
export { SUPPLIERS, DELIVERY_OPTIONS }
