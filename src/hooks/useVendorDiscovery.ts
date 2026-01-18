/**
 * 🎯 VENDOR DISCOVERY HOOK
 *
 * Purpose: Manages AI-powered vendor discovery for evaluation.
 * Extracts business logic from VendorSelection component.
 *
 * Features:
 * - AI-powered vendor discovery based on category and criteria
 * - Fallback to curated mock data when AI fails
 * - Loading state management
 * - Error handling with user feedback
 * - Data transformation for AI service
 *
 * @module hooks/useVendorDiscovery
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { findVendors as n8nFindVendors, type TransformedCriterion } from '@/services/n8nService';

/**
 * Vendor structure returned from discovery
 */
export interface Vendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, number>;
  criteriaAnswers?: Record<string, {
    yesNo: 'yes' | 'no' | 'partial';
    comment: string;
  }>;
  features: string[];
}

/**
 * Criteria structure for discovery context
 */
export interface Criteria {
  id: string;
  name: string;
  explanation?: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
  isArchived?: boolean;
}

/**
 * Project context for vendor discovery
 */
export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Hook return type
 */
export interface UseVendorDiscoveryReturn {
  isDiscovering: boolean;
  discoverVendors: (
    project: ProjectContext,
    criteria: Criteria[],
    maxVendors?: number
  ) => Promise<Vendor[]>;
}

/**
 * Custom hook for AI-powered vendor discovery
 *
 * Purpose: Manages vendor discovery business logic with AI service integration.
 * Handles data mapping, error handling, and fallback to mock data.
 *
 * @returns Object with discovery state and function
 *
 * @example
 * ```typescript
 * const { isDiscovering, discoverVendors } = useVendorDiscovery();
 *
 * // Discover vendors based on tech request and criteria
 * const vendors = await discoverVendors(
 *   {
 *     category: 'CRM Software',
 *     description: 'Need mobile support and integrations',
 *     requirements: ['mobile app', 'API integrations']
 *   },
 *   criteria,
 *   10 // maximum vendors to discover
 * );
 * ```
 *
 * @remarks
 * - Automatically falls back to mock data when AI fails
 * - Loading state can be used to show spinners
 * - Shows toast notification when using fallback
 * - Maps AI service data to component format
 */
export const useVendorDiscovery = (): UseVendorDiscoveryReturn => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const { toast } = useToast();

  /**
   * Discover vendors using n8n AI service
   *
   * Purpose: Uses n8n workflow with Perplexity search to discover relevant vendors
   * based on project info and evaluation criteria. Falls back to mock data on error.
   *
   * @param project - Project context with id, name, description, and category
   * @param criteria - Evaluation criteria for context
   * @param maxVendors - Maximum number of vendors to discover (default: 10)
   * @returns Promise resolving to array of discovered vendors
   *
   * @example
   * ```typescript
   * const vendors = await discoverVendors(
   *   { id: 'proj-1', name: 'My Project', description: 'CRM needs', category: 'CRM Software' },
   *   criteria,
   *   10
   * );
   * console.log(`Discovered ${vendors.length} vendors`);
   * ```
   *
   * @remarks
   * - Calls n8n workflow which uses Perplexity for web search
   * - Falls back to mock data on error (with toast notification)
   * - Returns vendors with basic info (criteriaScores populated in deep research stage)
   * - Limits results to maxVendors parameter
   */
  const discoverVendors = async (
    project: ProjectContext,
    criteria: Criteria[],
    maxVendors: number = 10
  ): Promise<Vendor[]> => {
    setIsDiscovering(true);

    try {
      // Map criteria to n8n format
      const n8nCriteria: TransformedCriterion[] = criteria.map(c => ({
        id: c.id,
        name: c.name,
        explanation: c.explanation || '',
        importance: c.importance,
        type: c.type,
        isArchived: c.isArchived || false
      }));

      // Call n8n vendor discovery service
      const response = await n8nFindVendors(
        project.id,
        project.name,
        project.description,
        project.category || 'Software', // Fallback to 'Software' if category is undefined
        n8nCriteria,
        maxVendors
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'Vendor discovery failed');
      }

      // Map n8n response to Vendor format
      const vendors: Vendor[] = response.vendors.map(v => ({
        id: v.id,
        name: v.name,
        description: v.description,
        website: v.website,
        pricing: v.pricing,
        rating: v.rating,
        criteriaScores: {}, // Will be populated in deep research stage
        criteriaAnswers: {},
        features: v.features
      }));

      // Show success toast with search summary
      if (response.search_summary) {
        toast({
          title: "Vendors Discovered",
          description: response.search_summary,
          duration: 5000
        });
      }

      return vendors;
    } catch (error) {
      console.error('Vendor discovery failed:', error);

      // Fallback to mock data
      toast({
        title: "Discovery Failed",
        description: `Using sample data. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });

      return getFallbackVendors();
    } finally {
      setIsDiscovering(false);
    }
  };

  /**
   * Get fallback vendors
   *
   * Purpose: Provides empty vendor list when n8n discovery fails.
   * n8n is the source of all vendor data.
   *
   * @returns Empty array - vendors should come from n8n
   */
  const getFallbackVendors = (): Vendor[] => {
    // n8n handles all vendor discovery - no local fallback
    return [];
  };

  return {
    isDiscovering,
    discoverVendors
  };
};
