/**
 * Excel Export Service - Part 1: Foundation & Constants
 * Sprint: SP_027 - Excel & JSON Export Feature
 *
 * Service for exporting complete project data to Excel format with 7 tabs
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type {
  ExcelExportOptions,
  ExportResult,
  ProjectStage,
  ExportProjectData,
  IncompleteDataCheck,
  MatchStatus,
} from '@/types/export.types';
import { generateSP027Filename } from '@/utils/exportHelpers';
import { processVendorLogos } from '@/utils/imageProcessing';
import { captureScatterPlotWhenReady, isElementVisible } from '@/utils/screenshotCapture';
import { getImageDimensions } from '@/utils/imageProcessing';
import { calculateMatchPercentage } from '@/utils/vendorComparison';

// ============================================================================
// CONSTANTS
// ============================================================================

const BRAND_COLOR = '0066FF';
const FONT_NAME = 'Inter';
const HEADER_FONT_SIZE = 12;
const BODY_FONT_SIZE = 11;

// Background colors for match status (all white)
const BG_COLORS = {
  yes: 'FFFFFF',
  partial: 'FFFFFF',
  unknown: 'FFFFFF',
  pending: 'FFFFFF',
  star: 'FFFFFF',
  no: 'FFFFFF',
};

// Icon colors for match status
const ICON_COLORS = {
  yes: '22C55E', // Green for check mark
  partial: '000000', // Black for +/-
  unknown: '000000', // Black for ?
  pending: '000000', // Black for 🔄
  star: '000000', // Black for ⭐ (emoji will use default color)
  no: '000000', // Black for X
};

// Importance text colors
const IMPORTANCE_COLORS = {
  high: 'DC2626',
  medium: 'F97316',
  low: '22C55E',
};

// Match status icons (Stage 1 + Stage 2)
const MATCH_ICONS = {
  yes: '✓',
  partial: '+/-',
  unknown: '?',
  pending: '🔄',
  star: '⭐',
  no: 'X',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sort criteria by category in standard order (Feature → Technical → Business → Compliance → Custom)
 * Same order as displayed in the web app (VerticalBarChart)
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

  // Standard categories in display order (same as VerticalBarChart)
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
 * Capitalize first letter of category name for display
 */
