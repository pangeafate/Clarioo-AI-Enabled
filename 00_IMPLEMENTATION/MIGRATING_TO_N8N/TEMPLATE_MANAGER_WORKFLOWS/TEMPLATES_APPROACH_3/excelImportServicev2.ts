/**
 * Excel Import Service
 * Sprint: SP_027 - Excel & JSON Export Feature (Reverse Operation)
 *
 * Service for importing Excel files back to JSON format with lossless conversion.
 * Mirrors the structure of excelExportService.ts
 */

import ExcelJS from 'exceljs';
import type {
  ProjectStage,
  MatchStatus,
} from '@/types/export.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ImportResult {
  success: boolean;
  data?: ExportProjectData;
  error?: string;
  errorCode?: ImportErrorCode;
  warnings?: string[];
}

export type ImportErrorCode =
  | 'FILE_READ_ERROR'
  | 'INVALID_FORMAT'
  | 'MISSING_REQUIRED_TAB'
  | 'PARSE_ERROR'
  | 'VERSION_MISMATCH';

export interface ExportProjectData {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  stage: ProjectStage;
  category?: string;
  techRequest?: TechRequest;
  criteria: Criterion[];
  vendors: Vendor[];
  comparisonMatrix?: ComparisonMatrix;
  executiveSummary?: ExecutiveSummaryData;
  battlecards?: BattlecardRow[];
  screeningSummary?: string;
  metadata?: ProjectMetadata;
}

export interface TechRequest {
  description?: string;
  companyContext?: string;
  solutionRequirements?: string;
}

export interface Criterion {
  id: string;
  name: string;
  explanation?: string;
  description?: string;
  importance: 'high' | 'medium' | 'low';
  type: string;
  isArchived?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  website?: string;
}

export interface ComparisonMatrix {
  criteria: {
    [criterionId: string]: {
      cells: {
        [vendorId: string]: CellState;
      };
    };
  };
}

export interface CellState {
  value: MatchStatus;
  status?: MatchStatus;
  evidenceDescription?: string;
  researchNotes?: string;
  vendorSiteEvidence?: string;
  thirdPartyEvidence?: string;
  evidenceUrl?: string;
}

export interface BattlecardRow {
  category_title: string;
  status: 'pending' | 'failed' | 'complete';
  cells: BattlecardCell[];
}

export interface BattlecardCell {
  vendor_name: string;
  text: string;
}

export interface ExecutiveSummaryData {
  generatedAt?: string;
  projectSummary?: string;
  keyCriteria?: KeyCriterion[];
  vendorRecommendations?: VendorRecommendation[];
  keyDifferentiators?: KeyDifferentiator[];
  riskFactors?: RiskFactors;
  recommendation?: Recommendation;
}

export interface KeyCriterion {
  name: string;
  importance?: string;
  description?: string;
}

export interface VendorRecommendation {
  rank: number;
  name: string;
  matchPercentage?: number;
  overallAssessment?: string;
  keyStrengths?: string[];
  keyWeaknesses?: string[];
  bestFor?: string;
}

export interface KeyDifferentiator {
  category: string;
  leader: string;
  details?: string;
}

export interface RiskFactors {
  vendorSpecific?: VendorRisk[];
  generalConsiderations?: string[];
}

export interface VendorRisk {
  vendor: string;
  questions: string[];
}

export interface Recommendation {
  topPick?: string;
  reason?: string;
  considerations?: string[];
}

