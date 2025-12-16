"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Package, Users, AlertCircle, FileText, LinkIcon, Shield, Bell, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { mockRFQs } from "@/lib/mock-data"
import { productService } from "@/lib/services/product-service"
import { useAuth } from "@/contexts/auth-context"
import type { Product, PaginatedProductList } from "@/lib/api-types"

export default function SupplierDashboardPage() {
  const { isAuthenticated, user } = useAuth()
  const [criticalStock, setCriticalStock] = useState<Product[]>([])
  const [productStats, setProductStats] = useState({ total: 0, active: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && user?.user_type === 'supplier') {
      loadData()
    }
  }, [isAuthenticated, user])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load critical stock products
      const criticalResponse = await productService.getCriticalStock()
      if (criticalResponse.data) {
        setCriticalStock(criticalResponse.data)
      }

      // Load product stats
      const statsResponse = await productService.listProducts({ page: 1, page_size: 1 })
      if (statsResponse.data) {
        setProductStats({
          total: statsResponse.data.total,
          active: statsResponse.data.total, // Will be refined with is_active filter
        })
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">New RFQs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">{mockRFQs.filter((rfq) => rfq.status === "new").length}</p>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-3xl font-bold text-destructive">{criticalStock.length}</p>
                <p className="text-xs text-muted-foreground">Items below minimum</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">This month (demo)</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trust Score</CardTitle>
              <Shield className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">9.2</p>
            <p className="text-xs text-muted-foreground">Excellent rating (demo)</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Toggles */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle>Management Settings</CardTitle>
          <CardDescription>Control your supplier dashboard features and integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Quote Management */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="quote-management" className="text-base font-medium">
                    Quote Management
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Automatically respond to RFQs with your current pricing and availability
                  </p>
                </div>
              </div>
              <Switch id="quote-management" defaultChecked />
            </div>

            {/* API Source Connection */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <LinkIcon className="mt-1 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="api-connection" className="text-base font-medium">
                    API Source Connection
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sync your inventory and pricing with external systems in real-time
                  </p>
                  <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                    Configure API
                  </Button>
                </div>
              </div>
              <Switch id="api-connection" />
            </div>

            {/* Trust Score */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 h-5 w-5 text-accent" />
                <div className="flex-1">
                  <Label htmlFor="trust-score" className="text-base font-medium">
                    Trust Score Display
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Show your trust score and verification badges to potential buyers
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-accent/20 text-accent">Score: 9.2</Badge>
                    <Badge className="bg-primary/20 text-primary">Verified Supplier</Badge>
                  </div>
                </div>
              </div>
              <Switch id="trust-score" defaultChecked />
            </div>

            {/* RFQ Notifications */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <Bell className="mt-1 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="rfq-notifications" className="text-base font-medium">
                    RFQ Notifications
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Receive instant notifications when buyers submit RFQs for your products
                  </p>
                </div>
              </div>
              <Switch id="rfq-notifications" defaultChecked />
            </div>

            {/* Product Management */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <Package className="mt-1 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="product-management" className="text-base font-medium">
                    Product Catalog
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your product listings, inventory levels, and pricing
                  </p>
                  <Button size="sm" variant="outline" className="mt-2 bg-transparent" asChild>
                    <Link href="/dashboard/supplier/products">Manage Products</Link>
                  </Button>
                </div>
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Badge className="bg-secondary text-secondary-foreground">{productStats.total} Products</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFQ List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Recent RFQs</CardTitle>
          <CardDescription>Request for Quotations from potential buyers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRFQs.map((rfq) => (
              <div key={rfq.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{rfq.productName}</h4>
                      <p className="text-sm text-muted-foreground">{rfq.customerName}</p>
                    </div>
                    <Badge
                      variant={rfq.status === "new" ? "default" : "secondary"}
                      className={
                        rfq.status === "new"
                          ? "bg-accent text-accent-foreground"
                          : rfq.status === "quoted"
                            ? "bg-chart-3/20 text-chart-3"
                            : "bg-secondary text-secondary-foreground"
                      }
                    >
                      {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">Quantity: </span>
                      <span className="font-medium">{rfq.quantity} units</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Budget: </span>
                      <span className="font-medium">${rfq.budget.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deadline: </span>
                      <span className="font-medium">{new Date(rfq.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  <Button size="sm" variant={rfq.status === "new" ? "default" : "outline"}>
                    {rfq.status === "new" ? "Quote" : "View"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
