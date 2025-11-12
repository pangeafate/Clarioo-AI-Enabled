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
import * as aiService from '@/services/mock/aiService';
import { useToast } from '@/hooks/use-toast';

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
  importance: 'low' | 'medium' | 'high';
  type: string;
}

/**
 * Tech request context for discovery
 */
export interface TechRequest {
  category: string;
  description?: string;
  requirements?: string[];
}

/**
 * Hook return type
 */
export interface UseVendorDiscoveryReturn {
  isDiscovering: boolean;
  discoverVendors: (
    techRequest: TechRequest,
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
   * Discover vendors using AI service
   *
   * Purpose: Uses AI to discover relevant vendors based on category,
   * requirements, and evaluation criteria. Falls back to mock data on error.
   *
   * @param techRequest - Tech request with category and requirements
   * @param criteria - Evaluation criteria for context
   * @param maxVendors - Maximum number of vendors to discover (default: 10)
   * @returns Promise resolving to array of discovered vendors
   *
   * @example
   * ```typescript
   * const vendors = await discoverVendors(
   *   { category: 'CRM Software', requirements: ['mobile app'] },
   *   criteria,
   *   15
   * );
   * console.log(`Discovered ${vendors.length} vendors`);
   * ```
   *
   * @remarks
   * - Maps criteria to AI service format for better discovery
   * - Extracts requirements from description if not provided
   * - Falls back to mock data silently on error (with toast)
   * - Returns vendors with basic info (detailed scores added later)
   * - Limits results to maxVendors parameter
   */
  const discoverVendors = async (
    techRequest: TechRequest,
    criteria: Criteria[],
    maxVendors: number = 10
  ): Promise<Vendor[]> => {
    setIsDiscovering(true);

    try {
      // Map criteria to aiService format for context
      const mappedCriteria: aiService.Criterion[] = criteria.map(c => ({
        id: c.id,
        name: c.name,
        importance: c.importance,
        type: c.type
      }));

      // Extract requirements from description or use provided array
      const requirements = techRequest.requirements || [];
      if (!requirements.length && techRequest.description) {
        // Simple keyword extraction from description
        const keywords = techRequest.description.toLowerCase().split(/[\s,]+/);
        requirements.push(...keywords.filter(k => k.length > 3));
      }

      // Call AI service to discover vendors
      const { data: discoveredVendors, error } = await aiService.selectVendors(
        techRequest.category,
        mappedCriteria,
        maxVendors
      );

      if (error || !discoveredVendors || discoveredVendors.length === 0) {
        throw new Error(error?.message || 'No vendors discovered');
      }

      // Map AI service vendors to component format
      const vendors: Vendor[] = discoveredVendors.map(v => ({
        id: v.id,
        name: v.name,
        description: v.description,
        website: v.website,
        pricing: v.pricing || 'Contact for pricing',
        rating: v.match_score / 20, // Convert 0-100 to 0-5
        criteriaScores: {}, // Will be filled by comparison generation
        criteriaAnswers: {},
        features: v.pros || [] // Use pros as features initially
      }));

      return vendors;
    } catch (error) {
      console.error('Vendor discovery failed:', error);

      // Fallback to mock vendors from data file
      const fallbackVendors = await getFallbackVendors(techRequest.category);

      toast({
        title: "Using Curated Data",
        description: `AI discovery failed. Using curated ${techRequest.category} vendors instead.`,
        variant: "default"
      });

      return fallbackVendors.slice(0, maxVendors);
    } finally {
      setIsDiscovering(false);
    }
  };

  /**
   * Get fallback vendors from mock data
   *
   * Purpose: Provides curated vendor list when AI discovery fails.
   * Uses category-specific mock data.
   *
   * @param category - Software category
   * @returns Promise resolving to array of fallback vendors
   *
   * @remarks
   * - In prototype mode, uses static mock data
   * - In production, this would query database for real vendors
   * - Returns vendors with basic info structure
   */
  const getFallbackVendors = async (category: string): Promise<Vendor[]> => {
    // 🎨 PROTOTYPE MODE: Using mock vendor data
    // In production, this would query the vendors database

    const mockVendors: Vendor[] = [
      {
        id: 'vendor-1',
        name: `${category} Solution A`,
        description: `Leading ${category.toLowerCase()} platform with comprehensive features`,
        website: 'solution-a.com',
        pricing: 'Starting at $50/user/month',
        rating: 4.5,
        criteriaScores: {},
        features: ['Cloud-based', 'Mobile app', 'API integrations', 'Advanced analytics']
      },
      {
        id: 'vendor-2',
        name: `${category} Solution B`,
        description: `Enterprise-grade ${category.toLowerCase()} solution for large organizations`,
        website: 'solution-b.com',
        pricing: 'Contact for pricing',
        rating: 4.3,
        criteriaScores: {},
        features: ['On-premise option', 'Custom workflows', '24/7 support', 'Compliance tools']
      },
      {
        id: 'vendor-3',
        name: `${category} Solution C`,
        description: `Modern ${category.toLowerCase()} platform with intuitive interface`,
        website: 'solution-c.com',
        pricing: 'Starting at $30/user/month',
        rating: 4.2,
        criteriaScores: {},
        features: ['Easy setup', 'Drag-and-drop builder', 'Templates', 'Collaboration tools']
      },
      {
        id: 'vendor-4',
        name: `${category} Solution D`,
        description: `Cost-effective ${category.toLowerCase()} solution for growing businesses`,
        website: 'solution-d.com',
        pricing: 'Starting at $20/user/month',
        rating: 4.0,
        criteriaScores: {},
        features: ['Affordable pricing', 'Essential features', 'Quick implementation', 'Good support']
      },
      {
        id: 'vendor-5',
        name: `${category} Solution E`,
        description: `AI-powered ${category.toLowerCase()} platform with automation`,
        website: 'solution-e.com',
        pricing: 'Starting at $75/user/month',
        rating: 4.4,
        criteriaScores: {},
        features: ['AI automation', 'Predictive analytics', 'Smart workflows', 'Machine learning']
      }
    ];

    return mockVendors;
  };

  return {
    isDiscovering,
    discoverVendors
  };
};