export interface ProjectMetadata {
  exportDate?: string;
  createdBy?: string;
  userId?: string;
  softwareCategory?: string;
  searchedBy?: string;
  keyFeatures?: string;
  clientQuote?: string;
  currentTools?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Reverse mapping: icon to status
const ICON_TO_STATUS: Record<string, MatchStatus> = {
  '✓': 'yes',
  '⭐': 'star',
  'X': 'no',
  '+/-': 'partial',
  '?': 'unknown',
  '🔄': 'pending',
};

// Stage name mapping (reverse)
const STAGE_NAME_TO_STAGE: Record<string, ProjectStage> = {
  'Criteria Defined': 'criteria_only',
  'Vendors Selected': 'vendors_selected',
  'Comparison Complete': 'comparison_matrix',
  'Pre-Demo Brief Generated': 'executive_summary',
  'Battlecards Complete': 'battlecards_complete',
  'In Progress': 'criteria_only',
};

// Importance color to value (reverse mapping)
const IMPORTANCE_FROM_COLOR: Record<string, 'high' | 'medium' | 'low'> = {
  'FFDC2626': 'high',
  'DC2626': 'high',
  'FFF97316': 'medium',
  'F97316': 'medium',
  'FF22C55E': 'low',
  '22C55E': 'low',
};

// Tab name patterns
const TAB_PATTERNS = {
  INDEX: /^INDEX$/i,
  CRITERIA: /^1\.\s*Evaluation Criteria$/i,
  VENDOR_LIST: /^2\.\s*Vendor List$/i,
  COMPARISON: /^3\.\s*Vendor Evaluation$/i,
  DETAILED_MATCHING: /^4\.\s*Detailed Matching$/i,
  BATTLECARDS: /^5\.\s*Battlecards$/i,
  EXECUTIVE_SUMMARY: /^6\.\s*Pre-Demo Brief$/i,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get cell value as string, handling various cell types
 */
function getCellString(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }

  const value = cell.value;

  // Handle rich text
  if (typeof value === 'object' && 'richText' in value) {
    return (value as ExcelJS.CellRichTextValue).richText
      .map((rt) => rt.text)
      .join('');
  }

  // Handle hyperlinks
  if (typeof value === 'object' && 'text' in value) {
    return (value as ExcelJS.CellHyperlinkValue).text;
  }

  // Handle formula results
  if (typeof value === 'object' && 'result' in value) {
    return String((value as ExcelJS.CellFormulaValue).result || '');
  }

  return String(value);
}

/**
 * Get hyperlink URL from cell
 */
function getCellHyperlink(cell: ExcelJS.Cell | undefined): string | undefined {
  if (!cell || !cell.value) return undefined;

  const value = cell.value;

  if (typeof value === 'object' && 'hyperlink' in value) {
    return (value as ExcelJS.CellHyperlinkValue).hyperlink;
  }

  return undefined;
}

/**
 * Get cell font color (ARGB)
 */
function getCellFontColor(cell: ExcelJS.Cell | undefined): string | undefined {
  if (!cell || !cell.font || !cell.font.color) return undefined;
  return cell.font.color.argb;
}

/**
 * Parse importance from cell (by text or color)
 */
function parseImportance(cell: ExcelJS.Cell | undefined): 'high' | 'medium' | 'low' {
  const text = getCellString(cell).toLowerCase();
  
  if (text === 'high') return 'high';
  if (text === 'medium') return 'medium';
  if (text === 'low') return 'low';

  // Try by color
  const color = getCellFontColor(cell);
  if (color && IMPORTANCE_FROM_COLOR[color]) {
    return IMPORTANCE_FROM_COLOR[color];
  }

  return 'medium'; // Default
}

/**
 * Parse match status from cell icon
 */
function parseMatchStatus(cell: ExcelJS.Cell | undefined): MatchStatus {
  const text = getCellString(cell).trim();
  return ICON_TO_STATUS[text] || 'pending';
}

/**
 * Generate a unique ID (for reconstructing missing IDs)
 */
function generateId(prefix: string, index: number): string {
  return `${prefix}_${Date.now()}_${index}`;
}

/**
 * Find worksheet by pattern
 */
function findWorksheet(
  workbook: ExcelJS.Workbook,
  pattern: RegExp
): ExcelJS.Worksheet | undefined {
  return workbook.worksheets.find((ws) => pattern.test(ws.name));
}

/**
 * Find row index where a specific value appears in column A
 */
function findRowByLabel(
  worksheet: ExcelJS.Worksheet,
  label: string,
  startRow: number = 1,
  endRow: number = 100
): number | undefined {
  for (let row = startRow; row <= endRow; row++) {
    const cellValue = getCellString(worksheet.getCell(`A${row}`));
    if (cellValue.toLowerCase().includes(label.toLowerCase())) {
      return row;
    }
  }
  return undefined;
}

/**
 * Find row index where header row starts (by looking for specific headers)
 */
function findHeaderRow(
  worksheet: ExcelJS.Worksheet,
  expectedHeaders: string[],
  maxRow: number = 20
): number | undefined {
  for (let row = 1; row <= maxRow; row++) {
    const rowValues: string[] = [];
    for (let col = 1; col <= 10; col++) {
      rowValues.push(getCellString(worksheet.getCell(row, col)).toLowerCase());
    }
    
    const matchCount = expectedHeaders.filter((h) =>
      rowValues.some((v) => v.includes(h.toLowerCase()))
    ).length;

    if (matchCount >= expectedHeaders.length * 0.7) {
      return row;
    }
  }
  return undefined;
}

// ============================================================================
// TAB PARSING FUNCTIONS
// ============================================================================

/**
 * Parse INDEX tab
 */
function parseIndexTab(worksheet: ExcelJS.Worksheet): {
  projectName?: string;
  projectDescription?: string;
  stage?: ProjectStage;
  category?: string;
  techRequest?: TechRequest;
  metadata?: ProjectMetadata;
} {
  const result: ReturnType<typeof parseIndexTab> = {
    techRequest: {},
    metadata: {},
  };

  // Scan rows for key-value pairs
  for (let row = 1; row <= 100; row++) {
    const labelCell = worksheet.getCell(`A${row}`);
    const valueCell = worksheet.getCell(`B${row}`);
    const label = getCellString(labelCell).replace(':', '').trim().toLowerCase();
    const value = getCellString(valueCell).trim();

    if (!label || !value) continue;

    switch (label) {
      case 'project name':
        result.projectName = value;
        break;
      case 'category':
        result.category = value;
        break;
      case 'company context':
        result.techRequest!.companyContext = value;
        break;
      case 'solution requirements':
        result.techRequest!.solutionRequirements = value;
        break;
      case 'description':
        result.projectDescription = value;
        break;
      case 'software category':
        result.metadata!.softwareCategory = value;
        break;
      case 'searched by':
        result.metadata!.searchedBy = value;
        break;
      case 'key features':
        result.metadata!.keyFeatures = value;
        break;
      case 'client quote':
        result.metadata!.clientQuote = value;
        break;
      case 'current tools':
        result.metadata!.currentTools = value;
        break;
      case 'created by':
        result.metadata!.createdBy = value;
        break;
      case 'user id':
        result.metadata!.userId = value;
        break;
      case 'export date':
        result.metadata!.exportDate = value;
        break;
      case 'project stage':
        result.stage = STAGE_NAME_TO_STAGE[value] || 'criteria_only';
        break;
    }
  }

  // Clean up empty objects
  if (Object.keys(result.techRequest!).length === 0) {
    delete result.techRequest;
  }
  if (Object.keys(result.metadata!).length === 0) {
    delete result.metadata;
  }

  return result;
}

/**
 * Parse Criteria tab
 */
function parseCriteriaTab(worksheet: ExcelJS.Worksheet): Criterion[] {
  const criteria: Criterion[] = [];

  // Find header row
  const headerRow = findHeaderRow(worksheet, ['#', 'criterion', 'importance', 'type']);
  if (!headerRow) {
    console.warn('[Import] Could not find criteria header row');
    return criteria;
  }

  // Determine column indices
  const headerCells: string[] = [];
  for (let col = 1; col <= 10; col++) {
    headerCells.push(getCellString(worksheet.getCell(headerRow, col)).toLowerCase());
  }

  const colIndex = {
    number: headerCells.findIndex((h) => h === '#') + 1,
    name: headerCells.findIndex((h) => h.includes('criterion')) + 1,
    explanation: headerCells.findIndex((h) => h.includes('explanation')) + 1,
    importance: headerCells.findIndex((h) => h.includes('importance')) + 1,
    type: headerCells.findIndex((h) => h.includes('type')) + 1,
  };

  // Parse data rows
  let row = headerRow + 1;
  let index = 0;

  while (row <= worksheet.rowCount) {
    const nameCell = worksheet.getCell(row, colIndex.name || 2);
    const name = getCellString(nameCell).trim();

    if (!name) {
      row++;
      continue;
    }

    const criterion: Criterion = {
      id: generateId('criterion', index),
      name,
      explanation: getCellString(worksheet.getCell(row, colIndex.explanation || 3)),
      importance: parseImportance(worksheet.getCell(row, colIndex.importance || 4)),
      type: getCellString(worksheet.getCell(row, colIndex.type || 5)) || 'Feature',
    };

    // Use explanation as description fallback
    if (!criterion.explanation) {
      criterion.description = criterion.explanation;
    }

    criteria.push(criterion);
    index++;
    row++;
  }

  return criteria;
}

/**
 * Parse Vendor List tab
 */
function parseVendorListTab(worksheet: ExcelJS.Worksheet): {
  vendors: Vendor[];
  screeningSummary?: string;
} {
  const vendors: Vendor[] = [];
  let screeningSummary: string | undefined;

  // Look for screening summary
  const screeningRow = findRowByLabel(worksheet, 'SCREENING SUMMARY');
  if (screeningRow) {
    screeningSummary = getCellString(worksheet.getCell(`A${screeningRow + 1}`));
  }

  // Find header row
  const headerRow = findHeaderRow(worksheet, ['#', 'vendor', 'description', 'website']);
  if (!headerRow) {
    console.warn('[Import] Could not find vendor list header row');
    return { vendors };
  }

  // Determine column indices
  const headerCells: string[] = [];
  for (let col = 1; col <= 10; col++) {
    headerCells.push(getCellString(worksheet.getCell(headerRow, col)).toLowerCase());
  }

  const colIndex = {
    number: headerCells.findIndex((h) => h === '#') + 1,
    logo: headerCells.findIndex((h) => h.includes('logo')) + 1,
    name: headerCells.findIndex((h) => h.includes('vendor')) + 1,
    description: headerCells.findIndex((h) => h.includes('description')) + 1,
    website: headerCells.findIndex((h) => h.includes('website')) + 1,
  };

  // Parse data rows
  let row = headerRow + 1;
  let index = 0;

  while (row <= worksheet.rowCount) {
    const nameCell = worksheet.getCell(row, colIndex.name || 3);
    const name = getCellString(nameCell).trim();

    if (!name) {
      row++;
      // Stop if we hit "STRATEGIC POSITIONING" section
      const cellA = getCellString(worksheet.getCell(row, 1));
      if (cellA.includes('STRATEGIC POSITIONING')) break;
      continue;
    }

    const websiteCell = worksheet.getCell(row, colIndex.website || 5);
    const website = getCellHyperlink(websiteCell) || getCellString(websiteCell);

    const vendor: Vendor = {
      id: generateId('vendor', index),
      name,
      description: getCellString(worksheet.getCell(row, colIndex.description || 4)),
      website: website || undefined,
    };

    vendors.push(vendor);
    index++;
    row++;
  }

  return { vendors, screeningSummary };
}

/**
 * Parse Comparison Matrix tab (Vendor Evaluation)
 */
function parseComparisonMatrixTab(
  worksheet: ExcelJS.Worksheet,
  criteria: Criterion[],
  vendors: Vendor[]
): ComparisonMatrix {
  const matrix: ComparisonMatrix = { criteria: {} };

  // Find header row with vendor names
  const headerRow = findHeaderRow(worksheet, ['category', 'criteria']);
  if (!headerRow) {
    console.warn('[Import] Could not find comparison matrix header row');
    return matrix;
  }

  // Build vendor column mapping
  const vendorColumns: Map<number, string> = new Map();
  for (let col = 3; col <= vendors.length + 2; col++) {
    const vendorName = getCellString(worksheet.getCell(headerRow, col)).trim();
    const vendor = vendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase()
    );
    if (vendor) {
      vendorColumns.set(col, vendor.id);
    }
  }

