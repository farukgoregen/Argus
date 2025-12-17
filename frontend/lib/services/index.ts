/**
 * Services Index
 * 
 * Central export point for all API services
 */

export { authService } from './auth-service';
export { profileService } from './profile-service';
export { productService } from './product-service';
export { publicProductService } from './public-product-service';
export { homeFeedService } from './home-feed-service';
export { aiChatService, aiService } from './ai-chat-service';
export { watchlistService } from './watchlist-service';
export { chatService } from './chat-service';
export { marketService } from './market-service';

// Re-export types
export type * from '../api-types';
