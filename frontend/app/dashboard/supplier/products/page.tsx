"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Plus, Search, Package, Edit, Trash2, Loader2, MoreHorizontal, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { productService } from "@/lib/services/product-service"
import type { ProductListItem, ProductFilters } from "@/lib/api-types"
import { useAuth } from "@/contexts/auth-context"

export default function SupplierProductsPage() {
  const { isAuthenticated, user } = useAuth()
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Create form state
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    product_category: "",
    description: "",
    unit_price: "",
    stock_quantity: "",
    sell_quantity: "1",
  })

  const loadProducts = useCallback(async (filters: ProductFilters = {}) => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const response = await productService.listProducts({
        ...filters,
        page,
        page_size: 20,
        search: searchQuery || undefined,
      })

      if (response.data) {
        setProducts(response.data.items)
        setTotal(response.data.total)
      }
    } catch {
      toast.error("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, page, searchQuery])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadProducts()
  }

  const handleCreateProduct = async () => {
    if (!newProduct.product_name || !newProduct.product_category || !newProduct.unit_price) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsCreating(true)
    try {
      const response = await productService.createProduct({
        product_name: newProduct.product_name,
        product_category: newProduct.product_category,
        description: newProduct.description || undefined,
        unit_price: parseFloat(newProduct.unit_price),
        stock_quantity: newProduct.stock_quantity ? parseInt(newProduct.stock_quantity) : 0,
        sell_quantity: newProduct.sell_quantity ? parseInt(newProduct.sell_quantity) : 1,
      })

      if (response.data) {
        toast.success("Product created successfully")
        setIsCreateDialogOpen(false)
        setNewProduct({
          product_name: "",
          product_category: "",
          description: "",
          unit_price: "",
          stock_quantity: "",
          sell_quantity: "1",
        })
        loadProducts()
      } else {
        toast.error(response.error?.detail || "Failed to create product")
      }
    } catch {
      toast.error("Failed to create product")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    const response = await productService.deleteProduct(productId)
    if (response.data) {
      toast.success("Product deleted successfully")
      loadProducts()
    } else {
      toast.error(response.error?.detail || "Failed to delete product")
    }
  }

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    const response = isActive
      ? await productService.deactivateProduct(productId)
      : await productService.activateProduct(productId)
    
    if (response.data) {
      toast.success(isActive ? "Product deactivated" : "Product activated")
      loadProducts()
    } else {
      toast.error(response.error?.detail || "Failed to update product")
    }
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge className="bg-green-500/20 text-green-500">In Stock</Badge>
      case "low_stock":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Low Stock</Badge>
      case "out_of_stock":
        return <Badge className="bg-red-500/20 text-red-500">Out of Stock</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Authentication Required</h3>
            <p className="text-muted-foreground">Please log in to manage your products</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user?.user_type !== 'supplier') {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Supplier Account Required</h3>
            <p className="text-muted-foreground">Only suppliers can manage products</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      {/* Products Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            {total} product{total !== 1 ? "s" : ""} in your catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No products yet</h3>
              <p className="mb-4 text-muted-foreground">Create your first product to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-secondary">
                          <Image
                            src={product.main_photo_url || "/placeholder.svg"}
                            alt={product.product_name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{product.product_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.product_category}</TableCell>
                    <TableCell>${product.unit_price}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStockStatusBadge(product.stock_status)}
                        {!product.is_active && (
                          <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(product.id, product.is_active)}>
                            {product.is_active ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                placeholder="Enter product name"
                value={newProduct.product_name}
                onChange={(e) => setNewProduct({ ...newProduct, product_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product_category">Category *</Label>
              <Input
                id="product_category"
                placeholder="Enter category"
                value={newProduct.product_category}
                onChange={(e) => setNewProduct({ ...newProduct, product_category: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit_price">Unit Price ($) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newProduct.unit_price}
                  onChange={(e) => setNewProduct({ ...newProduct, unit_price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProduct.stock_quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sell_quantity">Minimum Order Quantity (MOQ)</Label>
              <Input
                id="sell_quantity"
                type="number"
                min="1"
                placeholder="1"
                value={newProduct.sell_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, sell_quantity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
