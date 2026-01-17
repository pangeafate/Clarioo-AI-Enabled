/**
 * JSON Export Service
 * Sprint: SP_027 - Excel & JSON Export Feature
 *
 * Service for exporting complete project state to JSON format
 * Includes all localStorage data for full project reconstruction
 */

import { saveAs } from 'file-saver';
import type {
  JSONExportOptions,
  JSONExportData,
  ExportResult,
  ProjectStage,
} from '@/types/export.types';
import type { VendorSummaryData } from '@/services/n8nService';
import {
  generateSP027Filename,
  getProjectLocalStorageKeys,
} from '@/utils/exportHelpers';

/**
 * Sort criteria by category in standard order (Feature → Technical → Business → Compliance → Custom)
 * Same order as displayed in the web app and Excel export
 */
function sortCriteriaByCategory(criteria: any[]): any[] {
  // Group criteria by category
  const groups: Record<string, any[]> = {};

  criteria.forEach((criterion) => {
    const category = (criterion.type || 'other').toLowerCase();
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(criterion);
  });

  // Standard categories in display order
  const standardCategories = ['feature', 'technical', 'business', 'compliance'];

  // Custom categories (anything not in standard list)
  const customCategories = Object.keys(groups).filter(
    (cat) => !standardCategories.includes(cat.toLowerCase())
  );

  // Flatten in display order: Feature → Technical → Business → Compliance → Custom
  const orderedCriteria: any[] = [];
  [...standardCategories, ...customCategories].forEach((category) => {
    if (groups[category]) {
      orderedCriteria.push(...groups[category]);
    }
  });

  return orderedCriteria;
}

/**
 * Detect current project stage based on available data
 *
 * @param projectId - Project ID
 * @returns Detected project stage
 */
function detectProjectStage(projectId: string): ProjectStage {
  // Check what data exists in localStorage
  // CORRECTED: Use actual localStorage keys from the application
  const workflowData = localStorage.getItem(`workflow_${projectId}`);
  const hasCriteria = workflowData ? JSON.parse(workflowData).criteria?.length > 0 : false;
  const hasVendors = workflowData ? JSON.parse(workflowData).selectedVendors?.length > 0 : false;
  const hasComparison = localStorage.getItem(`comparison_state_${projectId}`) !== null;
  const hasBattlecards = localStorage.getItem(`clarioo_battlecards_state_${projectId}`) !== null;
  // Check for Pre-Demo Brief using correct key (with fallback to old key)
  const hasExecutiveSummary =
    localStorage.getItem(`clarioo_executive_summary_${projectId}`) !== null ||
    localStorage.getItem(`stage2_results_${projectId}`) !== null;

  // Determine stage based on available data
  if (hasBattlecards) {
    return 'battlecards_complete';
  }

  if (hasExecutiveSummary) {
    return 'executive_summary';
  }

  if (hasComparison) {
    // Check if detailed matching is complete by looking at comparison state
    const comparisonData = JSON.parse(localStorage.getItem(`comparison_state_${projectId}`) || '{}');
    // If all cells are completed or failed, consider detailed matching done
    const allCellsProcessed = comparisonData.criteria &&
      Object.values(comparisonData.criteria).every((row: any) =>
        Object.values(row.cells || {}).every((cell: any) =>
          cell.status === 'completed' || cell.status === 'failed'
        )
      );
    if (allCellsProcessed) {
      return 'detailed_matching';
    }
    return 'comparison_matrix';
  }

  if (hasVendors) {
    return 'vendors_selected';
  }

  if (hasCriteria) {
    return 'criteria_only';
  }

  return 'criteria_only';
}

/**
 * Collect all localStorage data for a project
 *
 * @param projectId - Project ID
 * @returns Object with all localStorage data
 */
function collectProjectData(projectId: string): Record<string, any> {
  const data: Record<string, any> = {};
  const keys = getProjectLocalStorageKeys(projectId);

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        // Try to parse as JSON
        data[key] = JSON.parse(value);
      } catch {
        // If not JSON, store as string
        data[key] = value;
      }
    }
  }

  return data;
}