function formatCategoryName(category: string): string {
  if (!category) return 'Other';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

/**
 * Detect project stage from localStorage
 * CORRECTED: Use actual localStorage keys from the application
 */
function detectProjectStage(projectId: string): ProjectStage {
  const workflowData = localStorage.getItem(`workflow_${projectId}`);
  const hasCriteria = workflowData ? JSON.parse(workflowData).criteria?.length > 0 : false;
  const hasVendors = workflowData ? JSON.parse(workflowData).selectedVendors?.length > 0 : false;
  const hasComparison = localStorage.getItem(`comparison_state_${projectId}`) !== null;
  const hasBattlecards = localStorage.getItem(`clarioo_battlecards_state_${projectId}`) !== null;
  const hasStage2 = localStorage.getItem(`stage2_results_${projectId}`) !== null;

  if (hasBattlecards) return 'battlecards_complete';
  if (hasStage2) return 'executive_summary';
  if (hasComparison) return 'comparison_matrix';
  if (hasVendors) return 'vendors_selected';
  if (hasCriteria) return 'criteria_only';

  return 'criteria_only';
}

/**
 * Load project data from localStorage
 * CORRECTED: Use actual localStorage keys from the application
 */
function loadProjectData(projectId: string): Partial<ExportProjectData> {
  const workflowKey = `workflow_${projectId}`;
  const comparisonKey = `comparison_state_${projectId}`;
  const stage1Key = `stage1_results_${projectId}`;
  const stage2Key = `stage2_results_${projectId}`;
  const executiveSummaryKey = `clarioo_executive_summary_${projectId}`; // CORRECTED KEY
  const battlecardsStateKey = `clarioo_battlecards_state_${projectId}`;
  const battlecardsRowsKey = `clarioo_battlecards_rows_${projectId}`;

  const data: Partial<ExportProjectData> = {
    projectId,
    projectName: 'Untitled Project',
    stage: detectProjectStage(projectId),
    criteria: [],
    vendors: [],
  };

  // PRIORITY 1: Load project metadata from clarioo_projects list
  const projectsData = localStorage.getItem('clarioo_projects');
  if (projectsData) {
    try {
      const projects = JSON.parse(projectsData);
      const project = projects.find((p: any) => p.id === projectId);
      if (project) {
        data.projectName = project.name || data.projectName;
        data.projectDescription = project.description || undefined;
        console.log('[Excel Export] Loaded project from clarioo_projects:', {
          name: data.projectName,
          hasDescription: !!data.projectDescription,
        });
      }
    } catch (error) {
      console.error('[Excel Export] Failed to parse clarioo_projects:', error);
    }
  }

  // PRIORITY 2: Load workflow data (contains criteria, vendors, and may override project name)
  const workflowData = localStorage.getItem(workflowKey);
  if (workflowData) {
    const workflow = JSON.parse(workflowData);
    data.criteria = workflow.criteria || [];
    data.vendors = workflow.selectedVendors || [];

    // If no project name from clarioo_projects, try techRequest description as fallback
    if (data.projectName === 'Untitled Project' && workflow.techRequest?.description) {
      data.projectName = workflow.techRequest.description.substring(0, 50);
    }
  }

  // Load comparison state
  const comparisonData = localStorage.getItem(comparisonKey);
  if (comparisonData) {
    data.comparisonMatrix = JSON.parse(comparisonData);
  }

  // Enrich vendor data with summaries from localStorage
  // CORRECTED: Use actual key format: clarioo_vendor_summary_{projectId}_{vendorName}
  if (data.vendors && data.vendors.length > 0) {
    console.log('[Excel Export] Enriching vendor data with summaries from localStorage');
    data.vendors = data.vendors.map((vendor: any) => {
      const summaryKey = `clarioo_vendor_summary_${projectId}_${vendor.name}`;
      const summaryData = localStorage.getItem(summaryKey);

      if (summaryData) {
        try {
          const parsed = JSON.parse(summaryData);
          // Extract the data property from the stored object
          const summary = parsed.data || parsed;

          console.log(`[Excel Export] ✅ Enriching ${vendor.name} with summary data:`, {
            hasExecutiveSummary: !!summary.executiveSummary,
            hasKillerFeature: !!summary.killerFeature,
            hasKeyFeatures: !!(summary.keyFeatures && summary.keyFeatures.length > 0),
          });

          return {
            ...vendor,
            executiveSummary: summary.executiveSummary || vendor.executiveSummary,
            killerFeature: summary.killerFeature || vendor.killerFeature,
            keyFeatures: summary.keyFeatures || vendor.keyFeatures,
          };
        } catch (error) {
          console.error(`[Excel Export] ❌ Failed to parse vendor summary for ${vendor.name}:`, error);
        }
      } else {
        console.log(`[Excel Export] ⚠️  No summary found for ${vendor.name} (key: ${summaryKey})`);
      }

      return vendor;
    });
  }

  // Calculate and add matchPercentage to vendors
  if (data.vendors && data.vendors.length > 0 && data.comparisonMatrix && data.criteria) {
    console.log('[Excel Export] Calculating match percentages for vendors');
    const criteriaForCalc = data.criteria
      .filter((c: any) => !c.isArchived)
      .map((c: any) => ({
        id: c.id,
        importance: c.importance,
        type: c.type || 'other'
      }));

    const comparisonMatrix = data.comparisonMatrix as any;

    data.vendors = data.vendors.map((vendor: any) => {
      // Extract scores from comparison matrix
      const scores: Record<string, 'no' | 'unknown' | 'yes' | 'star'> = {};

      criteriaForCalc.forEach((criterion: any) => {
        const cellState = comparisonMatrix?.criteria?.[criterion.id]?.cells?.[vendor.id];
        if (cellState?.value) {
          // Use the value field from CellState
          const value = cellState.value;
          if (value === 'yes' || value === 'unknown' || value === 'no' || value === 'star') {
            scores[criterion.id] = value;
          }
        }
      });

      // Calculate match percentage
      const matchPercentage = calculateMatchPercentage(scores, criteriaForCalc, vendor.name);

      console.log(`[Excel Export] ${vendor.name}: matchPercentage = ${matchPercentage}%`, {
        scoreCount: Object.keys(scores).length,
        criteriaCount: criteriaForCalc.length,
      });

      return {
        ...vendor,
        matchPercentage,
      };
    });
  }

  // Load stage 1 results
  const stage1Data = localStorage.getItem(stage1Key);
  if (stage1Data) {
    data.stage1Results = JSON.parse(stage1Data);
  }

  // Load stage 2 results (executive summary) - CORRECTED to use clarioo_executive_summary key
  const executiveSummaryData = localStorage.getItem(executiveSummaryKey);
  if (executiveSummaryData) {
    const parsed = JSON.parse(executiveSummaryData);
    // Extract the data property from the stored object
    data.executiveSummary = parsed.data || parsed;
    console.log('[Excel Export] Loaded executive summary:', {
      hasData: !!data.executiveSummary,
      generatedAt: parsed.generated_at,
      sections: data.executiveSummary ? Object.keys(data.executiveSummary) : []
    });
  } else {
    console.log('[Excel Export] No executive summary found for project:', projectId);
  }

  // Fallback: Try old stage2_results key for backwards compatibility
  if (!data.executiveSummary) {
    const stage2Data = localStorage.getItem(stage2Key);
    if (stage2Data) {
      data.executiveSummary = JSON.parse(stage2Data);
      console.log('[Excel Export] Loaded executive summary from stage2_results (fallback)');
    }
  }

  // Load battlecards state
  const battlecardsStateData = localStorage.getItem(battlecardsStateKey);
  if (battlecardsStateData) {
    const state = JSON.parse(battlecardsStateData);
    // The state object has a 'rows' property with the actual battlecard rows
    data.battlecards = state.rows || [];
    console.log('[Excel Export] Loaded battlecards from state:', {
      rowCount: data.battlecards.length,
      firstRow: data.battlecards[0] ? {
        category_title: data.battlecards[0].category_title,
        cellCount: data.battlecards[0].cells?.length,
      } : null,
    });
  }

  // Load battlecards rows (fallback if state doesn't exist)
  const battlecardsRowsData = localStorage.getItem(battlecardsRowsKey);
  if (battlecardsRowsData && (!data.battlecards || data.battlecards.length === 0)) {
    data.battlecardsRows = JSON.parse(battlecardsRowsData);
    // Use rows as battlecards if state didn't have them
    data.battlecards = data.battlecardsRows;
    console.log('[Excel Export] Loaded battlecards from rows fallback:', {
      rowCount: data.battlecards.length,
    });
  }

  console.log('[Excel Export] Final battlecards data:', {
    hasBattlecards: !!data.battlecards,
    rowCount: data.battlecards?.length || 0,
    vendorCount: data.vendors?.length || 0,
  });

  return data;
}

/**
 * Check for incomplete data
 */
function checkIncompleteData(data: Partial<ExportProjectData>): IncompleteDataCheck {
  const missingTabs: string[] = [];
  let pendingCells = 0;

  // Check comparison matrix for pending cells - CORRECTED: Use actual structure
  if (data.comparisonMatrix) {
    const vendors = data.vendors || [];
    const criteria = data.criteria || [];
    const comparisonMatrix = data.comparisonMatrix as any;

    vendors.forEach(vendor => {
      criteria.forEach(criterion => {
        const cellState = comparisonMatrix?.criteria?.[criterion.id]?.cells?.[vendor.id];
        const status = cellState?.status || 'pending';
        if (status === 'pending' || status === 'loading') {
          pendingCells++;
        }
      });
    });
  }

  const isComplete = pendingCells === 0;
  const shouldPrompt = !isComplete;

  return {
    isComplete,
    missingTabs,
    pendingCells,
    shouldPrompt,
    message: isComplete
      ? 'All data is complete'
      : `Export includes ${pendingCells} incomplete cells (grayed out)`,
  };
}

/**
 * Apply common cell styling
 */
function applyCellStyle(cell: ExcelJS.Cell, options: {
  bold?: boolean;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  alignment?: Partial<ExcelJS.Alignment>;
  border?: boolean;
}) {
  const {
    bold = false,
    fontSize = BODY_FONT_SIZE,
    fontColor,
    bgColor,
    alignment,
    border = true,
  } = options;

  // Font
  cell.font = {
    name: FONT_NAME,
    size: fontSize,
    bold,
    color: fontColor ? { argb: fontColor } : undefined,
  };

  // Alignment
  if (alignment) {
    cell.alignment = alignment;
  }

  // Background
  if (bgColor) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    };
  }

  // Border
  if (border) {
    cell.border = {
      top: { style: 'thin', color: { argb: 'D3D3D3' } },
      left: { style: 'thin', color: { argb: 'D3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'D3D3D3' } },
      right: { style: 'thin', color: { argb: 'D3D3D3' } },
    };
  }
}

/**
 * Create header row styling
 */
function createHeaderRow(worksheet: ExcelJS.Worksheet, row: number, values: string[]) {
  const headerRow = worksheet.getRow(row);

  values.forEach((value, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = value;
    applyCellStyle(cell, {
      bold: true,
      fontSize: HEADER_FONT_SIZE,
      fontColor: 'FFFFFF',
      bgColor: BRAND_COLOR,
      alignment: { horizontal: 'center', vertical: 'middle' },
    });
  });

  headerRow.height = 20;
}

// ============================================================================
// TAB GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate INDEX tab (cover page)
 */
async function generateIndexTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>
): Promise<void> {
  const worksheet = workbook.addWorksheet('INDEX');

  // Set column widths
  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 55;

  let currentRow = 1;

  // ===== CLARIOO BRANDING =====
  // Clarioo logo/brand section with gradient background effect
  const brandCell = worksheet.getCell(`A${currentRow}`);
  brandCell.value = 'CLARIOO';
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  applyCellStyle(brandCell, {
    bold: true,
    fontSize: 28,
    fontColor: BRAND_COLOR,
    bgColor: 'F0F9FF', // Light blue background
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  worksheet.getRow(currentRow).height = 40;
  currentRow += 1;

  // Tagline
  const taglineCell = worksheet.getCell(`A${currentRow}`);
  taglineCell.value = 'Software Discovery & Selection Co-pilot';
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  applyCellStyle(taglineCell, {
    fontSize: 12,
    fontColor: '6B7280',
    bgColor: 'F0F9FF',
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: false,
  });
  worksheet.getRow(currentRow).height = 25;
  currentRow += 2;

  // ===== PROJECT INFORMATION =====
  const projectTitleCell = worksheet.getCell(`A${currentRow}`);
  projectTitleCell.value = 'PROJECT REPORT';
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  applyCellStyle(projectTitleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
    border: false,
  });
  currentRow += 2;

  // Project Name
  worksheet.getCell(`A${currentRow}`).value = 'Project Name:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  worksheet.getCell(`B${currentRow}`).value = data.projectName || 'Untitled Project';
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow++;

  // Get additional project data from localStorage
  const workflowData = localStorage.getItem(`workflow_${data.projectId}`);
  let techRequest: any = null;
  let projectCategory: string | undefined;

  if (workflowData) {
    const workflow = JSON.parse(workflowData);
    techRequest = workflow.techRequest;
    projectCategory = workflow.category;
  }

  // Project Category (if available from template)
  if (projectCategory) {
    worksheet.getCell(`A${currentRow}`).value = 'Category:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
    worksheet.getCell(`B${currentRow}`).value = projectCategory;
    applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
    currentRow++;
  }

  // Company Context (if available)
  if (techRequest?.companyContext) {
    worksheet.getCell(`A${currentRow}`).value = 'Company Context:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false, alignment: { vertical: 'top' } });
    const contextCell = worksheet.getCell(`B${currentRow}`);
    contextCell.value = techRequest.companyContext;
    contextCell.alignment = { wrapText: true, vertical: 'top' };
    applyCellStyle(contextCell, { border: false });
    worksheet.getRow(currentRow).height = Math.max(30, Math.min(100, techRequest.companyContext.split('\n').length * 15));
    currentRow++;
  }

  // Solution Requirements (if available)
  if (techRequest?.solutionRequirements) {
    worksheet.getCell(`A${currentRow}`).value = 'Solution Requirements:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false, alignment: { vertical: 'top' } });
    const reqCell = worksheet.getCell(`B${currentRow}`);
    reqCell.value = techRequest.solutionRequirements;
    reqCell.alignment = { wrapText: true, vertical: 'top' };
    applyCellStyle(reqCell, { border: false });
    worksheet.getRow(currentRow).height = Math.max(30, Math.min(100, techRequest.solutionRequirements.split('\n').length * 15));
    currentRow++;
  }

  // Project Description (if available and different from above)
  if (data.projectDescription && data.projectDescription !== techRequest?.companyContext && data.projectDescription !== techRequest?.solutionRequirements) {
    worksheet.getCell(`A${currentRow}`).value = 'Description:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false, alignment: { vertical: 'top' } });
    const descCell = worksheet.getCell(`B${currentRow}`);
    descCell.value = data.projectDescription;
    descCell.alignment = { wrapText: true, vertical: 'top' };
    applyCellStyle(descCell, { border: false });
    worksheet.getRow(currentRow).height = Math.max(30, Math.min(100, data.projectDescription.split('\n').length * 15));
    currentRow++;
  }

  // Software Category (placeholder)
  worksheet.getCell(`A${currentRow}`).value = 'Software Category:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  worksheet.getCell(`B${currentRow}`).value = 'MANUAL_FILL_IN';
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow++;

  // Searched By (placeholder)
  worksheet.getCell(`A${currentRow}`).value = 'Searched By:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  worksheet.getCell(`B${currentRow}`).value = 'MANUAL_FILL_IN';
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow++;

  // Key Features (placeholder - comma-separated)
  worksheet.getCell(`A${currentRow}`).value = 'Key Features:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false, alignment: { vertical: 'top' } });
  const keyFeaturesCell = worksheet.getCell(`B${currentRow}`);
  keyFeaturesCell.value = 'MANUAL_FILL_IN, MANUAL_FILL_IN';
  keyFeaturesCell.alignment = { wrapText: true, vertical: 'top' };
  applyCellStyle(keyFeaturesCell, { border: false });
  currentRow++;

  // Client Quote (placeholder)
  worksheet.getCell(`A${currentRow}`).value = 'Client Quote:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false, alignment: { vertical: 'top' } });
  const clientQuoteCell = worksheet.getCell(`B${currentRow}`);
  clientQuoteCell.value = 'MANUAL_FILL_IN';
  clientQuoteCell.alignment = { wrapText: true, vertical: 'top' };
  applyCellStyle(clientQuoteCell, { border: false });
  currentRow++;

  // Current Tools (placeholder - comma-separated)
  worksheet.getCell(`A${currentRow}`).value = 'Current Tools:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  worksheet.getCell(`B${currentRow}`).value = 'MANUAL_FILL_IN, MANUAL_FILL_IN';
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow++;

  currentRow++;

  // ===== METADATA =====
  const metadataCell = worksheet.getCell(`A${currentRow}`);
  metadataCell.value = 'REPORT METADATA';
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  applyCellStyle(metadataCell, {
    bold: true,
    fontSize: 13,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
    border: false,
  });
  currentRow += 2;

  // Get user email from localStorage
  const emailStorage = localStorage.getItem('clarioo_email');
  let userEmail: string | undefined;
  if (emailStorage) {
    try {
      const emailData = JSON.parse(emailStorage);
      userEmail = emailData.email;
    } catch (e) {
      console.error('[Excel Export] Failed to parse email storage:', e);
    }
  }

  // Created By (email)
  if (userEmail) {
    worksheet.getCell(`A${currentRow}`).value = 'Created By:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
    worksheet.getCell(`B${currentRow}`).value = userEmail;
    applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
    currentRow++;
  }

  // User ID
  const userId = localStorage.getItem('clarioo_user_id');
  if (userId) {
    worksheet.getCell(`A${currentRow}`).value = 'User ID:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
    worksheet.getCell(`B${currentRow}`).value = userId;
    applyCellStyle(worksheet.getCell(`B${currentRow}`), { fontSize: 9, fontColor: '666666', border: false });
    currentRow++;
  }

  // Project ID
  if (data.projectId) {
    worksheet.getCell(`A${currentRow}`).value = 'Project ID:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
    worksheet.getCell(`B${currentRow}`).value = data.projectId;
    applyCellStyle(worksheet.getCell(`B${currentRow}`), { fontSize: 9, fontColor: '666666', border: false });
    currentRow++;
  }

  // Export Date
  worksheet.getCell(`A${currentRow}`).value = 'Export Date:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  const now = new Date();
  worksheet.getCell(`B${currentRow}`).value = `${now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })} at ${now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`;
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow++;

  // Stage
  worksheet.getCell(`A${currentRow}`).value = 'Project Stage:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  const stageNames: Record<string, string> = {
    'criteria_only': 'Criteria Defined',
    'vendors_selected': 'Vendors Selected',
    'comparison_complete': 'Comparison Complete',
    'executive_summary': 'Pre-Demo Brief Generated',
    'battlecards_complete': 'Battlecards Complete',
  };
  worksheet.getCell(`B${currentRow}`).value = stageNames[data.stage || 'criteria_only'] || 'In Progress';
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow += 2;

  // Stats
  const statsCell = worksheet.getCell(`A${currentRow}`);
  statsCell.value = 'PROJECT STATISTICS';
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  applyCellStyle(statsCell, {
    bold: true,
    fontSize: 13,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
    border: false,
  });
  currentRow += 2;

  // Criteria Count
  worksheet.getCell(`A${currentRow}`).value = 'Total Criteria:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  worksheet.getCell(`B${currentRow}`).value = data.criteria?.length || 0;
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow++;

  // Vendors Count
  worksheet.getCell(`A${currentRow}`).value = 'Total Vendors:';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
  worksheet.getCell(`B${currentRow}`).value = data.vendors?.length || 0;
  applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
  currentRow++;

  // Battlecards Count
  if (data.battlecards && data.battlecards.length > 0) {
    worksheet.getCell(`A${currentRow}`).value = 'Battlecard Categories:';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), { bold: true, border: false });
    worksheet.getCell(`B${currentRow}`).value = data.battlecards.length;
    applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false });
    currentRow++;
  }

  currentRow += 2;

  // "Clone as Project in Clarioo" button placeholder
  const buttonCell = worksheet.getCell(`A${currentRow}`);
  buttonCell.value = 'Clone as Project in Clarioo';
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  applyCellStyle(buttonCell, {
    fontColor: '999999',
    bgColor: 'E5E7EB',
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  buttonCell.note = 'Coming soon: Import this project back into Clarioo';
  worksheet.getRow(currentRow).height = 30;
  currentRow += 2;

  // Table of contents header
  const tocHeader = worksheet.getCell(`A${currentRow}`);
  tocHeader.value = 'TABLE OF CONTENTS';
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  applyCellStyle(tocHeader, {
    bold: true,
    fontSize: 14,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
    border: false,
  });
  currentRow += 2;

  // TOC entries with hyperlinks
  const tocEntries = [
    { name: '1. Evaluation Criteria', sheet: '1. Evaluation Criteria', desc: 'All requirements and evaluation criteria' },
    { name: '2. Vendor List', sheet: '2. Vendor List', desc: 'Shortlisted vendors with strategic positioning' },
    { name: '3. Vendor Evaluation', sheet: '3. Vendor Evaluation', desc: 'Comparison matrix with final rankings' },
    { name: '4. Detailed Matching', sheet: '4. Detailed Matching', desc: 'Evidence and reasoning for each vendor-criterion match' },
  ];

  // Add conditional tabs - SWAPPED ORDER
  if (data.battlecards && data.battlecards.length > 0) {
    tocEntries.push({
      name: '5. Battlecards',
      sheet: '5. Battlecards',
      desc: 'Deep research of key vendor differences',
    });
  }

  if (data.stage !== 'criteria_only' && data.vendors && data.vendors.length > 0) {
    tocEntries.push({
      name: '6. Vendor Overview & Match lvl',
      sheet: '6. Vendor Overview & Match lvl',
      desc: 'Vendor summaries and match percentages',
    });
  }

  if (data.executiveSummary) {
    tocEntries.push({
      name: '7. Pre-Demo Brief',
      sheet: '7. Pre-Demo Brief',
      desc: 'AI-generated project summary',
    });
  }

  // Core Analysis Tabs header
  const coreHeader = worksheet.getCell(`A${currentRow}`);
  coreHeader.value = 'Core Analysis';
  applyCellStyle(coreHeader, {
    bold: true,
    fontSize: 11,
    fontColor: '6B7280',
    border: false,
  });
  currentRow++;

  // Core tabs (1-4)
  for (let i = 0; i < Math.min(4, tocEntries.length); i++) {
    const entry = tocEntries[i];
    const cell = worksheet.getCell(`A${currentRow}`);
    cell.value = {
      text: `  ${entry.name}`,
      hyperlink: `#'${entry.sheet}'!A1`,
    };
    applyCellStyle(cell, {
      fontColor: BRAND_COLOR,
      border: false,
    });

    worksheet.getCell(`B${currentRow}`).value = entry.desc;
    applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false, fontColor: '6B7280' });

    currentRow++;
  }

  // Additional Insights header (if battlecards or executive summary exist)
  if (tocEntries.length > 4) {
    currentRow++;
    const insightsHeader = worksheet.getCell(`A${currentRow}`);
    insightsHeader.value = 'Additional Insights';
    applyCellStyle(insightsHeader, {
      bold: true,
      fontSize: 11,
      fontColor: '6B7280',
      border: false,
    });
    currentRow++;

    // Additional tabs (5+)
    for (let i = 4; i < tocEntries.length; i++) {
      const entry = tocEntries[i];
      const cell = worksheet.getCell(`A${currentRow}`);
      cell.value = {
        text: `  ${entry.name}`,
        hyperlink: `#'${entry.sheet}'!A1`,
      };
      applyCellStyle(cell, {
        fontColor: BRAND_COLOR,
        border: false,
      });

      worksheet.getCell(`B${currentRow}`).value = entry.desc;
      applyCellStyle(worksheet.getCell(`B${currentRow}`), { border: false, fontColor: '6B7280' });

      currentRow++;
    }
  }

  // Hide gridlines
  worksheet.views = [{ showGridLines: false }];
}

