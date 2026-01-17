/**
 * 📊 EXPORT HELPERS UTILITY
 *
 * Purpose: Provides utility functions for exporting vendor comparison data
 * to various formats (Excel, CSV).
 *
 * Features:
 * - Excel export with multiple sheets (comparison, criteria, features, assessment)
 * - CSV export for simple data transfer
 * - Pure functions with no side effects
 * - Comprehensive data transformation
 * - Automatic filename generation
 *
 * Dependencies:
 * - xlsx library for Excel generation
 *
 * @module utils/exportHelpers
 */

import * as XLSX from 'xlsx';

/**
 * Vendor structure for export
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
 * Criteria structure for export context
 */
export interface Criteria {
  id: string;
  name: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
}

/**
 * Tech request for export metadata
 */
export interface TechRequest {
  category: string;
  description?: string;
}

/**
 * Export result structure
 */
export interface ExportResult {
  success: boolean;
  filename: string;
  error?: string;
}

/**
 * Export vendor comparison data to Excel format
 *
 * Purpose: Creates comprehensive Excel workbook with multiple sheets
 * containing vendor comparison, criteria, features, and detailed assessment.
 *
 * @param vendors - Vendors to export
 * @param criteria - Evaluation criteria
 * @param techRequest - Tech request for context
 * @param calculateOverallScore - Function to calculate overall vendor score
 * @returns Export result with success status and filename
 *
 * @example
 * ```typescript
 * const result = exportToExcel(
 *   vendors,
 *   criteria,
 *   { category: 'CRM Software' },
 *   calculateOverallScore
 * );
 * console.log(result.success ? 'Exported!' : result.error);
 * ```
 *
 * @remarks
 * **Sheet 1: Vendor Comparison**
 * - Vendor name, description, website, pricing, rating, overall score
 * - Individual criteria scores for each vendor
 *
 * **Sheet 2: Evaluation Criteria**
 * - Criteria name, type, importance level
 *
 * **Sheet 3: Vendor Features** (if available)
 * - Vendor name and associated features
 *
 * **Sheet 4: Detailed Assessment** (if criteria answers available)
 * - Vendor name, criteria name, score, yes/no/partial assessment, comments
 *
 * - Filename format: `vendor-comparison-{category}-{date}.xlsx`
 * - Downloads file automatically via browser API
 * - Pure function, but has browser side effect (file download)
 */
