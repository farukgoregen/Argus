"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Loader2, 
  Upload, 
  Save, 
  X, 
  User, 
  Building2,
  Phone,
  Globe,
  FileText,
  MapPin,
  RotateCcw,
  CreditCard,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { profileService } from "@/lib/services/profile-service";
import { validateImageFile, createImagePreview, revokeImagePreview } from "@/lib/image-utils";
import type { BuyerProfile, SupplierProfile } from "@/lib/api-types";

// Form field configurations
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'tel';
  icon: React.ElementType;
  placeholder: string;
  maxLength?: number;
  required?: boolean;
}

const buyerFields: FormField[] = [
  { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '+1 234 567 8900', maxLength: 20 },
  { name: 'payment_method', label: 'Preferred Payment Method', type: 'text', icon: CreditCard, placeholder: 'Bank Transfer, Wire, etc.', maxLength: 100 },
];

const supplierFields: FormField[] = [
  { name: 'phone', label: 'Phone Number', type: 'tel', icon: Phone, placeholder: '+1 234 567 8900', maxLength: 20 },
  { name: 'website', label: 'Website', type: 'url', icon: Globe, placeholder: 'https://yourcompany.com', maxLength: 255 },
  { name: 'description', label: 'Business Description', type: 'textarea', icon: FileText, placeholder: 'Describe your business, products, and services...', maxLength: 2000 },
  { name: 'main_production_location', label: 'Main Production Location', type: 'text', icon: MapPin, placeholder: 'City, Country', maxLength: 255 },
  { name: 'return_policy', label: 'Return & Warranty Policy', type: 'textarea', icon: RotateCcw, placeholder: 'Describe your return and warranty terms...', maxLength: 2000 },
  { name: 'payment_method', label: 'Preferred Payment Method', type: 'text', icon: CreditCard, placeholder: 'Wire Transfer, LC, etc.', maxLength: 100 },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // Profile data state
  const [profile, setProfile] = useState<BuyerProfile | SupplierProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoTimestamp, setLogoTimestamp] = useState<number>(Date.now()); // For cache busting
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine user type and fields
  const isSupplier = user?.user_type === 'supplier';
  const fields = isSupplier ? supplierFields : buyerFields;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);
  
  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    setLoadError(null);
    
    try {
      const response = isSupplier 
        ? await profileService.getSupplierProfile()
        : await profileService.getBuyerProfile();
      
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      
      if (response.status === 403) {
        setLoadError(`Access denied. Your account is not set up as a ${isSupplier ? 'supplier' : 'buyer'}.`);
        return;
      }
      
      if (response.error) {
        setLoadError(response.error.detail || 'Failed to load profile');
        return;
      }
      
      if (response.data) {
        setProfile(response.data);
        
        // Initialize form data from profile
        const initialData: Record<string, string> = {};
        fields.forEach(field => {
          const value = (response.data as Record<string, unknown>)[field.name];
          initialData[field.name] = typeof value === 'string' ? value : '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoadError('An unexpected error occurred');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user, isSupplier, fields, router]);
  
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);
  
  // Cleanup logo preview URL on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) {
        revokeImagePreview(logoPreview);
      }
    };
  }, [logoPreview]);
  
  // Handle form field changes
  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset previous logo state
    if (logoPreview) {
      revokeImagePreview(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
    
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setLogoError(validationError);
      return;
    }
    
    // Set file and create preview (conversion happens server-side)
    setLogoFile(file);
    setLogoPreview(createImagePreview(file));
    setIsDirty(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove selected logo
  const handleRemoveLogo = () => {
    if (logoPreview) {
      revokeImagePreview(logoPreview);
    }
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(null);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = formData[field.name] || '';
      
      if (field.required && !value.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      if (field.type === 'url' && value && !value.match(/^https?:\/\/.+/)) {
        newErrors[field.name] = 'Please enter a valid URL starting with http:// or https://';
      }
      
      if (field.maxLength && value.length > field.maxLength) {
        newErrors[field.name] = `Maximum ${field.maxLength} characters allowed`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updateData = { ...formData } as Record<string, string | File | undefined>;
      
      // Add logo if selected
      if (logoFile) {
        updateData.logo = logoFile;
      }
      
      const response = isSupplier
        ? await profileService.updateSupplierProfile(updateData as Parameters<typeof profileService.updateSupplierProfile>[0])
        : await profileService.updateBuyerProfile(updateData as Parameters<typeof profileService.updateBuyerProfile>[0]);
      
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      
      if (response.error) {
        toast.error(response.error.detail || 'Failed to save profile');
        return;
      }
      
      if (response.data) {
        setProfile(response.data);
        setIsDirty(false);
        
        // Clear logo selection and refresh timestamp after successful save
        if (logoFile) {
          handleRemoveLogo();
          setLogoTimestamp(Date.now()); // Bust browser cache for new logo
        }
        
        // Notify sidebar to refresh profile logo
        window.dispatchEvent(new CustomEvent('profile-updated'));
        
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get current logo URL with cache busting
  const currentLogoUrl = profile?.logo 
    ? (() => {
        const baseUrl = profile.logo.startsWith('http') 
          ? profile.logo 
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${profile.logo}`;
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}t=${logoTimestamp}`;
      })()
    : null;
  
  // Loading state
  if (authLoading || (isAuthenticated && isLoadingProfile)) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (loadError) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Error Loading Profile</CardTitle>
            </div>
            <CardDescription className="text-destructive">
              {loadError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchProfile} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Edit Profile</CardTitle>
            </div>
            <CardDescription>
              Update your {isSupplier ? 'supplier' : 'buyer'} profile information
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Company Name (Read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company Name
              </Label>
              <Input 
                value={profile?.company_name || ''} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Company name cannot be changed. Contact support if you need to update it.
              </p>
            </div>
            
            {/* Logo Upload Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                Company Logo
              </Label>
              
              <div className="flex items-start gap-4">
                {/* Current/Preview Logo */}
                <div className="relative h-24 w-24 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  ) : currentLogoUrl ? (
                    <Image
                      src={currentLogoUrl}
                      alt="Current logo"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                
                {/* Upload Controls */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleLogoSelect}
                    className="hidden"
                    id="logo-upload"
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </Button>
                    
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF or WebP. Max 5MB. Images will be converted to WebP.
                  </p>
                  
                  {logoError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {logoError}
                    </p>
                  )}
                  
                  {logoPreview && !logoError && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      New logo ready to save
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Dynamic Form Fields */}
            {fields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label 
                  htmlFor={field.name}
                  className="flex items-center gap-2"
                >
                  <field.icon className="h-4 w-4 text-muted-foreground" />
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={errors[field.name] ? 'border-destructive' : ''}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={errors[field.name] ? 'border-destructive' : ''}
                  />
                )}
                
                {errors[field.name] && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors[field.name]}
                  </p>
                )}
                
                {field.maxLength && formData[field.name]?.length > field.maxLength * 0.8 && (
                  <p className="text-xs text-muted-foreground text-right">
                    {formData[field.name]?.length || 0} / {field.maxLength}
                  </p>
                )}
              </div>
            ))}
            
            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {isDirty ? 'You have unsaved changes' : 'All changes saved'}
              </p>
              
              <Button 
                type="submit" 
                disabled={!isDirty || isSaving}
              >
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