/**
 * Generate Criteria tab
 */
async function generateCriteriaTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>
): Promise<void> {
  const worksheet = workbook.addWorksheet('1. Evaluation Criteria');

  // Set column widths
  worksheet.getColumn(1).width = 5;   // #
  worksheet.getColumn(2).width = 30;  // Criterion
  worksheet.getColumn(3).width = 50;  // Explanation
  worksheet.getColumn(4).width = 12;  // Importance
  worksheet.getColumn(5).width = 15;  // Type

  let currentRow = 1;

  // Title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'EVALUATION CRITERIA';
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  applyCellStyle(titleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
  });
  currentRow += 2;

  // Header row
  createHeaderRow(worksheet, currentRow, ['#', 'Criterion', 'Explanation', 'Importance', 'Type']);
  currentRow++;

  // Data rows
  const criteria = sortCriteriaByCategory(data.criteria || []); // Sort by category
  criteria.forEach((criterion, index) => {
    const row = worksheet.getRow(currentRow);

    // Number
    row.getCell(1).value = index + 1;
    applyCellStyle(row.getCell(1), { alignment: { horizontal: 'center' } });

    // Criterion name
    row.getCell(2).value = criterion.name;
    applyCellStyle(row.getCell(2), {});

    // Explanation
    row.getCell(3).value = criterion.explanation || criterion.description || '';
    applyCellStyle(row.getCell(3), { alignment: { wrapText: true } });

    // Importance (with color coding - TEXT COLOR ONLY)
    const importanceCell = row.getCell(4);
    importanceCell.value = criterion.importance.charAt(0).toUpperCase() + criterion.importance.slice(1);
    const importanceColor = IMPORTANCE_COLORS[criterion.importance as keyof typeof IMPORTANCE_COLORS];
    applyCellStyle(importanceCell, {
      fontColor: importanceColor,
      alignment: { horizontal: 'center' },
    });

    // Type
    row.getCell(5).value = criterion.type;
    applyCellStyle(row.getCell(5), { alignment: { horizontal: 'center' } });

    // Alternating row colors
    if (index % 2 === 1) {
      [1, 2, 3, 4, 5].forEach(col => {
        const cell = row.getCell(col);
        if (cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFB' },
          };
        }
      });
    }

    currentRow++;
  });

  // Freeze header rows and hide gridlines
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3, showGridLines: false }];
}

