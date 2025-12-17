/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls:
 * - Registration
 * - Login
 * - Logout
 * - Token refresh
 * - Get current user
 */

import { apiClient, tokenManager, ApiResponse } from '../api-client';
import type {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  RefreshResponse,
  MessageResponse,
} from '../api-types';

export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, {
      skipAuth: true,
    });

    if (response.data) {
      tokenManager.setTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });
    }

    return response;
  },

  /**
   * Login with email/username and password
   */
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, {
      skipAuth: true,
    });

    if (response.data) {
      tokenManager.setTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });
    }

    return response;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<ApiResponse<MessageResponse>> => {
    const refreshToken = tokenManager.getRefreshToken();
    
    // Clear tokens first (ensures user is logged out even if API call fails)
    tokenManager.clearTokens();

    if (refreshToken) {
      return await apiClient.post<MessageResponse>(
        '/auth/logout',
        { refresh: refreshToken },
        { skipAuth: true }
      );
    }

    return { data: { message: 'Logged out' }, status: 200 };
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return await apiClient.get<User>('/auth/me');
  },

  /**
   * Refresh the access token
   */
  refreshToken: async (): Promise<ApiResponse<RefreshResponse>> => {
    const refreshToken = tokenManager.getRefreshToken();
    
    if (!refreshToken) {
      return {
        error: { detail: 'No refresh token available' },
        status: 401,
      };
    }

    const response = await apiClient.post<RefreshResponse>(
      '/auth/refresh',
      { refresh: refreshToken },
      { skipAuth: true }
    );

    if (response.data) {
      tokenManager.setAccessToken(response.data.access);
    } else {
      // Refresh failed, clear all tokens
      tokenManager.clearTokens();
    }

    return response;
  },

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated: (): boolean => {
    return tokenManager.hasTokens();
  },

  /**
   * Clear authentication state
   */
  clearAuth: (): void => {
    tokenManager.clearTokens();
  },
};

export default authService;
