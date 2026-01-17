/**
 * Screenshot Capture Utilities
 * Sprint: SP_027 - Excel & JSON Export Feature
 *
 * Utilities for capturing DOM elements as images using html2canvas
 */

import html2canvas from 'html2canvas';
import type { ScreenshotOptions } from '@/types/export.types';

/**
 * Capture a DOM element as a data URL
 *
 * @param options - Screenshot options
 * @returns Promise resolving to image data URL
 *
 * @example
 * const dataUrl = await captureScreenshot({
 *   elementId: 'scatter-plot-chart',
 *   width: 600,
 *   height: 400,
 *   scale: 2
 * });
 */
export async function captureScreenshot(
  options: ScreenshotOptions
): Promise<string> {
  const {
    elementId,
    element,
    width = 600,
    height = 400,
    scale = 2,
    backgroundColor = '#FFFFFF',
  } = options;

  // Get target element
  let targetElement: HTMLElement | null = null;

  if (element) {
    targetElement = element;
  } else if (elementId) {
    targetElement = document.getElementById(elementId);
  }

  if (!targetElement) {
    throw new Error('Target element not found for screenshot');
  }

  try {
    // Get element's actual dimensions if not specified
    const rect = targetElement.getBoundingClientRect();
    const captureWidth = width || Math.ceil(rect.width);
    const captureHeight = height || Math.ceil(rect.height);

    // Capture element with html2canvas
    // Note: We don't set width/height constraints to let html2canvas capture the full element
    const canvas = await html2canvas(targetElement, {
      backgroundColor,
      scale,
      useCORS: true, // Enable CORS for external images
      allowTaint: false,
      logging: false,
      // Don't constrain window size - capture full element
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
    });

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    return dataUrl;
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw new Error(`Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture scatter plot screenshot using element's actual dimensions
 * - Scale: 2x for retina displays
 * - Automatically detects element dimensions (no cropping)
 *
 * @param elementId - ID of scatter plot container element
 * @returns Promise resolving to image data URL
 */
export async function captureScatterPlot(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element ${elementId} not found for screenshot`);
  }

  // Get actual element dimensions for logging
  const rect = element.getBoundingClientRect();
  console.log(`[Screenshot] Capturing scatter plot: ${Math.ceil(rect.width)}x${Math.ceil(rect.height)}px`);

  // Capture without dimension constraints - let html2canvas size to element
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#FFFFFF',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
    });

    // Convert to data URL
    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Scatter plot screenshot capture failed:', error);
    throw new Error(`Failed to capture scatter plot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture element and return as Blob
 *
 * @param options - Screenshot options
 * @returns Promise resolving to image Blob
 */
export async function captureScreenshotAsBlob(
  options: ScreenshotOptions
): Promise<Blob> {
  const dataUrl = await captureScreenshot(options);

  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  return await response.blob();
}

/**
 * Wait for element to be ready before capturing
 * Useful for capturing charts that need time to render
 *
 * @param elementId - Element ID
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 * @param checkInterval - Check interval in milliseconds (default: 100)
 * @returns Promise resolving to element when ready
 */
export async function waitForElement(
  elementId: string,
  timeout: number = 5000,
  checkInterval: number = 100
): Promise<HTMLElement> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const element = document.getElementById(elementId);

      if (element) {
        // Check if element has rendered content
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          resolve(element);
          return;
        }
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${elementId} not ready after ${timeout}ms`));
        return;
      }

      // Continue checking
      setTimeout(check, checkInterval);
    };

    check();
  });
}

/**
 * Capture scatter plot with automatic waiting for render
 *
 * @param elementId - Scatter plot container ID
 * @param waitTimeout - Maximum wait time for element (default: 5000ms)
 * @returns Promise resolving to image data URL
 */
export async function captureScatterPlotWhenReady(
  elementId: string,
  waitTimeout: number = 5000
): Promise<string> {
  // Wait for element to be ready
  await waitForElement(elementId, waitTimeout);

  // Small additional delay to ensure complete render
  await new Promise(resolve => setTimeout(resolve, 200));

  // Capture screenshot
  return captureScatterPlot(elementId);
}

/**
 * Extract base64 string from data URL
 *
 * @param dataUrl - Data URL
 * @returns Base64 string without data URL prefix
 */
export function extractBase64(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return match[1];
}

/**
 * Check if an element exists and is visible
 *
 * @param elementId - Element ID to check
 * @returns True if element exists and is visible
 */
export function isElementVisible(elementId: string): boolean {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