/**
 * Generate Vendor List tab with scatter plot
 */
async function generateVendorListTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>,
  scatterPlotImageId?: number,
  logoImageIds?: Map<string, number>,
  scatterPlotDimensions?: { width: number; height: number }
): Promise<void> {
  const worksheet = workbook.addWorksheet('2. Vendor List');

  // Set column widths
  worksheet.getColumn(1).width = 5;   // #
  worksheet.getColumn(2).width = 12;  // Logo (increased for larger icons)
  worksheet.getColumn(3).width = 20;  // Vendor
  worksheet.getColumn(4).width = 50;  // Description
  // Column 5 (Website) width is calculated after data is added (auto-fit)

  let currentRow = 1;

  // Title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'SHORTLISTED VENDORS';
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  applyCellStyle(titleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
  });
  currentRow += 2;

  // Screening summary section (if exists in localStorage)
  const screeningSummary = data.screeningSummary;
  if (screeningSummary) {
    worksheet.getCell(`A${currentRow}`).value = 'SCREENING SUMMARY';
    applyCellStyle(worksheet.getCell(`A${currentRow}`), {
      bold: true,
      fontSize: 12,
      border: false,
    });
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = screeningSummary;
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    worksheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
    currentRow += 2;
  }

  // Vendor list header
  worksheet.getCell(`A${currentRow}`).value = 'VENDOR LIST';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), {
    bold: true,
    fontSize: 12,
    border: false,
  });
  currentRow++;

  // Header row
  createHeaderRow(worksheet, currentRow, ['#', 'Logo', 'Vendor', 'Description', 'Website']);
  currentRow++;

  // Data rows
  const vendors = data.vendors || [];
  const vendorStartRow = currentRow;

  vendors.forEach((vendor, index) => {
    const row = worksheet.getRow(currentRow);
    row.height = 60; // Taller rows for larger logos

    // Number
    row.getCell(1).value = index + 1;
    applyCellStyle(row.getCell(1), { alignment: { horizontal: 'center', vertical: 'middle' } });

    // Logo - insert actual image if available
    applyCellStyle(row.getCell(2), { alignment: { horizontal: 'center', vertical: 'middle' } });
    if (logoImageIds && logoImageIds.has(vendor.id)) {
      const imageId = logoImageIds.get(vendor.id)!;
      const logoSize = 50; // Increased from 35 to 50
      // Center in cell: column width 12 chars ≈ 84px, offset = (84 - 50) / 2 ≈ 17px
      const offsetX = 17;
      const offsetY = 5; // Small vertical offset for better centering
      worksheet.addImage(imageId, {
        tl: { col: 1, row: currentRow - 1, x: offsetX, y: offsetY },
        ext: { width: logoSize, height: logoSize },
        editAs: 'oneCell',
      });
    }

    // Vendor name
    row.getCell(3).value = vendor.name;
    applyCellStyle(row.getCell(3), { bold: true, alignment: { vertical: 'middle' } });

    // Description
    row.getCell(4).value = vendor.description;
    applyCellStyle(row.getCell(4), { alignment: { wrapText: true, vertical: 'middle' } });

    // Website (as hyperlink)
    if (vendor.website) {
      row.getCell(5).value = {
        text: vendor.website,
        hyperlink: vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`,
      };
      applyCellStyle(row.getCell(5), {
        fontColor: BRAND_COLOR,
        alignment: { vertical: 'middle' },
      });
    }

    currentRow++;
  });

  // Auto-fit Website column (E) to widest content
  const maxWebsiteLength = vendors.reduce((max, vendor) => {
    if (vendor.website) {
      return Math.max(max, vendor.website.length);
    }
    return max;
  }, 'Website'.length); // At least as wide as header

  // Excel column width calculation: characters * 1.2 + padding
  const calculatedWidth = Math.min(maxWebsiteLength * 1.2 + 2, 60); // Cap at 60 for very long URLs
  worksheet.getColumn(5).width = calculatedWidth;
  console.log(`[Excel Export] Website column auto-fit width: ${calculatedWidth} (max URL length: ${maxWebsiteLength})`);

  currentRow += 2;

  // Strategic positioning section
  worksheet.getCell(`A${currentRow}`).value = 'STRATEGIC POSITIONING';
  applyCellStyle(worksheet.getCell(`A${currentRow}`), {
    bold: true,
    fontSize: 12,
    border: false,
  });
  currentRow++;

  // Add scatter plot image if provided (optional)
  if (scatterPlotImageId !== undefined && scatterPlotDimensions &&
      typeof scatterPlotDimensions.width === 'number' &&
      typeof scatterPlotDimensions.height === 'number') {
    try {
      console.log(`[Excel Export] Adding scatter plot to Vendor List tab at row ${currentRow - 1}`);
      console.log(`[Excel Export] Scatter plot original dimensions: ${scatterPlotDimensions.width}x${scatterPlotDimensions.height}px`);

      // Detect if desktop export (aspect ratio close to 9:5 = 1.8)
      const aspectRatio = scatterPlotDimensions.width / scatterPlotDimensions.height;
      const isDesktopExport = Math.abs(aspectRatio - 1.8) < 0.1; // Within 0.1 of 1.8

      // Scale desktop exports down by 30% (multiply by 0.7)
      const scaleFactor = isDesktopExport ? 0.7 : 1.0;
      const displayWidth = Math.round(scatterPlotDimensions.width * scaleFactor);
      const displayHeight = Math.round(scatterPlotDimensions.height * scaleFactor);

      console.log(`[Excel Export] Display size: ${displayWidth}x${displayHeight}px (${isDesktopExport ? 'desktop, scaled 70%' : 'mobile, original size'})`);

      worksheet.addImage(scatterPlotImageId, {
        tl: { col: 0, row: currentRow - 1 },
        ext: {
          width: displayWidth,
          height: displayHeight
        },
      });
      console.log('[Excel Export] ✅ Scatter plot added to Vendor List tab');
    } catch (error) {
      console.error('[Excel Export] ⚠️ Failed to add scatter plot to worksheet:', error);
    }
  } else {
    console.log('[Excel Export] ℹ️ Scatter plot not added to Vendor List tab:', {
      hasImageId: scatterPlotImageId !== undefined,
      hasDimensions: !!scatterPlotDimensions,
      dimensionsValid: scatterPlotDimensions ?
        (typeof scatterPlotDimensions.width === 'number' && typeof scatterPlotDimensions.height === 'number') :
        false
    });

    // Add instructional message when scatter plot is not included
    const instructionCell = worksheet.getCell(`A${currentRow}`);
    instructionCell.value = "If you'd like to have the scatterplot with the strategic vendor positioning displayed, please export the project from the page with the scatterplot after it is fully rendered";
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    applyCellStyle(instructionCell, {
      fontSize: 10,
      fontColor: '6B7280',
      italic: true,
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
      border: false,
    });
    worksheet.getRow(currentRow).height = 40; // Enough height for wrapped text
    currentRow++;
  }

  // Hide gridlines
  worksheet.views = [{ showGridLines: false }];
}

/**
 * Generate Comparison Matrix tab
 */
async function generateComparisonMatrixTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>,
  logoImageIds?: Map<string, number>
): Promise<void> {
  const worksheet = workbook.addWorksheet('3. Vendor Evaluation');

  const criteria = sortCriteriaByCategory(data.criteria || []); // Sort by category
  const vendors = data.vendors || [];
  const comparisonMatrix = data.comparisonMatrix as any;

  // Set column widths
  worksheet.getColumn(1).width = 18; // Category
  worksheet.getColumn(2).width = 30; // Criteria
  vendors.forEach((_, index) => {
    worksheet.getColumn(index + 3).width = 15; // Vendor columns start from column 3
  });

  let currentRow = 1;

  // Title (merge across Category + Criteria + all vendor columns)
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'CRITERIA VS VENDORS';
  const titleRange = `A${currentRow}:${String.fromCharCode(66 + vendors.length)}${currentRow}`;
  worksheet.mergeCells(titleRange);
  applyCellStyle(titleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
  });
  currentRow += 2;

  // Icon legend row (includes Stage 1 + Stage 2 statuses)
  const legendCell = worksheet.getCell(`A${currentRow}`);
  legendCell.value = '✓ = Yes  |  ⭐ = Standout  |  X = No  |  +/- = Partial  |  ? = Unknown  |  🔄 = Pending';
  worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(66 + vendors.length)}${currentRow}`);
  applyCellStyle(legendCell, {
    bgColor: 'FFFFFF',
    alignment: { horizontal: 'center' },
  });
  currentRow += 2;

  // Logo row (if logos available) - COMPARISON MATRIX TAB
  // Logos start at column 3 (after Category and Criteria columns)
  if (logoImageIds && logoImageIds.size > 0) {
    const logoRow = worksheet.getRow(currentRow);
    logoRow.height = 55; // Taller row for larger logos

    vendors.forEach((vendor, index) => {
      if (logoImageIds.has(vendor.id)) {
        const imageId = logoImageIds.get(vendor.id)!;
        const logoSize = 45; // Increased from 30 to 45
        // Center in cell: column width 15 chars ≈ 105px, offset = (105 - 45) / 2 = 30px
        const offsetX = 30;
        const offsetY = 5; // Small vertical offset for better centering
        worksheet.addImage(imageId, {
          tl: { col: index + 2, row: currentRow - 1, x: offsetX, y: offsetY }, // col: index + 2 (shifted by 1)
          ext: { width: logoSize, height: logoSize },
          editAs: 'oneCell',
        });
      }
    });
    currentRow++;
  }

  // Header row with Category, Criteria, and vendor names
  const headerRow = worksheet.getRow(currentRow);

  // Category header
  headerRow.getCell(1).value = 'Category';
  applyCellStyle(headerRow.getCell(1), {
    bold: true,
    fontSize: HEADER_FONT_SIZE,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'left', vertical: 'middle' },
  });

  // Criteria header
  headerRow.getCell(2).value = 'Criteria';
  applyCellStyle(headerRow.getCell(2), {
    bold: true,
    fontSize: HEADER_FONT_SIZE,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'left', vertical: 'middle' },
  });

  // Vendor headers (start from column 3)
  vendors.forEach((vendor, index) => {
    const cell = headerRow.getCell(index + 3);
    cell.value = vendor.name;
    applyCellStyle(cell, {
      bold: true,
      fontSize: HEADER_FONT_SIZE,
      fontColor: 'FFFFFF',
      bgColor: BRAND_COLOR,
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    });
  });

  headerRow.height = 20;
  currentRow++;

  // Data rows
  criteria.forEach((criterion) => {
    const row = worksheet.getRow(currentRow);

    // Category name (column 1)
    row.getCell(1).value = formatCategoryName(criterion.type || 'other');
    applyCellStyle(row.getCell(1), {
      fontColor: '666666',
      alignment: { vertical: 'middle' },
    });

    // Criterion name (column 2)
    row.getCell(2).value = criterion.name;
    applyCellStyle(row.getCell(2), {
      fontColor: BRAND_COLOR,
      alignment: { vertical: 'middle' },
    });

    // Match status for each vendor (columns 3+)
    vendors.forEach((vendor, vendorIndex) => {
      const cell = row.getCell(vendorIndex + 3);
      // Get cell state from comparison_state localStorage (includes Stage 1 + Stage 2 updates)
      // Stage 1: yes, unknown, partial, pending
      // Stage 2: star (standout), no (doesn't meet criterion), or updated yes/unknown
      const cellState = comparisonMatrix?.criteria?.[criterion.id]?.cells?.[vendor.id];
      const matchStatus = cellState?.value || 'pending';
      const icon = MATCH_ICONS[matchStatus as MatchStatus] || '';
      const bgColor = BG_COLORS[matchStatus as MatchStatus] || BG_COLORS.pending;
      const iconColor = ICON_COLORS[matchStatus as MatchStatus] || '000000';

      cell.value = icon;
      applyCellStyle(cell, {
        fontSize: 14,
        bgColor,
        fontColor: iconColor,
        alignment: { horizontal: 'center', vertical: 'middle' },
      });
    });

    currentRow++;
  });

  // Freeze panes (freeze Category and Criteria columns) and hide gridlines
  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: currentRow - criteria.length, showGridLines: false }];
}

