/**
 * n8n Integration Service
 *
 * This service handles communication with n8n workflows for AI-powered
 * project creation and criteria generation.
 *
 * @module services/n8nService
 */

import type {
  N8nProjectCreationRequest,
  N8nProjectCreationResponse,
  N8nCriterion,
  TransformedProject,
  TransformedCriterion,
  ProjectCreationResult,
  EmailCollectionRequest,
  EmailCollectionResponse,
  EmailCollectionStorage,
} from '@/types';

import type { CriterionScoreDetail } from '@/types/comparison.types';
import { collectDeviceMetadata } from '@/utils/deviceMetadata';
import {
  getProjectCreationUrl,
  getCriteriaChatUrl,
  getFindVendorsUrl,
  getCompareVendorsUrl,
  getCompareVendorCriterionUrl,
  getRankCriterionResultsUrl,
  getExecutiveSummaryUrl,
  getVendorSummaryUrl,
  getEmailCollectionUrl,
} from '@/config/webhooks';

// ===========================================
// Configuration
// ===========================================

const TIMEOUT_MS = 120000; // 2 minutes for project creation and criteria chat
const VENDOR_SEARCH_TIMEOUT_MS = 180000; // 3 minutes for vendor search

// ===========================================
// Criteria Chat Types
// ===========================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CriteriaChatRequest {
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  criteria: TransformedCriterion[];
  user_message: string;
  chat_history: ChatMessage[];
  timestamp: string;
}

export interface CriteriaAction {
  type: 'create' | 'update' | 'delete';
  criterion?: TransformedCriterion;
  criterion_id?: string;
  summary: string;
}

export interface CriteriaChatResponse {
  success: boolean;
  message: string;
  actions: CriteriaAction[];
  error?: {
    code: string;
    message: string;
  };
}

// ===========================================
// User & Session ID Management
// ===========================================

/**
 * Get or create a persistent user ID
 * Stored in localStorage, persists across browser sessions
 */
export const getUserId = (): string => {
  let userId = localStorage.getItem('clarioo_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('clarioo_user_id', userId);
  }
  return userId;
};

/**
 * Get or create a session ID
 * Stored in sessionStorage, unique per browser tab/session
 */
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('clarioo_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('clarioo_session_id', sessionId);
  }
  return sessionId;
};

// ===========================================
// Data Transformation
// ===========================================

/**
 * Transform n8n criterion to app criterion format
 * Key mapping: n8n "description" -> app "explanation"
 */
export const transformN8nCriterion = (n8nCriterion: N8nCriterion): TransformedCriterion => ({
  id: n8nCriterion.id,
  name: n8nCriterion.name,
  explanation: n8nCriterion.description, // KEY MAPPING
  importance: n8nCriterion.importance,
  type: n8nCriterion.type,
  isArchived: n8nCriterion.isArchived,
});

/**
 * Transform n8n response to app project format
 */
export const transformN8nProject = (
  n8nResponse: N8nProjectCreationResponse,
  companyContext: string,
  solutionRequirements: string
): TransformedProject => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: n8nResponse.project!.name,
    description: n8nResponse.project!.description,
    category: n8nResponse.project!.category,
    status: 'in-progress',
    created_at: now,
    updated_at: now,
    user_id: getUserId(),
    techRequest: {
      companyContext,
      solutionRequirements,
    },
  };
};

// ===========================================
// API Functions
// ===========================================

/**
 * Create a project with AI-generated criteria via n8n workflow
 *
 * @param companyContext - User's company background and context
 * @param solutionRequirements - User's solution requirements and needs
 * @returns Promise resolving to project and criteria data
 * @throws Error if request fails, times out, or AI processing fails
 *
 * @example
 * ```typescript
 * const result = await createProjectWithAI(
 *   "We are a mid-size SaaS company with 50 employees in the healthcare sector",
 *   "Looking for a CRM system with email integration and HIPAA compliance"
 * );
 * console.log(result.project.name); // "Healthcare CRM Evaluation"
 * console.log(result.criteria.length); // 10-15 criteria
 * ```
 */
