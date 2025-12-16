"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CreditCard, Lock, AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
  validateCardholderName,
  formatCardNumber,
  formatExpiryDate,
  detectCardType,
  type CardType,
} from "@/lib/validators/card";

import {
  getPackageById,
  formatPackagePrice,
} from "@/lib/data/packages";

import type { PackageSelection } from "./package-step";

export interface PaymentFormData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

interface PaymentStepProps {
  initialData: PaymentFormData | null;
  selectedPackage: PackageSelection | null;
  onDataChange: (data: PaymentFormData, isValid: boolean) => void;
  disabled?: boolean;
}

interface ValidationErrors {
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

// Card type icons (simplified)
const cardTypeLabels: Record<CardType, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  unknown: "",
};

export function PaymentStep({
  initialData,
  selectedPackage,
  onDataChange,
  disabled = false,
}: PaymentStepProps) {
  const [formData, setFormData] = useState<PaymentFormData>(
    initialData || {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    }
  );

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Get selected package details
  const packageDetails = useMemo(() => {
    if (!selectedPackage?.packageId) return null;
    return getPackageById(selectedPackage.packageId);
  }, [selectedPackage?.packageId]);

  // Detect card type from number
  const cardType = useMemo(
    () => detectCardType(formData.cardNumber),
    [formData.cardNumber]
  );

  // Validation function
  const validate = useCallback(
    (data: PaymentFormData): ValidationErrors => {
      const errs: ValidationErrors = {};

      // For free plans, skip card validation
      if (packageDetails?.priceMonthly === 0) {
        return errs;
      }

      const nameResult = validateCardholderName(data.cardholderName);
      if (!nameResult.valid) errs.cardholderName = nameResult.error;

      const cardResult = validateCardNumber(data.cardNumber);
      if (!cardResult.valid) errs.cardNumber = cardResult.error;

      const expiryResult = validateExpiryDate(data.expiryDate);
      if (!expiryResult.valid) errs.expiryDate = expiryResult.error;

      const cvvResult = validateCVV(data.cvv, cardType);
      if (!cvvResult.valid) errs.cvv = cvvResult.error;

      return errs;
    },
    [cardType, packageDetails?.priceMonthly]
  );

  // Update parent when data changes
  useEffect(() => {
    const validationErrors = validate(formData);
    const isValid = Object.keys(validationErrors).length === 0;
    onDataChange(formData, isValid);
    setErrors(validationErrors);
  }, [formData, validate, onDataChange]);

  // Handle field change with formatting
  const handleChange = (field: keyof PaymentFormData, value: string) => {
    let formattedValue = value;

    // Apply formatting
    if (field === "cardNumber") {
      // Strip non-digits and format
      const digitsOnly = value.replace(/\D/g, "").slice(0, 19);
      formattedValue = formatCardNumber(digitsOnly);
    } else if (field === "expiryDate") {
      // Format as MM/YY
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      formattedValue = formatExpiryDate(digitsOnly);
    } else if (field === "cvv") {
      // Digits only, max 4
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle blur to show errors
  const handleBlur = (field: keyof PaymentFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Should show error for field
  const showError = (field: keyof ValidationErrors): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  // Check if it's a free plan
  const isFreePackage = packageDetails?.priceMonthly === 0;

  return (
    <div className="space-y-6">
      {/* Order summary */}
      {packageDetails && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="font-medium mb-2">Order Summary</h4>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-muted-foreground">
                {packageDetails.name} Plan
              </span>
              <Badge variant="outline" className="ml-2 text-xs">
                {selectedPackage?.billingCycle === "yearly" ? "Yearly" : "Monthly"}
              </Badge>
            </div>
            <span className="font-semibold">
              {formatPackagePrice(
                packageDetails,
                selectedPackage?.billingCycle === "yearly"
              )}
              {!isFreePackage && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{selectedPackage?.billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              )}
            </span>
          </div>
          {packageDetails.trialDays && packageDetails.trialDays > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Includes {packageDetails.trialDays}-day free trial. You won&apos;t
              be charged until the trial ends.
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* Free plan notice */}
      {isFreePackage ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You&apos;ve selected the <strong>Free</strong> plan. No payment
            information is required. Click &quot;Complete Registration&quot; to
            finish setting up your account.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Security notice */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          {/* Card form */}
          <div className="space-y-4">
            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name *</Label>
              <Input
                id="cardholderName"
                type="text"
                placeholder="Name as it appears on card"
                value={formData.cardholderName}
                onChange={(e) => handleChange("cardholderName", e.target.value)}
                onBlur={() => handleBlur("cardholderName")}
                disabled={disabled}
                className={showError("cardholderName") ? "border-destructive" : ""}
                autoComplete="cc-name"
              />
              {showError("cardholderName") && (
                <p className="text-sm text-destructive">
                  {showError("cardholderName")}
                </p>
              )}
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number *</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => handleChange("cardNumber", e.target.value)}
                  onBlur={() => handleBlur("cardNumber")}
                  disabled={disabled}
                  className={
                    showError("cardNumber")
                      ? "border-destructive pr-20"
                      : "pr-20"
                  }
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  {cardType !== "unknown" && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {cardTypeLabels[cardType]}
                    </span>
                  )}
                </div>
              </div>
              {showError("cardNumber") && (
                <p className="text-sm text-destructive">
                  {showError("cardNumber")}
                </p>
              )}
            </div>

            {/* Expiry and CVV row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={(e) => handleChange("expiryDate", e.target.value)}
                  onBlur={() => handleBlur("expiryDate")}
                  disabled={disabled}
                  className={showError("expiryDate") ? "border-destructive" : ""}
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  maxLength={5}
                />
                {showError("expiryDate") && (
                  <p className="text-sm text-destructive">
                    {showError("expiryDate")}
                  </p>
                )}
              </div>

              {/* CVV */}
              <div className="space-y-2">
                <Label htmlFor="cvv">
                  Security Code *
                  <span className="text-xs text-muted-foreground ml-1">
                    ({cardType === "amex" ? "4 digits" : "3 digits"})
                  </span>
                </Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder={cardType === "amex" ? "1234" : "123"}
                  value={formData.cvv}
                  onChange={(e) => handleChange("cvv", e.target.value)}
                  onBlur={() => handleBlur("cvv")}
                  disabled={disabled}
                  className={showError("cvv") ? "border-destructive" : ""}
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  maxLength={cardType === "amex" ? 4 : 3}
                />
                {showError("cvv") && (
                  <p className="text-sm text-destructive">{showError("cvv")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mock payment notice */}
          <Alert variant="default" className="bg-amber-500/10 border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Demo Mode:</strong> This is a UI preview. No actual payment
              will be processed. Enter any valid-looking card details to proceed.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}
