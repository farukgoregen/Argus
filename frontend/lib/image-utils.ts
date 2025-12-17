/**
 * Image Utilities
 * 
 * Client-side image validation and preview utilities.
 * Note: WebP conversion is handled server-side by the backend.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate image file before upload
 * 
 * @param file - The file to validate
 * @param maxSize - Maximum file size in bytes (default 5MB)
 * @returns Error message string if invalid, null if valid
 */
export function validateImageFile(file: File, maxSize: number = MAX_FILE_SIZE): string | null {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!supportedTypes.includes(file.type)) {
    return `Unsupported format: ${file.type}. Please use JPEG, PNG, GIF, or WebP.`;
  }
  
  if (file.size > maxSize) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
  }
  
  return null;
}

/**
 * Create a preview URL for an image file
 * 
 * @param file - The image file to preview
 * @returns Object URL for the image
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 * 
 * @param url - The object URL to revoke
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
