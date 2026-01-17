/**
 * Template Service
 *
 * This service handles template-related operations including:
 * - Loading templates from JSON data (legacy)
 * - Loading templates from n8n Data Tables (SP_028 MVP)
 * - Filtering templates by category
 * - Creating projects from templates
 * - Uploading/deleting templates (admin only)
 * - Template usage tracking
 *
 * @module services/templateService
 */

import type { Template } from '@/types/template.types';
import type { Criterion } from '@/types/criteria.types';
import type { Project } from '@/types/project.types';
import templatesData from '@/data/templates/templates.json';
import { getTemplatesUrl } from '@/config/webhooks';

/**
 * Generate unique ID for projects
 */
const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Load all templates from JSON data
 *
 * @returns Promise resolving to array of all templates
 *
 * @example
 * ```typescript
 * const templates = await getTemplates();
 * console.log(`Loaded ${templates.length} templates`);
 * ```
 */
export async function getTemplates(): Promise<Template[]> {
  // Simulate async loading (useful for future API integration)
  return Promise.resolve(templatesData as Template[]);
}

/**
 * Get template by ID
 *
 * @param id - Template ID to find
 * @returns Template if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const template = getTemplateById('luxury-fashion-retailer-001');
 * if (template) {
 *   console.log(`Found template: ${template.name}`);
 * }
 * ```
 */
export function getTemplateById(id: string): Template | undefined {
  return (templatesData as Template[]).find(t => t.templateId === id);
}

/**
 * Get unique categories from all templates
 *
 * @returns Array of unique category names
 *
 * @example
 * ```typescript
 * const categories = getTemplateCategories();
 * // Returns: ['CX Platform', 'Project Management', 'CRM', ...]
 * ```
 */
export function getTemplateCategories(): string[] {
  const templates = templatesData as Template[];
  const categories = templates.map(t => t.category);
  return Array.from(new Set(categories)).sort();
}

/**
 * Filter templates by categories
 *
 * @param templates - Array of templates to filter
 * @param categories - Array of category names to filter by
 * @returns Filtered templates matching any of the specified categories
 *
 * @example
 * ```typescript
 * const allTemplates = await getTemplates();
 * const cxTemplates = filterTemplatesByCategories(allTemplates, ['CX Platform']);
 * ```
 */
export function filterTemplatesByCategories(
  templates: Template[],
  categories: string[]
): Template[] {
  if (categories.length === 0) {
    return templates;
  }
  return templates.filter(t => categories.includes(t.category));
}

/**
 * Get projects from localStorage
 *
 * @returns Array of projects
 */
function getProjects(): Project[] {
  try {
    const data = localStorage.getItem('clarioo_projects');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading projects from localStorage:', error);
    return [];
  }
}

/**
 * Create project from template
 *
 * This function:
 * 1. Generates a new project ID
 * 2. Creates a project object with template data
 * 3. Saves project to localStorage
 * 4. Saves criteria to localStorage
 * 5. Saves workflow state to localStorage
 *
 * @param template - Template to create project from
 * @returns Promise with project ID and success status
 *
 * @example
 * ```typescript
 * const template = getTemplateById('luxury-fashion-retailer-001');
 * if (template) {
 *   const result = await createProjectFromTemplate(template);
 *   if (result.success) {
 *     console.log(`Created project: ${result.projectId}`);
 *     navigate(`/vendor-discovery/${result.projectId}`);
 *   }
 * }
 * ```
 *
 * @remarks
 * - Does NOT call n8n webhook (templates are pre-configured)
 * - Saves to localStorage only
 * - Sets currentStep to 'criteria-builder' (user can review/modify criteria)
 * - Transforms template criteria to match app format
 */
