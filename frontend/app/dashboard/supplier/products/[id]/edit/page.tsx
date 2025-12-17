"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { productService } from "@/lib/services/product-service"
import type { Product, ProductPhoto, ProductUpdateRequest } from "@/lib/api-types"
import { useAuth } from "@/contexts/auth-context"

interface EditablePhoto extends ProductPhoto {
  markedForDeletion?: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()

  // Loading & error states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [notAllowed, setNotAllowed] = useState(false)

  // Original product data (for comparison)
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null)

  // Form state
  const [productName, setProductName] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [description, setDescription] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("")
  const [sellQuantity, setSellQuantity] = useState("")
  const [features, setFeatures] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Photo management state
  const [photos, setPhotos] = useState<EditablePhoto[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPhotosPreviews, setNewPhotosPreviews] = useState<string[]>([])

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Load product data
  const loadProduct = useCallback(async () => {
    if (!productId) return

    setIsLoading(true)
    setError(null)
    setNotFound(false)
    setNotAllowed(false)

    try {
      const response = await productService.getProduct(productId)

      if (response.data) {
        const product = response.data
        setOriginalProduct(product)

        // Populate form
        setProductName(product.product_name)
        setProductCategory(product.product_category)
        setDescription(product.description || "")
        setUnitPrice(product.unit_price)
        setStockQuantity(String(product.stock_quantity))
        setSellQuantity(String(product.sell_quantity))
        setFeatures(product.features ? JSON.stringify(product.features, null, 2) : "")
        setIsActive(product.is_active)
        setPhotos(product.photos.map(p => ({ ...p, markedForDeletion: false })))
      } else if (response.error) {
        // Check error detail for status hints
        const errorDetail = response.error.detail?.toLowerCase() || ""
        if (errorDetail.includes("not authenticated") || errorDetail.includes("unauthorized") || response.status === 401) {
          router.push("/login")
          return
        } else if (errorDetail.includes("not found") || response.status === 404) {
          setNotFound(true)
        } else if (errorDetail.includes("permission") || errorDetail.includes("forbidden") || response.status === 403) {
          setNotAllowed(true)
        } else {
          setError(response.error.detail || "Failed to load product")
        }
      }
    } catch {
      setError("Failed to load product")
    } finally {
      setIsLoading(false)
    }
  }, [productId, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadProduct()
    } else if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, loadProduct, router])

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!productName.trim()) {
      errors.productName = "Product name is required"
    } else if (productName.length > 200) {
      errors.productName = "Product name must be 200 characters or less"
    }

    if (!productCategory.trim()) {
      errors.productCategory = "Category is required"
    } else if (productCategory.length > 120) {
      errors.productCategory = "Category must be 120 characters or less"
    }

    const price = parseFloat(unitPrice)
    if (isNaN(price) || price < 0) {
      errors.unitPrice = "Price must be a positive number"
    }

    const stock = parseInt(stockQuantity)
    if (isNaN(stock) || stock < 0) {
      errors.stockQuantity = "Stock must be a non-negative integer"
    }

    const moq = parseInt(sellQuantity)
    if (isNaN(moq) || moq < 1) {
      errors.sellQuantity = "MOQ must be at least 1"
    }

    if (features.trim()) {
      try {
        JSON.parse(features)
      } catch {
        errors.features = "Features must be valid JSON"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors")
      return
    }

    setIsSaving(true)

    try {
      // Build update request
      const updateData: ProductUpdateRequest = {
        product_name: productName,
        product_category: productCategory,
        description: description || undefined,
        unit_price: parseFloat(unitPrice),
        stock_quantity: parseInt(stockQuantity),
        sell_quantity: parseInt(sellQuantity),
        is_active: isActive,
      }

      // Add features if present
      if (features.trim()) {
        try {
          updateData.features = JSON.parse(features)
        } catch {
          // Already validated
        }
      }

      // Photos to delete
      const photosToDelete = photos
        .filter(p => p.markedForDeletion)
        .map(p => p.id)
      if (photosToDelete.length > 0) {
        updateData.photos_to_delete = photosToDelete
      }

      // Photos to update (reorder) - only non-deleted photos
      const activePhotos = photos.filter(p => !p.markedForDeletion)
      if (activePhotos.length > 0) {
        updateData.photos_to_update = activePhotos.map((p, index) => ({
          id: p.id,
          sort_order: index,
        }))
      }

      const response = await productService.updateProduct(
        productId,
        updateData,
        newPhotos.length > 0 ? newPhotos : undefined
      )

      if (response.data) {
        toast.success("Product updated successfully")
        // Reload to get fresh data
        loadProduct()
        // Clear new photos
        setNewPhotos([])
        setNewPhotosPreviews([])
      } else {
        toast.error(response.error?.detail || "Failed to update product")
      }
    } catch {
      toast.error("Failed to update product")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete product
  const handleDelete = async () => {
    try {
      const response = await productService.deleteProduct(productId)
      if (response.data) {
        toast.success("Product deleted successfully")
        router.push("/dashboard/supplier/products")
      } else {
        toast.error(response.error?.detail || "Failed to delete product")
      }
    } catch {
      toast.error("Failed to delete product")
    }
  }

  // Handle activate/deactivate
  const handleToggleActive = async () => {
    try {
      const response = isActive
        ? await productService.deactivateProduct(productId)
        : await productService.activateProduct(productId)

      if (response.data) {
        setIsActive(!isActive)
        toast.success(isActive ? "Product deactivated" : "Product activated")
      } else {
        toast.error(response.error?.detail || "Failed to update product status")
      }
    } catch {
      toast.error("Failed to update product status")
    }
  }

  // Photo management functions
  const handlePhotoDelete = (photoId: string) => {
    setPhotos(photos.map(p =>
      p.id === photoId ? { ...p, markedForDeletion: !p.markedForDeletion } : p
    ))
  }

  const handlePhotoMoveUp = (index: number) => {
    if (index === 0) return
    const newPhotos = [...photos]
    ;[newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]]
    setPhotos(newPhotos)
  }

  const handlePhotoMoveDown = (index: number) => {
    if (index === photos.length - 1) return
    const newPhotos = [...photos]
    ;[newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]]
    setPhotos(newPhotos)
  }

  const handleNewPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewPhotos(prev => [...prev, ...files])

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewPhotosPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
    setNewPhotosPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error states
  if (notFound) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Product Not Found</h3>
            <p className="mb-4 text-muted-foreground">
              The product you're looking for doesn't exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/dashboard/supplier/products">Back to Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notAllowed) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Access Denied</h3>
            <p className="mb-4 text-muted-foreground">
              You don't have permission to edit this product.
            </p>
            <Button asChild>
              <Link href="/dashboard/supplier/products">Back to Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Error</h3>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={loadProduct}>
                Retry
              </Button>
              <Button asChild>
                <Link href="/dashboard/supplier/products">Back to Products</Link>
              </Button>
            </div>
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
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Supplier Account Required</h3>
            <p className="text-muted-foreground">Only suppliers can edit products</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/supplier/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">{originalProduct?.product_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleActive}>
            {isActive ? (
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
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the product
                  "{originalProduct?.product_name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500/20 text-green-500" : ""}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Product name, category, and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="product_name">
                  Product Name *
                  {validationErrors.productName && (
                    <span className="text-destructive text-sm ml-2">{validationErrors.productName}</span>
                  )}
                </Label>
                <Input
                  id="product_name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                  maxLength={200}
                  className={validationErrors.productName ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product_category">
                  Category *
                  {validationErrors.productCategory && (
                    <span className="text-destructive text-sm ml-2">{validationErrors.productCategory}</span>
                  )}
                </Label>
                <Input
                  id="product_category"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  placeholder="Enter category"
                  maxLength={120}
                  className={validationErrors.productCategory ? "border-destructive" : ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Stock</CardTitle>
              <CardDescription>Set your pricing and inventory levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="unit_price">
                    Unit Price ($) *
                    {validationErrors.unitPrice && (
                      <span className="text-destructive text-sm ml-2">{validationErrors.unitPrice}</span>
                    )}
                  </Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className={validationErrors.unitPrice ? "border-destructive" : ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stock_quantity">
                    Stock Quantity *
                    {validationErrors.stockQuantity && (
                      <span className="text-destructive text-sm ml-2">{validationErrors.stockQuantity}</span>
                    )}
                  </Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="0"
                    className={validationErrors.stockQuantity ? "border-destructive" : ""}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sell_quantity">
                    MOQ *
                    {validationErrors.sellQuantity && (
                      <span className="text-destructive text-sm ml-2">{validationErrors.sellQuantity}</span>
                    )}
                  </Label>
                  <Input
                    id="sell_quantity"
                    type="number"
                    min="1"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(e.target.value)}
                    placeholder="1"
                    className={validationErrors.sellQuantity ? "border-destructive" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Additional product attributes (JSON format)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="features">
                  Features (JSON)
                  {validationErrors.features && (
                    <span className="text-destructive text-sm ml-2">{validationErrors.features}</span>
                  )}
                </Label>
                <Textarea
                  id="features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder='{"color": "black", "material": "steel"}'
                  rows={4}
                  className={`font-mono text-sm ${validationErrors.features ? "border-destructive" : ""}`}
                />
                <p className="text-xs text-muted-foreground">
                  Enter key-value pairs in JSON format. Example: {`{"color": "black", "size": "large"}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Product Photos</CardTitle>
              <CardDescription>Manage product images. Drag to reorder or mark for deletion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Photos */}
              {photos.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Photos</Label>
                  <div className="grid gap-3">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 ${
                          photo.markedForDeletion ? "border-destructive bg-destructive/10" : "border-border"
                        }`}
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-secondary">
                          <Image
                            src={photo.url.startsWith('http') ? photo.url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${photo.url}`}
                            alt={`Photo ${index + 1}`}
                            fill
                            className={`object-cover ${photo.markedForDeletion ? "opacity-50" : ""}`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Photo {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {photo.markedForDeletion ? "Will be deleted on save" : `Sort order: ${index}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePhotoMoveUp(index)}
                            disabled={index === 0 || photo.markedForDeletion}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePhotoMoveDown(index)}
                            disabled={index === photos.length - 1 || photo.markedForDeletion}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={photo.markedForDeletion ? "outline" : "ghost"}
                            size="icon"
                            onClick={() => handlePhotoDelete(photo.id)}
                            className={photo.markedForDeletion ? "" : "text-destructive hover:text-destructive"}
                          >
                            {photo.markedForDeletion ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              <div className="space-y-2">
                <Label>Add New Photos</Label>
                <div className="grid gap-3">
                  {newPhotosPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-secondary">
                        <Image
                          src={preview}
                          alt={`New photo ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{newPhotos[index]?.name}</p>
                        <p className="text-xs text-muted-foreground">New photo - will be uploaded on save</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveNewPhoto(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <div className="text-center">
                      <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">Add Photos</p>
                      <p className="text-xs text-muted-foreground">Click to select images</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNewPhotosChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Product Active</Label>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isActive
                  ? "Product is visible to buyers"
                  : "Product is hidden from buyers"}
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/supplier/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Products
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Meta Info */}
          {originalProduct && (
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(originalProduct.created_at).toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(originalProduct.updated_at).toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{originalProduct.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