/**
 * Export project to JSON format
 *
 * @param options - Export options
 * @returns Export result with success status and filename
 *
 * @example
 * const result = await exportProjectToJSON({
 *   projectId: 'abc123',
 *   projectName: 'CX Platform Selection',
 *   prettyPrint: true
 * });
 *
 * if (result.success) {
 *   console.log(`Exported to ${result.filename}`);
 * }
 */
export async function exportProjectToJSON(
  options: JSONExportOptions
): Promise<ExportResult> {
  const {
    projectId,
    projectName,
    prettyPrint = true,
    includeMetadata = true,
  } = options;

  try {
    // Detect current project stage
    const stage = detectProjectStage(projectId);

    // Collect all project data from localStorage
    const rawLocalStorage = collectProjectData(projectId);

    // Load project metadata from clarioo_projects
    let projectMetadata: any = null;
    let projectDescription: string | undefined;
    let createdAt: string | undefined;
    let updatedAt: string | undefined;

    const projectsData = localStorage.getItem('clarioo_projects');
    if (projectsData) {
      try {
        const projects = JSON.parse(projectsData);
        projectMetadata = projects.find((p: any) => p.id === projectId);
        if (projectMetadata) {
          projectDescription = projectMetadata.description;
          // Note: projectCategory is now a manual placeholder (MANUAL_FILL_IN)
          createdAt = projectMetadata.created_at;
          updatedAt = projectMetadata.updated_at;
          console.log('[JSON Export] Loaded project metadata from clarioo_projects');
        }
      } catch (error) {
        console.error('[JSON Export] Failed to parse clarioo_projects:', error);
      }
    }

    // Load user information
    let userEmail: string | undefined;
    let userId: string | undefined;

    // Get user email
    const emailStorage = localStorage.getItem('clarioo_email');
    if (emailStorage) {
      try {
        const emailData = JSON.parse(emailStorage);
        userEmail = emailData.email;
      } catch (error) {
        console.error('[JSON Export] Failed to parse clarioo_email:', error);
      }
    }

    // Get user ID
    userId = localStorage.getItem('clarioo_user_id') || undefined;

    // Build structured export data
    const exportData: JSONExportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0',
        projectId,
        projectName,
        projectDescription,
        projectCategory: 'MANUAL_FILL_IN',
        stage,
        createdAt,
        updatedAt,
        createdBy: userEmail,
        userId,
        softwareCategory: 'MANUAL_FILL_IN',
        searchedBy: 'MANUAL_FILL_IN',
        keyFeatures: 'MANUAL_FILL_IN, MANUAL_FILL_IN',
        clientQuote: 'MANUAL_FILL_IN',
        currentTools: 'MANUAL_FILL_IN, MANUAL_FILL_IN',
      },
      project: {
        projectId,
        projectName,
        projectDescription,
        createdAt,
        updatedAt,
        stage,
        criteria: [],
        vendors: [],
        // These will be populated from localStorage data
      },
      rawLocalStorage: includeMetadata ? rawLocalStorage : undefined,
    };

    // Parse workflow data (contains criteria and vendors)
    const workflowKey = `workflow_${projectId}`;
    if (rawLocalStorage[workflowKey]) {
      const workflow = rawLocalStorage[workflowKey];
      // Sort criteria by category (Feature → Technical → Business → Compliance → Custom)
      exportData.project.criteria = sortCriteriaByCategory(workflow.criteria || []);
      exportData.project.vendors = workflow.selectedVendors || [];
      exportData.project.techRequest = workflow.techRequest;
      exportData.project.currentStep = workflow.currentStep;

      // Note: projectCategory is now always MANUAL_FILL_IN (removed fallback logic)
    }

    // Load vendor summaries (About, Killer Feature, Key Features)
    // CORRECTED: Use actual key format: clarioo_vendor_summary_{projectId}_{vendorName}
    const vendorSummaries: Record<string, VendorSummaryData> = {};
    const vendors = exportData.project.vendors || [];

    for (const vendor of vendors) {
      const summaryKey = `clarioo_vendor_summary_${projectId}_${vendor.name}`;
      const summaryData = localStorage.getItem(summaryKey);

      if (summaryData) {
        try {
          const parsed = JSON.parse(summaryData);
          // Extract the data property from the stored object
          const summary = parsed.data || parsed;
          vendorSummaries[vendor.name] = summary;
          console.log(`[JSON Export] Loaded vendor summary for ${vendor.name}`);
        } catch (error) {
          console.error(`[JSON Export] Failed to parse vendor summary for ${vendor.name}:`, error);
        }
      }
    }

    // Add vendor summaries to export if any found
    if (Object.keys(vendorSummaries).length > 0) {
      exportData.vendorSummaries = vendorSummaries;
      console.log(`[JSON Export] Included ${Object.keys(vendorSummaries).length} vendor summaries`);
    }

    // Load scatter plot positioning data
    const scatterPlotKey = `vendor_scatterplot_positions_${projectId}`;
    const scatterPlotData = localStorage.getItem(scatterPlotKey);

    if (scatterPlotData) {
      try {
        const scatterPlot = JSON.parse(scatterPlotData);
        exportData.project.scatterPlot = {
          vendors: scatterPlot.positions.map((pos: any) => ({
            id: pos.vendor_id,
            name: pos.vendor_name,
            x: pos.solution_scope,
            y: pos.industry_focus,
            logo: undefined, // Logo URLs are in vendors array
          })),
          chartConfig: {
            width: 900,
            height: 500,
            xAxisLabel: 'Solution Scope (Single-Purpose → Multi-Function)',
            yAxisLabel: 'Industry Focus (Vertical-Specific → Multiple Verticals)',
          },
        };
        console.log('[JSON Export] Included scatter plot positioning data');
      } catch (error) {
        console.error('[JSON Export] Failed to parse scatter plot data:', error);
      }
    }

    // Parse comparison state
    const comparisonKey = `comparison_state_${projectId}`;
    if (rawLocalStorage[comparisonKey]) {
      exportData.project.comparisonMatrix = rawLocalStorage[comparisonKey];
    }

    // Parse stage 1 results
    const stage1Key = `stage1_results_${projectId}`;
    if (rawLocalStorage[stage1Key]) {
      exportData.project.stage1Results = rawLocalStorage[stage1Key];
    }

    // Parse Pre-Demo Brief (executive summary) - CORRECTED to use clarioo_executive_summary key
    const executiveSummaryKey = `clarioo_executive_summary_${projectId}`;
    if (rawLocalStorage[executiveSummaryKey]) {
      const parsed = rawLocalStorage[executiveSummaryKey];
      // Extract data property if present (new format), otherwise use raw data
      exportData.project.preDemoBrief = parsed.data || parsed;
    }

    // Fallback: Try old stage2_results key for backwards compatibility
    const stage2Key = `stage2_results_${projectId}`;
    if (!exportData.project.preDemoBrief && rawLocalStorage[stage2Key]) {
      exportData.project.preDemoBrief = rawLocalStorage[stage2Key];
    }

    // Parse battlecards (state and rows)
    const battlecardsStateKey = `clarioo_battlecards_state_${projectId}`;
    const battlecardsRowsKey = `clarioo_battlecards_rows_${projectId}`;
    if (rawLocalStorage[battlecardsStateKey]) {
      exportData.project.battlecardsState = rawLocalStorage[battlecardsStateKey];
    }
    if (rawLocalStorage[battlecardsRowsKey]) {
      exportData.project.battlecardsRows = rawLocalStorage[battlecardsRowsKey];
    }

    // Convert to JSON string
    const jsonString = prettyPrint
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Generate filename
    const filename = generateSP027Filename(projectName, 'json');

    // Trigger download
    saveAs(blob, filename);

    return {
      success: true,
      format: 'json',
      filename,
      blob,
    };
  } catch (error) {
    console.error('JSON export failed:', error);

    return {
      success: false,
      format: 'json',
      filename: '',
      error: error instanceof Error ? error.message : 'Failed to export to JSON',
      errorCode: 'JSON_SERIALIZATION_FAILED',
    };
  }
}