export async function createProjectFromTemplate(
  template: Template
): Promise<{ projectId: string; success: boolean; error?: string }> {
  try {
    // SP_030: Check if template has JSON data (new format from n8n)
    // Templates uploaded via JSON or Excel will have template_data_json field
    if (template.template_data_json) {
      console.log('[templateService SP_030] Using JSON template format');

      try {
        // SP_030 FIX: n8n may return template_data_json as already-parsed object or as string
        // Check type before parsing to avoid "[object Object]" error
        const jsonData = typeof template.template_data_json === 'string'
          ? JSON.parse(template.template_data_json)
          : template.template_data_json;

        return await createProjectFromJSONTemplate(jsonData);
      } catch (parseError) {
        console.error('[templateService SP_030] Failed to parse template_data_json, falling back to legacy:', parseError);
        // Fall through to legacy handling
      }
    }

    // LEGACY: Handle old static templates (without template_data_json)
    console.log('[templateService] Using legacy template format');

    // 1. Generate project ID
    const projectId = generateId();
    const now = new Date().toISOString();

    // 2. Use company description from template
    // searchedBy contains the company context (e.g., "Luxury Fashion Retailer – 30+ boutiques")
    const description = template.searchedBy || template.projectName;

    // 3. Create project object
    const project: Project = {
      id: projectId,
      name: template.projectName,
      description: description,
      category: template.softwareCategory || template.templateCategory,
      status: 'in-progress',
      created_at: now,
      updated_at: now,
    };

    // 4. Save to localStorage - projects list
    const projects = getProjects();
    projects.push(project);
    localStorage.setItem('clarioo_projects', JSON.stringify(projects));

    // 5. Transform and save criteria
    // Template criteria use Criterion interface, need to ensure isArchived is set
    const criteria: Criterion[] = template.criteria.map(c => ({
      ...c,
      isArchived: c.isArchived || false,
      explanation: c.explanation || '',
    }));

    localStorage.setItem(`criteria_${projectId}`, JSON.stringify(criteria));

    // 6. Save workflow state
    // Calculate maxStepReached based on available template data
    // Step indices: 0=criteria, 1=vendor-selection, 2=vendor-comparison, 3=invite-pitch
    let maxStepReached = 0; // At minimum, criteria is available

    if (template.vendors && template.vendors.length > 0) {
      maxStepReached = 1; // Vendors available, can access vendor-selection
    }

    if (template.comparisonMatrix && (template.comparisonMatrix.stage1_results || template.comparisonMatrix.stage2_results)) {
      maxStepReached = 2; // Comparison data available, can access vendor-comparison
    }

    // Note: We don't automatically set maxStepReached to 3 (invite-pitch) as that's a manual action

    const workflowState = {
      projectId: projectId,
      currentStep: 'criteria' as const,
      maxStepReached: maxStepReached,
      lastSaved: now,
      techRequest: {
        category: template.softwareCategory || template.templateCategory,
        description: description,
        companyInfo: template.searchedBy || '',
        solutionRequirements: template.keyFeatures || '',
      },
      criteria: criteria,
      selectedVendors: template.vendors || [],
    };

    localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));

    // 6b. Save vendors for VendorSelection component
    // The VendorSelection component expects vendors in vendors_{projectId}
    if (template.vendors && template.vendors.length > 0) {
      localStorage.setItem(`vendors_${projectId}`, JSON.stringify(template.vendors));

      // Select all vendors by default
      const vendorIds = template.vendors.map(v => v.id);
      localStorage.setItem(`vendor_selection_${projectId}`, JSON.stringify(vendorIds));

      console.log('[templateService] Saved vendors for VendorSelection:', template.vendors.length);
    }

    // 7. Save comparison results if available
    // Declare these outside the if block for logging
    let stage1Source: any = null;
    let stage2Source: any = null;
    let stage1CellCount = 0; // Track actual saved cells

    if (template.comparisonMatrix) {
      // Check if stage1_results/stage2_results are already wrapped or just the results object
      stage1Source = template.comparisonMatrix.stage1_results as any;
      stage2Source = template.comparisonMatrix.stage2_results as any;

      // Stage 1 results (individual vendor-criterion research)
      if (stage1Source) {
        // Check if already wrapped with projectId and results
        const stage1ResultsFlat = stage1Source.results || stage1Source;

        // Transform flat keys ("vendor_001:crit_001") to nested structure
        // Hook expects: results[criterion.id][vendor.id] = cellData
        const stage1ResultsNested: Record<string, Record<string, any>> = {};

        for (const criterion of criteria) {
          stage1ResultsNested[criterion.id] = {};

          for (const vendor of (template.vendors || [])) {
            const cellKey = `${vendor.id}:${criterion.id}`;
            const cellData = stage1ResultsFlat[cellKey];

            if (cellData) {
              stage1ResultsNested[criterion.id][vendor.id] = {
                status: 'completed' as const,
                value: cellData.match_status || '',
                evidenceUrl: cellData.source_urls?.[0] || '',
                evidenceDescription: cellData.evidence_description || '',
                comment: cellData.research_notes || '',
              };
              stage1CellCount++; // Count each saved cell
            }
          }
        }

        const stage1Data = {
          projectId: projectId,
          results: stage1ResultsNested,
          timestamp: now,
        };
        localStorage.setItem(`stage1_results_${projectId}`, JSON.stringify(stage1Data));
      }

      // Stage 2 results (comparative rankings)
      if (stage2Source) {
        // Check if already wrapped with projectId and results
        const stage2Results = stage2Source.results || stage2Source;

        const stage2Data = {
          projectId: projectId,
          results: stage2Results,
          timestamp: now,
        };
        localStorage.setItem(`stage2_results_${projectId}`, JSON.stringify(stage2Data));
      }

      // Comparison state (orchestration state for the two-stage comparison)
      // Build criteria state from stage1/stage2 results
      const criteriaState: Record<string, any> = {};

      // Get the actual results objects
      const stage1Results = stage1Source?.results || stage1Source || {};
      const stage2Results = stage2Source?.results || stage2Source || {};

      for (const criterion of criteria) {
        // Build cells object for this criterion from stage1 results
        // Stage 1 results are keyed as "vendorId:criterionId"
        const cells: Record<string, any> = {};

        for (const vendor of (template.vendors || [])) {
          const cellKey = `${vendor.id}:${criterion.id}`;
          const cellData = stage1Results[cellKey];

          if (cellData) {
            cells[vendor.id] = {
              status: 'completed' as const,
              value: cellData.match_status || '',
              evidenceUrl: cellData.source_urls?.[0] || '',
              evidenceDescription: cellData.evidence_description || '',
              comment: cellData.research_notes || '',
            };
          }
        }

        // Get stage2 data for this criterion
        const stage2Row = stage2Results[criterion.id];

        criteriaState[criterion.id] = {
          criterionId: criterion.id,
          stage1Complete: Object.keys(cells).length > 0,
          stage2Status: stage2Row ? 'completed' as const : 'pending' as const,
          cells: cells,
          criterionInsight: stage2Row?.criterionInsight,
          starsAwarded: stage2Row?.starsAwarded,
        };
      }

      const comparisonState = {
        criteria: criteriaState,
        activeWorkflows: 0,
        isPaused: false,
        currentCriterionIndex: criteria.length, // All criteria completed
        lastUpdated: now,
      };

      localStorage.setItem(`comparison_state_${projectId}`, JSON.stringify(comparisonState));
    }

    // 8. Save battlecards if available
    if (template.battlecards && Array.isArray(template.battlecards) && template.battlecards.length > 0) {
      // Save battlecards rows
      localStorage.setItem(`clarioo_battlecards_rows_${projectId}`, JSON.stringify(template.battlecards));

      // Save battlecards state
      const battlecardsState = {
        rows: template.battlecards,
        status: 'completed' as const,
        current_row_index: template.battlecards.length,
        timestamp: now,
      };
      localStorage.setItem(`clarioo_battlecards_state_${projectId}`, JSON.stringify(battlecardsState));
    }

    // 9. Save executive summary if available and has data
    // Transform template format to ExecutiveSummaryData format for consistency
    if (template.executiveSummary && Object.keys(template.executiveSummary).length > 0) {
      const templateSummary = template.executiveSummary as any;

      // Check if has required vendor data
      const hasVendorRecommendations = templateSummary.vendorRecommendations && Array.isArray(templateSummary.vendorRecommendations) && templateSummary.vendorRecommendations.length > 0;

      if (hasVendorRecommendations) {
        // Transform to ExecutiveSummaryData format
        const transformedSummary = {
          keyCriteria: templateSummary.keyCriteria || [],
          vendorRecommendations: templateSummary.vendorRecommendations || [],
          keyDifferentiators: templateSummary.keyDifferentiators || [],
          riskFactors: templateSummary.riskFactors || {
            vendorSpecific: [],
            generalConsiderations: []
          },
          recommendation: templateSummary.recommendation || {
            topPick: '',
            reason: '',
            considerations: []
          }
        };

        // Wrap in same format as n8n (consistent with JSON template path)
        localStorage.setItem(`clarioo_executive_summary_${projectId}`, JSON.stringify({
          data: transformedSummary,
          generated_at: now
        }));
        console.log('[templateService] Saved executive summary in ExecutiveSummaryData format');
      } else {
        console.log('[templateService] Skipping executive summary save - no vendor recommendations');
      }
    }

    // 10. Save positioning data if available
    if (template.positioningData) {
      localStorage.setItem(`positioning_data_${projectId}`, JSON.stringify(template.positioningData));
    }

    // Calculate stage2 results count for logging
    const stage2Count = stage2Source?.results ? Object.keys(stage2Source.results).length : 0;

    console.log('[templateService] Created project from template:', {
      projectId,
      templateId: template.templateId,
      projectName: template.projectName,
      description,
      criteriaCount: criteria.length,
      vendorsCount: template.vendors?.length || 0,
      maxStepReached,
      hasComparisonMatrix: !!template.comparisonMatrix,
      stage1ResultsCount: stage1CellCount,
      stage2ResultsCount: stage2Count,
      hasBattlecards: !!template.battlecards?.length,
      hasExecutiveSummary: !!template.executiveSummary,
      hasPositioningData: !!template.positioningData,
    });

    return { projectId, success: true };
  } catch (error) {
    console.error('[templateService] Error creating project from template:', error);
    return {
      projectId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}

// ============================================================================
// SP_028 MVP: n8n Template Manager Integration (Tabs 0-2 Only)
// ============================================================================

/**
 * Get n8n endpoint based on webhook mode (testing or production)
 *
 * @deprecated Use getTemplatesUrl() from '@/config/webhooks' instead
 * @param webhookName - Name of the webhook (e.g., 'templates')
 * @returns Full webhook URL
 *
 * @example
 * ```typescript
 * // OLD (deprecated):
 * const endpoint = getN8nEndpoint('templates');
 *
 * // NEW (recommended):
 * import { getTemplatesUrl } from '@/config/webhooks';
 * const endpoint = getTemplatesUrl();
 * ```
 */
function getN8nEndpoint(webhookName: string): string {
  // DEPRECATED: Use webhook mode toggle system instead
  // This function now delegates to getTemplatesUrl()
  console.warn('[templateService] getN8nEndpoint is deprecated - use getTemplatesUrl() from webhooks.ts');
  return getTemplatesUrl();
}

/**
 * Get user ID from localStorage
 *
 * @returns User ID or generated UUID if not found
 */
function getUserId(): string {
  let userId = localStorage.getItem('clarioo_user_id');

  if (!userId) {
    userId = generateId();
    localStorage.setItem('clarioo_user_id', userId);
  }

  return userId;
}

/**
 * Get all templates from n8n Data Tables
 *
 * SP_028 MVP: Returns basic templates (tabs 0-2: metadata, criteria, vendors)
 *
 * @param category - Optional category filter
 * @returns Promise resolving to array of templates
 *
 * @example
 * ```typescript
 * const templates = await getTemplatesFromN8n();
 * const cxTemplates = await getTemplatesFromN8n('CX Platform');
 * ```
 */
export async function getTemplatesFromN8n(
  category?: string
): Promise<Template[]> {
  try {
    const endpoint = getN8nEndpoint('templates');

    const body: { action: string; category?: string } = { action: 'list' };
    if (category) body.category = category;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch templates');
    }

    console.log('[templateService SP_030] Fetched templates from n8n:', {
      count: data.templates?.length || 0,
      templates: data.templates
    });

    // SP_030: Parse template_data_json for each template (5-column schema)
    // n8n returns camelCase field names (auto-converted from snake_case)
    // Support both naming conventions for backward compatibility
    const parsedTemplates = (data.templates || []).map((template: any) => {
      try {
        // SP_030 FIX: n8n auto-converts template_data_json → templateData (camelCase)
        // Support both field names for backward compatibility
        const rawTemplateData = template.templateData || template.template_data_json;

        // Parse the template data field (contains complete JSONExportData)
        const templateDataJson = typeof rawTemplateData === 'string'
          ? JSON.parse(rawTemplateData)
          : rawTemplateData;

        // Detect format: JSONExportData has .metadata and .project, ExportProjectData is flat
        const isJSONExportData = templateDataJson?.metadata && templateDataJson?.project;
        const projectData = isJSONExportData ? templateDataJson.project : templateDataJson;
        const metadata = isJSONExportData ? templateDataJson.metadata : {};

        // DEBUG: Log battlecards data presence
        console.log('[templateService DEBUG] Template data inspection:', {
          templateId: template.templateId || template.template_id,
          templateName: template.templateName || template.template_name,
          hasBattlecards: !!projectData?.battlecards,
          battlecardsCount: projectData?.battlecards?.length || 0,
          battlecardsFirstRow: projectData?.battlecards?.[0],
          hasVendors: !!projectData?.vendors,
          vendorsCount: projectData?.vendors?.length || 0,
          hasCriteria: !!projectData?.criteria,
          criteriaCount: projectData?.criteria?.length || 0,
          hasComparisonMatrix: !!projectData?.comparisonMatrix,
          projectDataKeys: Object.keys(projectData || {})
        });

        // SP_030: Derive all display fields from template_data_json
        // Support both snake_case and camelCase field names from n8n
        return {
          templateId: template.templateId || template.template_id,
          templateCategory: template.templateCategory || template.template_category,
          projectName: template.templateName || template.template_name,
          searchedBy: metadata.searchedBy || '',
          projectDescription: metadata.projectDescription || '',
          softwareCategory: metadata.softwareCategory || template.templateCategory || template.template_category,
          keyFeatures: metadata.keyFeatures || '',
          clientQuote: metadata.clientQuote || null,
          currentTool: metadata.currentTools || null,
          // Extract complete project data from template_data_json
          criteria: projectData?.criteria || [],
          vendors: projectData?.vendors || [],
          comparisonMatrix: projectData?.comparisonMatrix,
          // Support both 'battlecards' (export format) and 'battlecardsRows' (localStorage format)
          battlecards: projectData?.battlecards || projectData?.battlecardsRows,
          executiveSummary: projectData?.executiveSummary || projectData?.preDemoBrief,
          positioningData: projectData?.scatterPlot,
          // SP_030: Extract vendorSummaries for vendor card details (killerFeature, executiveSummary, keyFeatures)
          vendorSummaries: templateDataJson?.vendorSummaries || {},
          // SP_030: Include the complete JSON for project creation (use original field name)
          template_data_json: rawTemplateData,
        };
      } catch (error) {
        console.error('[templateService SP_030] Error parsing template_data_json:', error, template);
        // Return template with minimal data to prevent crashes
        return {
          templateId: template.templateId || template.template_id,
          templateCategory: template.templateCategory || template.template_category,
          projectName: template.templateName || template.template_name,
          searchedBy: '',
          projectDescription: '',
          softwareCategory: template.templateCategory || template.template_category,
          keyFeatures: '',
          clientQuote: null,
          currentTool: null,
          criteria: [],
          vendors: [],
          template_data_json: template.templateData || template.template_data_json,
        };
      }
    });

    return parsedTemplates;
  } catch (error) {
    console.error('[templateService] Error fetching templates from n8n:', error);
    // SP_028: Return empty array on error (no legacy template fallback)
    return [];
  }
}

