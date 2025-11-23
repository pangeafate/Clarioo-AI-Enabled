/**
 * 🎯 CRITERIA GENERATION HOOK
 *
 * Purpose: Manages AI-powered criteria generation for vendor evaluation.
 * Extracts business logic from CriteriaBuilder component.
 *
 * Features:
 * - AI-powered criteria generation based on category and requirements
 * - Fallback to standard criteria when AI fails
 * - Loading state management
 * - Error handling with user-friendly fallbacks
 *
 * @module hooks/useCriteriaGeneration
 */

import { useState } from 'react';
import * as aiService from '@/services/mock/aiService';
import mockAIdata from '@/data/mockAIdata.json';

/**
 * Criteria structure for component use
 */
export interface Criteria {
  id: string;
  name: string;
  explanation: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
}

/**
 * Tech request data for criteria generation
 */
export interface TechRequest {
  category: string;
  requirements?: string[];
  description?: string;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Hook return type
 */
export interface UseCriteriaGenerationReturn {
  isGenerating: boolean;
  generateInitialCriteria: (request: TechRequest) => Promise<{
    criteria: Criteria[];
    message: ChatMessage;
  }>;
  generateFallbackCriteria: (request: TechRequest) => Criteria[];
}

/**
 * Generate fallback criteria when AI fails
 *
 * Purpose: Provides standard evaluation criteria as a fallback.
 * Returns a comprehensive set of 20 criteria covering all aspects.
 *
 * @param request - Tech request data
 * @returns Array of 20 standard criteria
 *
 * @remarks
 * - Used as fallback when AI service fails
 * - Covers feature, technical, business, and compliance aspects
 * - Generic but comprehensive coverage
 */
const createFallbackCriteria = (request: TechRequest): Criteria[] => {
  // 🎨 PROTOTYPE MODE: Load criteria from mockAIdata.json
  // This ensures criterion IDs match the score keys in vendor data
  return mockAIdata.criteria.map(c => ({
    id: c.id, // Use exact IDs from mockAIdata (crm_1, crm_2, etc.)
    name: c.name,
    explanation: c.description,
    importance: c.importance >= 4 ? 'high' : c.importance >= 3 ? 'medium' : 'low',
    type: c.type || 'other'
  }));
};

/**
 * Custom hook for AI-powered criteria generation
 *
 * Purpose: Manages criteria generation with AI service integration.
 * Handles loading states, errors, and fallback generation.
 *
 * @returns Object with generation state and functions
 *
 * @example
 * ```typescript
 * const { isGenerating, generateInitialCriteria, generateFallbackCriteria } = useCriteriaGeneration();
 *
 * // Generate criteria with AI
 * const { criteria, message } = await generateInitialCriteria({
 *   category: 'CRM Software',
 *   requirements: ['mobile app', 'integrations']
 * });
 *
 * // Or use fallback
 * const fallbackCriteria = generateFallbackCriteria(techRequest);
 * ```
 *
 * @remarks
 * - Automatically handles AI failures with fallback
 * - Returns both criteria and explanatory chat message
 * - Loading state can be used to show spinners
 */
export const useCriteriaGeneration = (): UseCriteriaGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generate initial criteria using AI service
   *
   * @param request - Tech request with category and requirements
   * @returns Promise with generated criteria and chat message
   */
  const generateInitialCriteria = async (
    request: TechRequest
  ): Promise<{ criteria: Criteria[]; message: ChatMessage }> => {
    setIsGenerating(true);

    try {
      // Extract requirements from description
      const requirements = request.requirements || [];

      // Call AI service to generate criteria
      const { data: generatedCriteria, error } = await aiService.generateCriteria(
        request.category,
        requirements,
        20
      );

      if (error || !generatedCriteria) {
        throw new Error(error?.message || 'Failed to generate criteria');
      }

      // Map to component's Criteria type
      // 🎨 PROTOTYPE MODE: Use mockAIdata IDs to match vendor score keys
      const aiCriteria: Criteria[] = generatedCriteria.map((c, index) => ({
        id: mockAIdata.criteria[index]?.id || `ai-${index + 1}`, // Use mockAIdata IDs (crm_1, crm_2, etc.)
        name: c.name,
        explanation: c.explanation || c.description || '', // Use explanation or description from AI, fallback to empty string
        importance: c.importance,
        type: c.type
      }));

      // Create success message with unique timestamp-based ID
      const successMessage: ChatMessage = {
        id: `gen-${Date.now()}`,
        role: 'assistant',
        content: `I've generated 20 evaluation criteria for ${request.category} solutions based on your requirements. These criteria cover essential product features, technical capabilities, business factors, and compliance considerations. You can refine these criteria using the chat or manually add/remove items as needed.`,
        timestamp: new Date()
      };

      return {
        criteria: aiCriteria,
        message: successMessage
      };
    } catch (error) {
      console.error('AI criteria generation failed:', error);

      // Use fallback criteria
      const fallbackCriteria = createFallbackCriteria(request);

      // Create fallback message with unique timestamp-based ID
      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: `I couldn't generate AI-powered criteria. I've provided 20 standard criteria for ${request.category} solutions instead. You can still use the chat to refine these criteria or ask for suggestions.`,
        timestamp: new Date()
      };

      return {
        criteria: fallbackCriteria,
        message: fallbackMessage
      };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate fallback criteria
   * Public accessor for fallback criteria generation
   *
   * @param request - Tech request data
   * @returns Array of fallback criteria
   */
  const generateFallbackCriteria = (request: TechRequest): Criteria[] => {
    return createFallbackCriteria(request);
  };

  return {
    isGenerating,
    generateInitialCriteria,
    generateFallbackCriteria
  };
};
