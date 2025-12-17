"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Upload, Loader2, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { aiService } from "@/lib/services"
import { cn } from "@/lib/utils"

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle text search
  const handleSearch = useCallback((searchQuery?: string) => {
    const q = (searchQuery || query).trim()
    if (!q) {
      toast.error("Please enter a search term or upload an image")
      return
    }
    
    setIsSearching(true)
    router.push(`/dashboard/search?q=${encodeURIComponent(q)}`)
  }, [query, router])

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, WebP, or GIF)")
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 10MB")
      return
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setIsAnalyzing(true)

    try {
      const response = await aiService.extractKeywords(file)

      if (response.data && response.data.keywords.length > 0) {
        const keywords = response.data.keywords.join(" ")
        setQuery(keywords)
        toast.success(`Found keywords: ${keywords}`)
        
        // Auto-navigate to search
        setTimeout(() => {
          handleSearch(keywords)
        }, 500)
      } else {
        toast.error("Couldn't extract keywords. Try a different image or search manually.")
      }
    } catch {
      toast.error("Failed to analyze image. Please try again or search by text.")
    } finally {
      setIsAnalyzing(false)
      // Clean up preview after a moment
      setTimeout(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }, 1000)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Clear preview
  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Trigger file input
  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          {/* Main search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search products, suppliers, categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base bg-background border-input"
              disabled={isAnalyzing || isSearching}
            />
          </div>

          {/* Image upload button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0"
            onClick={triggerUpload}
            disabled={isAnalyzing || isSearching}
            title="Search by image"
          >
            {isAnalyzing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </Button>

          {/* Search button */}
          <Button 
            type="submit" 
            size="lg" 
            className="h-12 px-6"
            disabled={isAnalyzing || isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageUpload}
        />
      </form>

      {/* Image preview / analyzing state */}
      {(previewUrl || isAnalyzing) && (
        <div className="mt-4 relative">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border",
            isAnalyzing ? "border-primary bg-primary/5" : "border-border bg-muted/50"
          )}>
            {previewUrl ? (
              <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewUrl} 
                  alt="Uploaded" 
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Analyzing image with AI...</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Image ready</span>
              )}
            </div>

            {!isAnalyzing && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={clearPreview}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Type a search query or{" "}
        <button
          type="button"
          onClick={triggerUpload}
          className="text-primary hover:underline font-medium"
          disabled={isAnalyzing}
        >
          upload an image
        </button>{" "}
        to find products with AI
      </p>
    </div>
  )
}
