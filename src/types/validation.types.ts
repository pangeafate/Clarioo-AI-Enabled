/**
 * Cell Validation Types
 *
 * Tracks validation state for each vendor × criterion cell
 * Used for displaying validation badges around icons in comparison matrix
 */

export interface CellValidation {
  system: boolean;              // Default true - when true, hides validation badges
  vendorValidation: boolean;    // Shows green "V" badge at 12 o'clock
  buyerValidation: boolean;     // Shows blue "B" badge at 9 o'clock
  expertValidation: boolean;    // Shows orange "E" badge at 3 o'clock
}

export const DEFAULT_VALIDATION: CellValidation = {
  system: true,
  vendorValidation: false,
  buyerValidation: false,
  expertValidation: false,
};

/**
 * Get validation storage key for a specific cell
 */
export const getValidationKey = (projectId: string, vendorId: string, criterionId: string): string => {
  return `validation_${projectId}_${vendorId}_${criterionId}`;
};

/**
 * Load validation state for a cell from localStorage
 */
export const loadCellValidation = (
  projectId: string,
  vendorId: string,
  criterionId: string
): CellValidation => {
  const key = getValidationKey(projectId, vendorId, criterionId);
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_VALIDATION;
    }
  }

  return DEFAULT_VALIDATION;
};

/**
 * Save validation state for a cell to localStorage
 */
export const saveCellValidation = (
  projectId: string,
  vendorId: string,
  criterionId: string,
  validation: CellValidation
): void => {
  const key = getValidationKey(projectId, vendorId, criterionId);
  localStorage.setItem(key, JSON.stringify(validation));
};