export const exportToExcel = (
  vendors: Vendor[],
  criteria: Criteria[],
  techRequest: TechRequest,
  calculateOverallScore: (vendor: Vendor) => number
): ExportResult => {
  try {
    // Create main comparison data
    const comparisonData = vendors.map(vendor => {
      const row: any = {
        'Vendor Name': vendor.name,
        'Description': vendor.description,
        'Website': vendor.website,
        'Pricing': vendor.pricing,
        'Rating': vendor.rating,
        'Overall Score': calculateOverallScore(vendor).toFixed(2)
      };

      // Add criteria scores
      criteria.forEach(criterion => {
        row[criterion.name] = vendor.criteriaScores[criterion.id]?.toFixed(1) || 'N/A';
      });

      return row;
    });

    // Create detailed criteria sheet
    const criteriaData = criteria.map(criterion => ({
      'Criteria': criterion.name,
      'Type': criterion.type,
      'Importance': criterion.importance
    }));

    // Create vendor features sheet
    const featuresData: Array<{ Vendor: string; Feature: string }> = [];
    vendors.forEach(vendor => {
      vendor.features.forEach(feature => {
        featuresData.push({
          'Vendor': vendor.name,
          'Feature': feature
        });
      });
    });

    // Create detailed assessment sheet
    const assessmentData: Array<{
      Vendor: string;
      Criteria: string;
      Score: string;
      Assessment: string;
      Comment: string;
    }> = [];

    vendors.forEach(vendor => {
      criteria.forEach(criterion => {
        const answer = vendor.criteriaAnswers?.[criterion.id];
        assessmentData.push({
          'Vendor': vendor.name,
          'Criteria': criterion.name,
          'Score': vendor.criteriaScores[criterion.id]?.toFixed(1) || 'N/A',
          'Assessment': answer?.yesNo || 'N/A',
          'Comment': answer?.comment || 'No comment available'
        });
      });
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add comparison sheet
    const comparisonSheet = XLSX.utils.json_to_sheet(comparisonData);
    XLSX.utils.book_append_sheet(workbook, comparisonSheet, 'Vendor Comparison');

    // Add criteria sheet
    const criteriaSheet = XLSX.utils.json_to_sheet(criteriaData);
    XLSX.utils.book_append_sheet(workbook, criteriaSheet, 'Evaluation Criteria');

    // Add features sheet (if there are features)
    if (featuresData.length > 0) {
      const featuresSheet = XLSX.utils.json_to_sheet(featuresData);
      XLSX.utils.book_append_sheet(workbook, featuresSheet, 'Vendor Features');
    }

    // Add detailed assessment sheet (if there are answers)
    if (assessmentData.length > 0) {
      const assessmentSheet = XLSX.utils.json_to_sheet(assessmentData);
      XLSX.utils.book_append_sheet(workbook, assessmentSheet, 'Detailed Assessment');
    }

    // Generate filename
    const filename = `vendor-comparison-${techRequest.category.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      filename
    };
  } catch (error) {
    console.error('Excel export failed:', error);
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'Failed to export to Excel'
    };
  }
};

/**
 * Export vendor comparison data to CSV format
 *
 * Purpose: Creates simple CSV file with vendor comparison data
 * for easy import into spreadsheet applications.
 *
 * @param vendors - Vendors to export
 * @param criteria - Evaluation criteria
 * @param techRequest - Tech request for filename
 * @param calculateOverallScore - Function to calculate overall vendor score
 * @returns Export result with success status and filename
 *
 * @example
 * ```typescript
 * const result = exportToCSV(
 *   vendors,
 *   criteria,
 *   { category: 'CRM Software' },
 *   calculateOverallScore
 * );
 * console.log(result.success ? 'Exported!' : result.error);
 * ```
 *
 * @remarks
 * **CSV Structure**:
 * - Header row: Vendor, Rating, Overall Score, Pricing, Website, [Criteria Names...]
 * - Data rows: One per vendor with all scores
 *
 * - Filename format: `vendor-comparison-{category}.csv`
 * - Downloads file automatically via browser API
 * - Pure function, but has browser side effect (file download)
 * - Simpler format than Excel, single sheet equivalent
 */
export const exportToCSV = (
  vendors: Vendor[],
  criteria: Criteria[],
  techRequest: TechRequest,
  calculateOverallScore: (vendor: Vendor) => number
): ExportResult => {
  try {
    // Create CSV header
    const headers = [
      'Vendor',
      'Rating',
      'Overall Score',
      'Pricing',
      'Website',
      ...criteria.map(c => c.name)
    ];

    // Create CSV rows
    const rows = vendors.map(vendor => [
      vendor.name,
      vendor.rating.toString(),
      calculateOverallScore(vendor).toFixed(1),
      vendor.pricing,
      vendor.website,
      ...criteria.map(c => vendor.criteriaScores[c.id]?.toFixed(1) || 'N/A')
    ]);

    // Combine header and rows
    const csvContent = [
      headers,
      ...rows
    ].map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `vendor-comparison-${techRequest.category.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename
    };
  } catch (error) {
    console.error('CSV export failed:', error);
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'Failed to export to CSV'
    };
  }
};

/**
 * Generate export filename
 *
 * Purpose: Creates consistent filename for exports based on
 * category and current date.
 *
 * @param techRequest - Tech request with category
 * @param format - File format (excel, csv)
 * @returns Formatted filename
 *
 * @example
 * ```typescript
 * const filename = generateExportFilename(
 *   { category: 'CRM Software' },
 *   'excel'
 * );
 * // Returns: "vendor-comparison-crm-software-2024-01-15.xlsx"
 * ```
 *
 * @remarks
 * - Converts category to lowercase kebab-case
 * - Includes ISO date (YYYY-MM-DD)
 * - Pure function, deterministic for same inputs
 */
export const generateExportFilename = (
  techRequest: TechRequest,
  format: 'excel' | 'csv'
): string => {
  const category = techRequest.category.replace(/\s+/g, '-').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  const extension = format === 'excel' ? 'xlsx' : 'csv';

  return `vendor-comparison-${category}-${date}.${extension}`;
};

// ============================================================================
// SP_027: Additional Export Helper Functions
// ============================================================================

/**
 * Sanitize project name for use in filename (SP_027)
 * - Removes special characters
 * - Replaces spaces with empty string
 * - Truncates to max length
 *
 * @param name - Raw project name
 * @param maxLength - Maximum length (default: 10)
 * @returns Sanitized project name
 *
 * @example
 * sanitizeProjectName('CX Platform Selection!', 10) // 'CXPlatform'
 * sanitizeProjectName('Test@#$%', 5) // 'Test'
 */
export function sanitizeProjectName(name: string, maxLength: number = 10): string {
  // Remove special characters and spaces
  const sanitized = name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '');            // Remove all spaces

  // Truncate to max length
  return sanitized.slice(0, maxLength);
}