export const createProjectWithAI = async (
  companyContext: string,
  solutionRequirements: string
): Promise<ProjectCreationResult> => {
  console.log('[n8n] Starting project creation...');
  console.log('[n8n] Company context:', companyContext.substring(0, 50) + (companyContext.length > 50 ? '...' : ''));
  console.log('[n8n] Solution requirements:', solutionRequirements.substring(0, 50) + (solutionRequirements.length > 50 ? '...' : ''));

  // Validate inputs - at least one field must have 10+ characters
  const hasCompanyContext = companyContext.trim().length >= 10;
  const hasSolutionRequirements = solutionRequirements.trim().length >= 10;

  if (!hasCompanyContext && !hasSolutionRequirements) {
    throw new Error('At least one field must have 10 or more characters');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const requestBody: N8nProjectCreationRequest = {
      user_id: getUserId(),
      session_id: getSessionId(),
      company_context: companyContext.trim(),
      solution_requirements: solutionRequirements.trim(),
      timestamp: new Date().toISOString(),
    };

    const url = getProjectCreationUrl();
    console.log('[n8n] Sending request to:', url);
    console.log('[n8n] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[n8n] Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[n8n] HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: N8nProjectCreationResponse = await response.json();
    console.log('[n8n] Response data:', JSON.stringify(data, null, 2));

    if (!data.success) {
      const errorMessage = data.error?.message || 'AI processing failed';
      const errorCode = data.error?.code || 'UNKNOWN_ERROR';
      console.error('[n8n] API error:', errorCode, errorMessage);
      throw new Error(`${errorCode}: ${errorMessage}`);
    }

    if (!data.project || !data.criteria) {
      console.error('[n8n] Invalid response: missing project or criteria data');
      throw new Error('Invalid response: missing project or criteria data');
    }

    // Transform the response to app format
    const project = transformN8nProject(data, companyContext, solutionRequirements);
    const criteria = data.criteria.map(transformN8nCriterion);

    console.log('[n8n] Project created successfully:', project.name);
    console.log('[n8n] Criteria count:', criteria.length);

    return { project, criteria };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n] Request timeout after', TIMEOUT_MS, 'ms');
        throw new Error('Request timeout - AI processing took too long (2 min limit). Please try again.');
      }
      console.error('[n8n] Error:', error.message);
      throw error;
    }

    console.error('[n8n] Unexpected error:', error);
    throw new Error('An unexpected error occurred during project creation');
  }
};

// ===========================================
// Criteria Chat API
// ===========================================

/**
 * Send a chat message for criteria management via n8n workflow
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param projectDescription - Project description
 * @param projectCategory - Project category
 * @param criteria - Current criteria list
 * @param userMessage - User's chat message
 * @param chatHistory - Previous chat messages for context
 * @returns Promise resolving to chat response with message and actions
 */
export const sendCriteriaChat = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  criteria: TransformedCriterion[],
  userMessage: string,
  chatHistory: ChatMessage[]
): Promise<CriteriaChatResponse> => {
  console.log('[n8n-chat] Starting criteria chat...');
  console.log('[n8n-chat] User message:', userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const requestBody: CriteriaChatRequest = {
      user_id: getUserId(),
      session_id: getSessionId(),
      project_id: projectId,
      project_name: projectName,
      project_description: projectDescription,
      project_category: projectCategory,
      criteria,
      user_message: userMessage.trim(),
      chat_history: chatHistory.slice(-10), // Limit to last 10 messages
      timestamp: new Date().toISOString(),
    };

    const url = getCriteriaChatUrl();
    console.log('[n8n-chat] Sending request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[n8n-chat] Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[n8n-chat] HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: CriteriaChatResponse = await response.json();
    console.log('[n8n-chat] Response:', {
      success: data.success,
      messageLength: data.message?.length,
      actionsCount: data.actions?.length
    });

    if (!data.success) {
      const errorMessage = data.error?.message || 'AI processing failed';
      const errorCode = data.error?.code || 'UNKNOWN_ERROR';
      console.error('[n8n-chat] API error:', errorCode, errorMessage);
      throw new Error(`${errorCode}: ${errorMessage}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n-chat] Request timeout after', TIMEOUT_MS, 'ms');
        throw new Error('Request timeout - AI processing took too long. Please try again.');
      }
      console.error('[n8n-chat] Error:', error.message);
      throw error;
    }

    console.error('[n8n-chat] Unexpected error:', error);
    throw new Error('An unexpected error occurred during chat processing');
  }
};

// ===========================================
// Vendor Search Types
// ===========================================

export interface VendorSearchRequest {
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  criteria: TransformedCriterion[];
  max_vendors: number;
  timestamp: string;
}

export interface DiscoveredVendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, 'yes' | 'no' | 'unknown' | 'star'>;
  features: string[];
}

export interface VendorSearchResponse {
  success: boolean;
  vendors: DiscoveredVendor[];
  search_summary?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ===========================================
// Vendor Search API
// ===========================================

/**
 * Find vendors matching project criteria via n8n workflow
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param projectDescription - Project description
 * @param projectCategory - Project category
 * @param criteria - Criteria to match (feature type preferred)
 * @param maxVendors - Maximum vendors to return (default: 10)
 * @returns Promise resolving to vendor search response
 */
export const findVendors = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  criteria: TransformedCriterion[],
  maxVendors: number = 10
): Promise<VendorSearchResponse> => {
  console.log('[n8n-vendors] Starting vendor search...');
  console.log('[n8n-vendors] Project:', projectName);
  console.log('[n8n-vendors] Category:', projectCategory);

  // Filter criteria: feature type only, or all if no features
  const featureCriteria = criteria.filter(c => c.type === 'feature' && !c.isArchived);
  const criteriaToSend = featureCriteria.length > 0
    ? featureCriteria
    : criteria.filter(c => !c.isArchived);

  console.log('[n8n-vendors] Sending', criteriaToSend.length, 'criteria');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VENDOR_SEARCH_TIMEOUT_MS);

  try {
    const requestBody: VendorSearchRequest = {
      user_id: getUserId(),
      session_id: getSessionId(),
      project_id: projectId,
      project_name: projectName,
      project_description: projectDescription,
      project_category: projectCategory,
      criteria: criteriaToSend,
      max_vendors: maxVendors,
      timestamp: new Date().toISOString(),
    };

    const url = getFindVendorsUrl();
    console.log('[n8n-vendors] Sending request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[n8n-vendors] Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[n8n-vendors] HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: VendorSearchResponse = await response.json();
    console.log('[n8n-vendors] Response:', {
      success: data.success,
      vendorCount: data.vendors?.length,
      summary: data.search_summary
    });

    if (!data.success) {
      const errorMessage = data.error?.message || 'Vendor search failed';
      const errorCode = data.error?.code || 'UNKNOWN_ERROR';
      console.error('[n8n-vendors] API error:', errorCode, errorMessage);
      throw new Error(`${errorCode}: ${errorMessage}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n-vendors] Request timeout after', VENDOR_SEARCH_TIMEOUT_MS, 'ms');
        throw new Error('Request timeout - vendor search took too long. Please try again.');
      }
      console.error('[n8n-vendors] Error:', error.message);
      throw error;
    }

    console.error('[n8n-vendors] Unexpected error:', error);
    throw new Error('An unexpected error occurred during vendor search');
  }
};

