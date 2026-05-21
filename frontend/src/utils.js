// Base URL for backend API/assets.
// Defaults to same-origin so frontend+backend can run from a single URL.
// Set VITE_API_URL only when the API is hosted on a different origin.
export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Build the correct absolute URL for an image path.
 * Handles /uploads/ paths that are served by the backend, not the React dev server.
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
}