/**
 * Generate Detailed Matching tab
 */
async function generateDetailedMatchingTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>
): Promise<void> {
  const worksheet = workbook.addWorksheet('4. Detailed Matching');

  // Set column widths
  worksheet.getColumn(1).width = 18;  // Category
  worksheet.getColumn(2).width = 20;  // Vendor
  worksheet.getColumn(3).width = 20;  // Criterion
  worksheet.getColumn(4).width = 10;  // Status
  worksheet.getColumn(5).width = 80;  // Evidence
  worksheet.getColumn(6).width = 30;  // Sources

  let currentRow = 1;

  // Title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'VENDORS\' DETAILED CRITERIA MATCHING';
  worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
  applyCellStyle(titleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
  });
  currentRow += 2;

  // Header row
  createHeaderRow(worksheet, currentRow, ['Category', 'Vendor', 'Criterion', 'Status', 'Evidence', 'Sources']);
  currentRow++;

  // Data rows
  const vendors = data.vendors || [];
  const criteria = sortCriteriaByCategory(data.criteria || []); // Sort by category
  const comparisonMatrix = data.comparisonMatrix as any;

  let rowIndex = 0;
  vendors.forEach(vendor => {
    criteria.forEach(criterion => {
      const row = worksheet.getRow(currentRow);

      // Category name (column 1)
      row.getCell(1).value = formatCategoryName(criterion.type || 'other');
      applyCellStyle(row.getCell(1), {
        fontColor: '666666',
        alignment: { vertical: 'top' }
      });

      // Vendor name (column 2)
      row.getCell(2).value = vendor.name;
      applyCellStyle(row.getCell(2), { bold: true, alignment: { vertical: 'top' } });

      // Criterion name (column 3)
      row.getCell(3).value = criterion.name;
      applyCellStyle(row.getCell(3), { alignment: { vertical: 'top' } });

      // Status (column 4) - Get cell state from comparison_state localStorage (includes Stage 1 + Stage 2 updates)
      // Stage 1: yes, unknown, partial, pending
      // Stage 2: star (standout), no (doesn't meet criterion), or updated yes/unknown
      const cellState = comparisonMatrix?.criteria?.[criterion.id]?.cells?.[vendor.id];
      const matchStatus = cellState?.value || 'pending';
      const icon = MATCH_ICONS[matchStatus as MatchStatus] || '';
      const bgColor = BG_COLORS[matchStatus as MatchStatus] || BG_COLORS.pending;
      const iconColor = ICON_COLORS[matchStatus as MatchStatus] || '000000';

      const statusCell = row.getCell(4);
      statusCell.value = icon;
      applyCellStyle(statusCell, {
        fontSize: 14,
        bgColor,
        fontColor: iconColor,
        alignment: { horizontal: 'center', vertical: 'middle' },
      });

      // Evidence (column 5) - CORRECTED: Get from cellState
      const evidenceDescription = cellState?.evidenceDescription || '';
      const researchNotes = cellState?.researchNotes || '';
      const evidenceText = evidenceDescription || researchNotes
        ? `${evidenceDescription}\n\n${researchNotes}`
        : '';

      row.getCell(5).value = evidenceText;
      applyCellStyle(row.getCell(5), {
        fontSize: 10,
        alignment: { wrapText: true, vertical: 'top' },
      });

      // Set max height for evidence
      row.height = Math.min(150, Math.max(40, evidenceText.split('\n').length * 15));

      // Sources (column 6) - CORRECTED: Get from cellState
      const vendorSiteEvidence = cellState?.vendorSiteEvidence;
      const thirdPartyEvidence = cellState?.thirdPartyEvidence;
      const evidenceUrl = cellState?.evidenceUrl;

      const sourceUrl = vendorSiteEvidence || thirdPartyEvidence || evidenceUrl;
      if (sourceUrl) {
        const sourcesCell = row.getCell(6);
        sourcesCell.value = {
          text: sourceUrl,
          hyperlink: sourceUrl,
        };
        applyCellStyle(sourcesCell, {
          fontSize: 9,
          fontColor: BRAND_COLOR,
          alignment: { vertical: 'top', wrapText: true },
        });
      }

      // Alternating row colors (now 6 columns instead of 5)
      if (rowIndex % 2 === 1) {
        [1, 2, 3, 4, 5, 6].forEach(col => {
          const cell = row.getCell(col);
          if (cell.fill && !(cell.fill as any).fgColor) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F9FAFB' },
            };
          }
        });
      }

      currentRow++;
      rowIndex++;
    });
  });

  // Freeze header and hide gridlines
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3, showGridLines: false }];
}

/**
 * Generate Vendor Overview & Match lvl tab
 */
