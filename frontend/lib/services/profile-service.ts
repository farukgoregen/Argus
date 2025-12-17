/**
 * Profile Service
 * 
 * Handles all profile-related API calls:
 * - Get buyer/supplier profile
 * - Update buyer/supplier profile
 */

import { apiClient, ApiResponse } from '../api-client';
import type { BuyerProfile, SupplierProfile } from '../api-types';

export const profileService = {
  /**
   * Get buyer profile
   */
  getBuyerProfile: async (): Promise<ApiResponse<BuyerProfile>> => {
    return await apiClient.get<BuyerProfile>('/profile/buyer');
  },

  /**
   * Update buyer profile
   */
  updateBuyerProfile: async (data: {
    phone?: string;
    payment_method?: string;
    logo?: File;
  }): Promise<ApiResponse<BuyerProfile>> => {
    const formData = new FormData();

    if (data.phone !== undefined) {
      formData.append('phone', data.phone);
    }
    if (data.payment_method !== undefined) {
      formData.append('payment_method', data.payment_method);
    }
    if (data.logo) {
      formData.append('logo', data.logo);
    }

    return await apiClient.patch<BuyerProfile>('/profile/buyer', formData);
  },

  /**
   * Get supplier profile
   */
  getSupplierProfile: async (): Promise<ApiResponse<SupplierProfile>> => {
    return await apiClient.get<SupplierProfile>('/profile/supplier');
  },

  /**
   * Update supplier profile
   */
  updateSupplierProfile: async (data: {
    phone?: string;
    website?: string;
    description?: string;
    main_production_location?: string;
    return_policy?: string;
    payment_method?: string;
    logo?: File;
  }): Promise<ApiResponse<SupplierProfile>> => {
    const formData = new FormData();

    if (data.phone !== undefined) {
      formData.append('phone', data.phone);
    }
    if (data.website !== undefined) {
      formData.append('website', data.website);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.main_production_location !== undefined) {
      formData.append('main_production_location', data.main_production_location);
    }
    if (data.return_policy !== undefined) {
      formData.append('return_policy', data.return_policy);
    }
    if (data.payment_method !== undefined) {
      formData.append('payment_method', data.payment_method);
    }
    if (data.logo) {
      formData.append('logo', data.logo);
    }

    return await apiClient.patch<SupplierProfile>('/profile/supplier', formData);
  },
};

export default profileService;
