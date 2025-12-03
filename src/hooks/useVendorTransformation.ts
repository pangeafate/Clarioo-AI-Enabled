/**
 * useVendorTransformation Hook
 *
 * Shared hook for transforming workflow vendor data to ComparisonVendor format
 * Used by both VendorComparison.tsx (old) and VendorComparisonNew.tsx (new)
 *
 * Handles:
 * - Converting workflow vendors to ComparisonVendor format
 * - Match percentage calculation from scores
 * - Logo URL generation
 * - Color assignment from palette
 * - Sorting by match percentage when all comparisons complete
 */

import { useMemo } from 'react';
import { ComparisonVendor, VENDOR_COLOR_PALETTE } from '../types/comparison.types';
import { VendorComparisonState } from '../types/vendorComparison.types';
import { calculateMatchPercentage } from '../utils/vendorComparison';

// Vendor and Criteria types from VendorDiscovery
export interface WorkflowVendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, 'yes' | 'no' | 'unknown' | 'star'>;
  criteriaAnswers: Record<string, { yesNo: 'yes' | 'no' | 'partial'; comment: string; }>;
  features: string[];
}

export interface WorkflowCriteria {
  id: string;
  name: string;
  explanation: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
  isArchived?: boolean;
}

/**
 * Hook for transforming workflow vendors to ComparisonVendor format
 *
 * @param workflowVendors - Vendors from VendorDiscovery workflow
 * @param workflowCriteria - Criteria from VendorDiscovery workflow
 * @param vendorComparisonStates - Comparison states for each vendor (old system)
 * @param allComparisonsComplete - Whether all comparisons are complete (for sorting)
 * @returns Array of ComparisonVendor objects, sorted by match percentage if complete
 */
export const useVendorTransformation = (
  workflowVendors?: WorkflowVendor[],
  workflowCriteria?: WorkflowCriteria[],
  vendorComparisonStates?: Record<string, VendorComparisonState>,
  allComparisonsComplete: boolean = false
): ComparisonVendor[] => {
  return useMemo(() => {
    if (!workflowVendors) return [];

    // Get criteria for match percentage calculation
    const criteriaForCalc = workflowCriteria
      ? workflowCriteria.filter(c => !c.isArchived).map(c => ({
          id: c.id,
          importance: c.importance,
          type: c.type || 'other'
        }))
      : [];

    let vendors = workflowVendors.map((v, index) => {
      const comparisonState = vendorComparisonStates?.[v.id];
      const comparedData = comparisonState?.comparedData;

      // If we have compared data from old system, use it
      if (comparedData) {
        // Calculate match percentage client-side from scores
        const calculatedMatchPercentage = calculateMatchPercentage(
          comparedData.scores,
          criteriaForCalc,
          v.name // Pass vendor name for debugging
        );

        console.log('[useVendorTransformation] Using compared data for', v.name, ':', {
          killerFeature: comparedData.killerFeature,
          executiveSummary: comparedData.executiveSummary,
          keyFeaturesCount: comparedData.keyFeatures?.length
        });

        return {
          id: v.id,
          name: comparedData.name,
          logo: `https://logo.clearbit.com/${comparedData.website.replace(/^https?:\/\//, '')}`,
          website: comparedData.website,
          killerFeature: comparedData.killerFeature,
          executiveSummary: comparedData.executiveSummary,
          keyFeatures: comparedData.keyFeatures,
          matchPercentage: calculatedMatchPercentage,
          scores: new Map(Object.entries(comparedData.scores)),
          scoreDetails: comparedData.scoreDetails,
          color: VENDOR_COLOR_PALETTE[index % VENDOR_COLOR_PALETTE.length],
          // Additional state info for UI
          comparisonStatus: comparisonState.status,
        };
      }

      // Use basic vendor info (pending/loading/failed state)
      const scores = v.criteriaScores || {};
      return {
        id: v.id,
        name: v.name,
        logo: `https://logo.clearbit.com/${v.website.replace(/^https?:\/\//, '')}`,
        website: v.website,
        killerFeature: v.description || '',
        executiveSummary: v.description || '',
        keyFeatures: v.features || [],
        matchPercentage: -1, // -1 indicates no data yet, display as "--"
        scores: new Map(Object.entries(scores)),
        color: VENDOR_COLOR_PALETTE[index % VENDOR_COLOR_PALETTE.length],
        // Additional state info for UI
        comparisonStatus: comparisonState?.status || 'pending',
        comparisonError: comparisonState?.error,
        comparisonErrorCode: comparisonState?.errorCode,
      };
    });

    // Sort by matchPercentage after all comparisons complete
    if (allComparisonsComplete) {
      vendors = [...vendors].sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    return vendors;
  }, [workflowVendors, vendorComparisonStates, allComparisonsComplete, workflowCriteria]);
};

/**
 * Hook for transforming workflow criteria to Criterion format
 * Filters out archived criteria
 *
 * @param workflowCriteria - Criteria from VendorDiscovery workflow
 * @returns Array of formatted Criterion objects
 */
export const useCriteriaTransformation = (
  workflowCriteria?: WorkflowCriteria[]
) => {
  return useMemo(() => {
    if (!workflowCriteria) return [];

    // Filter out archived criteria
    return workflowCriteria
      .filter(c => !c.isArchived)
      .map(c => ({
        id: c.id,
        name: c.name,
        description: c.explanation || '',
        importance: c.importance,
        type: c.type || 'other',
      }));
  }, [workflowCriteria]);
};
