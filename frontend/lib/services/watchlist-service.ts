/**
 * Watchlist Service
 * 
 * Handles watchlist-related API calls:
 * - List watchlist items with pagination
 * - Add products to watchlist
 * - Remove products from watchlist
 * - Get watchlist product IDs for quick checks
 */

import { apiClient, ApiResponse } from '../api-client';
import type {
  WatchlistListResponse,
  WatchlistItem,
  WatchlistAddRequest,
  WatchlistIdsResponse,
  WatchlistParams,
  MessageResponse,
} from '../api-types';

// Build query string from params
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const watchlistService = {
  /**
   * Get paginated watchlist items
   */
  getWatchlist: async (
    params: WatchlistParams = {}
  ): Promise<ApiResponse<WatchlistListResponse>> => {
    const query = buildQueryString(params as unknown as Record<string, unknown>);
    return await apiClient.get<WatchlistListResponse>(`/watchlist${query}`);
  },

  /**
   * Add a product to watchlist
   */
  addToWatchlist: async (
    productId: string
  ): Promise<ApiResponse<WatchlistItem>> => {
    const data: WatchlistAddRequest = { product_id: productId };
    return await apiClient.post<WatchlistItem>('/watchlist', data);
  },

  /**
   * Remove a product from watchlist
   */
  removeFromWatchlist: async (
    productId: string
  ): Promise<ApiResponse<MessageResponse>> => {
    return await apiClient.delete<MessageResponse>(`/watchlist/${productId}`);
  },

  /**
   * Get list of product IDs in watchlist (for quick UI checks)
   */
  getWatchlistIds: async (): Promise<ApiResponse<WatchlistIdsResponse>> => {
    return await apiClient.get<WatchlistIdsResponse>('/watchlist/ids');
  },

  /**
   * Check if a product is in watchlist
   */
  isInWatchlist: async (productId: string): Promise<boolean> => {
    const response = await watchlistService.getWatchlistIds();
    if (response.error || !response.data) {
      return false;
    }
    return response.data.product_ids.includes(productId);
  },
};

export default watchlistService;