  // Parse data rows
  let row = headerRow + 1;
  let criterionIndex = 0;

  while (row <= worksheet.rowCount && criterionIndex < criteria.length) {
    const criterionName = getCellString(worksheet.getCell(row, 2)).trim();

    if (!criterionName) {
      row++;
      continue;
    }

    // Find matching criterion
    const criterion = criteria.find(
      (c) => c.name.toLowerCase() === criterionName.toLowerCase()
    );

    if (!criterion) {
      row++;
      continue;
    }

    // Initialize criterion in matrix
    if (!matrix.criteria[criterion.id]) {
      matrix.criteria[criterion.id] = { cells: {} };
    }

    // Parse vendor cells
    vendorColumns.forEach((vendorId, col) => {
      const cell = worksheet.getCell(row, col);
      const status = parseMatchStatus(cell);

      matrix.criteria[criterion.id].cells[vendorId] = {
        value: status,
        status: status,
      };
    });

    criterionIndex++;
    row++;
  }

  return matrix;
}

/**
 * Parse Detailed Matching tab
 */
function parseDetailedMatchingTab(
  worksheet: ExcelJS.Worksheet,
  criteria: Criterion[],
  vendors: Vendor[],
  existingMatrix: ComparisonMatrix
): ComparisonMatrix {
  const matrix = existingMatrix || { criteria: {} };

  // Find header row
  const headerRow = findHeaderRow(worksheet, [
    'category',
    'vendor',
    'criterion',
    'status',
    'evidence',
  ]);
  if (!headerRow) {
    console.warn('[Import] Could not find detailed matching header row');
    return matrix;
  }

  // Determine column indices
  const headerCells: string[] = [];
  for (let col = 1; col <= 10; col++) {
    headerCells.push(getCellString(worksheet.getCell(headerRow, col)).toLowerCase());
  }

  const colIndex = {
    category: headerCells.findIndex((h) => h.includes('category')) + 1,
    vendor: headerCells.findIndex((h) => h.includes('vendor')) + 1,
    criterion: headerCells.findIndex((h) => h.includes('criterion')) + 1,
    status: headerCells.findIndex((h) => h.includes('status')) + 1,
    evidence: headerCells.findIndex((h) => h.includes('evidence')) + 1,
    sources: headerCells.findIndex((h) => h.includes('source')) + 1,
  };

  // Parse data rows
  let row = headerRow + 1;

  while (row <= worksheet.rowCount) {
    const vendorName = getCellString(worksheet.getCell(row, colIndex.vendor || 2)).trim();
    const criterionName = getCellString(worksheet.getCell(row, colIndex.criterion || 3)).trim();

    if (!vendorName || !criterionName) {
      row++;
      continue;
    }

    // Find matching vendor and criterion
    const vendor = vendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase()
    );
    const criterion = criteria.find(
      (c) => c.name.toLowerCase() === criterionName.toLowerCase()
    );

    if (!vendor || !criterion) {
      row++;
      continue;
    }

    // Initialize if needed
    if (!matrix.criteria[criterion.id]) {
      matrix.criteria[criterion.id] = { cells: {} };
    }

    // Parse cell data
    const statusCell = worksheet.getCell(row, colIndex.status || 4);
    const evidenceCell = worksheet.getCell(row, colIndex.evidence || 5);
    const sourcesCell = worksheet.getCell(row, colIndex.sources || 6);

    const evidenceText = getCellString(evidenceCell);
    const sourceUrl = getCellHyperlink(sourcesCell) || getCellString(sourcesCell);

    // Split evidence into description and notes
    const evidenceParts = evidenceText.split('\n\n');
    const evidenceDescription = evidenceParts[0] || '';
    const researchNotes = evidenceParts.slice(1).join('\n\n') || '';

    const cellState: CellState = {
      value: parseMatchStatus(statusCell),
      status: parseMatchStatus(statusCell),
      evidenceDescription: evidenceDescription || undefined,
      researchNotes: researchNotes || undefined,
      evidenceUrl: sourceUrl || undefined,
    };

    // Preserve existing cell data, merge with new
    matrix.criteria[criterion.id].cells[vendor.id] = {
      ...matrix.criteria[criterion.id].cells[vendor.id],
      ...cellState,
    };

    row++;
  }

  return matrix;
}