async function generateVendorOverviewTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>,
  logoImageIds?: Map<string, number>
): Promise<void> {
  const worksheet = workbook.addWorksheet('6. Vendor Overview & Match lvl');

  const vendors = data.vendors || [];

  // Set column widths
  worksheet.getColumn(1).width = 20; // Row label column
  vendors.forEach((_, index) => {
    worksheet.getColumn(index + 2).width = 30; // Vendor columns start from column 2
  });

  let currentRow = 1;

  // Title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'VENDOR OVERVIEW & MATCH LEVEL';
  const titleRange = `A${currentRow}:${String.fromCharCode(65 + vendors.length)}${currentRow}`;
  worksheet.mergeCells(titleRange);
  applyCellStyle(titleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
  });
  currentRow += 2;

  // Logo row (if logos available)
  if (logoImageIds && logoImageIds.size > 0) {
    const logoRow = worksheet.getRow(currentRow);
    logoRow.height = 55; // Taller row for logos

    vendors.forEach((vendor, index) => {
      if (logoImageIds.has(vendor.id)) {
        const imageId = logoImageIds.get(vendor.id)!;
        const logoSize = 45;
        // Center in cell: column width 30 chars ≈ 210px, offset = (210 - 45) / 2 ≈ 82px
        const offsetX = 82;
        const offsetY = 5;
        worksheet.addImage(imageId, {
          tl: { col: index + 1, row: currentRow - 1, x: offsetX, y: offsetY },
          ext: { width: logoSize, height: logoSize },
          editAs: 'oneCell',
        });
      }
    });
    currentRow++;
  }

  // Header row with vendor names
  const headerRow = worksheet.getRow(currentRow);
  headerRow.height = 20;

  // First column header (empty)
  headerRow.getCell(1).value = '';
  applyCellStyle(headerRow.getCell(1), {
    bold: true,
    fontSize: HEADER_FONT_SIZE,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'left', vertical: 'middle' },
  });

  // Vendor name headers (start from column 2)
  vendors.forEach((vendor, index) => {
    const cell = headerRow.getCell(index + 2);
    cell.value = vendor.name;
    applyCellStyle(cell, {
      bold: true,
      fontSize: HEADER_FONT_SIZE,
      fontColor: 'FFFFFF',
      bgColor: BRAND_COLOR,
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    });
  });
  currentRow++;

  // Log vendor data for debugging
  console.log('[Excel Export] Generating Vendor Overview tab with enriched vendor data');
  console.log('[Excel Export] Vendors:', vendors.map((v: any) => ({
    name: v.name,
    hasExecutiveSummary: !!v.executiveSummary,
    hasKillerFeature: !!v.killerFeature,
    hasKeyFeatures: !!(v.keyFeatures && v.keyFeatures.length > 0),
    executiveSummaryPreview: v.executiveSummary ? v.executiveSummary.substring(0, 50) + '...' : 'N/A',
  })));

  // Row 1: Match Percentage
  const matchPercentageRow = worksheet.getRow(currentRow);
  matchPercentageRow.height = 20;
  matchPercentageRow.getCell(1).value = 'Match Percentage';
  applyCellStyle(matchPercentageRow.getCell(1), {
    bold: true,
    alignment: { horizontal: 'left', vertical: 'middle' },
  });

  vendors.forEach((vendor, index) => {
    const cell = matchPercentageRow.getCell(index + 2);
    console.log(`[Excel Export] ${vendor.name} matchPercentage:`, vendor.matchPercentage);
    const matchPercentage = vendor.matchPercentage !== undefined && vendor.matchPercentage !== -1
      ? `${vendor.matchPercentage}%`
      : '';
    cell.value = matchPercentage;
    applyCellStyle(cell, {
      alignment: { horizontal: 'center', vertical: 'middle' },
    });
  });
  currentRow++;

  // Row 2: Vendor About
  const aboutRow = worksheet.getRow(currentRow);
  aboutRow.height = 100; // Taller for multi-line content
  aboutRow.getCell(1).value = 'Vendor About';
  applyCellStyle(aboutRow.getCell(1), {
    bold: true,
    alignment: { horizontal: 'left', vertical: 'top' },
  });

  vendors.forEach((vendor: any, index) => {
    const cell = aboutRow.getCell(index + 2);
    const aboutText = vendor.executiveSummary || vendor.description || '';
    console.log(`[Excel Export] ${vendor.name} About text:`, aboutText ? `"${aboutText.substring(0, 50)}..."` : 'EMPTY');
    cell.value = aboutText;
    cell.alignment = { wrapText: true, vertical: 'top' };
    applyCellStyle(cell, {});
  });
  currentRow++;

  // Row 3: Killer Feature
  const killerFeatureRow = worksheet.getRow(currentRow);
  killerFeatureRow.height = 60; // Taller for multi-line content
  killerFeatureRow.getCell(1).value = 'Killer Feature';
  applyCellStyle(killerFeatureRow.getCell(1), {
    bold: true,
    alignment: { horizontal: 'left', vertical: 'top' },
  });

  vendors.forEach((vendor: any, index) => {
    const cell = killerFeatureRow.getCell(index + 2);
    const killerFeature = vendor.killerFeature || '';
    console.log(`[Excel Export] ${vendor.name} Killer Feature:`, killerFeature ? `"${killerFeature.substring(0, 50)}..."` : 'EMPTY');
    cell.value = killerFeature;
    cell.alignment = { wrapText: true, vertical: 'top' };
    applyCellStyle(cell, {});
  });
  currentRow++;

  // Row 4: Key Features (bullet list)
  const keyFeaturesRow = worksheet.getRow(currentRow);
  keyFeaturesRow.height = 120; // Taller for bullet list
  keyFeaturesRow.getCell(1).value = 'Key Features';
  applyCellStyle(keyFeaturesRow.getCell(1), {
    bold: true,
    alignment: { horizontal: 'left', vertical: 'top' },
  });

  vendors.forEach((vendor: any, index) => {
    const cell = keyFeaturesRow.getCell(index + 2);
    if (vendor.keyFeatures && Array.isArray(vendor.keyFeatures) && vendor.keyFeatures.length > 0) {
      // Create bullet list with bullet point character
      const bulletList = vendor.keyFeatures.map((feature: string) => `• ${feature}`).join('\n');
      console.log(`[Excel Export] ${vendor.name} Key Features count:`, vendor.keyFeatures.length);
      cell.value = bulletList;
    } else {
      console.log(`[Excel Export] ${vendor.name} Key Features: EMPTY`);
      cell.value = '';
    }
    cell.alignment = { wrapText: true, vertical: 'top' };
    applyCellStyle(cell, {});
  });
  currentRow++;

  // Hide gridlines
  worksheet.views = [{ showGridLines: false }];

  console.log('[Excel Export] Vendor Overview & Match lvl tab complete');
}

/**
 * Generate Pre-Demo Brief tab
 */
