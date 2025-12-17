/**
 * AI Service
 * 
 * Handles all AI-related API calls:
 * - Dashboard AI chat (authenticated)
 * - Vision keywords extraction (public)
 * - Public assistant (public)
 * - Search summary (public)
 */

import { apiClient, ApiResponse } from '../api-client';
import type { 
  AIChatRequest, 
  AIChatResponse,
  VisionKeywordsResponse,
  AssistantRequest,
  AssistantResponse,
  SearchSummaryRequest,
  SearchSummaryResponse,
} from '../api-types';

export const aiChatService = {
  /**
   * Send a message to the AI chat assistant (authenticated, dashboard context)
   */
  sendMessage: async (data: AIChatRequest): Promise<ApiResponse<AIChatResponse>> => {
    return await apiClient.post<AIChatResponse>('/ai/chat', data);
  },
};

export const aiService = {
  /**
   * Extract keywords from an image using Gemini Vision
   * @param file - Image file to analyze
   * @returns Keywords extracted from the image
   */
  extractKeywords: async (file: File): Promise<ApiResponse<VisionKeywordsResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return await apiClient.upload<VisionKeywordsResponse>('/ai/vision-keywords', formData);
  },
  
  /**
   * Send a message to the public AI assistant
   * Works for both authenticated and unauthenticated users
   */
  askAssistant: async (data: AssistantRequest): Promise<ApiResponse<AssistantResponse>> => {
    return await apiClient.post<AssistantResponse>('/ai/assistant', data);
  },
  
  /**
   * Generate AI-powered search summary
   * @param data - Query and search results
   * @returns AI-generated summary with best deal, avg price, etc.
   */
  getSearchSummary: async (data: SearchSummaryRequest): Promise<ApiResponse<SearchSummaryResponse>> => {
    return await apiClient.post<SearchSummaryResponse>('/ai/search-summary', data);
  },
};

export default aiService;
