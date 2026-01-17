/**
 * Image Processing Utilities
 * Sprint: SP_027 - Excel & JSON Export Feature
 *
 * Utilities for processing vendor logos, circular cropping, and compression
 */

import type { ImageProcessingOptions } from '@/types/export.types';
import { generateInitials } from './exportHelpers';

/**
 * Load image from URL and return as HTMLImageElement
 *
 * @param url - Image URL
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to loaded image
 */
export async function loadImage(url: string, timeout: number = 5000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for external images

    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout: ${url}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 *
 * @param img - Source image
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @returns Resized dimensions { width, height }
 */
export function calculateResizedDimensions(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = img;

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Resize to fit within max dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress and optionally crop image to circular shape
 *
 * @param img - Source image
 * @param options - Processing options
 * @returns Promise resolving to compressed image as base64 data URL
 */
export async function processImage(
  img: HTMLImageElement,
  options: Partial<ImageProcessingOptions> = {}
): Promise<string> {
  const {
    maxWidth = 1000,
    maxHeight = 1600,
    quality = 0.85,
    outputFormat = 'jpeg',
    circular = false,
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate resized dimensions
  const { width, height } = calculateResizedDimensions(img, maxWidth, maxHeight);

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  if (circular) {
    // Create circular clip path
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  if (circular) {
    ctx.restore();
  }

  // Convert to data URL with compression
  const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Process vendor logo: fetch, resize, crop to circle, compress
 *
 * @param logoUrl - Logo URL
 * @param size - Target size in pixels (will be circular, default: 40)
 * @returns Promise resolving to processed logo as base64 data URL
 */
export async function processVendorLogo(
  logoUrl: string,
  size: number = 40
): Promise<string> {
  try {
    // Load image
    const img = await loadImage(logoUrl);

    // Process with circular crop
    const processedImage = await processImage(img, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.85,
      outputFormat: 'png', // PNG for transparent background
      circular: true,
    });

    return processedImage;
  } catch (error) {
    console.error(`Failed to process logo ${logoUrl}:`, error);
    throw error;
  }
}

/**
 * Generate initials badge as SVG data URL (fallback for missing logos)
 *
 * @param name - Vendor name
 * @param size - Badge size in pixels (default: 40)
 * @param backgroundColor - Background color (default: '#0066FF')
 * @param textColor - Text color (default: '#FFFFFF')
 * @returns SVG data URL
 *
 * @example
 * generateInitialsBadge('Tulip', 40) // Returns SVG with "TU"
 */
export function generateInitialsBadge(
  name: string,
  size: number = 40,
  backgroundColor: string = '#0066FF',
  textColor: string = '#FFFFFF'
): string {
  const initials = generateInitials(name);
  const fontSize = Math.round(size * 0.4); // 40% of badge size

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${backgroundColor}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
        fill="${textColor}"
      >${initials}</text>
    </svg>
  `;

  // Convert SVG to data URL
  const encoded = btoa(svg);
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Fetch and process vendor logo with fallback to initials badge
 *
 * @param vendorName - Vendor name (for initials fallback)
 * @param logoUrl - Optional logo URL
 * @param size - Target size in pixels (default: 40)
 * @returns Promise resolving to processed logo or initials badge as data URL
 */
export async function getVendorLogoOrFallback(
  vendorName: string,
  logoUrl?: string,
  size: number = 40
): Promise<string> {
  // If no logo URL, return initials badge immediately
  if (!logoUrl) {
    return generateInitialsBadge(vendorName, size);
  }

  try {
    // Try to fetch and process logo
    return await processVendorLogo(logoUrl, size);
  } catch (error) {
    // Fallback to initials badge on error
    console.warn(`Logo failed for ${vendorName}, using initials badge`);
    return generateInitialsBadge(vendorName, size);
  }
}

/**
 * Process multiple vendor logos in parallel
 *
 * @param vendors - Array of vendors with name and optional logo URL
 * @param size - Target size in pixels (default: 40)
 * @returns Promise resolving to map of vendor ID to processed logo data URL
 */
export async function processVendorLogos(
  vendors: Array<{ id: string; name: string; logo?: string }>,
  size: number = 40
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process all logos in parallel
  const promises = vendors.map(async (vendor) => {
    const logoDataUrl = await getVendorLogoOrFallback(vendor.name, vendor.logo, size);
    results.set(vendor.id, logoDataUrl);
  });

  await Promise.all(promises);

  return results;
}

/**
 * Convert data URL to base64 string (without prefix)
 *
 * @param dataUrl - Data URL (e.g., 'data:image/png;base64,iVBORw0...')
 * @returns Base64 string without prefix
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return match[1];
}

/**
 * Convert data URL to Blob
 *
 * @param dataUrl - Data URL
 * @returns Blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return await response.blob();
}

/**
 * Get image dimensions from data URL
 *
 * @param dataUrl - Data URL
 * @returns Promise resolving to dimensions { width, height }
 */
export async function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image from data URL'));
    };

    img.src = dataUrl;
  });
}

/**
 * Check if URL is a valid image URL
 *
 * @param url - URL to check
 * @returns True if URL appears to be an image
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;

  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
  if (imageExtensions.test(url)) {
    return true;
  }

  // Check for data URLs
  if (url.startsWith('data:image/')) {
    return true;
  }

  return false;
}