/**
 * Validate JSON export data structure
 *
 * @param data - JSON export data to validate
 * @returns True if valid, throws error if invalid
 */
export function validateJSONExportData(data: any): boolean {
  // Check required top-level properties
  if (!data.metadata || !data.project) {
    throw new Error('Missing required properties: metadata or project');
  }

  // Check metadata structure
  if (!data.metadata.exportedAt || !data.metadata.projectId || !data.metadata.projectName) {
    throw new Error('Invalid metadata structure');
  }

  // Check project structure
  if (!data.project.projectId || !data.project.projectName || !data.project.stage) {
    throw new Error('Invalid project structure');
  }

  // Check criteria array
  if (!Array.isArray(data.project.criteria)) {
    throw new Error('Project criteria must be an array');
  }

  // Check vendors array
  if (!Array.isArray(data.project.vendors)) {
    throw new Error('Project vendors must be an array');
  }

  return true;
}

/**
 * Calculate export file size (before compression)
 *
 * @param projectId - Project ID
 * @returns Estimated file size in bytes
 */
export function estimateExportSize(projectId: string): number {
  const data = collectProjectData(projectId);
  const jsonString = JSON.stringify(data);
  return new Blob([jsonString]).size;
}

/**
 * Check if project data exists for export
 *
 * @param projectId - Project ID
 * @returns True if project has exportable data
 */
