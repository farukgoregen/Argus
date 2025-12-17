import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingDown, Shield, BarChart3, Check, Mail, MapPin, Phone } from "lucide-react"
import { PublicNavbar } from "@/components/public-navbar"
import { ContactForm } from "@/components/contact-form"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Public Navbar */}
      <PublicNavbar />
      
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden border-b border-border pt-16">
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
                <Link href="/register">
                  SIGN UP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                <Link href="/register?type=supplier">BECOME A SUPPLIER</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                Already have an account? Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="border-b border-border py-16 md:py-24 scroll-mt-16">
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

      {/* Pricing Section */}
      <section id="pricing" className="border-b border-border py-16 md:py-24 scroll-mt-16">
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

      {/* Contact Section */}
      <section id="contact" className="border-b border-border py-16 md:py-24 scroll-mt-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30" variant="secondary">
              Get In Touch
            </Badge>
            <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">Contact Us</h2>
            <p className="mb-12 text-pretty text-lg text-muted-foreground">
              Have questions about our platform? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-2">
            {/* Contact Form */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>Fill out the form below and we&apos;ll get back to you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6 lg:pl-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                <p className="text-muted-foreground mb-6">
                  Our team is here to help you optimize your supply chain and maximize your profits.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:support@argusplatform.com" className="text-muted-foreground hover:text-foreground transition-colors">
                      support@argusplatform.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <a href="tel:+1-555-123-4567" className="text-muted-foreground hover:text-foreground transition-colors">
                      +1 (555) 123-4567
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">
                      123 Business District<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="font-medium mb-2">Business Hours</h4>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM (PST)<br />
                  Saturday - Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 scroll-mt-16">
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
