/**
 * Subscription Packages Mock Data
 * 
 * This is FRONTEND MOCK DATA - no backend endpoint exists for packages.
 * 
 * TODO: When backend packages endpoint is implemented:
 * 1. Create a service in lib/services/packages-service.ts
 * 2. Fetch packages from API instead of using this mock
 * 3. Keep types in lib/api-types.ts
 * 
 * Structure is designed to be easily replaceable with API response.
 */

export type UserType = 'buyer' | 'supplier';

export interface PackageFeature {
  id: string;
  name: string;
  included: boolean;
  limit?: string; // e.g., "100/month", "Unlimited"
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  userType: UserType;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: PackageFeature[];
  popular?: boolean;
  trialDays?: number;
}

/**
 * Buyer subscription packages
 */
export const buyerPackages: SubscriptionPackage[] = [
  {
    id: 'buyer-starter',
    name: 'Starter',
    description: 'Perfect for individual buyers exploring the platform',
    userType: 'buyer',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    trialDays: 0,
    features: [
      { id: 'search', name: 'Product Search', included: true, limit: '50/month' },
      { id: 'quotes', name: 'Request Quotes', included: true, limit: '5/month' },
      { id: 'watchlist', name: 'Watchlist Items', included: true, limit: '10 items' },
      { id: 'ai-chat', name: 'AI Assistant', included: false },
      { id: 'price-alerts', name: 'Price Alerts', included: false },
      { id: 'analytics', name: 'Market Analytics', included: false },
      { id: 'priority-support', name: 'Priority Support', included: false },
    ],
  },
  {
    id: 'buyer-professional',
    name: 'Professional',
    description: 'For growing businesses with regular sourcing needs',
    userType: 'buyer',
    priceMonthly: 49,
    priceYearly: 470,
    currency: 'USD',
    popular: true,
    trialDays: 14,
    features: [
      { id: 'search', name: 'Product Search', included: true, limit: 'Unlimited' },
      { id: 'quotes', name: 'Request Quotes', included: true, limit: '50/month' },
      { id: 'watchlist', name: 'Watchlist Items', included: true, limit: '100 items' },
      { id: 'ai-chat', name: 'AI Assistant', included: true },
      { id: 'price-alerts', name: 'Price Alerts', included: true, limit: '20 alerts' },
      { id: 'analytics', name: 'Market Analytics', included: false },
      { id: 'priority-support', name: 'Priority Support', included: false },
    ],
  },
  {
    id: 'buyer-enterprise',
    name: 'Enterprise',
    description: 'Full-featured solution for large organizations',
    userType: 'buyer',
    priceMonthly: 199,
    priceYearly: 1990,
    currency: 'USD',
    trialDays: 30,
    features: [
      { id: 'search', name: 'Product Search', included: true, limit: 'Unlimited' },
      { id: 'quotes', name: 'Request Quotes', included: true, limit: 'Unlimited' },
      { id: 'watchlist', name: 'Watchlist Items', included: true, limit: 'Unlimited' },
      { id: 'ai-chat', name: 'AI Assistant', included: true },
      { id: 'price-alerts', name: 'Price Alerts', included: true, limit: 'Unlimited' },
      { id: 'analytics', name: 'Market Analytics', included: true },
      { id: 'priority-support', name: 'Priority Support', included: true },
    ],
  },
];

/**
 * Supplier subscription packages
 */
export const supplierPackages: SubscriptionPackage[] = [
  {
    id: 'supplier-starter',
    name: 'Starter',
    description: 'Get started with basic product listings',
    userType: 'supplier',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    trialDays: 0,
    features: [
      { id: 'listings', name: 'Product Listings', included: true, limit: '10 products' },
      { id: 'photos', name: 'Photos per Product', included: true, limit: '3 photos' },
      { id: 'rfq-responses', name: 'RFQ Responses', included: true, limit: '5/month' },
      { id: 'analytics', name: 'Sales Analytics', included: false },
      { id: 'featured', name: 'Featured Listings', included: false },
      { id: 'bulk-upload', name: 'Bulk Upload', included: false },
      { id: 'api-access', name: 'API Access', included: false },
      { id: 'priority-support', name: 'Priority Support', included: false },
    ],
  },
  {
    id: 'supplier-professional',
    name: 'Professional',
    description: 'Expand your reach with more visibility',
    userType: 'supplier',
    priceMonthly: 79,
    priceYearly: 790,
    currency: 'USD',
    popular: true,
    trialDays: 14,
    features: [
      { id: 'listings', name: 'Product Listings', included: true, limit: '100 products' },
      { id: 'photos', name: 'Photos per Product', included: true, limit: '10 photos' },
      { id: 'rfq-responses', name: 'RFQ Responses', included: true, limit: '50/month' },
      { id: 'analytics', name: 'Sales Analytics', included: true },
      { id: 'featured', name: 'Featured Listings', included: true, limit: '5/month' },
      { id: 'bulk-upload', name: 'Bulk Upload', included: false },
      { id: 'api-access', name: 'API Access', included: false },
      { id: 'priority-support', name: 'Priority Support', included: false },
    ],
  },
  {
    id: 'supplier-enterprise',
    name: 'Enterprise',
    description: 'Maximum exposure and full platform access',
    userType: 'supplier',
    priceMonthly: 249,
    priceYearly: 2490,
    currency: 'USD',
    trialDays: 30,
    features: [
      { id: 'listings', name: 'Product Listings', included: true, limit: 'Unlimited' },
      { id: 'photos', name: 'Photos per Product', included: true, limit: 'Unlimited' },
      { id: 'rfq-responses', name: 'RFQ Responses', included: true, limit: 'Unlimited' },
      { id: 'analytics', name: 'Sales Analytics', included: true },
      { id: 'featured', name: 'Featured Listings', included: true, limit: 'Unlimited' },
      { id: 'bulk-upload', name: 'Bulk Upload', included: true },
      { id: 'api-access', name: 'API Access', included: true },
      { id: 'priority-support', name: 'Priority Support', included: true },
    ],
  },
];

/**
 * Get packages filtered by user type
 */
export function getPackagesByUserType(userType: UserType): SubscriptionPackage[] {
  return userType === 'buyer' ? buyerPackages : supplierPackages;
}

/**
 * Get a specific package by ID
 */
export function getPackageById(packageId: string): SubscriptionPackage | undefined {
  return [...buyerPackages, ...supplierPackages].find(pkg => pkg.id === packageId);
}

/**
 * Format price for display
 */
export function formatPackagePrice(pkg: SubscriptionPackage, yearly: boolean = false): string {
  const price = yearly ? pkg.priceYearly : pkg.priceMonthly;
  
  if (price === 0) {
    return 'Free';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: pkg.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