export function hasExportableData(projectId: string): boolean {
  const keys = getProjectLocalStorageKeys(projectId);
  return keys.length > 0;
}

/**
 * Get summary of exportable data for a project
 *
 * @param projectId - Project ID
 * @returns Summary object with counts of exportable items
 */
export function getExportDataSummary(projectId: string): {
  stage: ProjectStage;
  criteriaCount: number;
  vendorsCount: number;
  hasBattlecards: boolean;
  hasExecutiveSummary: boolean;
  hasScatterPlot: boolean;
  vendorSummariesCount: number;
  estimatedSize: number;
} {
  const stage = detectProjectStage(projectId);
  const data = collectProjectData(projectId);

  // CORRECTED: Use actual localStorage keys
  const workflowKey = `workflow_${projectId}`;
  const battlecardsStateKey = `clarioo_battlecards_state_${projectId}`;
  const executiveSummaryKey = `clarioo_executive_summary_${projectId}`;
  const stage2Key = `stage2_results_${projectId}`; // Fallback for backwards compatibility
  const scatterPlotKey = `vendor_scatterplot_positions_${projectId}`;

  let criteriaCount = 0;
  let vendorsCount = 0;
  let vendorSummariesCount = 0;

  if (data[workflowKey]) {
    const workflow = data[workflowKey];
    if (workflow.criteria && Array.isArray(workflow.criteria)) {
      criteriaCount = workflow.criteria.length;
    }
    if (workflow.selectedVendors && Array.isArray(workflow.selectedVendors)) {
      vendorsCount = workflow.selectedVendors.length;

      // Count vendor summaries - CORRECTED: Use actual key format
      workflow.selectedVendors.forEach((vendor: any) => {
        const summaryKey = `clarioo_vendor_summary_${projectId}_${vendor.name}`;
        if (localStorage.getItem(summaryKey)) {
          vendorSummariesCount++;
        }
      });
    }
  }

  return {
    stage,
    criteriaCount,
    vendorsCount,
    hasBattlecards: !!data[battlecardsStateKey],
    hasExecutiveSummary: !!data[executiveSummaryKey] || !!data[stage2Key],
    hasScatterPlot: !!data[scatterPlotKey],
    vendorSummariesCount,
    estimatedSize: estimateExportSize(projectId),
  };
}
