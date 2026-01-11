/**
 * useVendorScatterplot Hook
 * Sprint: SP_026
 *
 * Hook for managing vendor positioning scatter plot data:
 * - Loads cached positions if valid
 * - Calls n8n workflow to generate positions
 * - Handles auto-retry (2 attempts) on failure
 * - Manages loading and error states
 *
 * @module hooks/useVendorScatterplot
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateVendorScatterplot,
  getVendorScatterplotFromStorage,
} from '@/services/n8nService';
import type {
  VendorScatterplotPosition,
  VendorScatterplotResponse,
} from '@/types/vendorScatterplot.types';
import type { Vendor } from '@/types';

interface UseVendorScatterplotOptions {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectCategory: string;
  vendors: Vendor[];
  enabled?: boolean; // Whether to automatically fetch on mount (default: true)
}

interface UseVendorScatterplotReturn {
  positions: VendorScatterplotPosition[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const MAX_RETRY_ATTEMPTS = 2;

export function useVendorScatterplot({
  projectId,
  projectName,
  projectDescription,
  projectCategory,
  vendors,
  enabled = true,
}: UseVendorScatterplotOptions): UseVendorScatterplotReturn {
  const [positions, setPositions] = useState<VendorScatterplotPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Ref to track if we're currently fetching (prevents duplicate requests)
  const isFetchingRef = useRef(false);

  // Ref to track previous vendor IDs (detect vendor list changes)
  const prevVendorIdsRef = useRef<string>('');

  /**
   * Fetch vendor positions from cache or n8n
   */
  const fetchPositions = useCallback(async () => {
    if (isFetchingRef.current || !enabled || vendors.length === 0) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    console.log('[useVendorScatterplot] Fetching positions for project:', projectId);
    console.log('[useVendorScatterplot] Vendor count:', vendors.length);
    console.log('[useVendorScatterplot] Retry count:', retryCount);

    try {
      const vendorIds = vendors.map(v => v.id);

      // Check cache first
      const cached = getVendorScatterplotFromStorage(projectId, vendorIds);
      if (cached && cached.positions.length === vendors.length) {
        console.log('[useVendorScatterplot] Using cached positions');
        setPositions(cached.positions);
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      console.log('[useVendorScatterplot] No valid cache, calling n8n...');

      // Call n8n to generate positions
      const response: VendorScatterplotResponse = await generateVendorScatterplot(
        projectId,
        projectName,
        projectDescription,
        projectCategory,
        vendors.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description,
          website: v.website,
        }))
      );

      if (response.success && response.positionings) {
        console.log('[useVendorScatterplot] Positions generated successfully');
        setPositions(response.positionings);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(response.error?.message || 'Failed to generate positions');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('[useVendorScatterplot] Error fetching positions:', err);

      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

      // Auto-retry if we haven't exceeded max attempts
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(`[useVendorScatterplot] Auto-retrying (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`);
        setRetryCount(prev => prev + 1);
        isFetchingRef.current = false;
        // Retry after 2 seconds
        setTimeout(() => {
          fetchPositions();
        }, 2000);
        return;
      }

      // Max retries exceeded
      setError(errorMessage);
      setIsLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [projectId, projectName, projectDescription, projectCategory, vendors, enabled, retryCount]);

  /**
   * Manual retry function (resets retry count)
   */
  const retry = useCallback(() => {
    console.log('[useVendorScatterplot] Manual retry triggered');
    setRetryCount(0);
    setError(null);
    fetchPositions();
  }, [fetchPositions]);

  // Fetch positions on mount and when dependencies change
  useEffect(() => {
    // Generate vendor IDs string for comparison
    const currentVendorIds = vendors.map(v => v.id).sort().join(',');

    // Only fetch if vendor list actually changed (not just re-render)
    if (prevVendorIdsRef.current !== currentVendorIds) {
      console.log('[useVendorScatterplot] Vendor list changed, fetching new positions');
      prevVendorIdsRef.current = currentVendorIds;
      setRetryCount(0); // Reset retry count when vendors change
      fetchPositions();
    }
  }, [vendors, fetchPositions]);

  return {
    positions,
    isLoading,
    error,
    retry,
  };
}
