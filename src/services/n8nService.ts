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
} from '@/types';

import type { CriterionScoreDetail } from '@/types/comparison.types';

// ===========================================
// Configuration
// ===========================================

const N8N_PROJECT_CREATION_URL = 'https://n8n.lakestrom.com/webhook/clarioo-project-creation';
const N8N_CRITERIA_CHAT_URL = 'https://n8n.lakestrom.com/webhook/clarioo-criteria-chat';
const N8N_FIND_VENDORS_URL = 'https://n8n.lakestrom.com/webhook/clarioo-find-vendors';
const TIMEOUT_MS = 120000; // 2 minutes for project creation and criteria chat
const VENDOR_SEARCH_TIMEOUT_MS = 120000; // 2 minutes for vendor search

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

    console.log('[n8n] Sending request to:', N8N_PROJECT_CREATION_URL);
    console.log('[n8n] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(N8N_PROJECT_CREATION_URL, {
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

    console.log('[n8n-chat] Sending request to:', N8N_CRITERIA_CHAT_URL);

    const response = await fetch(N8N_CRITERIA_CHAT_URL, {
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

    console.log('[n8n-vendors] Sending request to:', N8N_FIND_VENDORS_URL);

    const response = await fetch(N8N_FIND_VENDORS_URL, {
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

const N8N_COMPARE_VENDORS_URL = 'https://n8n.lakestrom.com/webhook/clarioo-compare-vendors';
const N8N_EXECUTIVE_SUMMARY_URL = 'https://n8n.lakestrom.com/webhook/clarioo-executive-summary';
const COMPARE_VENDOR_TIMEOUT_MS = 120000; // 2 minutes per vendor

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

    console.log('[n8n-compare] Sending request for:', vendor.name);

    const response = await fetch(N8N_COMPARE_VENDORS_URL, {
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

    console.log('[n8n-summary] Sending request to:', N8N_EXECUTIVE_SUMMARY_URL);

    const response = await fetch(N8N_EXECUTIVE_SUMMARY_URL, {
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

    const result: ExecutiveSummaryResponse = await response.json();

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