async function generateExecutiveSummaryTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>
): Promise<void> {
  if (!data.executiveSummary) return;

  const worksheet = workbook.addWorksheet('7. Pre-Demo Brief');

  // Set column width
  worksheet.getColumn(1).width = 100;

  let currentRow = 1;

  // Title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'PRE-DEMO BRIEF';
  applyCellStyle(titleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    border: false,
  });
  currentRow += 2;

  // Generated date (if available)
  if (data.executiveSummary.generatedAt) {
    const dateCell = worksheet.getCell(`A${currentRow}`);
    const date = new Date(data.executiveSummary.generatedAt);
    dateCell.value = `Generated on ${date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`;
    applyCellStyle(dateCell, {
      fontSize: 11,
      fontColor: '666666',
      border: false,
    });
    currentRow += 2;
  }

  // Check if we have structured data (from n8n) or simple summary
  const summaryData = data.executiveSummary as any;
  const hasStructuredData = summaryData.keyCriteria || summaryData.vendorRecommendations;

  if (hasStructuredData) {
    // Export n8n ExecutiveSummaryData structure
    console.log('[Excel Export] Exporting structured Pre-Demo Brief data');

    // Key Evaluation Criteria section
    if (summaryData.keyCriteria && Array.isArray(summaryData.keyCriteria) && summaryData.keyCriteria.length > 0) {
      const sectionTitle = worksheet.getCell(`A${currentRow}`);
      sectionTitle.value = 'Key Evaluation Criteria';
      applyCellStyle(sectionTitle, {
        bold: true,
        fontSize: 14,
        fontColor: BRAND_COLOR,
        border: false,
      });
      currentRow += 2;

      summaryData.keyCriteria.forEach((criterion: any) => {
        const criterionHeader = worksheet.getCell(`A${currentRow}`);
        criterionHeader.value = `${criterion.name}${criterion.importance ? ` (${criterion.importance})` : ''}`;
        applyCellStyle(criterionHeader, {
          bold: true,
          fontSize: 11,
          border: false,
        });
        currentRow += 1;

        if (criterion.description) {
          const descCell = worksheet.getCell(`A${currentRow}`);
          descCell.value = criterion.description;
          descCell.alignment = { wrapText: true, vertical: 'top' };
          applyCellStyle(descCell, { border: false });
          currentRow += 1;
        }
        currentRow += 1;
      });
    }

    // Vendor Recommendations section
    if (summaryData.vendorRecommendations && Array.isArray(summaryData.vendorRecommendations) && summaryData.vendorRecommendations.length > 0) {
      const sectionTitle = worksheet.getCell(`A${currentRow}`);
      sectionTitle.value = 'Vendor Recommendations';
      applyCellStyle(sectionTitle, {
        bold: true,
        fontSize: 14,
        fontColor: BRAND_COLOR,
        border: false,
      });
      currentRow += 2;

      summaryData.vendorRecommendations.forEach((vendor: any) => {
        const vendorHeader = worksheet.getCell(`A${currentRow}`);
        vendorHeader.value = `${vendor.rank}. ${vendor.name}${vendor.matchPercentage ? ` - ${vendor.matchPercentage}% Match` : ''}`;
        applyCellStyle(vendorHeader, {
          bold: true,
          fontSize: 12,
          fontColor: BRAND_COLOR,
          border: false,
        });
        currentRow += 1;

        if (vendor.overallAssessment) {
          const assessmentCell = worksheet.getCell(`A${currentRow}`);
          assessmentCell.value = vendor.overallAssessment;
          assessmentCell.alignment = { wrapText: true, vertical: 'top' };
          applyCellStyle(assessmentCell, { border: false });
          currentRow += 1;
        }

        if (vendor.keyStrengths && vendor.keyStrengths.length > 0) {
          const strengthsTitle = worksheet.getCell(`A${currentRow}`);
          strengthsTitle.value = 'Key Strengths:';
          applyCellStyle(strengthsTitle, { bold: true, fontSize: 10, border: false });
          currentRow += 1;

          vendor.keyStrengths.forEach((strength: string) => {
            const strengthCell = worksheet.getCell(`A${currentRow}`);
            strengthCell.value = `• ${strength}`;
            strengthCell.alignment = { wrapText: true, vertical: 'top' };
            applyCellStyle(strengthCell, { border: false });
            currentRow += 1;
          });
        }

        if (vendor.keyWeaknesses && vendor.keyWeaknesses.length > 0) {
          const weaknessesTitle = worksheet.getCell(`A${currentRow}`);
          weaknessesTitle.value = 'Key Weaknesses:';
          applyCellStyle(weaknessesTitle, { bold: true, fontSize: 10, border: false });
          currentRow += 1;

          vendor.keyWeaknesses.forEach((weakness: string) => {
            const weaknessCell = worksheet.getCell(`A${currentRow}`);
            weaknessCell.value = `• ${weakness}`;
            weaknessCell.alignment = { wrapText: true, vertical: 'top' };
            applyCellStyle(weaknessCell, { border: false });
            currentRow += 1;
          });
        }

        if (vendor.bestFor) {
          const bestForTitle = worksheet.getCell(`A${currentRow}`);
          bestForTitle.value = 'Best For:';
          applyCellStyle(bestForTitle, { bold: true, fontSize: 10, border: false });
          currentRow += 1;

          const bestForCell = worksheet.getCell(`A${currentRow}`);
          bestForCell.value = vendor.bestFor;
          bestForCell.alignment = { wrapText: true, vertical: 'top' };
          applyCellStyle(bestForCell, { border: false });
          currentRow += 1;
        }

        currentRow += 1;
      });
    }

    // Key Differentiators section
    if (summaryData.keyDifferentiators && Array.isArray(summaryData.keyDifferentiators) && summaryData.keyDifferentiators.length > 0) {
      const sectionTitle = worksheet.getCell(`A${currentRow}`);
      sectionTitle.value = 'Key Differentiators';
      applyCellStyle(sectionTitle, {
        bold: true,
        fontSize: 14,
        fontColor: BRAND_COLOR,
        border: false,
      });
      currentRow += 2;

      summaryData.keyDifferentiators.forEach((diff: any) => {
        const diffHeader = worksheet.getCell(`A${currentRow}`);
        diffHeader.value = `${diff.category}: ${diff.leader}`;
        applyCellStyle(diffHeader, {
          bold: true,
          border: false,
        });
        currentRow += 1;

        if (diff.details) {
          const detailsCell = worksheet.getCell(`A${currentRow}`);
          detailsCell.value = diff.details;
          detailsCell.alignment = { wrapText: true, vertical: 'top' };
          applyCellStyle(detailsCell, { border: false });
          currentRow += 1;
        }
        currentRow += 1;
      });
    }

    // Risk Factors & Call Preparation section
    if (summaryData.riskFactors) {
      const sectionTitle = worksheet.getCell(`A${currentRow}`);
      sectionTitle.value = 'Risk Factors & Call Preparation';
      applyCellStyle(sectionTitle, {
        bold: true,
        fontSize: 14,
        fontColor: BRAND_COLOR,
        border: false,
      });
      currentRow += 2;

      if (summaryData.riskFactors.vendorSpecific && summaryData.riskFactors.vendorSpecific.length > 0) {
        const questionsTitle = worksheet.getCell(`A${currentRow}`);
        questionsTitle.value = 'Questions to Ask Each Vendor:';
        applyCellStyle(questionsTitle, {
          bold: true,
          border: false,
        });
        currentRow += 1;

        summaryData.riskFactors.vendorSpecific.forEach((item: any) => {
          const vendorName = worksheet.getCell(`A${currentRow}`);
          vendorName.value = item.vendor;
          applyCellStyle(vendorName, {
            bold: true,
            fontColor: BRAND_COLOR,
            border: false,
          });
          currentRow += 1;

          if (item.questions && item.questions.length > 0) {
            item.questions.forEach((q: string) => {
              const questionCell = worksheet.getCell(`A${currentRow}`);
              questionCell.value = `• ${q}`;
              questionCell.alignment = { wrapText: true, vertical: 'top' };
              applyCellStyle(questionCell, { border: false });
              currentRow += 1;
            });
          }
          currentRow += 1;
        });
      }

      if (summaryData.riskFactors.generalConsiderations && summaryData.riskFactors.generalConsiderations.length > 0) {
        const considerationsTitle = worksheet.getCell(`A${currentRow}`);
        considerationsTitle.value = 'General Considerations:';
        applyCellStyle(considerationsTitle, {
          bold: true,
          border: false,
        });
        currentRow += 1;

        summaryData.riskFactors.generalConsiderations.forEach((consideration: string) => {
          const considerationCell = worksheet.getCell(`A${currentRow}`);
          considerationCell.value = `• ${consideration}`;
          considerationCell.alignment = { wrapText: true, vertical: 'top' };
          applyCellStyle(considerationCell, { border: false });
          currentRow += 1;
        });
        currentRow += 1;
      }
    }

    // Final Recommendation section
    if (summaryData.recommendation) {
      const sectionTitle = worksheet.getCell(`A${currentRow}`);
      sectionTitle.value = 'Final Recommendation';
      applyCellStyle(sectionTitle, {
        bold: true,
        fontSize: 14,
        fontColor: BRAND_COLOR,
        border: false,
      });
      currentRow += 2;

      if (summaryData.recommendation.topPick) {
        const topPickTitle = worksheet.getCell(`A${currentRow}`);
        topPickTitle.value = `Top Pick: ${summaryData.recommendation.topPick}`;
        applyCellStyle(topPickTitle, {
          bold: true,
          fontSize: 12,
          fontColor: BRAND_COLOR,
          border: false,
        });
        currentRow += 1;
      }

      if (summaryData.recommendation.reason) {
        const reasonCell = worksheet.getCell(`A${currentRow}`);
        reasonCell.value = summaryData.recommendation.reason;
        reasonCell.alignment = { wrapText: true, vertical: 'top' };
        applyCellStyle(reasonCell, { border: false });
        currentRow += 1;
      }

      if (summaryData.recommendation.considerations && summaryData.recommendation.considerations.length > 0) {
        currentRow += 1;
        const considerationsTitle = worksheet.getCell(`A${currentRow}`);
        considerationsTitle.value = 'Key Considerations:';
        applyCellStyle(considerationsTitle, { bold: true, border: false });
        currentRow += 1;

        summaryData.recommendation.considerations.forEach((consideration: string) => {
          const considerationCell = worksheet.getCell(`A${currentRow}`);
          considerationCell.value = `• ${consideration}`;
          considerationCell.alignment = { wrapText: true, vertical: 'top' };
          applyCellStyle(considerationCell, { border: false });
          currentRow += 1;
        });
      }
    }
  } else {
    // Fallback: Export simple summary text if structured data not available
    console.log('[Excel Export] No structured data found, using fallback text export');
    const summaryCell = worksheet.getCell(`A${currentRow}`);
    summaryCell.value = data.executiveSummary.projectSummary || summaryData.toString();
    summaryCell.alignment = { wrapText: true, vertical: 'top' };
    applyCellStyle(summaryCell, { border: false });
  }

  // Hide gridlines
  worksheet.views = [{ showGridLines: false }];

  console.log('[Excel Export] Pre-Demo Brief tab complete');
}

/**
 * Generate Battlecards tab (transposed)
 */
async function generateBattlecardsTab(
  workbook: ExcelJS.Workbook,
  data: Partial<ExportProjectData>,
  logoImageIds?: Map<string, number>
): Promise<void> {
  if (!data.battlecards || data.battlecards.length === 0) {
    console.log('[Excel Export] Battlecards tab skipped - no data');
    return;
  }

  console.log('[Excel Export] Generating battlecards tab:', {
    rowCount: data.battlecards.length,
    vendorCount: data.vendors?.length || 0,
    sampleRow: data.battlecards[0] ? {
      category: data.battlecards[0].category_title,
      status: data.battlecards[0].status,
      cellCount: data.battlecards[0].cells?.length,
    } : null,
  });

  const worksheet = workbook.addWorksheet('5. Battlecards');

  const battlecards = data.battlecards;
  const vendors = data.vendors || [];

  // Set column widths
  worksheet.getColumn(1).width = 25; // Category
  vendors.forEach((_, index) => {
    worksheet.getColumn(index + 2).width = 30;
  });

  let currentRow = 1;

  // Title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'VENDOR BATTLECARDS';
  const titleRange = `A${currentRow}:${String.fromCharCode(65 + vendors.length)}${currentRow}`;
  worksheet.mergeCells(titleRange);
  applyCellStyle(titleCell, {
    bold: true,
    fontSize: 16,
    fontColor: BRAND_COLOR,
    alignment: { horizontal: 'center' },
  });
  currentRow += 2;

  // Logo row (if logos available) - BATTLECARDS TAB
  if (logoImageIds && logoImageIds.size > 0) {
    const logoRow = worksheet.getRow(currentRow);
    logoRow.height = 55; // Taller row for larger logos

    vendors.forEach((vendor, index) => {
      if (logoImageIds.has(vendor.id)) {
        const imageId = logoImageIds.get(vendor.id)!;
        const logoSize = 45; // Increased from 30 to 45
        // Center in cell: column width 30 chars ≈ 210px, offset = (210 - 45) / 2 ≈ 82px
        const offsetX = 82;
        const offsetY = 5; // Small vertical offset for better centering
        worksheet.addImage(imageId, {
          tl: { col: index + 1, row: currentRow - 1, x: offsetX, y: offsetY },
          ext: { width: logoSize, height: logoSize },
          editAs: 'oneCell',
        });
      }
    });
    currentRow++;
  }

  // Header row with vendor names
  const headerRow = worksheet.getRow(currentRow);
  headerRow.getCell(1).value = 'Category';
  applyCellStyle(headerRow.getCell(1), {
    bold: true,
    fontSize: HEADER_FONT_SIZE,
    fontColor: BRAND_COLOR,
  });

  vendors.forEach((vendor, index) => {
    const cell = headerRow.getCell(index + 2);
    cell.value = vendor.name;
    applyCellStyle(cell, {
      bold: true,
      fontSize: HEADER_FONT_SIZE,
      fontColor: 'FFFFFF',
      bgColor: BRAND_COLOR,
      alignment: { horizontal: 'center', wrapText: true },
    });
  });

  currentRow++;

  // Data rows (transposed: categories in rows, vendors in columns)
  battlecards.forEach((row, rowIndex) => {
    // Skip rows with pending or failed status
    if (row.status === 'pending' || row.status === 'failed') {
      console.log(`[Excel Export] Skipping battlecard row: ${row.category_title} (status: ${row.status})`);
      return;
    }

    const wsRow = worksheet.getRow(currentRow);

    // Category name - CORRECTED: Use snake_case field name
    wsRow.getCell(1).value = row.category_title || 'Unknown Category';
    applyCellStyle(wsRow.getCell(1), {
      bold: true,
      fontColor: BRAND_COLOR,
      alignment: { vertical: 'top' },
    });

    // Vendor cells - CORRECTED: Use 'text' field, not 'content'
    if (row.cells && Array.isArray(row.cells)) {
      console.log(`[Excel Export] Processing battlecard row: ${row.category_title}, cells: ${row.cells.length}`);
      row.cells.forEach((cell, cellIndex) => {
        const wsCell = wsRow.getCell(cellIndex + 2);
        // FIXED: BattlecardCell uses 'text' field, not 'content'
        wsCell.value = cell.text || '';
        applyCellStyle(wsCell, {
          alignment: { wrapText: true, vertical: 'top' },
        });

        // Log first cell content for debugging
        if (cellIndex === 0) {
          console.log(`  First cell (${cell.vendor_name}): "${(cell.text || '').substring(0, 50)}..."`);
        }
      });
    } else {
      console.warn(`[Excel Export] Battlecard row has no cells: ${row.category_title}`);
    }

    // Alternating row colors
    if (rowIndex % 2 === 1) {
      for (let i = 1; i <= vendors.length + 1; i++) {
        const cell = wsRow.getCell(i);
        if (!cell.fill || !(cell.fill as any).fgColor) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFB' },
          };
        }
      }
    }

    currentRow++;
  });

  console.log(`[Excel Export] Battlecards tab complete: ${currentRow - 4} rows generated`);

  // Freeze header and hide gridlines
  worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 3, showGridLines: false }];
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Export project to Excel format
 *
 * @param options - Export options
 * @returns Export result with success status and filename
 *
 * @example
 * const result = await exportProjectToExcel({
 *   projectId: 'abc123',
 *   projectName: 'CX Platform Selection'
 * });
 *
 * if (result.success) {
 *   console.log(`Exported to ${result.filename}`);
 * }
 */
