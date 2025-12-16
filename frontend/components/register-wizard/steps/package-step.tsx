"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { 
  getPackagesByUserType, 
  formatPackagePrice,
  type SubscriptionPackage,
  type UserType,
} from "@/lib/data/packages";

export interface PackageSelection {
  packageId: string;
  billingCycle: "monthly" | "yearly";
}

interface PackageStepProps {
  userType: UserType;
  initialSelection: PackageSelection | null;
  onSelectionChange: (selection: PackageSelection, isValid: boolean) => void;
  disabled?: boolean;
}

export function PackageStep({ 
  userType, 
  initialSelection, 
  onSelectionChange, 
  disabled = false 
}: PackageStepProps) {
  const packages = getPackagesByUserType(userType);
  
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialSelection?.packageId || null
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    initialSelection?.billingCycle || "monthly"
  );
  
  // Update parent when selection changes
  useEffect(() => {
    if (selectedPackageId) {
      onSelectionChange(
        { packageId: selectedPackageId, billingCycle },
        true
      );
    } else {
      onSelectionChange(
        { packageId: "", billingCycle },
        false
      );
    }
  }, [selectedPackageId, billingCycle, onSelectionChange]);
  
  // Handle package selection
  const handleSelect = useCallback((packageId: string) => {
    if (!disabled) {
      setSelectedPackageId(packageId);
    }
  }, [disabled]);
  
  // Calculate yearly savings
  const getYearlySavings = (pkg: SubscriptionPackage): number => {
    if (pkg.priceMonthly === 0) return 0;
    const yearlyCost = pkg.priceMonthly * 12;
    return yearlyCost - pkg.priceYearly;
  };
  
  return (
    <div className="space-y-6">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label 
          htmlFor="billing-toggle" 
          className={cn(
            "cursor-pointer transition-colors",
            billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingCycle === "yearly"}
          onCheckedChange={(checked) => setBillingCycle(checked ? "yearly" : "monthly")}
          disabled={disabled}
        />
        <Label 
          htmlFor="billing-toggle" 
          className={cn(
            "cursor-pointer transition-colors",
            billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Yearly
          <Badge variant="secondary" className="ml-2 text-xs">
            Save up to 20%
          </Badge>
        </Label>
      </div>
      
      {/* Package cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const price = formatPackagePrice(pkg, billingCycle === "yearly");
          const yearlySavings = getYearlySavings(pkg);
          const isFree = pkg.priceMonthly === 0;
          
          return (
            <div
              key={pkg.id}
              onClick={() => handleSelect(pkg.id)}
              className={cn(
                "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-card",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {/* Popular badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              {/* Package info */}
              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </div>
                
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{price}</span>
                    {!isFree && (
                      <span className="text-sm text-muted-foreground">
                        /{billingCycle === "yearly" ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  {billingCycle === "yearly" && yearlySavings > 0 && (
                    <p className="text-sm text-green-600">
                      Save ${yearlySavings}/year
                    </p>
                  )}
                  {pkg.trialDays && pkg.trialDays > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {pkg.trialDays}-day free trial
                    </p>
                  )}
                </div>
                
                {/* Features */}
                <ul className="space-y-2 text-sm">
                  {pkg.features.slice(0, 5).map((feature) => (
                    <li 
                      key={feature.id}
                      className={cn(
                        "flex items-start gap-2",
                        !feature.included && "text-muted-foreground line-through"
                      )}
                    >
                      <Check className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        feature.included ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span>
                        {feature.name}
                        {feature.limit && feature.included && (
                          <span className="text-muted-foreground ml-1">
                            ({feature.limit})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                  {pkg.features.length > 5 && (
                    <li className="text-muted-foreground text-xs">
                      +{pkg.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Selection hint */}
      {!selectedPackageId && (
        <p className="text-center text-sm text-muted-foreground">
          Please select a plan to continue
        </p>
      )}
    </div>
  );
}
