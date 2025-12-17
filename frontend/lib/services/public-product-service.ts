/**
 * Public Product Service
 * 
 * Handles public (no auth required) product API calls for buyers:
 * - Search products
 * - Product detail
 * - Product offers (same product from different sellers)
 */

import { apiClient, ApiResponse } from '../api-client';
import type {
  PublicProductDetail,
  PaginatedPublicProductList,
  PublicProductSearchParams,
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

export const publicProductService = {
  /**
   * Search products (public, no auth required)
   */
  searchProducts: async (
    params: PublicProductSearchParams
  ): Promise<ApiResponse<PaginatedPublicProductList>> => {
    const query = buildQueryString(params as unknown as Record<string, unknown>);
    return await apiClient.get<PaginatedPublicProductList>(
      `/public/products/search${query}`,
      { skipAuth: true }
    );
  },

  /**
   * Get product detail (public, no auth required)
   */
  getProduct: async (productId: string): Promise<ApiResponse<PublicProductDetail>> => {
    return await apiClient.get<PublicProductDetail>(
      `/public/products/${productId}`,
      { skipAuth: true }
    );
  },

  /**
   * Get offers for the same product from different sellers
   * (public, no auth required)
   */
  getProductOffers: async (
    productId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedPublicProductList>> => {
    const query = buildQueryString({ page, page_size: pageSize });
    return await apiClient.get<PaginatedPublicProductList>(
      `/public/products/${productId}/offers${query}`,
      { skipAuth: true }
    );
  },
};

export default publicProductService;
