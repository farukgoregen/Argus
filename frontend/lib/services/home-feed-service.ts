/**
 * Home Feed Service
 * 
 * Handles home feed API calls:
 * - Get homepage feed with recent searches and products
 */

import { apiClient, ApiResponse } from '../api-client';
import type { HomeFeedResponse, HomeFeedParams } from '../api-types';

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

export const homeFeedService = {
  /**
   * Get home feed with recent searches and products
   */
  getHomeFeed: async (
    params: HomeFeedParams = {}
  ): Promise<ApiResponse<HomeFeedResponse>> => {
    const query = buildQueryString(params as unknown as Record<string, unknown>);
    return await apiClient.get<HomeFeedResponse>(`/home-feed${query}`);
  },
};

export default homeFeedService;
