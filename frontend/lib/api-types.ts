/**
 * Type definitions for API responses and requests
 * Based on the backend API documentation
 */

// ============================================
// User & Auth Types
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  user_type: 'buyer' | 'supplier';
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  user_type?: 'buyer' | 'supplier';
  company_name?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

// ============================================
// Profile Types
// ============================================

export interface BuyerProfile {
  id: string;
  company_name: string;
  phone?: string;
  payment_method?: string;
  logo?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierProfile {
  id: string;
  company_name: string;
  phone?: string;
  website?: string;
  description?: string;
  main_production_location?: string;
  return_policy?: string;
  payment_method?: string;
  logo?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Product Types
// ============================================

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ProductPhoto {
  id: string;
  url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  product_name: string;
  product_category: string;
  description?: string;
  unit_price: string;
  stock_quantity: number;
  sell_quantity: number;
  stock_status: StockStatus;
  features?: Record<string, unknown>;
  is_active: boolean;
  photos: ProductPhoto[];
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: string;
  product_name: string;
  product_category: string;
  unit_price: string;
  stock_quantity: number;
  stock_status: StockStatus;
  is_active: boolean;
  main_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedProductList {
  items: ProductListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ProductCreateRequest {
  product_name: string;
  product_category: string;
  description?: string;
  unit_price: number;
  stock_quantity?: number;
  sell_quantity?: number;
  features?: Record<string, unknown>;
  is_active?: boolean;
}

export interface ProductUpdateRequest {
  product_name?: string;
  product_category?: string;
  description?: string;
  unit_price?: number;
  stock_quantity?: number;
  sell_quantity?: number;
  features?: Record<string, unknown>;
  is_active?: boolean;
  photos_to_delete?: string[];
  photos_to_update?: { id: string; sort_order: number }[];
}

export interface ProductFilters {
  is_active?: boolean;
  stock_status?: StockStatus;
  stock_below?: number;
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  page_size?: number;
}

// ============================================
// Public Product Types (Buyer View)
// ============================================

export interface PublicProductSeller {
  id: string;
  display_name: string;
}

export interface PublicProductPhoto {
  id: string;
  url: string;
  sort_order: number;
}

export interface PublicProductListItem {
  id: string;
  product_name: string;
  product_category: string;
  description?: string;
  photos: PublicProductPhoto[];
  unit_price: string;
  stock_quantity: number;
  stock_status: StockStatus;
  sell_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seller_id: string;
  seller_display_name: string;
}

export interface PublicProductDetail {
  id: string;
  product_name: string;
  product_category: string;
  description?: string;
  photos: PublicProductPhoto[];
  unit_price: string;
  stock_quantity: number;
  stock_status: StockStatus;
  sell_quantity: number;
  features?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seller_id: string;
  seller_display_name: string;
}

export interface PaginatedPublicProductList {
  items: PublicProductListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface PublicProductSearchParams {
  q: string;
  seller_id?: string;
  page?: number;
  page_size?: number;
  price_min?: number;
  price_max?: number;
  suppliers?: string[];
}

// ============================================
// Home Feed Types
// ============================================

export interface RecentSearchItem {
  query: string;
  searched_at: string;
}

export interface ProductCardSeller {
  id: string;
  display_name: string;
}

export interface ProductCardPhoto {
  id: string;
  url: string;
  sort_order: number;
}

export interface ProductCard {
  id: string;
  product_name: string;
  product_category: string;
  description_preview?: string;
  photos: ProductCardPhoto[];
  unit_price: string;
  sell_quantity: number;
  stock_quantity: number;
  stock_status: StockStatus;
  seller: ProductCardSeller;
  created_at: string;
  updated_at: string;
}

export interface HomeFeedPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface RecentSearchesSection {
  key: 'recent_searches';
  title: string;
  items: RecentSearchItem[];
}

export interface AllProductsSection {
  key: 'all_products';
  title: string;
  pagination: HomeFeedPagination;
  items: ProductCard[];
}

export type HomeFeedSection = RecentSearchesSection | AllProductsSection;

export interface HomeFeedResponse {
  sections: HomeFeedSection[];
}

export interface HomeFeedParams {
  page?: number;
  page_size?: number;
  q?: string;
  category?: string;
  seller_id?: string;
  hide_out_of_stock?: boolean;
}

// ============================================
// Watchlist Types
// ============================================

export interface WatchlistProduct {
  id: string;
  product_name: string;
  product_category: string;
  description_preview?: string;
  photos: ProductCardPhoto[];
  unit_price: string;
  stock_quantity: number;
  stock_status: StockStatus;
  seller: ProductCardSeller;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  created_at: string;
  product: WatchlistProduct;
}

export interface WatchlistPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface WatchlistListResponse {
  items: WatchlistItem[];
  pagination: WatchlistPagination;
}

export interface WatchlistAddRequest {
  product_id: string;
}

export interface WatchlistIdsResponse {
  product_ids: string[];
}

export interface WatchlistParams {
  page?: number;
  page_size?: number;
}

// ============================================
// AI Chat Types
// ============================================

export interface AIChatRequest {
  message: string;
  product_id?: number;
  supplier_id?: number;
}

export interface AIChatResponse {
  reply: string;
  from_cache: boolean;
  degraded: boolean;
}

// ============================================
// Real-time Chat Types
// ============================================

export interface ChatUserSummary {
  id: string;
  username: string;
  user_type: 'buyer' | 'supplier';
}

export interface ChatProductSummary {
  id: string;
  product_name: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_username: string;
  text: string;
  created_at: string;
}

export interface ChatLastMessage {
  id: string;
  sender_id: string;
  sender_username: string;
  text: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  buyer: ChatUserSummary;
  supplier: ChatUserSummary;
  product: ChatProductSummary | null;
  last_message: ChatLastMessage | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatThreadListResponse {
  threads: ChatThread[];
  total: number;
}

export interface ChatMessageListResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ChatUnreadCountResponse {
  unread_total: number;
}

export interface ChatReadAckResponse {
  thread_id: string;
  unread_total: number;
}

export interface CreateChatThreadRequest {
  supplier_id: string;
  product_id?: string | null;
}

export interface SendChatMessageRequest {
  text: string;
}

// ============================================
// AI Types
// ============================================

export interface AIChatRequest {
  message: string;
  product_id?: number | null;
  supplier_id?: number | null;
}

export interface AIChatResponse {
  reply: string;
  from_cache: boolean;
  degraded: boolean;
}

export interface VisionKeywordsResponse {
  keywords: string[];
  raw_text?: string | null;
}

export interface AssistantContext {
  route?: string;
  user_type?: 'buyer' | 'supplier' | null;
  page_state?: Record<string, unknown>;
}

export interface AssistantRequest {
  message: string;
  context?: AssistantContext;
}

export interface AssistantResponse {
  reply: string;
}

// Search Summary Types
export interface SearchResultItem {
  id: string;
  product_name: string;
  product_category?: string;
  unit_price: number;
  sell_quantity?: number;
  seller_name?: string;
  updated_at?: string;
}

export interface SearchDestination {
  country?: string;
  region?: string;
}

export interface SearchSummaryRequest {
  query: string;
  results: SearchResultItem[];
  destination?: SearchDestination;
}

export interface BestDeal {
  title: string;
  price: number;
  seller: string;
  product_id: string;
}

export interface SearchSummaryResponse {
  best_deal: BestDeal | null;
  avg_price: number;
  suppliers_count: number;
  moq_warning: string | null;
  highlights: string[] | null;
}

// ============================================
// Market Indicators Types
// ============================================

export interface MarketIndicatorItem {
  symbol: string;
  label: string;
  value: number;
  change_pct?: number | null;
}

export interface MarketIndicatorsResponse {
  base: string;
  updated_at: string;
  items: MarketIndicatorItem[];
}

// ============================================
// Common Types
// ============================================

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  detail: string;
  errors?: Array<{ loc: string[]; msg: string; type: string }>;
}

export interface BulkUpdateResponse {
  updated: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}