/**
 * Parse Battlecards tab
 */
function parseBattlecardsTab(
  worksheet: ExcelJS.Worksheet,
  vendors: Vendor[]
): BattlecardRow[] {
  const battlecards: BattlecardRow[] = [];

  // Find header row with vendor names
  const headerRow = findHeaderRow(worksheet, ['category']);
  if (!headerRow) {
    console.warn('[Import] Could not find battlecards header row');
    return battlecards;
  }

  // Build vendor column mapping
  const vendorColumns: Map<number, string> = new Map();
  for (let col = 2; col <= vendors.length + 1; col++) {
    const vendorName = getCellString(worksheet.getCell(headerRow, col)).trim();
    const vendor = vendors.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase()
    );
    if (vendor) {
      vendorColumns.set(col, vendor.name);
    }
  }

  // Parse data rows
  let row = headerRow + 1;

  while (row <= worksheet.rowCount) {
    const categoryTitle = getCellString(worksheet.getCell(row, 1)).trim();

    if (!categoryTitle) {
      row++;
      continue;
    }

    const cells: BattlecardCell[] = [];

    vendorColumns.forEach((vendorName, col) => {
      const text = getCellString(worksheet.getCell(row, col));
      cells.push({
        vendor_name: vendorName,
        text: text || '',
      });
    });

    const battlecardRow: BattlecardRow = {
      category_title: categoryTitle,
      status: 'complete', // If it's in the export, it was complete
      cells,
    };

    battlecards.push(battlecardRow);
    row++;
  }

  return battlecards;
}

