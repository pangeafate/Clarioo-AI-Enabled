/**
 * Vendor Comparison Utilities
 *
 * Shared utilities for vendor comparison calculations
 * Used by both VendorComparison.tsx (old) and VendorComparisonNew.tsx (new two-stage)
 */

/**
 * Calculate match percentage from vendor scores and criteria
 *
 * Algorithm:
 * - Base scores: star=95, yes=80, unknown=60, no=10
 * - Importance weights: high=1.5, medium=1.0, low=0.7
 * - Feature category: 1.3x weight multiplier
 * - Star scores are valued higher to differentiate exceptional performance
 * - Result: Weighted average based on importance and type
 * - Cap at 98%
 */
export const calculateMatchPercentage = (
  scores: Record<string, 'no' | 'unknown' | 'yes' | 'star'>,
  criteria: { id: string; importance: string; type?: string }[],
  vendorName?: string // Optional for debugging
): number => {
  if (!scores || Object.keys(scores).length === 0 || criteria.length === 0) {
    return -1; // No data
  }

  // Importance multipliers
  const importanceMultipliers: Record<string, number> = {
    high: 1.5,
    medium: 1.0,
    low: 0.7
  };

  // Base score values
  const baseScores: Record<string, number> = {
    star: 95,
    yes: 80,
    unknown: 60,
    no: 10
  };

  let totalWeight = 0;
  let weightedScore = 0;

  // Count scores by type for debugging
  const scoreCount = { star: 0, yes: 0, unknown: 0, no: 0 };

  for (const criterion of criteria) {
    const score = scores[criterion.id];
    if (!score) continue;

    // Track score counts
    scoreCount[score]++;

    // Get importance multiplier
    const importanceWeight = importanceMultipliers[criterion.importance] || 1.0;

    // Apply feature category uplift (1.3x)
    const featureWeight = criterion.type === 'feature' ? 1.3 : 1.0;

    const weight = importanceWeight * featureWeight;

    totalWeight += weight;
    weightedScore += baseScores[score] * weight;
  }

  if (totalWeight === 0) {
    return -1;
  }

  const percentage = Math.min(98, Math.round((weightedScore / totalWeight)));

  // Debug logging
  if (vendorName) {
    console.log(`[Match %] ${vendorName}:`, {
      scores: scoreCount,
      totalCriteria: criteria.length,
      scoredCriteria: Object.keys(scores).length,
      percentage,
      rawScore: weightedScore / totalWeight
    });
  }

  return percentage;
};