// ===========================================
// Vendor Comparison Types
// ===========================================

const COMPARE_VENDOR_TIMEOUT_MS = 180000; // 3 minutes per vendor comparison

export interface VendorForComparison {
  id: string;
  name: string;
  website: string;
  description: string;
  features: string[];
}

export interface ComparedVendor {
  id: string;
  name: string;
  website: string;
  description: string;
  killerFeature: string;
  executiveSummary: string;
  keyFeatures: string[];
  matchPercentage: number;
  scores: Record<string, 'no' | 'unknown' | 'yes' | 'star'>;
  scoreDetails: Record<string, CriterionScoreDetail>;
}

export interface SingleVendorComparisonResponse {
  success: boolean;
  vendor?: ComparedVendor;
  vendor_id?: string;
  research_summary?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ===========================================
// Vendor Comparison API
// ===========================================

/**
 * Research a single vendor against criteria via n8n workflow
 * Called once per vendor for progressive loading
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param projectDescription - Project description
 * @param projectCategory - Project category
 * @param vendor - Vendor to research
 * @param criteria - Criteria to evaluate against
 * @returns Promise resolving to comparison response
 */
export const compareVendor = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  vendor: VendorForComparison,
  criteria: TransformedCriterion[]
): Promise<SingleVendorComparisonResponse> => {
  console.log('[n8n-compare] Starting research for vendor:', vendor.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COMPARE_VENDOR_TIMEOUT_MS);

  try {
    const requestBody = {
      user_id: getUserId(),
      session_id: getSessionId(),
      project_id: projectId,
      project_name: projectName,
      project_description: projectDescription,
      project_category: projectCategory,
      vendor,
      criteria: criteria.filter(c => !c.isArchived),
      timestamp: new Date().toISOString(),
    };

    const url = getCompareVendorsUrl();
    console.log('[n8n-compare] Sending request for:', vendor.name, 'to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[n8n-compare] Response status for', vendor.name, ':', response.status);

    if (!response.ok) {
      console.error('[n8n-compare] HTTP error for', vendor.name, ':', response.status);
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: SingleVendorComparisonResponse = await response.json();
    console.log('[n8n-compare] Response for', vendor.name, ':', {
      success: data.success,
      matchPercentage: data.vendor?.matchPercentage,
      summary: data.research_summary
    });
    console.log('[n8n-compare] Full vendor data:', data.vendor);

    if (!data.success) {
      const errorMessage = data.error?.message || 'Vendor comparison failed';
      const errorCode = data.error?.code || 'UNKNOWN_ERROR';
      console.error('[n8n-compare] API error for', vendor.name, ':', errorCode, errorMessage);
      return {
        success: false,
        vendor_id: vendor.id,
        error: {
          code: errorCode,
          message: errorMessage
        }
      };
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n-compare] Request timeout for', vendor.name);
        return {
          success: false,
          vendor_id: vendor.id,
          error: {
            code: 'TIMEOUT',
            message: `Research timeout for ${vendor.name}. Please retry.`
          }
        };
      }
      console.error('[n8n-compare] Error for', vendor.name, ':', error.message);
      return {
        success: false,
        vendor_id: vendor.id,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message
        }
      };
    }

    console.error('[n8n-compare] Unexpected error for', vendor.name, ':', error);
    return {
      success: false,
      vendor_id: vendor.id,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }
    };
  }
};

// ===========================================
// Progressive Vendor Comparison - Stage 1 & 2 (SP_018)
// ===========================================

const STAGE1_TIMEOUT_MS = 45000; // 45 seconds for individual vendor-criterion research
const STAGE2_TIMEOUT_MS = 90000; // 1.5 minutes for criterion ranking

// Stage 1: Individual vendor-criterion research
export interface Stage1Request {
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  vendor: {
    id: string;
    name: string;
    website: string;
  };
  criterion: {
    id: string;
    name: string;
    importance: string;
    description?: string;
  };
  timestamp: string;
}

export interface Stage1Result {
  vendor_id: string;
  criterion_id: string;
  evidence_strength: 'yes' | 'unknown' | 'no';
  evidence_url: string;
  evidence_description: string;
  vendor_site_evidence: string;
  third_party_evidence: string;
  research_notes: string;
  search_count: number;
}

