"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";

import { SignupStep, type SignupFormData } from "./steps/signup-step";
import { PackageStep, type PackageSelection } from "./steps/package-step";
import { PaymentStep, type PaymentFormData } from "./steps/payment-step";

// Wizard state
interface WizardState {
  currentStep: number;
  signupData: SignupFormData | null;
  packageSelection: PackageSelection | null;
  paymentData: PaymentFormData | null;
}

const TOTAL_STEPS = 3;

const stepLabels = [
  "Account Details",
  "Choose Plan",
  "Payment",
];

export function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  
  // Initialize user_type from URL param if present
  const initialUserType = searchParams.get("type") === "supplier" ? "supplier" : "buyer";
  
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    signupData: null,
    packageSelection: null,
    paymentData: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step validation state
  const [stepValid, setStepValid] = useState({
    1: false,
    2: false,
    3: false,
  });
  
  // Navigation
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  }, []);
  
  const goNext = useCallback(() => {
    if (state.currentStep < TOTAL_STEPS && stepValid[state.currentStep as keyof typeof stepValid]) {
      goToStep(state.currentStep + 1);
    }
  }, [state.currentStep, stepValid, goToStep]);
  
  const goBack = useCallback(() => {
    if (state.currentStep > 1) {
      goToStep(state.currentStep - 1);
    }
  }, [state.currentStep, goToStep]);
  
  // Step data handlers
  const handleSignupData = useCallback((data: SignupFormData, isValid: boolean) => {
    setState(prev => ({ ...prev, signupData: data }));
    setStepValid(prev => ({ ...prev, 1: isValid }));
  }, []);
  
  const handlePackageSelection = useCallback((data: PackageSelection, isValid: boolean) => {
    setState(prev => ({ ...prev, packageSelection: data }));
    setStepValid(prev => ({ ...prev, 2: isValid }));
  }, []);
  
  const handlePaymentData = useCallback((data: PaymentFormData, isValid: boolean) => {
    setState(prev => ({ ...prev, paymentData: data }));
    setStepValid(prev => ({ ...prev, 3: isValid }));
  }, []);
  
  // Final submission - calls backend register endpoint
  const handleSubmit = async () => {
    if (!state.signupData || !state.packageSelection) {
      toast.error("Please complete all steps");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare registration data for backend
      // NOTE: Only sending fields that backend expects
      // Card data is NOT sent to backend (no payment endpoint)
      const registrationData = {
        email: state.signupData.email,
        username: state.signupData.username,
        password: state.signupData.password,
        password_confirm: state.signupData.passwordConfirm,
        user_type: state.signupData.userType,
        company_name: state.signupData.companyName || undefined,
      };
      
      // Call backend register endpoint
      const result = await register(registrationData);
      
      if (result.success) {
        // Store selected package in localStorage for future use
        // TODO: Backend missing - send package ID to backend when endpoint exists
        localStorage.setItem('selectedPackage', JSON.stringify({
          packageId: state.packageSelection.packageId,
          billingCycle: state.packageSelection.billingCycle,
          selectedAt: new Date().toISOString(),
        }));
        
        toast.success("Account created successfully!", {
          description: "Welcome to Argus! Your subscription will be activated shortly.",
        });
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Progress percentage
  const progressPercent = (state.currentStep / TOTAL_STEPS) * 100;
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-border bg-card">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-xl font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-4xl font-bold text-foreground">Argus</span>
          </div>
          
          {/* Step indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {state.currentStep} of {TOTAL_STEPS}</span>
              <span>{stepLabels[state.currentStep - 1]}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          {/* Step dots */}
          <div className="flex justify-center gap-4">
            {stepLabels.map((label, index) => {
              const stepNum = index + 1;
              const isCompleted = state.currentStep > stepNum;
              const isCurrent = state.currentStep === stepNum;
              
              return (
                <div 
                  key={stepNum}
                  className="flex flex-col items-center gap-1"
                >
                  <div 
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors
                      ${isCompleted 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : isCurrent
                          ? 'border-primary text-primary'
                          : 'border-muted text-muted-foreground'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`text-xs ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          
          <CardTitle className="text-center text-2xl font-bold">
            {state.currentStep === 1 && "Create your account"}
            {state.currentStep === 2 && "Choose your plan"}
            {state.currentStep === 3 && "Payment details"}
          </CardTitle>
          <CardDescription className="text-center">
            {state.currentStep === 1 && "Enter your details to get started"}
            {state.currentStep === 2 && "Select the plan that fits your needs"}
            {state.currentStep === 3 && "Enter your payment information"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step content */}
          {state.currentStep === 1 && (
            <SignupStep
              initialData={state.signupData}
              initialUserType={initialUserType}
              onDataChange={handleSignupData}
              disabled={isSubmitting}
            />
          )}
          
          {state.currentStep === 2 && (
            <PackageStep
              userType={state.signupData?.userType || initialUserType}
              initialSelection={state.packageSelection}
              onSelectionChange={handlePackageSelection}
              disabled={isSubmitting}
            />
          )}
          
          {state.currentStep === 3 && (
            <PaymentStep
              initialData={state.paymentData}
              selectedPackage={state.packageSelection}
              onDataChange={handlePaymentData}
              disabled={isSubmitting}
            />
          )}
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={state.currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {state.currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={!stepValid[state.currentStep as keyof typeof stepValid] || isSubmitting}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!stepValid[3] || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
