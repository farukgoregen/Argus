/**
 * Product Service
 * 
 * Handles all product-related API calls for suppliers:
 * - CRUD operations
 * - Stock management
 * - Price management
 * - Bulk operations
 * - Photo management
 */

import { apiClient, ApiResponse } from '../api-client';
import type {
  Product,
  PaginatedProductList,
  ProductFilters,
  ProductCreateRequest,
  ProductUpdateRequest,
  BulkUpdateResponse,
  MessageResponse,
} from '../api-types';

// Build query string from filters
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

export const productService = {
  /**
   * List products with filters and pagination (supplier view)
   */
  listProducts: async (
    filters: ProductFilters = {}
  ): Promise<ApiResponse<PaginatedProductList>> => {
    const query = buildQueryString(filters as unknown as Record<string, unknown>);
    return await apiClient.get<PaginatedProductList>(`/products${query}`);
  },

  /**
   * Get a single product by ID
   */
  getProduct: async (productId: string): Promise<ApiResponse<Product>> => {
    return await apiClient.get<Product>(`/products/${productId}`);
  },

  /**
   * Create a new product
   */
  createProduct: async (
    data: ProductCreateRequest,
    photos?: File[]
  ): Promise<ApiResponse<Product>> => {
    const formData = new FormData();

    // Add product data
    formData.append('product_name', data.product_name);
    formData.append('product_category', data.product_category);
    formData.append('unit_price', String(data.unit_price));

    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.stock_quantity !== undefined) {
      formData.append('stock_quantity', String(data.stock_quantity));
    }
    if (data.sell_quantity !== undefined) {
      formData.append('sell_quantity', String(data.sell_quantity));
    }
    if (data.features) {
      formData.append('features', JSON.stringify(data.features));
    }
    if (data.is_active !== undefined) {
      formData.append('is_active', String(data.is_active));
    }

    // Add photos
    if (photos) {
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });
    }

    return await apiClient.post<Product>('/products', formData);
  },

  /**
   * Update a product
   */
  updateProduct: async (
    productId: string,
    data: ProductUpdateRequest,
    newPhotos?: File[]
  ): Promise<ApiResponse<Product>> => {
    const formData = new FormData();

    // Add product data
    if (data.product_name !== undefined) {
      formData.append('product_name', data.product_name);
    }
    if (data.product_category !== undefined) {
      formData.append('product_category', data.product_category);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.unit_price !== undefined) {
      formData.append('unit_price', String(data.unit_price));
    }
    if (data.stock_quantity !== undefined) {
      formData.append('stock_quantity', String(data.stock_quantity));
    }
    if (data.sell_quantity !== undefined) {
      formData.append('sell_quantity', String(data.sell_quantity));
    }
    if (data.features !== undefined) {
      formData.append('features', JSON.stringify(data.features));
    }
    if (data.is_active !== undefined) {
      formData.append('is_active', String(data.is_active));
    }
    if (data.photos_to_delete) {
      formData.append('photos_to_delete', JSON.stringify(data.photos_to_delete));
    }
    if (data.photos_to_update) {
      formData.append('photos_to_update', JSON.stringify(data.photos_to_update));
    }

    // Add new photos
    if (newPhotos) {
      newPhotos.forEach((photo) => {
        formData.append('new_photos', photo);
      });
    }

    return await apiClient.patch<Product>(`/products/${productId}`, formData);
  },

  /**
   * Delete a product (soft delete)
   */
  deleteProduct: async (productId: string): Promise<ApiResponse<MessageResponse>> => {
    return await apiClient.delete<MessageResponse>(`/products/${productId}`);
  },

  /**
   * Activate a product
   */
  activateProduct: async (productId: string): Promise<ApiResponse<Product>> => {
    return await apiClient.post<Product>(`/products/${productId}/activate`);
  },

  /**
   * Deactivate a product
   */
  deactivateProduct: async (productId: string): Promise<ApiResponse<Product>> => {
    return await apiClient.post<Product>(`/products/${productId}/deactivate`);
  },

  /**
   * Update product price
   */
  updatePrice: async (
    productId: string,
    unitPrice: number
  ): Promise<ApiResponse<Product>> => {
    return await apiClient.patch<Product>(`/products/${productId}/price`, {
      unit_price: unitPrice,
    });
  },

  /**
   * Update product stock
   */
  updateStock: async (
    productId: string,
    stockQuantity: number
  ): Promise<ApiResponse<Product>> => {
    return await apiClient.patch<Product>(`/products/${productId}/stock`, {
      stock_quantity: stockQuantity,
    });
  },

  /**
   * Get products with critical stock levels
   */
  getCriticalStock: async (
    threshold?: number
  ): Promise<ApiResponse<Product[]>> => {
    const query = threshold ? `?threshold=${threshold}` : '';
    return await apiClient.get<Product[]>(`/products/critical-stock${query}`);
  },

  /**
   * Bulk update prices
   */
  bulkUpdatePrices: async (
    items: Array<{ id: string; unit_price: number }>
  ): Promise<ApiResponse<BulkUpdateResponse>> => {
    return await apiClient.patch<BulkUpdateResponse>('/products/bulk/price', {
      items,
    });
  },

  /**
   * Bulk update stock
   */
  bulkUpdateStock: async (
    items: Array<{ id: string; stock_quantity: number }>
  ): Promise<ApiResponse<BulkUpdateResponse>> => {
    return await apiClient.patch<BulkUpdateResponse>('/products/bulk/stock', {
      items,
    });
  },

  /**
   * Add a photo to a product
   */
  addPhoto: async (
    productId: string,
    photo: File,
    sortOrder?: number
  ): Promise<ApiResponse<Product>> => {
    const formData = new FormData();
    formData.append('photo', photo);
    if (sortOrder !== undefined) {
      formData.append('sort_order', String(sortOrder));
    }

    return await apiClient.post<Product>(`/products/${productId}/photos`, formData);
  },

  /**
   * Delete a photo from a product
   */
  deletePhoto: async (
    productId: string,
    photoId: string
  ): Promise<ApiResponse<MessageResponse>> => {
    return await apiClient.delete<MessageResponse>(
      `/products/${productId}/photos/${photoId}`
    );
  },
};

export default productService;