/**
 * Format project name for filename using first two words with underscores
 *
 * Takes the first two words of the project name, capitalizes them,
 * and joins with underscores. Removes special characters.
 *
 * @param name - Project name
 * @returns Formatted name with underscores
 *
 * @example
 * formatProjectNameForFile('Luxury Fashion CX Platform') // 'Luxury_Fashion'
 * formatProjectNameForFile('CX Platform') // 'CX_Platform'
 * formatProjectNameForFile('Test') // 'Test'
 * formatProjectNameForFile('test-project name!') // 'Test_Project'
 */
export function formatProjectNameForFile(name: string): string {
  // Remove special characters except spaces
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  // Split into words and filter out empty strings
  const words = cleaned.split(/\s+/).filter(word => word.length > 0);

  // Take first two words (or just one if that's all there is)
  const selectedWords = words.slice(0, 2);

  // Capitalize first letter of each word and join with underscores
  return selectedWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
}

/**
 * Format date according to specified format (SP_027)
 *
 * @param date - Date to format
 * @param format - Date format string (e.g., 'YY_MM_DD')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2026-01-14'), 'YY_MM_DD') // '26_01_14'
 * formatDate(new Date('2026-01-14'), 'DD/MM/YYYY') // '14/01/2026'
 */
export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const yearShort = String(year).slice(2);

  // Replace format tokens
  return format
    .replace('YYYY', String(year))
    .replace('YY', yearShort)
    .replace('MM', month)
    .replace('DD', day);
}

/**
 * Generate export filename with SP_027 naming convention
 * Format: {First_Two_Words}_Clarioo_{YY_MM_DD}.{ext}
 *
 * @param projectName - Raw project name
 * @param format - Export format ('excel' or 'json')
 * @returns Formatted filename
 *
 * @example
 * generateSP027Filename('Luxury Fashion CX Platform', 'excel')
 * // 'Luxury_Fashion_Clarioo_26_01_17.xlsx'
 * generateSP027Filename('CX Platform Selection', 'json')
 * // 'CX_Platform_Clarioo_26_01_17.json'
 */
export function generateSP027Filename(
  projectName: string,
  format: 'excel' | 'json'
): string {
  const cleanName = formatProjectNameForFile(projectName);
  const dateStr = formatDate(new Date(), 'YY_MM_DD');
  const extension = format === 'excel' ? 'xlsx' : 'json';

  return `${cleanName}_Clarioo_${dateStr}.${extension}`;
}

/**
 * Generate initials from vendor name for badge fallback (SP_027)
 *
 * @param name - Vendor name
 * @returns Initials (max 2 characters, uppercase)
 *
 * @example
 * generateInitials('Tulip') // 'TU'
 * generateInitials('Sales Floor') // 'SF'
 * generateInitials('IBM Watson') // 'IW'
 */
export function generateInitials(name: string): string {
  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Truncate text to max length with ellipsis (SP_027)
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Format file size in human-readable format (SP_027)
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get all localStorage keys for a project (SP_027)
 *
 * @param projectId - Project ID
 * @returns Array of localStorage keys
 */
export function getProjectLocalStorageKeys(projectId: string): string[] {
  const keys: string[] = [];
  // CORRECTED: Use actual localStorage keys from the application
  const prefixes = [
    `workflow_${projectId}`,
    `comparison_state_${projectId}`,
    `stage1_results_${projectId}`,
    `stage2_results_${projectId}`, // Keep for backwards compatibility
    `clarioo_executive_summary_${projectId}`, // New Pre-Demo Brief key
    `compared_vendors_${projectId}`,
    `clarioo_battlecards_state_${projectId}`,
    `clarioo_battlecards_rows_${projectId}`,
    `vendor_scatterplot_positions_${projectId}`, // Scatter plot positioning data
  ];

  // Global keys to include (not project-specific but needed for export)
  const globalKeys = [
    'clarioo_projects',     // All projects metadata
    'clarioo_email',        // User email
    'clarioo_user_id',      // User ID
  ];

  // Add project-specific keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && prefixes.some(prefix => key.startsWith(prefix))) {
      keys.push(key);
    }
    // Also include vendor summaries (clarioo_vendor_summary_*)
    if (key && key.startsWith('clarioo_vendor_summary_')) {
      keys.push(key);
    }
  }

  // Add global keys if they exist
  globalKeys.forEach(globalKey => {
    if (localStorage.getItem(globalKey)) {
      keys.push(globalKey);
    }
  });

  return keys;
}
