/**
 * Market Service
 * 
 * Service for fetching market indicators (currency rates)
 */
import { apiClient } from '../api-client';
import type { MarketIndicatorsResponse } from '../api-types';

export const marketService = {
  /**
   * Get market indicators (currency exchange rates)
   * No authentication required
   */
  getIndicators: async (): Promise<MarketIndicatorsResponse> => {
    const response = await apiClient.get<MarketIndicatorsResponse>(
      '/market/indicators',
      { skipAuth: true }
    );

    if (response.error || !response.data) {
      throw new Error(response.error?.detail || 'Failed to fetch market indicators');
    }

    return response.data;
  },
};