/**
 * Parse Executive Summary (Pre-Demo Brief) tab
 */
function parseExecutiveSummaryTab(worksheet: ExcelJS.Worksheet): ExecutiveSummaryData {
  const summary: ExecutiveSummaryData = {};

  let currentSection: string | null = null;
  let currentVendor: Partial<VendorRecommendation> | null = null;
  let currentRiskVendor: Partial<VendorRisk> | null = null;
  let row = 1;

  // Helper to detect section headers
  const isSectionHeader = (text: string): boolean => {
    const headers = [
      'key evaluation criteria',
      'vendor recommendations',
      'key differentiators',
      'risk factors',
      'final recommendation',
    ];
    return headers.some((h) => text.toLowerCase().includes(h));
  };

  while (row <= worksheet.rowCount) {
    const cellA = worksheet.getCell(`A${row}`);
    const text = getCellString(cellA).trim();

    if (!text) {
      row++;
      continue;
    }

    // Check for generated date
    if (text.toLowerCase().startsWith('generated on')) {
      const dateMatch = text.match(/Generated on (.+)/i);
      if (dateMatch) {
        summary.generatedAt = dateMatch[1];
      }
      row++;
      continue;
    }

    // Check for section header
    if (isSectionHeader(text)) {
      // Finalize previous vendor if any
      if (currentVendor && currentVendor.name) {
        if (!summary.vendorRecommendations) summary.vendorRecommendations = [];
        summary.vendorRecommendations.push(currentVendor as VendorRecommendation);
        currentVendor = null;
      }
      if (currentRiskVendor && currentRiskVendor.vendor) {
        if (!summary.riskFactors) summary.riskFactors = {};
        if (!summary.riskFactors.vendorSpecific) summary.riskFactors.vendorSpecific = [];
        summary.riskFactors.vendorSpecific.push(currentRiskVendor as VendorRisk);
        currentRiskVendor = null;
      }

      if (text.toLowerCase().includes('key evaluation criteria')) {
        currentSection = 'keyCriteria';
        summary.keyCriteria = [];
      } else if (text.toLowerCase().includes('vendor recommendations')) {
        currentSection = 'vendorRecommendations';
        summary.vendorRecommendations = [];
      } else if (text.toLowerCase().includes('key differentiators')) {
        currentSection = 'keyDifferentiators';
        summary.keyDifferentiators = [];
      } else if (text.toLowerCase().includes('risk factors')) {
        currentSection = 'riskFactors';
        summary.riskFactors = {};
      } else if (text.toLowerCase().includes('final recommendation')) {
        currentSection = 'recommendation';
        summary.recommendation = {};
      }

      row++;
      continue;
    }

    // Parse content based on current section
    switch (currentSection) {
      case 'keyCriteria': {
        // Format: "Name (importance)" or just "Name"
        const criterionMatch = text.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
        if (criterionMatch && !text.startsWith('•')) {
          const criterion: KeyCriterion = {
            name: criterionMatch[1].trim(),
            importance: criterionMatch[2]?.trim(),
          };
          // Next row might be description
          const nextText = getCellString(worksheet.getCell(`A${row + 1}`)).trim();
          if (nextText && !isSectionHeader(nextText) && !nextText.match(/^[^(]+\s*\(/)) {
            criterion.description = nextText;
            row++;
          }
          summary.keyCriteria!.push(criterion);
        }
        break;
      }

      case 'vendorRecommendations': {
        // Format: "1. VendorName - 85% Match"
        const vendorMatch = text.match(/^(\d+)\.\s*([^-]+)(?:\s*-\s*(\d+)%\s*Match)?$/);
        if (vendorMatch) {
          // Finalize previous vendor
          if (currentVendor && currentVendor.name) {
            summary.vendorRecommendations!.push(currentVendor as VendorRecommendation);
          }
          currentVendor = {
            rank: parseInt(vendorMatch[1]),
            name: vendorMatch[2].trim(),
            matchPercentage: vendorMatch[3] ? parseInt(vendorMatch[3]) : undefined,
            keyStrengths: [],
            keyWeaknesses: [],
          };
        } else if (currentVendor) {
          if (text.toLowerCase() === 'key strengths:') {
            // Following lines are strengths
          } else if (text.toLowerCase() === 'key weaknesses:') {
            // Following lines are weaknesses
          } else if (text.toLowerCase() === 'best for:') {
            // Next line is bestFor
          } else if (text.startsWith('•')) {
            const item = text.replace(/^•\s*/, '');
            // Determine if strength or weakness based on context
            // This is heuristic - check previous non-bullet line
            const prevSection = findPreviousNonBulletLine(worksheet, row);
            if (prevSection.toLowerCase().includes('strength')) {
              currentVendor.keyStrengths!.push(item);
            } else if (prevSection.toLowerCase().includes('weakness')) {
              currentVendor.keyWeaknesses!.push(item);
            }
          } else if (!text.includes(':')) {
            // Could be overall assessment or bestFor
            const prevLine = getCellString(worksheet.getCell(`A${row - 1}`)).trim().toLowerCase();
            if (prevLine === 'best for:') {
              currentVendor.bestFor = text;
            } else if (!currentVendor.overallAssessment) {
              currentVendor.overallAssessment = text;
            }
          }
        }
        break;
      }

      case 'keyDifferentiators': {
        // Format: "Category: Leader"
        const diffMatch = text.match(/^([^:]+):\s*(.+)$/);
        if (diffMatch && !text.startsWith('•')) {
          const diff: KeyDifferentiator = {
            category: diffMatch[1].trim(),
            leader: diffMatch[2].trim(),
          };
          // Next row might be details
          const nextText = getCellString(worksheet.getCell(`A${row + 1}`)).trim();
          if (nextText && !isSectionHeader(nextText) && !nextText.match(/^[^:]+:\s*.+$/)) {
            diff.details = nextText;
            row++;
          }
          summary.keyDifferentiators!.push(diff);
        }
        break;
      }

      case 'riskFactors': {
        if (text.toLowerCase() === 'questions to ask each vendor:') {
          // Start vendor-specific section
        } else if (text.toLowerCase() === 'general considerations:') {
          // Finalize current risk vendor
          if (currentRiskVendor && currentRiskVendor.vendor) {
            if (!summary.riskFactors!.vendorSpecific) summary.riskFactors!.vendorSpecific = [];
            summary.riskFactors!.vendorSpecific.push(currentRiskVendor as VendorRisk);
            currentRiskVendor = null;
          }
          summary.riskFactors!.generalConsiderations = [];
        } else if (text.startsWith('•')) {
          const item = text.replace(/^•\s*/, '');
          if (currentRiskVendor) {
            currentRiskVendor.questions!.push(item);
          } else if (summary.riskFactors!.generalConsiderations) {
            summary.riskFactors!.generalConsiderations.push(item);
          }
        } else if (!text.includes(':') || text.match(/^[A-Z][a-z]+$/)) {
          // Vendor name
          if (currentRiskVendor && currentRiskVendor.vendor) {
            if (!summary.riskFactors!.vendorSpecific) summary.riskFactors!.vendorSpecific = [];
            summary.riskFactors!.vendorSpecific.push(currentRiskVendor as VendorRisk);
          }
          currentRiskVendor = {
            vendor: text,
            questions: [],
          };
        }
        break;
      }

      case 'recommendation': {
        if (text.toLowerCase().startsWith('top pick:')) {
          summary.recommendation!.topPick = text.replace(/^top pick:\s*/i, '').trim();
        } else if (text.toLowerCase() === 'key considerations:') {
          summary.recommendation!.considerations = [];
        } else if (text.startsWith('•')) {
          const item = text.replace(/^•\s*/, '');
          if (summary.recommendation!.considerations) {
            summary.recommendation!.considerations.push(item);
          }
        } else if (!summary.recommendation!.reason) {
          summary.recommendation!.reason = text;
        }
        break;
      }
    }

    row++;
  }

  // Finalize any remaining vendor
  if (currentVendor && currentVendor.name) {
    if (!summary.vendorRecommendations) summary.vendorRecommendations = [];
    summary.vendorRecommendations.push(currentVendor as VendorRecommendation);
  }
  if (currentRiskVendor && currentRiskVendor.vendor) {
    if (!summary.riskFactors) summary.riskFactors = {};
    if (!summary.riskFactors.vendorSpecific) summary.riskFactors.vendorSpecific = [];
    summary.riskFactors.vendorSpecific.push(currentRiskVendor as VendorRisk);
  }

  return summary;
}

/**
 * Helper to find previous non-bullet line
 */
function findPreviousNonBulletLine(
  worksheet: ExcelJS.Worksheet,
  currentRow: number
): string {
  for (let r = currentRow - 1; r >= 1; r--) {
    const text = getCellString(worksheet.getCell(`A${r}`)).trim();
    if (text && !text.startsWith('•')) {
      return text;
    }
  }
  return '';
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Import Excel file and convert to JSON
 *
 * @param file - File object or ArrayBuffer of the Excel file
 * @returns Import result with parsed data
 *
 * @example
 * const result = await importExcelToJson(file);
 * if (result.success) {
 *   console.log('Imported project:', result.data.projectName);
 * }
 */
export async function importExcelToJson(
  file: File | ArrayBuffer
): Promise<ImportResult> {
  const warnings: string[] = [];

  try {
    // Read workbook
    const workbook = new ExcelJS.Workbook();

    if (file instanceof File) {
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
    } else {
      await workbook.xlsx.load(file);
    }

    // Validate it's a Clarioo export
    const indexTab = findWorksheet(workbook, TAB_PATTERNS.INDEX);
    if (!indexTab) {
      return {
        success: false,
        error: 'Invalid file format: INDEX tab not found',
        errorCode: 'INVALID_FORMAT',
      };
    }

    // Check for CLARIOO branding
    const brandCell = getCellString(indexTab.getCell('A1'));
    if (!brandCell.toUpperCase().includes('CLARIOO')) {
      warnings.push('File may not be a Clarioo export (missing branding)');
    }

    // Parse INDEX tab
    const indexData = parseIndexTab(indexTab);

    // Parse Criteria tab (required)
    const criteriaTab = findWorksheet(workbook, TAB_PATTERNS.CRITERIA);
    if (!criteriaTab) {
      return {
        success: false,
        error: 'Missing required tab: Evaluation Criteria',
        errorCode: 'MISSING_REQUIRED_TAB',
      };
    }
    const criteria = parseCriteriaTab(criteriaTab);

    if (criteria.length === 0) {
      warnings.push('No criteria found in Evaluation Criteria tab');
    }

    // Parse Vendor List tab
    const vendorListTab = findWorksheet(workbook, TAB_PATTERNS.VENDOR_LIST);
    let vendors: Vendor[] = [];
    let screeningSummary: string | undefined;

    if (vendorListTab) {
      const vendorData = parseVendorListTab(vendorListTab);
      vendors = vendorData.vendors;
      screeningSummary = vendorData.screeningSummary;
    } else {
      warnings.push('Vendor List tab not found');
    }

    // Parse Comparison Matrix tab
    const comparisonTab = findWorksheet(workbook, TAB_PATTERNS.COMPARISON);
    let comparisonMatrix: ComparisonMatrix | undefined;

    if (comparisonTab && criteria.length > 0 && vendors.length > 0) {
      comparisonMatrix = parseComparisonMatrixTab(comparisonTab, criteria, vendors);
    }

    // Parse Detailed Matching tab (enhances comparison matrix)
    const detailedTab = findWorksheet(workbook, TAB_PATTERNS.DETAILED_MATCHING);
    if (detailedTab && criteria.length > 0 && vendors.length > 0) {
      comparisonMatrix = parseDetailedMatchingTab(
        detailedTab,
        criteria,
        vendors,
        comparisonMatrix || { criteria: {} }
      );
    }

    // Parse Battlecards tab
    const battlecardsTab = findWorksheet(workbook, TAB_PATTERNS.BATTLECARDS);
    let battlecards: BattlecardRow[] | undefined;

    if (battlecardsTab && vendors.length > 0) {
      battlecards = parseBattlecardsTab(battlecardsTab, vendors);
      if (battlecards.length === 0) {
        battlecards = undefined;
      }
    }

    // Parse Executive Summary tab
    const summaryTab = findWorksheet(workbook, TAB_PATTERNS.EXECUTIVE_SUMMARY);
    let executiveSummary: ExecutiveSummaryData | undefined;

    if (summaryTab) {
      executiveSummary = parseExecutiveSummaryTab(summaryTab);
      if (Object.keys(executiveSummary).length === 0) {
        executiveSummary = undefined;
      }
    }

    // Assemble final data
    const data: ExportProjectData = {
      projectId: indexData.metadata?.userId
        ? `imported_${indexData.metadata.userId}_${Date.now()}`
        : `imported_${Date.now()}`,
      projectName: indexData.projectName || 'Imported Project',
      projectDescription: indexData.projectDescription,
      stage: detectStage(criteria, vendors, comparisonMatrix, executiveSummary, battlecards),
      category: indexData.category,
      techRequest: indexData.techRequest,
      criteria,
      vendors,
      comparisonMatrix,
      executiveSummary,
      battlecards,
      screeningSummary,
      metadata: indexData.metadata,
    };

    return {
      success: true,
      data,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('[Import] Failed to import Excel file:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'FILE_READ_ERROR',
    };
  }
}

/**
 * Detect project stage from available data
 */
function detectStage(
  criteria: Criterion[],
  vendors: Vendor[],
  comparisonMatrix?: ComparisonMatrix,
  executiveSummary?: ExecutiveSummaryData,
  battlecards?: BattlecardRow[]
): ProjectStage {
  if (battlecards && battlecards.length > 0) {
    return 'battlecards_complete';
  }
  if (executiveSummary && Object.keys(executiveSummary).length > 0) {
    return 'executive_summary';
  }
  if (comparisonMatrix && Object.keys(comparisonMatrix.criteria).length > 0) {
    // Check if we have evidence (detailed matching)
    const hasEvidence = Object.values(comparisonMatrix.criteria).some((c) =>
      Object.values(c.cells).some(
        (cell) => cell.evidenceDescription || cell.researchNotes
      )
    );
    return hasEvidence ? 'detailed_matching' : 'comparison_matrix';
  }
  if (vendors.length > 0) {
    return 'vendors_selected';
  }
  return 'criteria_only';
}

/**
 * Validate imported data structure
 */
export function validateImportedData(data: ExportProjectData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.projectId) {
    errors.push('Missing project ID');
  }

  if (!data.projectName) {
    errors.push('Missing project name');
  }

  if (!data.criteria || data.criteria.length === 0) {
    errors.push('No criteria found');
  } else {
    data.criteria.forEach((c, i) => {
      if (!c.id) errors.push(`Criterion ${i + 1}: missing ID`);
      if (!c.name) errors.push(`Criterion ${i + 1}: missing name`);
      if (!c.importance) errors.push(`Criterion ${i + 1}: missing importance`);
    });
  }

  if (data.vendors) {
    data.vendors.forEach((v, i) => {
      if (!v.id) errors.push(`Vendor ${i + 1}: missing ID`);
      if (!v.name) errors.push(`Vendor ${i + 1}: missing name`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert imported data to localStorage format for Clarioo
 */
export function convertToLocalStorageFormat(data: ExportProjectData): {
  clarioo_projects: any[];
  workflow: any;
  comparison_state?: any;
  executive_summary?: any;
  battlecards_state?: any;
} {
  const projectId = data.projectId;

  // Project entry
  const projectEntry = {
    id: projectId,
    name: data.projectName,
    description: data.projectDescription,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Workflow
  const workflow = {
    criteria: data.criteria,
    selectedVendors: data.vendors,
    category: data.category,
    techRequest: data.techRequest,
  };

  // Comparison state
  const comparison_state = data.comparisonMatrix;

  // Executive summary
  const executive_summary = data.executiveSummary
    ? {
        data: data.executiveSummary,
        generated_at: data.executiveSummary.generatedAt || new Date().toISOString(),
      }
    : undefined;

  // Battlecards
  const battlecards_state = data.battlecards
    ? {
        rows: data.battlecards,
      }
    : undefined;

  return {
    clarioo_projects: [projectEntry],
    workflow,
    comparison_state,
    executive_summary,
    battlecards_state,
  };
}

/**
 * Save imported data to localStorage
 */
export function saveToLocalStorage(data: ExportProjectData): void {
  const projectId = data.projectId;
  const formatted = convertToLocalStorageFormat(data);

  // Merge with existing projects
  const existingProjects = JSON.parse(
    localStorage.getItem('clarioo_projects') || '[]'
  );
  const projectIndex = existingProjects.findIndex((p: any) => p.id === projectId);

  if (projectIndex >= 0) {
    existingProjects[projectIndex] = formatted.clarioo_projects[0];
  } else {
    existingProjects.push(formatted.clarioo_projects[0]);
  }

  localStorage.setItem('clarioo_projects', JSON.stringify(existingProjects));
  localStorage.setItem(`workflow_${projectId}`, JSON.stringify(formatted.workflow));

  if (formatted.comparison_state) {
    localStorage.setItem(
      `comparison_state_${projectId}`,
      JSON.stringify(formatted.comparison_state)
    );
  }

  if (formatted.executive_summary) {
    localStorage.setItem(
      `clarioo_executive_summary_${projectId}`,
      JSON.stringify(formatted.executive_summary)
    );
  }

  if (formatted.battlecards_state) {
    localStorage.setItem(
      `clarioo_battlecards_state_${projectId}`,
      JSON.stringify(formatted.battlecards_state)
    );
  }
}