export interface Stage1Response {
  success: boolean;
  result?: Stage1Result;
  vendor_id?: string;
  criterion_id?: string;
  timestamp?: string;
  error?: {
    code: string;
    message: string;
  };
}

// Stage 2: Comparative ranking and star allocation
export interface Stage2Request {
  user_id: string;
  session_id: string;
  project_id: string;
  project_name: string;
  project_description: string;
  project_category: string;
  criterion: {
    id: string;
    name: string;
    importance: string;
    description?: string;
  };
  stage1_results: Array<{
    vendor_id: string;
    vendor_name: string;
    vendor_website: string;
    evidence_strength: string;
    evidence_url: string;
    evidence_description: string;
    vendor_site_evidence: string;
    third_party_evidence: string;
    research_notes: string;
  }>;
  timestamp: string;
}

export interface Stage2VendorRanking {
  vendor_id: string;
  vendor_name: string;
  state: 'yes' | 'star' | 'no' | 'unknown';
  evidence_url: string;
  evidence_description: string;
  comment: string;
}

export interface Stage2Result {
  criterion_id: string;
  criterion_name: string;
  criterion_importance: string;
  vendor_rankings: Stage2VendorRanking[];
  criterion_insight: string;
  stars_awarded: number;
  search_count: number;
}

export interface Stage2Response {
  success: boolean;
  result?: Stage2Result;
  criterion_id?: string;
  timestamp?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Stage 1: Research a single vendor-criterion combination
 *
 * This function researches one vendor's capability for one specific criterion.
 * It collects evidence from vendor websites and third-party sources, but does NOT
 * assign ratings or compare to competitors.
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param projectDescription - Project description
 * @param projectCategory - Project category
 * @param vendor - Vendor to research
 * @param criterion - Criterion to evaluate
 * @returns Promise resolving to Stage 1 research result
 */
export const compareVendorCriterion = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  vendor: { id: string; name: string; website: string },
  criterion: { id: string; name: string; importance: string; description?: string }
): Promise<Stage1Response> => {
  console.log('[n8n-stage1] Starting research:', vendor.name, '-', criterion.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STAGE1_TIMEOUT_MS);

  try {
    const requestBody: Stage1Request = {
      user_id: getUserId(),
      session_id: getSessionId(),
      project_id: projectId,
      project_name: projectName,
      project_description: projectDescription,
      project_category: projectCategory,
      vendor,
      criterion,
      timestamp: new Date().toISOString(),
    };

    const url = getCompareVendorCriterionUrl();
    console.log('[n8n-stage1] Sending request to:', url);
    console.log('[n8n-stage1] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[n8n-stage1] Response status:', response.status);

    if (!response.ok) {
      // Try to read error response body for validation errors
      let errorMessage = `HTTP error: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('[n8n-stage1] Error response:', errorData);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (e) {
        console.error('[n8n-stage1] Could not parse error response');
      }

      console.error('[n8n-stage1] HTTP error:', response.status, errorMessage);
      return {
        success: false,
        vendor_id: vendor.id,
        criterion_id: criterion.id,
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
        },
      };
    }

    const data: Stage1Response = await response.json();
    console.log('[n8n-stage1] Result:', {
      success: data.success,
      evidence_strength: data.result?.evidence_strength,
      search_count: data.result?.search_count,
    });

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n-stage1] Timeout for:', vendor.name, '-', criterion.name);
        return {
          success: false,
          vendor_id: vendor.id,
          criterion_id: criterion.id,
          error: {
            code: 'TIMEOUT',
            message: `Research timeout for ${vendor.name} - ${criterion.name}`,
          },
        };
      }
      console.error('[n8n-stage1] Error:', error.message);
      return {
        success: false,
        vendor_id: vendor.id,
        criterion_id: criterion.id,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message,
        },
      };
    }

    console.error('[n8n-stage1] Unexpected error:', error);
    return {
      success: false,
      vendor_id: vendor.id,
      criterion_id: criterion.id,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
};

/**
 * Stage 2: Rank vendors for a criterion and award stars
 *
 * This function takes Stage 1 research results for all vendors on a single criterion,
 * conducts comparative research, and awards up to 2 stars to vendors showing
 * exceptional competitive advantage.
 *
 * @param projectId - Project ID
 * @param projectName - Project name
 * @param projectDescription - Project description
 * @param projectCategory - Project category
 * @param criterion - Criterion being evaluated
 * @param stage1Results - Stage 1 research results for all vendors
 * @returns Promise resolving to Stage 2 ranking result
 */
export const rankCriterionResults = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  projectCategory: string,
  criterion: { id: string; name: string; importance: string; description?: string },
  stage1Results: Array<Stage1Result & { vendor_name: string; vendor_website: string }>
): Promise<Stage2Response> => {
  console.log('[n8n-stage2] Starting ranking for criterion:', criterion.name);
  console.log('[n8n-stage2] Vendors to rank:', stage1Results.length);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STAGE2_TIMEOUT_MS);

  try {
    const requestBody: Stage2Request = {
      user_id: getUserId(),
      session_id: getSessionId(),
      project_id: projectId,
      project_name: projectName,
      project_description: projectDescription,
      project_category: projectCategory,
      criterion,
      stage1_results: stage1Results.map(r => ({
        vendor_id: r.vendor_id,
        vendor_name: r.vendor_name,
        vendor_website: r.vendor_website,
        evidence_strength: r.evidence_strength,
        evidence_url: r.evidence_url,
        evidence_description: r.evidence_description,
        vendor_site_evidence: r.vendor_site_evidence,
        third_party_evidence: r.third_party_evidence,
        research_notes: r.research_notes,
      })),
      timestamp: new Date().toISOString(),
    };

    const url = getRankCriterionResultsUrl();
    console.log('[n8n-stage2] Sending request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[n8n-stage2] Response status:', response.status);

    if (!response.ok) {
      console.error('[n8n-stage2] HTTP error:', response.status);
      return {
        success: false,
        criterion_id: criterion.id,
        error: {
          code: `HTTP_${response.status}`,
          message: `HTTP error: ${response.status}`,
        },
      };
    }

    const data: Stage2Response = await response.json();
    console.log('[n8n-stage2] Result:', {
      success: data.success,
      stars_awarded: data.result?.stars_awarded,
      search_count: data.result?.search_count,
    });

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n-stage2] Timeout for criterion:', criterion.name);
        return {
          success: false,
          criterion_id: criterion.id,
          error: {
            code: 'TIMEOUT',
            message: `Ranking timeout for ${criterion.name}`,
          },
        };
      }
      console.error('[n8n-stage2] Error:', error.message);
      return {
        success: false,
        criterion_id: criterion.id,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message,
        },
      };
    }

    console.error('[n8n-stage2] Unexpected error:', error);
    return {
      success: false,
      criterion_id: criterion.id,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
};

// ===========================================
// Storage Functions
// ===========================================

const PROJECTS_STORAGE_KEY = 'clarioo_projects';
const CRITERIA_STORAGE_PREFIX = 'criteria_';
const WORKFLOW_STORAGE_PREFIX = 'workflow_';

/**
 * Save project to localStorage
 */
export const saveProjectToStorage = (project: TransformedProject): void => {
  const existingProjects = getProjectsFromStorage();
  const updatedProjects = [project, ...existingProjects];
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
};

/**
 * Get all projects from localStorage
 */
export const getProjectsFromStorage = (): TransformedProject[] => {
  const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

/**
 * Get a single project by ID from localStorage
 */
export const getProjectByIdFromStorage = (projectId: string): TransformedProject | null => {
  const projects = getProjectsFromStorage();
  return projects.find(p => p.id === projectId) || null;
};

/**
 * Update a project in localStorage
 */
export const updateProjectInStorage = (projectId: string, updates: Partial<TransformedProject>): void => {
  const projects = getProjectsFromStorage();
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }
};

/**
 * Delete a project from localStorage
 */
export const deleteProjectFromStorage = (projectId: string): void => {
  const projects = getProjectsFromStorage();
  const filtered = projects.filter(p => p.id !== projectId);
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));

  // Also delete associated criteria and workflow state
  localStorage.removeItem(`${CRITERIA_STORAGE_PREFIX}${projectId}`);
  localStorage.removeItem(`${WORKFLOW_STORAGE_PREFIX}${projectId}`);
};

/**
 * Save criteria for a project to localStorage
 */
export const saveCriteriaToStorage = (projectId: string, criteria: TransformedCriterion[]): void => {
  localStorage.setItem(`${CRITERIA_STORAGE_PREFIX}${projectId}`, JSON.stringify(criteria));
};

/**
 * Get criteria for a project from localStorage
 */
export const getCriteriaFromStorage = (projectId: string): TransformedCriterion[] => {
  const stored = localStorage.getItem(`${CRITERIA_STORAGE_PREFIX}${projectId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

/**
 * Update criteria for a project in localStorage
 */
export const updateCriteriaInStorage = (projectId: string, criteria: TransformedCriterion[]): void => {
  saveCriteriaToStorage(projectId, criteria);
};

// ===========================================
// Executive Summary Types
// ===========================================

export interface ExecutiveSummaryData {
  keyCriteria: Array<{
    name: string;
    description: string;
    importance: string;
  }>;
  vendorRecommendations: Array<{
    rank: number;
    name: string;
    matchPercentage: number;
    overallAssessment: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
    bestFor: string;
  }>;
  keyDifferentiators: Array<{
    category: string;
    leader: string;
    details: string;
  }>;
  riskFactors: {
    vendorSpecific: Array<{
      vendor: string;
      questions: string[];
    }>;
    generalConsiderations: string[];
  };
  recommendation: {
    topPick: string;
    reason: string;
    considerations: string[];
  };
}

export interface ExecutiveSummaryRequest {
  project_id: string;
  project_name: string;
  project_description: string;
  session_id: string;
  timestamp: string;
  criteria: Array<{
    id: string;
    name: string;
    description: string;
    importance: string;
  }>;
  vendors: Array<{
    id: string;
    name: string;
    website?: string;
    matchPercentage: number;
    description?: string;
    killerFeature?: string; // Killer feature for executive summary consideration
    keyFeatures?: string[]; // Research insights for comprehensive analysis
    executiveSummary?: string; // About section for context
    scoreDetails: Array<{
      criterionId: string;
      criterionName: string;
      score: number;
      evidence: string;
      source_urls: string[];
      comments: string;
    }>;
  }>;
}

export interface ExecutiveSummaryResponse {
  success: boolean;
  data?: ExecutiveSummaryData;
  generated_at?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ===========================================
// Executive Summary API
// ===========================================

/**
 * Generate executive summary via n8n AI workflow
 */
export const generateExecutiveSummary = async (
  projectId: string,
  projectName: string,
  projectDescription: string,
  criteria: TransformedCriterion[],
  vendors: ComparedVendor[]
): Promise<ExecutiveSummaryData> => {
  console.log('[n8n-summary] Generating executive summary...');
  console.log('[n8n-summary] Project:', projectName);
  console.log('[n8n-summary] Criteria count:', criteria.length);
  console.log('[n8n-summary] Vendor count:', vendors.length);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Transform criteria to request format
    const criteriaPayload = criteria
      .filter(c => !c.isArchived)
      .map(c => ({
        id: c.id,
        name: c.name,
        description: c.explanation,
        importance: c.importance
      }));

    // Transform vendors to request format with scoreDetails
    const vendorsPayload = vendors.map(v => {
      // Convert scoreDetails from Record to Array
      const scoreDetailsArray = Object.entries(v.scoreDetails || {}).map(([criterionId, detail]) => {
        const criterion = criteria.find(c => c.id === criterionId);
        return {
          criterionId,
          criterionName: criterion?.name || criterionId,
          score: detail.state === 'star' ? 5 : detail.state === 'yes' ? 4 : detail.state === 'unknown' ? 3 : 1,
          evidence: detail.evidence || '',
          source_urls: detail.evidence ? [detail.evidence] : [],
          comments: detail.comment || ''
        };
      });

      return {
        id: v.id,
        name: v.name,
        website: v.website,
        matchPercentage: v.matchPercentage,
        description: v.description,
        killerFeature: v.killerFeature, // Include killer feature for n8n to consider
        keyFeatures: v.keyFeatures, // Include all research insights
        executiveSummary: v.executiveSummary, // Include About section for context
        scoreDetails: scoreDetailsArray
      };
    });

    const requestBody: ExecutiveSummaryRequest = {
      project_id: projectId,
      project_name: projectName,
      project_description: projectDescription,
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
      criteria: criteriaPayload,
      vendors: vendorsPayload
    };

    const url = getExecutiveSummaryUrl();
    console.log('[n8n-summary] Sending request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('[n8n-summary] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[n8n-summary] HTTP error:', response.status, errorText);
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    let result: ExecutiveSummaryResponse | ExecutiveSummaryResponse[] = await response.json();

    // Handle array response (n8n sometimes wraps response in array)
    if (Array.isArray(result)) {
      console.log('[n8n-summary] Response is array, extracting first element');
      if (result.length === 0) {
        throw new Error('Empty response array from n8n');
      }
      result = result[0];
    }

    if (!result.success || !result.data) {
      const errorMessage = result.error?.message || 'Failed to generate executive summary';
      console.error('[n8n-summary] API error:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('[n8n-summary] Summary generated successfully');

    // Cache the result
    saveExecutiveSummaryToStorage(projectId, result.data);

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n-summary] Request timeout');
        throw new Error('Executive summary generation timed out (2 min limit)');
      }
      throw error;
    }

    throw new Error('An unexpected error occurred during summary generation');
  }
};

// ===========================================
// Executive Summary Storage
// ===========================================

const EXECUTIVE_SUMMARY_PREFIX = 'clarioo_executive_summary_';

/**
 * Save executive summary to localStorage
 */
export const saveExecutiveSummaryToStorage = (projectId: string, data: ExecutiveSummaryData): void => {
  const key = `${EXECUTIVE_SUMMARY_PREFIX}${projectId}`;
  const stored = {
    data,
    generated_at: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(stored));
  console.log('[n8n-summary] Executive summary cached for project:', projectId);
};

/**
 * Get cached executive summary from localStorage
 */
export const getExecutiveSummaryFromStorage = (projectId: string): ExecutiveSummaryData | null => {
  const key = `${EXECUTIVE_SUMMARY_PREFIX}${projectId}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    return parsed.data;
  } catch {
    return null;
  }
};

/**
 * Clear cached executive summary
 */
export const clearExecutiveSummaryFromStorage = (projectId: string): void => {
  const key = `${EXECUTIVE_SUMMARY_PREFIX}${projectId}`;
  localStorage.removeItem(key);
  console.log('[n8n-summary] Executive summary cache cleared for project:', projectId);
};

// ===========================================
// Vendor Summary Types (for Vendor Cards)
// ===========================================

export interface VendorSummaryData {
  vendor_name: string;
  killerFeature: string;
  executiveSummary: string;
  keyFeatures: string[];
}

export interface VendorSummaryRequest {
  vendor_name: string;
  vendor_website: string;
  project_id: string;
  project_context?: string;
}

export interface VendorSummaryResponse {
  success: boolean;
  vendor_summary?: VendorSummaryData;
  generated_at?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ===========================================
// Vendor Summary API
// ===========================================

/**
 * Generate vendor card summary via n8n AI workflow (Perplexity)
 * Generates killerFeature, executiveSummary, and keyFeatures for a single vendor
 */
export const generateVendorSummary = async (
  vendorName: string,
  vendorWebsite: string,
  projectId: string,
  projectContext?: string
): Promise<VendorSummaryData> => {
  console.log('[n8n-vendor-summary] Generating vendor summary for:', vendorName);
  console.log('[n8n-vendor-summary] Website:', vendorWebsite);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const requestBody: VendorSummaryRequest = {
      vendor_name: vendorName,
      vendor_website: vendorWebsite,
      project_id: projectId,
      project_context: projectContext
    };

    const url = getVendorSummaryUrl();
    console.log('[n8n-vendor-summary] Sending request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('[n8n-vendor-summary] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[n8n-vendor-summary] HTTP error:', response.status, errorText);
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    const result: VendorSummaryResponse = await response.json();

    if (!result.success || !result.vendor_summary) {
      const errorMessage = result.error?.message || 'Failed to generate vendor summary';
      console.error('[n8n-vendor-summary] API error:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('[n8n-vendor-summary] Summary generated successfully for:', vendorName);

    // Cache the result
    saveVendorSummaryToStorage(projectId, vendorName, result.vendor_summary);

    return result.vendor_summary;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[n8n-vendor-summary] Request timeout');
        throw new Error('Vendor summary generation timed out (2 min limit)');
      }
      throw error;
    }

    throw new Error('An unexpected error occurred during vendor summary generation');
  }
};

/**
 * Generate vendor summaries for multiple vendors in parallel
 * Returns a map of vendor names to their summaries
 */
export const generateVendorSummaries = async (
  vendors: Array<{ name: string; website: string }>,
  projectId: string,
  projectContext?: string,
  concurrencyLimit: number = 3
): Promise<Map<string, VendorSummaryData>> => {
  console.log('[n8n-vendor-summary] Generating summaries for', vendors.length, 'vendors (max', concurrencyLimit, 'concurrent)');

  const results = new Map<string, VendorSummaryData>();
  const errors: Array<{ vendor: string; error: string }> = [];

  // Process vendors in batches to respect concurrency limit
  for (let i = 0; i < vendors.length; i += concurrencyLimit) {
    const batch = vendors.slice(i, i + concurrencyLimit);
    console.log(`[n8n-vendor-summary] Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(vendors.length / concurrencyLimit)}`);

    const batchPromises = batch.map(async (vendor) => {
      try {
        const summary = await generateVendorSummary(
          vendor.name,
          vendor.website,
          projectId,
          projectContext
        );
        return { vendor: vendor.name, summary };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[n8n-vendor-summary] Failed to generate summary for ${vendor.name}:`, errorMessage);
        errors.push({ vendor: vendor.name, error: errorMessage });
        return { vendor: vendor.name, summary: null };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    batchResults.forEach(({ vendor, summary }) => {
      if (summary) {
        results.set(vendor, summary);
      }
    });
  }

  if (errors.length > 0) {
    console.warn('[n8n-vendor-summary] Some vendors failed:', errors);
  }

  console.log('[n8n-vendor-summary] Generated summaries for', results.size, 'out of', vendors.length, 'vendors');
  return results;
};

// ===========================================
// Vendor Summary Storage
// ===========================================

const VENDOR_SUMMARY_PREFIX = 'clarioo_vendor_summary_';

/**
 * Save vendor summary to localStorage
 */
export const saveVendorSummaryToStorage = (
  projectId: string,
  vendorName: string,
  data: VendorSummaryData
): void => {
  const key = `${VENDOR_SUMMARY_PREFIX}${projectId}_${vendorName}`;
  const stored = {
    data,
    generated_at: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(stored));
  console.log('[n8n-vendor-summary] Vendor summary cached for:', vendorName);
};

/**
 * Get cached vendor summary from localStorage
 */
export const getVendorSummaryFromStorage = (
  projectId: string,
  vendorName: string
): VendorSummaryData | null => {
  const key = `${VENDOR_SUMMARY_PREFIX}${projectId}_${vendorName}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    return parsed.data;
  } catch {
    return null;
  }
};

/**
 * Clear cached vendor summary
 */
export const clearVendorSummaryFromStorage = (projectId: string, vendorName: string): void => {
  const key = `${VENDOR_SUMMARY_PREFIX}${projectId}_${vendorName}`;
  localStorage.removeItem(key);
  console.log('[n8n-vendor-summary] Vendor summary cache cleared for:', vendorName);
};

/**
 * Clear all vendor summaries for a project
 */
export const clearAllVendorSummariesForProject = (projectId: string): void => {
  const prefix = `${VENDOR_SUMMARY_PREFIX}${projectId}_`;
  const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
  keys.forEach(key => localStorage.removeItem(key));
  console.log('[n8n-vendor-summary] Cleared', keys.length, 'vendor summaries for project:', projectId);
};

// ===========================================
// Email Collection (SP_017)
// ===========================================

const EMAIL_STORAGE_KEY = 'clarioo_email';

// ===========================================
// Email Collection Storage Functions
// ===========================================

/**
 * Get email collection status from localStorage
 *
 * @returns EmailCollectionStorage object or null if not found
 */
export const getEmailFromStorage = (): EmailCollectionStorage | null => {
  const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Save email collection status to localStorage
 *
 * @param email - User's email address
 * @param passedToN8n - Whether email was successfully sent to n8n
 */
export const saveEmailToStorage = (email: string, passedToN8n: boolean): void => {
  const data: EmailCollectionStorage = {
    email_submitted: true,
    email: email.toLowerCase().trim(),
    timestamp: new Date().toISOString(),
    email_passed_to_n8n: passedToN8n,
  };

  localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(data));
  console.log('[email] Email collection status saved:', { email, passedToN8n });
};

/**
 * Check if email has been submitted
 *
 * @returns True if email has been submitted, false otherwise
 */
export const hasSubmittedEmail = (): boolean => {
  const stored = getEmailFromStorage();
  return stored?.email_submitted === true;
};

/**
 * Check if email needs retry (submitted but not passed to n8n)
 *
 * @returns True if email needs retry, false otherwise
 */
export const needsEmailRetry = (): boolean => {
  const stored = getEmailFromStorage();
  return stored?.email_submitted === true && stored?.email_passed_to_n8n === false;
};

/**
 * Update email_passed_to_n8n flag after successful retry
 */
export const markEmailPassedToN8n = (): void => {
  const stored = getEmailFromStorage();
  if (stored) {
    stored.email_passed_to_n8n = true;
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(stored));
    console.log('[email] Email marked as passed to n8n');
  }
};

// ===========================================
// Email Collection API
// ===========================================

/**
 * Collect user email and send to n8n workflow for Google Sheets storage
 *
 * This function is called when the user submits their email in the
 * EmailCollectionModal. It collects device metadata, generates/retrieves
 * user_id, and sends everything to the n8n webhook.
 *
 * @param email - User's email address
 * @returns Promise resolving to success/failure response
 * @throws Error if request fails or times out
 *
 * @example
 * ```typescript
 * try {
 *   const result = await collectEmail('user@example.com');
 *   if (result.success) {
 *     console.log('Email collected successfully');
 *   }
 * } catch (error) {
 *   console.error('Email collection failed:', error);
 * }
 * ```
 */
export const collectEmail = async (email: string): Promise<EmailCollectionResponse> => {
  console.log('[email] Starting email collection...');
  console.log('[email] Email:', email);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Get or create user_id (from existing SP_016 function)
    const userId = getUserId();
    console.log('[email] User ID:', userId);

    // Collect device metadata
    const deviceMetadata = collectDeviceMetadata();
    console.log('[email] Device metadata:', deviceMetadata);

    const requestBody: EmailCollectionRequest = {
      email: email.toLowerCase().trim(),
      user_id: userId,
      timestamp: new Date().toISOString(),
      device_metadata: deviceMetadata,
    };

    const url = getEmailCollectionUrl();
    console.log('[email] Sending request to:', url);
    console.log('[email] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[email] Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[email] HTTP error:', response.status, response.statusText);

      // Save to localStorage with failed flag for retry
      saveEmailToStorage(email, false);

      // Don't throw error - allow user to proceed
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: `HTTP error: ${response.status} ${response.statusText}`,
        },
      };
    }

    // Handle empty response body (webhook may return 200 with no content)
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log('[email] Empty response body - treating as success');
      saveEmailToStorage(email, true);
      return { success: true };
    }

    // Parse JSON response
    let data: EmailCollectionResponse;
    try {
      data = JSON.parse(text);
      console.log('[email] Response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('[email] Failed to parse response as JSON:', text);
      saveEmailToStorage(email, false);
      return {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Webhook returned invalid JSON response',
        },
      };
    }

    if (data.success) {
      // Save to localStorage with success flag
      saveEmailToStorage(email, true);
      console.log('[email] Email collected successfully');
    } else {
      // Save to localStorage with failed flag for retry
      saveEmailToStorage(email, false);
      console.log('[email] Email collection failed, will retry later');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[email] Request timeout after', TIMEOUT_MS, 'ms');

        // Save to localStorage with failed flag for retry
        saveEmailToStorage(email, false);

        // Don't throw error - allow user to proceed
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timeout - will retry later',
          },
        };
      }

      console.error('[email] Error:', error.message);

      // Save to localStorage with failed flag for retry
      saveEmailToStorage(email, false);

      // Don't throw error - allow user to proceed
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message,
        },
      };
    }

    console.error('[email] Unexpected error:', error);

    // Save to localStorage with failed flag for retry
    saveEmailToStorage(email, false);

    // Don't throw error - allow user to proceed
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
};

/**
 * Retry email collection silently in background
 * Called on user actions (step navigation, project creation, etc.)
 *
 * This function checks if there's a pending email retry, and if so,
 * attempts to send the email to n8n again. It runs silently without
 * blocking user interaction or showing errors.
 *
 * @returns Promise resolving when retry completes (success or failure)
 */
export const retryEmailCollection = async (): Promise<void> => {
  if (!needsEmailRetry()) {
    return; // No retry needed
  }

  const stored = getEmailFromStorage();
  if (!stored) {
    return; // No stored email
  }

  console.log('[email-retry] Attempting silent retry for:', stored.email);

  try {
    const result = await collectEmail(stored.email);
    if (result.success) {
      console.log('[email-retry] Retry successful');
      markEmailPassedToN8n();
    } else {
      console.log('[email-retry] Retry failed, will try again later');
    }
  } catch (error) {
    console.error('[email-retry] Retry error:', error);
    // Silently fail - will retry on next user action
  }
};
