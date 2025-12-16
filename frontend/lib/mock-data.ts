// Mock data for the Supplier Analysis Platform

export interface Supplier {
  id: string
  name: string
  logo: string
  trustScore: number
  rating: number
  totalReviews: number
}

export interface Product {
  id: string
  name: string
  image: string
  category: string
  avgPrice: number
  minPrice: number
  maxPrice: number
  suppliers: string[]
  stock: number
  rating: number
  reviews: number
}

export interface PricePoint {
  date: string
  alibaba: number
  trendyol: number
  amazon: number
  dhgate: number
}

export interface ProductOffer {
  id: string
  supplierId: string
  supplierName: string
  price: number
  vat: number
  shipping: number
  totalPrice: number
  moq: number
  deliveryDays: number
  trustScore: number
  stock: number
}

export interface WatchlistItem {
  id: string
  productId: string
  productName: string
  productImage: string
  currentPrice: number
  targetPrice: number
  priceChange30Days: number
  status: "watching" | "alert" | "target-reached"
  prediction: string
  addedDate: string
}

export interface Currency {
  code: string
  symbol: string
  rate: number
  change: number
}

export interface AIInsight {
  id: string
  type: "price-drop" | "supplier-alert" | "stock-alert" | "trend"
  title: string
  description: string
  productId?: string
  supplierId?: string
  timestamp: string
}

export interface RFQ {
  id: string
  productName: string
  quantity: number
  budget: number
  deadline: string
  status: "new" | "quoted" | "accepted" | "rejected"
  customerName: string
}

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: "alibaba",
    name: "Alibaba",
    logo: "/alibaba-logo.png",
    trustScore: 9.2,
    rating: 4.7,
    totalReviews: 15420,
  },
  {
    id: "trendyol",
    name: "Trendyol",
    logo: "/trendyol-logo.png",
    trustScore: 8.8,
    rating: 4.5,
    totalReviews: 8930,
  },
  {
    id: "amazon",
    name: "Amazon Business",
    logo: "/amazon-logo.png",
    trustScore: 9.5,
    rating: 4.8,
    totalReviews: 23450,
  },
  {
    id: "dhgate",
    name: "DHGate",
    logo: "/dhgate-logo.jpg",
    trustScore: 8.3,
    rating: 4.3,
    totalReviews: 12100,
  },
]

// Mock Products
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max 256GB",
    image: "/iphone-15-pro-max-display.png",
    category: "Electronics",
    avgPrice: 1150,
    minPrice: 1089,
    maxPrice: 1249,
    suppliers: ["alibaba", "amazon", "trendyol"],
    stock: 450,
    rating: 4.8,
    reviews: 1240,
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    image: "/samsung-galaxy-s24-ultra.png",
    category: "Electronics",
    avgPrice: 1050,
    minPrice: 999,
    maxPrice: 1199,
    suppliers: ["alibaba", "amazon", "dhgate"],
    stock: 320,
    rating: 4.7,
    reviews: 890,
  },
  {
    id: "3",
    name: "Sony WH-1000XM5 Headphones",
    image: "/sony-wh1000xm5-headphones.jpg",
    category: "Audio",
    avgPrice: 349,
    minPrice: 329,
    maxPrice: 399,
    suppliers: ["amazon", "trendyol", "dhgate"],
    stock: 890,
    rating: 4.9,
    reviews: 2340,
  },
  {
    id: "4",
    name: "MacBook Air M3 13-inch",
    image: "/macbook-air-m3.jpg",
    category: "Computers",
    avgPrice: 1299,
    minPrice: 1249,
    maxPrice: 1399,
    suppliers: ["alibaba", "amazon"],
    stock: 125,
    rating: 4.9,
    reviews: 1560,
  },
  {
    id: "5",
    name: "Dell XPS 15 Laptop",
    image: "/dell-xps-15.png",
    category: "Computers",
    avgPrice: 1499,
    minPrice: 1449,
    maxPrice: 1599,
    suppliers: ["alibaba", "amazon", "trendyol"],
    stock: 210,
    rating: 4.6,
    reviews: 780,
  },
  {
    id: "6",
    name: 'iPad Pro 12.9" M2',
    image: "/ipad-pro-m2.jpg",
    category: "Tablets",
    avgPrice: 1099,
    minPrice: 1049,
    maxPrice: 1179,
    suppliers: ["amazon", "alibaba"],
    stock: 340,
    rating: 4.8,
    reviews: 920,
  },
]

// Price Trend Data (7 days)
export const mockPriceTrends: PricePoint[] = [
  { date: "2025-12-09", alibaba: 1150, trendyol: 1180, amazon: 1120, dhgate: 1200 },
  { date: "2025-12-10", alibaba: 1145, trendyol: 1175, amazon: 1115, dhgate: 1195 },
  { date: "2025-12-11", alibaba: 1140, trendyol: 1170, amazon: 1110, dhgate: 1190 },
  { date: "2025-12-12", alibaba: 1130, trendyol: 1165, amazon: 1100, dhgate: 1185 },
  { date: "2025-12-13", alibaba: 1125, trendyol: 1160, amazon: 1095, dhgate: 1180 },
  { date: "2025-12-14", alibaba: 1120, trendyol: 1155, amazon: 1090, dhgate: 1175 },
  { date: "2025-12-15", alibaba: 1115, trendyol: 1150, amazon: 1089, dhgate: 1170 },
]

