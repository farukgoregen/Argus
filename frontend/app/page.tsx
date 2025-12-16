import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown, Shield, BarChart3, Check } from "lucide-react"
import { PriceTrendPreview } from "@/components/price-trend-preview"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container relative mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-primary/20 text-primary hover:bg-primary/30" variant="secondary">
              Global Sourcing Intelligence
            </Badge>
            <h1 className="mb-6 text-balance font-sans text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              The Benchmark for Global Sourcing Intelligence
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
              Analyze price trends, calculate profit margins, and secure your supply chain with real-time data from
              trusted global suppliers.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard">
                  SIGN UP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                <Link href="/dashboard/supplier">BECOME A SUPPLIER</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="#contact" className="underline underline-offset-4 hover:text-foreground">
                We will contact you
              </Link>
            </p>
          </div>

          {/* Price Trend Chart Preview */}
          <div className="mx-auto mt-12 max-w-5xl">
            <PriceTrendPreview />
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-b border-border py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">The Problem with Price Volatility</h2>
            <p className="mb-12 text-pretty text-lg text-muted-foreground">
              Global supply chains face unprecedented price fluctuations. Without real-time intelligence, businesses
              lose profit margins and competitive advantage.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardHeader>
                <TrendingDown className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Real-Time Price Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Track prices across Alibaba, Amazon, Trendyol, DHGate and more. Get instant alerts when prices drop
                  below your target.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <Shield className="mb-2 h-10 w-10 text-accent" />
                <CardTitle>Supplier Resilience Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  AI-powered trust scores evaluate supplier reliability, delivery times, and quality consistency to
                  minimize risk.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <BarChart3 className="mb-2 h-10 w-10 text-chart-3" />
                <CardTitle>Profit Margin Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Automatically calculate landed costs including VAT, shipping, and customs to understand true profit
                  potential.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* System Example */}
      <section className="border-b border-border py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">See It In Action</h2>
            <p className="mb-12 text-pretty text-lg text-muted-foreground">
              Example analysis for iPhone 15 Pro Max showing real-time supplier comparison
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">iPhone 15 Pro Max 256GB</CardTitle>
                    <CardDescription className="mt-2 text-base">Compare 4 verified suppliers</CardDescription>
                  </div>
                  <Badge className="bg-accent/20 text-accent hover:bg-accent/30">Best Deal Available</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-secondary p-4">
                      <div className="text-sm text-muted-foreground">Average Market Price</div>
                      <div className="text-2xl font-bold">$1,150</div>
                    </div>
                    <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
                      <div className="text-sm text-primary">Cheapest Seller (Amazon)</div>
                      <div className="text-2xl font-bold text-primary">$1,089</div>
                      <div className="text-xs text-muted-foreground">5.3% below average</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium">Profit Margin Analysis</span>
                      <Badge variant="outline">Including VAT & Shipping</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Price:</span>
                        <span className="font-medium">$1,089</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VAT (18%):</span>
                        <span className="font-medium">$195.02</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping:</span>
                        <span className="font-medium">Free</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 font-bold">
                        <span>Total Landed Cost:</span>
                        <span>$1,284.02</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-b border-border py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mb-12 text-pretty text-lg text-muted-foreground">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {/* Buyer/Merchant Plan */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-2xl">Buyer / Merchant</CardTitle>
                <CardDescription className="text-base">Perfect for businesses sourcing products</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$30</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "View-only access to price data",
                    "Real-time price trend analysis",
                    "Compare unlimited suppliers",
                    "Profit margin calculator",
                    "Watchlist & price alerts",
                    "Trust score visibility",
                    "AI-powered insights",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" size="lg">
                  <Link href="/dashboard">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Supplier/Vendor Plan */}
            <Card className="relative border-primary bg-card">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary px-4 py-1 text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Supplier / Vendor</CardTitle>
                <CardDescription className="text-base">For suppliers looking to reach buyers</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Full access to platform features",
                    "API integration for inventory",
                    "Manage product listings",
                    "Receive RFQ notifications",
                    "Direct quote management",
                    "Enhanced trust score features",
                    "Priority customer support",
                    "Analytics dashboard",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" size="lg">
                  <Link href="/dashboard/supplier">Start Free Trial</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-border bg-card p-6 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-accent" />
            <p className="font-medium">Supplier Verification Guarantee</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We audit and choose suppliers manually before onboarding. Every supplier undergoes rigorous verification
              to ensure quality and reliability for our buyers.
            </p>
          </div>
        </div>
      </section>

      {/* Trial Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-card">
            <div className="p-8 text-center md:p-12 lg:p-16">
              <Badge className="mb-4 bg-primary/30 text-primary hover:bg-primary/40" variant="secondary">
                Limited Time Offer
              </Badge>
              <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">Dedicated to B2B Sourcing</h2>
              <p className="mb-8 text-pretty text-lg text-muted-foreground">
                Join thousands of businesses optimizing their supply chain with Argus. Start your journey today.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    1 WEEK FREE TRIAL
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  <Link href="#contact">Contact Sales</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Argus Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
