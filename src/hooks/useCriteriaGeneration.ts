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
  return [
    { id: '1', name: 'User Interface Design', explanation: 'The software must have an intuitive, modern user interface that requires minimal training for new users. Should support drag-and-drop functionality and customizable dashboards.', importance: 'high', type: 'feature' },
    { id: '2', name: 'Core Functionality', explanation: 'Must deliver all essential features required for primary use cases. The system should handle standard workflows efficiently without requiring workarounds or third-party tools.', importance: 'high', type: 'feature' },
    { id: '3', name: 'Performance Speed', explanation: 'System must respond to user actions within 2 seconds for standard operations. Page load times should not exceed 3 seconds, even with large datasets.', importance: 'high', type: 'technical' },
    { id: '4', name: 'Mobile Compatibility', explanation: 'Full-featured mobile applications (iOS and Android) or responsive web design that provides comparable functionality to desktop version. Touch-optimized interface required.', importance: 'high', type: 'feature' },
    { id: '5', name: 'Integration Capabilities', explanation: 'Must integrate seamlessly with existing enterprise tools including email, calendar, file storage, and CRM systems. RESTful API required for custom integrations.', importance: 'high', type: 'technical' },
    { id: '6', name: 'Customization Options', explanation: 'Ability to customize fields, workflows, and user interface elements without coding. Support for custom reports and automated workflows based on business rules.', importance: 'medium', type: 'feature' },
    { id: '7', name: 'Reporting & Analytics', explanation: 'Built-in reporting tools with ability to create custom reports and dashboards. Real-time analytics with export capabilities to PDF, Excel, and CSV formats.', importance: 'medium', type: 'feature' },
    { id: '8', name: 'API Documentation', explanation: 'Comprehensive, up-to-date API documentation with code examples and use cases. Must include authentication guides, rate limits, and version history.', importance: 'medium', type: 'technical' },
    { id: '9', name: 'Data Export Options', explanation: 'Support for bulk data export in multiple formats (CSV, Excel, JSON, XML). Scheduled exports and API-based data retrieval for backup and migration purposes.', importance: 'medium', type: 'feature' },
    { id: '10', name: 'Workflow Automation', explanation: 'Built-in automation capabilities for recurring tasks. Support for conditional logic, scheduled triggers, and multi-step workflows without requiring coding expertise.', importance: 'medium', type: 'feature' },
    { id: '11', name: 'Real-time Updates', explanation: 'Changes made by one user should be immediately visible to other users without page refresh. WebSocket or similar technology for live collaboration features.', importance: 'medium', type: 'technical' },
    { id: '12', name: 'Multi-user Support', explanation: 'Concurrent user support with role-based access control. Ability to handle at least 50 simultaneous users without performance degradation.', importance: 'high', type: 'feature' },
    { id: '13', name: 'Backup & Recovery', explanation: 'Automated daily backups with point-in-time recovery options. Maximum acceptable data loss window of 24 hours. Clear restore procedures documented.', importance: 'high', type: 'technical' },
    { id: '14', name: 'Scalability', explanation: 'System must scale to support growing data volumes and user counts. Architecture should handle 3x current requirements without requiring platform migration.', importance: 'medium', type: 'technical' },
    { id: '15', name: 'Pricing Model', explanation: 'Transparent, predictable pricing structure with no hidden fees. Flexible licensing options (per-user, per-feature, or enterprise). Annual contract discounts available.', importance: 'high', type: 'business' },
    { id: '16', name: 'Customer Support Quality', explanation: 'Email and phone support during business hours (minimum). Average response time under 4 hours for standard queries. Dedicated account manager for enterprise plans.', importance: 'high', type: 'business' },
    { id: '17', name: 'Training Resources', explanation: 'Comprehensive onboarding materials including video tutorials, documentation, and live training sessions. Self-service knowledge base with search functionality.', importance: 'medium', type: 'business' },
    { id: '18', name: 'Vendor Reputation', explanation: 'Established vendor with proven track record in the industry. Positive customer reviews and case studies from similar organizations. Financial stability indicators.', importance: 'medium', type: 'business' },
    { id: '19', name: 'Data Security', explanation: 'Enterprise-grade security with encryption at rest and in transit (minimum TLS 1.2). SOC 2 Type II certification required. Regular security audits and penetration testing.', importance: 'high', type: 'compliance' },
    { id: '20', name: 'GDPR Compliance', explanation: 'Full compliance with GDPR requirements including data processing agreements, right to deletion, data portability, and breach notification procedures.', importance: 'medium', type: 'compliance' }
  ];
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
      const aiCriteria: Criteria[] = generatedCriteria.map((c, index) => ({
        id: `ai-${index + 1}`,
        name: c.name,
        explanation: c.explanation || c.description || '', // Use explanation or description from AI, fallback to empty string
        importance: c.importance,
        type: c.type
      }));

      // Create success message
      const successMessage: ChatMessage = {
        id: '2',
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

      // Create fallback message
      const fallbackMessage: ChatMessage = {
        id: '2',
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
