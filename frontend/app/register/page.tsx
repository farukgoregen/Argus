"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { RegisterWizard } from "@/components/register-wizard";
import { PublicNavbar } from "@/components/public-navbar";
import { useAuth } from "@/contexts/auth-context";

// Loading fallback for Suspense
function WizardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading registration...</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth status
  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={<WizardLoading />}>
      <div className="min-h-screen bg-background">
        {/* Public Navbar */}
        <PublicNavbar />
        
        {/* Registration wizard */}
        <div className="pt-20 pb-20">
          <RegisterWizard />
        </div>
        
        {/* Footer */}
        <div className="fixed bottom-4 left-0 right-0 text-center">
          <div className="flex flex-col items-center gap-2 text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Landing
            </Link>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