// Product Offers
export const mockOffers: ProductOffer[] = [
  {
    id: "1",
    supplierId: "amazon",
    supplierName: "Amazon Business",
    price: 1089,
    vat: 195.02,
    shipping: 0,
    totalPrice: 1284.02,
    moq: 1,
    deliveryDays: 2,
    trustScore: 9.5,
    stock: 450,
  },
  {
    id: "2",
    supplierId: "alibaba",
    supplierName: "Alibaba",
    price: 1115,
    vat: 200.7,
    shipping: 25,
    totalPrice: 1340.7,
    moq: 5,
    deliveryDays: 7,
    trustScore: 9.2,
    stock: 890,
  },
  {
    id: "3",
    supplierId: "trendyol",
    supplierName: "Trendyol",
    price: 1150,
    vat: 207.0,
    shipping: 15,
    totalPrice: 1372.0,
    moq: 2,
    deliveryDays: 4,
    trustScore: 8.8,
    stock: 320,
  },
  {
    id: "4",
    supplierId: "dhgate",
    supplierName: "DHGate",
    price: 1170,
    vat: 210.6,
    shipping: 30,
    totalPrice: 1410.6,
    moq: 10,
    deliveryDays: 14,
    trustScore: 8.3,
    stock: 125,
  },
]

// Currencies
export const mockCurrencies: Currency[] = [
  { code: "USD", symbol: "$", rate: 1.0, change: 0.12 },
  { code: "EUR", symbol: "€", rate: 0.92, change: -0.08 },
  { code: "GBP", symbol: "£", rate: 0.79, change: 0.05 },
  { code: "JPY", symbol: "¥", rate: 149.82, change: -0.34 },
  { code: "CNY", symbol: "¥", rate: 7.24, change: 0.02 },
  { code: "GOLD", symbol: "AU", rate: 2034.5, change: 1.23 },
]

// AI Insights
export const mockAIInsights: AIInsight[] = [
  {
    id: "1",
    type: "price-drop",
    title: "Significant Price Drop Detected",
    description:
      "iPhone 15 Pro Max dropped 3.2% on Amazon in the last 24 hours. Historical data suggests further decline.",
    productId: "1",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "supplier-alert",
    title: "New Supplier Available",
    description: "A verified supplier with 9.4 trust score now offers MacBook Air M3 at competitive rates.",
    productId: "4",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    type: "trend",
    title: "Market Trend Alert",
    description: "Electronics category showing downward price trend. Good time to purchase in bulk.",
    timestamp: "1 day ago",
  },
]

// Watchlist Items
export const mockWatchlist: WatchlistItem[] = [
  {
    id: "1",
    productId: "1",
    productName: "iPhone 15 Pro Max 256GB",
    productImage: "/iphone-15-pro.png",
    currentPrice: 1089,
    targetPrice: 1050,
    priceChange30Days: -5.2,
    status: "alert",
    prediction: "Price dropping steadily, likely to hit target in ~2 weeks",
    addedDate: "2025-11-15",
  },
  {
    id: "2",
    productId: "3",
    productName: "Sony WH-1000XM5 Headphones",
    productImage: "/wireless-headphones.png",
    currentPrice: 329,
    targetPrice: 299,
    priceChange30Days: -2.8,
    status: "watching",
    prediction: "Stable pricing, target may take 4-6 weeks",
    addedDate: "2025-11-20",
  },
  {
    id: "3",
    productId: "4",
    productName: "MacBook Air M3 13-inch",
    productImage: "/macbook-air-on-desk.png",
    currentPrice: 1249,
    targetPrice: 1200,
    priceChange30Days: -1.5,
    status: "watching",
    prediction: "Seasonal trends suggest drop around January",
    addedDate: "2025-12-01",
  },
]

// RFQs (for supplier dashboard)
export const mockRFQs: RFQ[] = [
  {
    id: "1",
    productName: "iPhone 15 Pro Max 256GB",
    quantity: 50,
    budget: 55000,
    deadline: "2025-12-20",
    status: "new",
    customerName: "Tech Retailers Inc.",
  },
  {
    id: "2",
    productName: "Samsung Galaxy S24 Ultra",
    quantity: 30,
    budget: 31500,
    deadline: "2025-12-18",
    status: "quoted",
    customerName: "Mobile World",
  },
  {
    id: "3",
    productName: "Sony WH-1000XM5 Headphones",
    quantity: 100,
    budget: 34000,
    deadline: "2025-12-25",
    status: "new",
    customerName: "Audio Depot",
  },
]

// Recent Searches
export const mockRecentSearches = mockProducts.slice(0, 4)