/**
 * Get single template by ID from n8n Data Tables
 *
 * SP_028 MVP: Returns complete template data (tabs 0-2)
 *
 * @param templateId - Template ID to fetch
 * @returns Promise resolving to template or null if not found
 *
 * @example
 * ```typescript
 * const template = await getTemplateByIdFromN8n('tpl_550e8400-e29b-41d4-a716-446655440000');
 * if (template) {
 *   console.log(`Found template: ${template.lookingFor}`);
 * }
 * ```
 */
export async function getTemplateByIdFromN8n(
  templateId: string
): Promise<Template | null> {
  try {
    const endpoint = getN8nEndpoint('templates');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get',
        template_id: templateId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch template');
    }

    // SP_030: Parse template_data_json (5-column schema)
    if (data.template) {
      try {
        const template = data.template;

        // SP_030 FIX: n8n auto-converts template_data_json → templateData (camelCase)
        // Support both field names for backward compatibility
        const rawTemplateData = template.templateData || template.template_data_json;

        // Parse the template data field (contains complete JSONExportData)
        const templateDataJson = typeof rawTemplateData === 'string'
          ? JSON.parse(rawTemplateData)
          : rawTemplateData;

        // Detect format: JSONExportData has .metadata and .project, ExportProjectData is flat
        const isJSONExportData = templateDataJson?.metadata && templateDataJson?.project;
        const projectData = isJSONExportData ? templateDataJson.project : templateDataJson;
        const metadata = isJSONExportData ? templateDataJson.metadata : {};

        return {
          templateId: template.templateId || template.template_id,
          templateCategory: template.templateCategory || template.template_category,
          projectName: template.templateName || template.template_name,
          searchedBy: metadata.searchedBy || '',
          projectDescription: metadata.projectDescription || '',
          softwareCategory: metadata.softwareCategory || template.templateCategory || template.template_category,
          keyFeatures: metadata.keyFeatures || '',
          clientQuote: metadata.clientQuote || null,
          currentTool: metadata.currentTools || null,
          criteria: projectData?.criteria || [],
          vendors: projectData?.vendors || [],
          comparisonMatrix: projectData?.comparisonMatrix,
          battlecards: projectData?.battlecards,
          executiveSummary: projectData?.executiveSummary,
          positioningData: projectData?.scatterPlot,
          // SP_030: Include the complete JSON for project creation
          template_data_json: rawTemplateData,
        };
      } catch (error) {
        console.error('[templateService SP_030] Error parsing template_data_json:', error);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('[templateService] Error fetching template from n8n:', error);
    return null;
  }
}

/**
 * Upload template Excel file to n8n
 *
 * SP_028 MVP: Parses tabs 0-2 (INDEX, Criteria, Vendors)
 *
 * @param file - Excel file to upload
 * @param userId - User ID performing upload
 * @param category - Optional category override
 * @returns Promise with success status and template ID
 *
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * const result = await uploadTemplateExcel(file, 'user_123', 'CX Platform');
 *
 * if (result.success) {
 *   console.log(`Template uploaded: ${result.templateId}`);
 * } else {
 *   console.error(`Upload failed: ${result.error}`);
 * }
 * ```
 */
export async function uploadTemplateExcel(
  file: File,
  userId: string,
  category?: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const endpoint = getN8nEndpoint('templates');

    const formData = new FormData();
    formData.append('action', 'upload');
    formData.append('excel_file', file);
    formData.append('user_id', userId);
    if (category) formData.append('category', category);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error?.message || 'Upload failed'
      };
    }

    return {
      success: true,
      templateId: data.template_id
    };
  } catch (error) {
    console.error('[templateService] Error uploading template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// ============================================================================
// SP_029: Excel Template Upload with Zero Transformation
// ============================================================================

/**
 * Upload template with parsed JSON data (SP_029)
 *
 * This function implements the zero-transformation approach:
 * 1. Frontend parses Excel → ExportProjectData JSON
 * 2. Upload complete JSON to n8n Data Tables
 * 3. Frontend uses JSON directly (NO transformations)
 *
 * @param templateData - Parsed ExportProjectData from excelImportService
 * @param userId - User ID performing upload
 * @returns Promise with success status and template ID
 *
 * @example
 * ```typescript
 * import { importExcelTemplate } from '@/services/excelImportService';
 *
 * const result = await importExcelTemplate({ file: excelFile });
 * if (result.success && result.data) {
 *   const uploadResult = await uploadTemplateWithJSON(result.data, getUserId());
 *   if (uploadResult.success) {
 *     console.log(`Template uploaded: ${uploadResult.templateId}`);
 *   }
 * }
 * ```
 */
export async function uploadTemplateWithJSON(
  templateData: any, // ExportProjectData type
  userId: string
): Promise<{ success: boolean; templateId?: string; error?: string; warnings?: string[] }> {
  try {
    const endpoint = getN8nEndpoint('templates');

    // Generate template ID
    const template_id = crypto.randomUUID();

    // Build complete template object with all 21 required fields for n8n
    const template = {
      template_id,
      template_name: templateData.projectName || 'Untitled Template',
      project_description: templateData.projectDescription || '',
      template_category: templateData.metadata?.category || templateData.metadata?.softwareCategory || 'Uncategorized',
      searched_by: templateData.metadata?.searchedBy || '',
      software_category: templateData.metadata?.softwareCategory || '',
      key_features: templateData.metadata?.keyFeatures || '',
      client_quote: templateData.metadata?.clientQuote || '',
      current_tools: templateData.metadata?.currentTools || '',
      company_context: templateData.techRequest?.companyContext || templateData.metadata?.companyContext || '',
      solution_requirements: templateData.techRequest?.solutionRequirements || templateData.metadata?.solutionRequirements || '',
      criteria_count: templateData.criteria?.length || 0,
      vendors_count: templateData.vendors?.length || 0,
      has_comparison_matrix: !!templateData.comparisonMatrix,
      has_battlecards: !!(templateData.battlecards && templateData.battlecards.length > 0),
      has_executive_summary: !!templateData.executiveSummary,
      project_stage: templateData.stage || 'criteria_only',
      template_data_json: JSON.stringify(templateData), // Store complete JSON
      user_id: userId,
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Send to n8n
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload_json',
        template: template
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error?.message || 'Upload failed',
        warnings: data.warnings
      };
    }

    console.log('[templateService SP_029] Template JSON uploaded successfully:', {
      templateId: data.template_id,
      projectName: templateData.projectName,
      criteriaCount: templateData.criteria?.length || 0,
      vendorsCount: templateData.vendors?.length || 0,
    });

    return {
      success: true,
      templateId: data.template_id,
      warnings: data.warnings
    };
  } catch (error) {
    console.error('[templateService SP_029] Error uploading template JSON:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload JSON template to n8n Data Tables (SP_030)
 *
 * This function uploads a complete JSONExportData structure (from jsonExportService)
 * to n8n Data Tables. It replaces the Excel upload approach (SP_029) with a simpler
 * JSON-based approach.
 *
 * @param jsonData - Complete JSONExportData from export
 * @param userId - User ID from localStorage
 * @returns Promise with success status, template ID, and optional warnings
 *
 * @example
 * ```typescript
 * import { exportProjectToJSON } from '@/services/jsonExportService';
 * import { uploadJSONTemplate } from '@/services/templateService';
 *
 * const jsonData = await exportProjectToJSON(projectId);
 * const result = await uploadJSONTemplate(jsonData, getUserId());
 * if (result.success) {
 *   console.log(`Template uploaded: ${result.templateId}`);
 * }
 * ```
 *
 * @remarks
 * KEY DIFFERENCES FROM SP_029:
 * - Accepts JSONExportData (with metadata wrapper) instead of ExportProjectData
 * - Includes vendorSummaries data (not available in Excel export)
 * - Stores complete JSONExportData in template_data_json
 * - Simpler validation (no Excel parsing errors)
 * - rawLocalStorage is stored but NOT used when creating projects
 */
export async function uploadJSONTemplate(
  jsonData: any, // JSONExportData type
  userId: string
): Promise<{ success: boolean; templateId?: string; error?: string; warnings?: string[] }> {
  try {
    const endpoint = getN8nEndpoint('templates');

    // Validate JSONExportData structure
    if (!jsonData.metadata || !jsonData.project) {
      throw new Error('Invalid JSON format - must be exported from Clarioo using Export → Download JSON');
    }

    // Generate template ID
    const template_id = crypto.randomUUID();

    // SIMPLIFIED: Only store 5 essential fields
    // Everything else is derivable from template_data_json
    const template = {
      template_id,
      template_name: jsonData.metadata.projectName || 'Untitled Template',
      template_category: jsonData.metadata.projectCategory || jsonData.metadata.softwareCategory || 'Uncategorized',
      template_data_json: JSON.stringify(jsonData), // Complete JSONExportData with everything
      uploaded_at: new Date().toISOString(),
    };

    console.log('[templateService SP_030] Uploading JSON template:', {
      templateName: template.template_name,
      templateCategory: template.template_category,
      criteriaCount: jsonData.project.criteria?.length || 0,
      vendorsCount: jsonData.project.vendors?.length || 0,
      hasVendorSummaries: !!jsonData.vendorSummaries,
    });

    // Send to n8n
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload_json',
        template: template
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error?.message || 'Upload failed',
        warnings: data.warnings
      };
    }

    console.log('[templateService SP_030] JSON template uploaded successfully:', {
      templateId: data.template_id,
      projectName: jsonData.metadata.projectName,
      criteriaCount: jsonData.project.criteria?.length || 0,
      vendorsCount: jsonData.project.vendors?.length || 0,
    });

    return {
      success: true,
      templateId: data.template_id,
      warnings: data.warnings
    };
  } catch (error) {
    console.error('[templateService SP_030] Error uploading JSON template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Create project from ExportProjectData template (SP_029)
 *
 * This function creates a project from the new ExportProjectData format
 * with ZERO transformations. The data is used exactly as stored in n8n.
 *
 * @param templateData - ExportProjectData from n8n
 * @returns Promise with project ID and success status
 *
 * @example
 * ```typescript
 * const template = await getTemplateByIdFromN8n('tpl_123');
 * if (template.data) {
 *   const result = await createProjectFromExportData(template.data);
 *   if (result.success) {
 *     navigate(`/vendor-discovery/${result.projectId}`);
 *   }
 * }
 * ```
 *
 * @remarks
 * ZERO TRANSFORMATION APPROACH:
 * - ExportProjectData already has the correct structure
 * - No field mapping, no nested transformations
 * - Direct save to localStorage
 * - Eliminates all transformation bugs
 */
export async function createProjectFromExportData(
  templateData: any // ExportProjectData type
): Promise<{ projectId: string; success: boolean; error?: string }> {
  try {
    // 1. Generate new project ID
    const projectId = generateId();
    const now = new Date().toISOString();

    // 2. Create project object
    const project: Project = {
      id: projectId,
      name: templateData.projectName || 'Untitled Project',
      description: templateData.projectDescription || '',
      category: templateData.metadata?.softwareCategory || templateData.metadata?.category || 'Other',
      status: 'in-progress',
      created_at: now,
      updated_at: now,
    };

    // 3. Save to localStorage - projects list
    const projects = getProjects();
    projects.push(project);
    localStorage.setItem('clarioo_projects', JSON.stringify(projects));

    // 4. Save criteria (ZERO transformation - use directly)
    const criteria = templateData.criteria || [];
    localStorage.setItem(`criteria_${projectId}`, JSON.stringify(criteria));

    // 5. Save vendors (ZERO transformation - use directly)
    const vendors = templateData.vendors || [];
    if (vendors.length > 0) {
      localStorage.setItem(`vendors_${projectId}`, JSON.stringify(vendors));

      // Select all vendors by default
      const vendorIds = vendors.map((v: any) => v.id);
      localStorage.setItem(`vendor_selection_${projectId}`, JSON.stringify(vendorIds));
    }

    // 6. Calculate maxStepReached based on available data
    let maxStepReached = 0; // At minimum, criteria is available

    if (vendors.length > 0) {
      maxStepReached = 1; // Vendors available
    }

    if (templateData.comparisonMatrix) {
      maxStepReached = 2; // Comparison data available
    }

    // 7. Save workflow state
    const workflowState = {
      projectId: projectId,
      currentStep: 'criteria' as const,
      maxStepReached: maxStepReached,
      lastSaved: now,
      category: project.category,
      techRequest: {
        companyContext: templateData.metadata?.companyContext || '',
        solutionRequirements: templateData.metadata?.solutionRequirements || '',
      },
      criteria: criteria,
      selectedVendors: vendors,
    };

    localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));

    // 8. Save comparison matrix (if available) - ZERO transformation
    if (templateData.comparisonMatrix) {
      const comparisonMatrix = templateData.comparisonMatrix;

      // Build comparison_state from criteria with matches
      const criteriaState: Record<string, any> = {};

      criteria.forEach((criterion: any) => {
        const cells: Record<string, any> = {};

        // Use matches from criterion (populated by import service)
        if (criterion.matches) {
          Object.entries(criterion.matches).forEach(([vendorId, matchStatus]) => {
            cells[vendorId] = {
              status: 'completed' as const,
              value: matchStatus,
              evidenceUrl: criterion.evidence?.[vendorId]?.sources?.[0] || '',
              evidenceDescription: criterion.evidence?.[vendorId]?.evidenceDescription || '',
              comment: '',
            };
          });
        }

        criteriaState[criterion.id] = {
          criterionId: criterion.id,
          stage1Complete: Object.keys(cells).length > 0,
          stage2Status: 'pending' as const,
          cells: cells,
        };
      });

      const comparisonState = {
        criteria: criteriaState,
        activeWorkflows: 0,
        isPaused: false,
        currentCriterionIndex: criteria.length,
        lastUpdated: now,
      };

      localStorage.setItem(`comparison_state_${projectId}`, JSON.stringify(comparisonState));
    }

    // 9. Save executive summary (if available) - ZERO transformation
    if (templateData.executiveSummary) {
      localStorage.setItem(
        `clarioo_executive_summary_${projectId}`,
        JSON.stringify({
          data: templateData.executiveSummary,
          generated_at: now,
        })
      );
    }

    // 10. Save battlecards (if available) - ZERO transformation
    if (templateData.battlecards && templateData.battlecards.length > 0) {
      localStorage.setItem(`clarioo_battlecards_rows_${projectId}`, JSON.stringify(templateData.battlecards));

      const battlecardsState = {
        rows: templateData.battlecards,
        status: 'completed' as const,
        current_row_index: templateData.battlecards.length,
        timestamp: now,
      };
      localStorage.setItem(`clarioo_battlecards_state_${projectId}`, JSON.stringify(battlecardsState));
    }

    // 11. Save scatter plot data (if available) - ZERO transformation
    if (templateData.scatterPlot) {
      localStorage.setItem(`positioning_data_${projectId}`, JSON.stringify(templateData.scatterPlot));
    }

    console.log('[templateService SP_029] Created project from ExportProjectData (ZERO transformation):', {
      projectId,
      projectName: templateData.projectName,
      criteriaCount: criteria.length,
      vendorsCount: vendors.length,
      maxStepReached,
      hasComparison: !!templateData.comparisonMatrix,
      hasExecutiveSummary: !!templateData.executiveSummary,
      hasBattlecards: !!templateData.battlecards,
      hasScatterPlot: !!templateData.scatterPlot,
    });

    return { projectId, success: true };
  } catch (error) {
    console.error('[templateService SP_029] Error creating project from ExportProjectData:', error);
    return {
      projectId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}

/**
 * Create project from JSON template (SP_030)
 *
 * This function creates a project from JSONExportData (complete JSON export)
 * or ExportProjectData (legacy Excel export) with ZERO transformations.
 *
 * @param jsonData - JSONExportData or ExportProjectData from n8n template
 * @returns Promise with project ID and success status
 *
 * @example
 * ```typescript
 * const template = await getTemplateByIdFromN8n('tpl_123');
 * const templateData = JSON.parse(template.template_data_json);
 * const result = await createProjectFromJSONTemplate(templateData);
 * if (result.success) {
 *   navigate(`/vendor-discovery/${result.projectId}`);
 * }
 * ```
 *
 * @remarks
 * SUPPORTS BOTH FORMATS (backward compatible):
 * 1. JSONExportData (SP_030) - with metadata wrapper and vendorSummaries
 * 2. ExportProjectData (SP_029) - legacy Excel format
 *
 * KEY FEATURES:
 * - ✅ Restores vendor summaries (About, Killer Feature, Key Features)
 * - ✅ Preserves all project data (criteria, vendors, comparison matrix, etc.)
 * - ✅ Zero transformation approach
 * - ❌ Does NOT restore rawLocalStorage (contains user-specific IDs that would conflict)
 */
export async function createProjectFromJSONTemplate(
  jsonData: any // JSONExportData or ExportProjectData
): Promise<{ projectId: string; success: boolean; error?: string }> {
  try {
    // Detect format: JSONExportData has .metadata and .project, ExportProjectData is flat
    const isJSONExportData = jsonData.metadata && jsonData.project;
    const projectData = isJSONExportData ? jsonData.project : jsonData;
    const vendorSummaries = isJSONExportData ? jsonData.vendorSummaries : null;

    console.log('[templateService SP_030] Creating project from JSON template:', {
      format: isJSONExportData ? 'JSONExportData' : 'ExportProjectData',
      hasVendorSummaries: !!vendorSummaries,
      criteriaCount: projectData.criteria?.length || 0,
      vendorsCount: projectData.vendors?.length || 0,
    });

    // 1. Generate new project ID
    const projectId = generateId();
    const now = new Date().toISOString();

    // 2. Create project object
    const project: Project = {
      id: projectId,
      name: projectData.projectName || 'Untitled Project',
      description: projectData.projectDescription || '',
      category: projectData.metadata?.softwareCategory || projectData.metadata?.category || 'Other',
      status: 'in-progress',
      created_at: now,
      updated_at: now,
    };

    // 3. Save to localStorage - projects list
    const projects = getProjects();
    projects.push(project);
    localStorage.setItem('clarioo_projects', JSON.stringify(projects));

    // 4. Save criteria (ZERO transformation - use directly)
    const criteria = projectData.criteria || [];
    localStorage.setItem(`criteria_${projectId}`, JSON.stringify(criteria));

    // 5. Save vendors (ZERO transformation - use directly)
    // Note: vendors will be updated later with criteriaScores from comparison matrix
    let vendors = projectData.vendors || [];
    if (vendors.length > 0) {
      localStorage.setItem(`vendors_${projectId}`, JSON.stringify(vendors));

      // Select all vendors by default
      const vendorIds = vendors.map((v: any) => v.id);
      localStorage.setItem(`vendor_selection_${projectId}`, JSON.stringify(vendorIds));
    }

    // 6. 🆕 SP_030: Restore vendor summaries (if available)
    // This is the KEY difference from SP_029 - vendorSummaries are now included!
    if (vendorSummaries) {
      Object.entries(vendorSummaries).forEach(([vendorName, summary]: [string, any]) => {
        const storageKey = `clarioo_vendor_summary_${vendorName}`;
        localStorage.setItem(storageKey, JSON.stringify(summary));
      });

      console.log('[templateService SP_030] Restored vendor summaries:', {
        count: Object.keys(vendorSummaries).length,
        vendors: Object.keys(vendorSummaries),
      });
    }

    // ❌ DO NOT restore rawLocalStorage
    // We use structured data instead because:
    // - rawLocalStorage contains user-specific IDs that would conflict
    // - rawLocalStorage may contain multiple projects
    // - Structured data (project, vendorSummaries) contains everything needed

    // 7. Save initial workflow state (maxStepReached will be updated later)
    // Note: selectedVendors will be updated after comparison matrix syncing
    const workflowState = {
      projectId: projectId,
      currentStep: 'criteria' as const,
      maxStepReached: 0, // Will be calculated after all data is restored
      lastSaved: now,
      category: project.category,
      techRequest: {
        companyContext: projectData.techRequest?.companyContext || '',
        solutionRequirements: projectData.techRequest?.solutionRequirements || '',
      },
      criteria: criteria,
      selectedVendors: vendors, // Will be updated below if comparison matrix exists
    };

    localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));

    // 9. Save comparison matrix (if available) - ZERO transformation
    if (projectData.comparisonMatrix) {
      // SP_030 FIX: comparisonMatrix from JSON export is already in comparison_state format
      // Just save it directly without transformation
      localStorage.setItem(`comparison_state_${projectId}`, JSON.stringify(projectData.comparisonMatrix));

      console.log('[templateService SP_030] Restored comparison matrix');

      // 🔥 SP_030 FIX: Populate vendors' criteriaScores from comparison matrix
      // The comparison matrix has the actual yes/no/star values in each cell
      // We need to sync these into vendor.criteriaScores for the UI to display correctly
      if (vendors.length > 0) {
        const updatedVendors = vendors.map((vendor: any) => {
          const criteriaScores: Record<string, 'yes' | 'no' | 'unknown' | 'star'> = {};

          // Build criteriaScores from comparison matrix cells
          Object.entries(projectData.comparisonMatrix.criteria).forEach(([criterionId, row]: [string, any]) => {
            const cell = row.cells?.[vendor.id];
            if (cell && cell.value) {
              // Map cell value to criteriaScores format
              // cell.value can be: 'yes', 'no', 'partial', 'star', 'unknown', 'pending'
              if (cell.value === 'yes' || cell.value === 'star') {
                criteriaScores[criterionId] = cell.value;
              } else if (cell.value === 'no') {
                criteriaScores[criterionId] = 'no';
              } else if (cell.value === 'partial') {
                criteriaScores[criterionId] = 'yes'; // Partial counts as yes
              } else {
                criteriaScores[criterionId] = 'unknown';
              }
            } else {
              criteriaScores[criterionId] = 'unknown';
            }
          });

          return {
            ...vendor,
            criteriaScores,
          };
        });

        // Re-save vendors with populated criteriaScores
        localStorage.setItem(`vendors_${projectId}`, JSON.stringify(updatedVendors));

        // Update the workflow state with vendors that have criteriaScores
        workflowState.selectedVendors = updatedVendors;
        localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));

        // Also update the vendors variable for subsequent use
        vendors = updatedVendors;

        console.log('[templateService SP_030] Synced vendor criteriaScores from comparison matrix:', {
          vendorCount: updatedVendors.length,
          criteriaCount: Object.keys(projectData.comparisonMatrix.criteria || {}).length,
          sampleScores: updatedVendors[0]?.criteriaScores ? Object.keys(updatedVendors[0].criteriaScores).length : 0,
        });
      }

      // 🔥 SP_030 FIX #5: Generate stage1_results and stage2_results from comparison matrix
      // useTwoStageComparison hook requires both comparison_state AND stage1_results to load
      // Without stage1_results, the hook won't display the comparison matrix data
      const stage1Results: Record<string, Record<string, any>> = {};
      const stage2Results: Record<string, any> = {};

      Object.entries(projectData.comparisonMatrix.criteria).forEach(([criterionId, row]: [string, any]) => {
        // Build stage1_results (cell-level data for each vendor)
        stage1Results[criterionId] = row.cells || {};

        // Build stage2_results (row-level summaries and stars)
        if (row.criterionInsight || row.starsAwarded) {
          stage2Results[criterionId] = {
            criterionInsight: row.criterionInsight,
            starsAwarded: row.starsAwarded,
            vendorSummaries: row.vendorSummaries || {},
          };
        }
      });

      // Save stage1_results (required by useTwoStageComparison)
      localStorage.setItem(`stage1_results_${projectId}`, JSON.stringify({
        projectId: projectId,
        results: stage1Results,
        timestamp: now,
      }));

      // Save stage2_results (optional row-level summaries)
      localStorage.setItem(`stage2_results_${projectId}`, JSON.stringify({
        projectId: projectId,
        results: stage2Results,
        timestamp: now,
      }));

      console.log('[templateService SP_030] Generated stage1_results and stage2_results from comparison matrix:', {
        stage1Criteria: Object.keys(stage1Results).length,
        stage2Criteria: Object.keys(stage2Results).length,
      });
    }

    // 10. Save executive summary (if available) - ZERO transformation
    // SP_030 FIX: JSON export uses 'preDemoBrief' field name, but we also support 'executiveSummary' for backward compatibility
    const executiveSummaryData = projectData.preDemoBrief || projectData.executiveSummary;
    if (executiveSummaryData) {
      localStorage.setItem(
        `clarioo_executive_summary_${projectId}`,
        JSON.stringify({
          data: executiveSummaryData,
          generated_at: now,
        })
      );

      console.log('[templateService SP_030] Restored executive summary');
    }

    // 11. Save battlecards (if available) - ZERO transformation
    // SP_030 FIX: JSON export uses 'battlecardsRows' and 'battlecardsState' field names
    // Also support 'battlecards' for backward compatibility with older exports
    const battlecardsRows = projectData.battlecardsRows || projectData.battlecards;
    const battlecardsState = projectData.battlecardsState;

    if (battlecardsRows && battlecardsRows.length > 0) {
      localStorage.setItem(`clarioo_battlecards_rows_${projectId}`, JSON.stringify(battlecardsRows));

      // If battlecardsState is provided, use it directly; otherwise create a basic state
      if (battlecardsState) {
        localStorage.setItem(`clarioo_battlecards_state_${projectId}`, JSON.stringify(battlecardsState));
      } else {
        const state = {
          rows: battlecardsRows,
          status: 'completed' as const,
          current_row_index: battlecardsRows.length,
          timestamp: now,
        };
        localStorage.setItem(`clarioo_battlecards_state_${projectId}`, JSON.stringify(state));
      }

      console.log('[templateService SP_030] Restored battlecards:', {
        rowCount: battlecardsRows.length,
        hasState: !!battlecardsState,
      });
    }

    // 12. Save scatter plot data (if available) - ZERO transformation
    if (projectData.scatterPlot) {
      localStorage.setItem(`positioning_data_${projectId}`, JSON.stringify(projectData.scatterPlot));
    }

    // 13. Calculate maxStepReached based on what data was restored
    let maxStepReached = 0;

    if (vendors.length > 0) {
      maxStepReached = 1; // Vendors available
    }

    if (projectData.comparisonMatrix) {
      maxStepReached = 2; // Comparison matrix available
    }

    // SP_030: Use already-declared variables from lines 1269 and 1285
    if (executiveSummaryData) {
      maxStepReached = 3; // Executive summary available
    }

    if (battlecardsRows && battlecardsRows.length > 0) {
      maxStepReached = 4; // Battlecards available
    }

    // 14. Update workflow state with final maxStepReached
    const updatedWorkflowState = {
      ...workflowState,
      maxStepReached,
    };
    localStorage.setItem(`workflow_${projectId}`, JSON.stringify(updatedWorkflowState));

    console.log('[templateService SP_030] Created project from JSON template (ZERO transformation):', {
      projectId,
      projectName: projectData.projectName,
      criteriaCount: criteria.length,
      vendorsCount: vendors.length,
      vendorSummariesRestored: vendorSummaries ? Object.keys(vendorSummaries).length : 0,
      maxStepReached,
      hasComparison: !!projectData.comparisonMatrix,
      hasExecutiveSummary: !!executiveSummaryData,
      hasBattlecards: !!(battlecardsRows && battlecardsRows.length > 0),
      hasScatterPlot: !!projectData.scatterPlot,
    });

    return { projectId, success: true };
  } catch (error) {
    console.error('[templateService SP_030] Error creating project from JSON template:', error);
    return {
      projectId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}

/**
 * Delete template from n8n Data Tables (soft delete)
 *
 * @param templateId - Template ID to delete
 * @param userId - User ID performing deletion
 * @returns Promise with success status
 *
 * @example
 * ```typescript
 * const result = await deleteTemplate('tpl_550e8400-e29b-41d4-a716-446655440000', 'user_123');
 * if (result.success) {
 *   console.log('Template deleted successfully');
 * }
 * ```
 */
export async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const endpoint = getN8nEndpoint('templates');

    // SP_028 FIX: Use POST with action='delete' instead of DELETE method
    // to match n8n webhook configuration (POST only)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        template_id: templateId,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // SP_028 FIX: Handle empty response from n8n webhook
    // Some delete operations return empty body on success
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // No JSON response - if status is OK, consider it successful
      console.log('[templateService] Delete successful (no JSON response)');
      return { success: true };
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      // Empty response - if status is OK, consider it successful
      console.log('[templateService] Delete successful (empty response)');
      return { success: true };
    }

    const data = JSON.parse(text);

    if (!data.success) {
      return {
        success: false,
        error: data.error?.message || 'Delete failed'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[templateService] Error deleting template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Track template usage for analytics
 *
 * @param templateId - Template ID that was used
 * @param userId - User ID who used the template
 * @param projectId - Project ID that was created
 * @returns Promise (non-blocking, errors logged but not thrown)
 *
 * @example
 * ```typescript
 * await trackTemplateUsage('tpl_550e8400-e29b-41d4-a716-446655440000', 'user_123', 'proj_456');
 * ```
 */
export async function trackTemplateUsage(
  templateId: string,
  userId: string,
  projectId: string
): Promise<void> {
  try {
    const endpoint = getN8nEndpoint('templates');

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_usage',
        template_id: templateId,
        user_id: userId,
        project_id: projectId
      })
    });
  } catch (error) {
    console.error('[templateService] Failed to track template usage:', error);
    // Non-blocking error - don't throw
  }
}

/**
 * Export getUserId for use in components
 */
export { getUserId };