export async function exportProjectToExcel(
  options: ExcelExportOptions
): Promise<ExportResult> {
  const {
    projectId,
    projectName,
    includeArchived = true,
    skipPrompt = false,
    stage,
  } = options;

  try {
    // Load project data
    const data = loadProjectData(projectId);
    data.projectName = projectName;

    // Override stage if provided
    if (stage) {
      data.stage = stage;
    }

    // Check for incomplete data
    const incompleteCheck = checkIncompleteData(data);
    if (!skipPrompt && incompleteCheck.shouldPrompt) {
      // In a real implementation, show the IncompleteDataPrompt modal
      // For now, log a warning
      console.warn('Export includes incomplete data:', incompleteCheck.message);
    }

    // Filter archived criteria if needed
    if (!includeArchived) {
      data.criteria = data.criteria?.filter(c => !(c as any).isArchived);
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Clarioo';
    workbook.created = new Date();

    // Process vendor logos
    let logoImageIds: Map<string, number> | undefined;
    if (data.vendors && data.vendors.length > 0) {
      try {
        console.log('[Excel Export] Processing vendor logos:', data.vendors.length);

        // Generate logo URLs from website domains (matching AnimatedVendorLogo implementation)
        const vendorsWithLogos = data.vendors.map(v => {
          let logoUrl: string | undefined;

          if (v.website) {
            // Extract domain from website URL
            const domain = v.website.replace(/^https?:\/\//, '').split('/')[0];
            // Use img.logo.dev service with API token
            logoUrl = `https://img.logo.dev/${domain}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`;
            console.log(`[Excel Export] Generated logo URL for ${v.name}: ${logoUrl}`);
          } else {
            console.log(`[Excel Export] No website for ${v.name}, will use initials badge`);
          }

          return { id: v.id, name: v.name, logo: logoUrl };
        });

        const logoDataUrls = await processVendorLogos(vendorsWithLogos, 60);
        console.log(`[Excel Export] Successfully processed ${logoDataUrls.size} logos`);

        logoImageIds = new Map();
        for (const [vendorId, dataUrl] of logoDataUrls.entries()) {
          const imageId = workbook.addImage({
            base64: dataUrl.split(',')[1],
            extension: 'png',
          });
          logoImageIds.set(vendorId, imageId);
        }
      } catch (error) {
        console.error('Failed to process vendor logos:', error);
      }
    }

    // Capture scatter plot screenshot - OPTIONAL: Only if element is visible
    let scatterPlotImageId: number | undefined;
    let scatterPlotDimensions: { width: number; height: number } | undefined;
    if (data.vendors && data.vendors.length > 0 && data.stage !== 'criteria_only') {
      // Check if scatter plot element exists and is visible
      const scatterPlotVisible = isElementVisible('scatter-plot-chart');
      console.log(`[Excel Export] Scatter plot element visible: ${scatterPlotVisible}`);

      if (scatterPlotVisible) {
        try {
          console.log('[Excel Export] Attempting to capture scatter plot screenshot...');
          const scatterPlotDataUrl = await captureScatterPlotWhenReady('scatter-plot-chart', 5000);
          console.log('[Excel Export] ✅ Scatter plot captured successfully');

          // Get actual image dimensions from the captured screenshot
          try {
            scatterPlotDimensions = await getImageDimensions(scatterPlotDataUrl);

            // Verify dimensions are valid
            if (scatterPlotDimensions && scatterPlotDimensions.width > 0 && scatterPlotDimensions.height > 0) {
              console.log(`[Excel Export] Scatter plot dimensions: ${scatterPlotDimensions.width}x${scatterPlotDimensions.height}px`);
              scatterPlotImageId = workbook.addImage({
                base64: scatterPlotDataUrl.split(',')[1],
                extension: 'png',
              });
              console.log('[Excel Export] ✅ Scatter plot image added to workbook');
            } else {
              console.warn('[Excel Export] ⚠️ Invalid scatter plot dimensions, skipping');
              scatterPlotDimensions = undefined;
            }
          } catch (dimError) {
            console.error('[Excel Export] ⚠️ Failed to get image dimensions:', dimError);
            scatterPlotDimensions = undefined;
          }
        } catch (error) {
          // Scatter plot is optional - don't show as error
          console.log('[Excel Export] ℹ️ Scatter plot capture failed:', error instanceof Error ? error.message : 'Unknown error');
          console.log('[Excel Export] Continuing without scatter plot screenshot.');
        }
      } else {
        console.log('[Excel Export] ℹ️ Scatter plot element not visible, skipping capture');
      }
    }

    // Generate tabs based on project stage
    await generateIndexTab(workbook, data);
    await generateCriteriaTab(workbook, data);

    if (data.stage !== 'criteria_only') {
      await generateVendorListTab(workbook, data, scatterPlotImageId, logoImageIds, scatterPlotDimensions);
    }

    if (['comparison_matrix', 'detailed_matching', 'executive_summary', 'battlecards_complete'].includes(data.stage!)) {
      await generateComparisonMatrixTab(workbook, data, logoImageIds);
    }

    if (['detailed_matching', 'executive_summary', 'battlecards_complete'].includes(data.stage!)) {
      await generateDetailedMatchingTab(workbook, data);
    }

    // Tab 5: Battlecards
    if (data.battlecards && data.battlecards.length > 0) {
      await generateBattlecardsTab(workbook, data, logoImageIds);
    }

    // Tab 6: Vendor Overview & Match lvl (NEW)
    if (data.stage !== 'criteria_only' && data.vendors && data.vendors.length > 0) {
      await generateVendorOverviewTab(workbook, data, logoImageIds);
    }

    // Tab 7: Pre-Demo Brief (renumbered from 6)
    if (data.executiveSummary) {
      await generateExecutiveSummaryTab(workbook, data);
    }

    // Generate filename
    const filename = generateSP027Filename(projectName, 'excel');

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create blob
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Trigger download
    saveAs(blob, filename);

    return {
      success: true,
      format: 'excel',
      filename,
      blob,
    };
  } catch (error) {
    console.error('Excel export failed:', error);

    return {
      success: false,
      format: 'excel',
      filename: '',
      error: error instanceof Error ? error.message : 'Failed to export to Excel',
      errorCode: 'EXCEL_GENERATION_FAILED',
    };
  }
}

/**
 * Check if project has sufficient data for export
 *
 * @param projectId - Project ID
 * @returns True if project can be exported
 */
export function canExportToExcel(projectId: string): boolean {
  const data = loadProjectData(projectId);
  return (data.criteria?.length || 0) > 0;
}

/**
 * Get export preview information
 *
 * @param projectId - Project ID
 * @returns Export preview with tab counts
 */
export function getExportPreview(projectId: string): {
  stage: ProjectStage;
  tabCount: number;
  criteriaCount: number;
  vendorsCount: number;
  hasExecutiveSummary: boolean;
  hasBattlecards: boolean;
} {
  const data = loadProjectData(projectId);

  let tabCount = 2; // Always have INDEX + Criteria

  if (data.stage !== 'criteria_only') {
    tabCount++; // Vendor List
  }

  if (['comparison_matrix', 'detailed_matching', 'executive_summary', 'battlecards_complete'].includes(data.stage!)) {
    tabCount++; // Comparison Matrix
  }

  if (['detailed_matching', 'executive_summary', 'battlecards_complete'].includes(data.stage!)) {
    tabCount++; // Detailed Matching
  }

  if (data.battlecards && data.battlecards.length > 0) {
    tabCount++; // Battlecards
  }

  if (data.stage !== 'criteria_only' && data.vendors && data.vendors.length > 0) {
    tabCount++; // Vendor Overview & Match lvl
  }

  if (data.executiveSummary) {
    tabCount++; // Pre-Demo Brief
  }

  return {
    stage: data.stage!,
    tabCount,
    criteriaCount: data.criteria?.length || 0,
    vendorsCount: data.vendors?.length || 0,
    hasExecutiveSummary: !!data.executiveSummary,
    hasBattlecards: !!(data.battlecards && data.battlecards.length > 0),
  };
}

