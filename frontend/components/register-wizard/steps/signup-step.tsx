"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface SignupFormData {
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
  userType: "buyer" | "supplier";
  companyName: string;
}

interface SignupStepProps {
  initialData: SignupFormData | null;
  initialUserType: "buyer" | "supplier";
  onDataChange: (data: SignupFormData, isValid: boolean) => void;
  disabled?: boolean;
}

interface ValidationErrors {
  email?: string;
  username?: string;
  password?: string;
  passwordConfirm?: string;
  companyName?: string;
}

export function SignupStep({ 
  initialData, 
  initialUserType, 
  onDataChange, 
  disabled = false 
}: SignupStepProps) {
  const [formData, setFormData] = useState<SignupFormData>(
    initialData || {
      email: "",
      username: "",
      password: "",
      passwordConfirm: "",
      userType: initialUserType,
      companyName: "",
    }
  );
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Validation function
  const validate = useCallback((data: SignupFormData): ValidationErrors => {
    const errs: ValidationErrors = {};
    
    // Email validation
    if (!data.email) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = "Invalid email format";
    }
    
    // Username validation
    if (!data.username) {
      errs.username = "Username is required";
    } else if (data.username.length < 3) {
      errs.username = "Username must be at least 3 characters";
    } else if (data.username.length > 150) {
      errs.username = "Username must be at most 150 characters";
    } else if (!/^[\w-]+$/.test(data.username)) {
      errs.username = "Username can only contain letters, numbers, underscores, and hyphens";
    }
    
    // Password validation
    if (!data.password) {
      errs.password = "Password is required";
    } else if (data.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    
    // Password confirm validation
    if (!data.passwordConfirm) {
      errs.passwordConfirm = "Please confirm your password";
    } else if (data.password !== data.passwordConfirm) {
      errs.passwordConfirm = "Passwords do not match";
    }
    
    // Company name validation (optional but has min length if provided)
    if (data.companyName && data.companyName.trim().length > 0) {
      if (data.companyName.trim().length < 2) {
        errs.companyName = "Company name must be at least 2 characters";
      } else if (data.companyName.length > 255) {
        errs.companyName = "Company name must be at most 255 characters";
      }
    }
    
    return errs;
  }, []);
  
  // Update parent when data changes
  useEffect(() => {
    const validationErrors = validate(formData);
    const isValid = Object.keys(validationErrors).length === 0;
    onDataChange(formData, isValid);
    setErrors(validationErrors);
  }, [formData, validate, onDataChange]);
  
  // Handle field change
  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  // Handle blur to show errors
  const handleBlur = (field: keyof SignupFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  // Should show error for field
  const showError = (field: keyof ValidationErrors): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };
  
  return (
    <div className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          disabled={disabled}
          className={showError("email") ? "border-destructive" : ""}
        />
        {showError("email") && (
          <p className="text-sm text-destructive">{showError("email")}</p>
        )}
      </div>
      
      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          type="text"
          placeholder="Choose a username"
          value={formData.username}
          onChange={(e) => handleChange("username", e.target.value)}
          onBlur={() => handleBlur("username")}
          disabled={disabled}
          className={showError("username") ? "border-destructive" : ""}
        />
        {showError("username") && (
          <p className="text-sm text-destructive">{showError("username")}</p>
        )}
      </div>
      
      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            disabled={disabled}
            className={showError("password") ? "border-destructive" : ""}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {showError("password") && (
          <p className="text-sm text-destructive">{showError("password")}</p>
        )}
      </div>
      
      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Confirm Password *</Label>
        <Input
          id="passwordConfirm"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm your password"
          value={formData.passwordConfirm}
          onChange={(e) => handleChange("passwordConfirm", e.target.value)}
          onBlur={() => handleBlur("passwordConfirm")}
          disabled={disabled}
          className={showError("passwordConfirm") ? "border-destructive" : ""}
        />
        {showError("passwordConfirm") && (
          <p className="text-sm text-destructive">{showError("passwordConfirm")}</p>
        )}
      </div>
      
      {/* User Type */}
      <div className="space-y-2">
        <Label>Account Type</Label>
        <RadioGroup
          value={formData.userType}
          onValueChange={(value) => handleChange("userType", value)}
          className="flex gap-4"
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="buyer" id="buyer" />
            <Label htmlFor="buyer" className="font-normal cursor-pointer">
              Buyer
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="supplier" id="supplier" />
            <Label htmlFor="supplier" className="font-normal cursor-pointer">
              Supplier
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          {formData.userType === "buyer" 
            ? "Search and purchase products from suppliers" 
            : "List and sell your products to buyers"}
        </p>
      </div>
      
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          type="text"
          placeholder="Your company name (optional)"
          value={formData.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
          onBlur={() => handleBlur("companyName")}
          disabled={disabled}
          className={showError("companyName") ? "border-destructive" : ""}
        />
        {showError("companyName") && (
          <p className="text-sm text-destructive">{showError("companyName")}</p>
        )}
      </div>
    </div>
  );
}
