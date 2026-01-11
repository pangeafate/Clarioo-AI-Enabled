/**
 * Scatter Plot Positioning Utilities
 *
 * Utilities for normalizing coordinates, detecting collisions, and adjusting
 * vendor logo positions on the scatter plot chart.
 *
 * @module utils/scatterPlotPositioning
 */

import type {
  VendorScatterplotPosition,
  VendorPosition,
  ChartDimensions,
  CollisionDetectionResult,
} from '../types/vendorScatterplot.types';

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Normalize 0-100 scores to pixel coordinates
 *
 * Converts raw positioning scores from n8n (0-100 range) to pixel coordinates
 * within the chart bounds, using dynamic buffers that scale with logo size and font size.
 * Ensures logos and their labels stay fully within bounds.
 *
 * @param positions - Raw positioning data from n8n (0-100 scores)
 * @param dimensions - Chart dimensions configuration
 * @param fontSize - Font size for vendor name labels (used to calculate text width buffer)
 * @returns Array of vendor positions with normalized pixel coordinates
 */
export function normalizeCoordinates(
  positions: VendorScatterplotPosition[],
  dimensions: ChartDimensions,
  fontSize: number
): VendorPosition[] {
  const { width, height, padding, logoSize } = dimensions;

  // Calculate logo radius (half of diameter)
  const logoRadius = logoSize / 2;

  // Calculate label height (vendor name below logo)
  // BRUTE FORCE: Make buffer SO LARGE that overflow is impossible
  // Gap + worst-case text + massive safety margin
  const labelHeight = logoSize * 2.5; // Simple: 2.5x logo size for labels below

  // DYNAMIC HORIZONTAL BUFFER FORMULA
  // Accounts for BOTH logo radius AND text width (additive, not max)
  // Logo extends logoRadius from center
  // Text label is constrained to maxWidth = logoSize * 3 in AnimatedVendorLogo
  // Label extends (logoSize * 3) / 2 = logoSize * 1.5 from center
  // Buffer = logoRadius + label half-width
  const labelHorizontalBuffer = Math.max(
    20,                              // Minimum safety margin
    logoRadius + (logoSize * 1.5)    // Logo + label overflow (logoSize * 1.5 per side)
  );

  // Separate top/bottom buffers for clarity
  const topBuffer = logoRadius;                    // Logo extends upward only
  const bottomBuffer = logoRadius + labelHeight;   // Logo + label below

  // Calculate usable chart area with dynamic buffers
  // Horizontal: padding + buffer on each side
  // Vertical: padding + topBuffer at top, padding + bottomBuffer at bottom
  const minX = padding + labelHorizontalBuffer;
  const maxX = width - padding - labelHorizontalBuffer;
  const minY = padding + topBuffer;
  const maxY = height - padding - bottomBuffer;

  const usableWidth = maxX - minX;
  const usableHeight = maxY - minY;

  return positions.map((pos) => {
    // Convert 0-100 scores to pixel coordinates
    // X-axis: Direct mapping (0=left/Single-Purpose, 100=right/Multi-Function)
    const pixelX = (pos.x_score / 100) * usableWidth + minX;

    // Y-axis: REVERSED mapping for correct semantic interpretation
    // n8n returns: 0=Vertical-Specific, 100=Multiple Verticals
    // SVG coords: y=minY is TOP, y=maxY is BOTTOM
    // We want: Vertical-Specific at BOTTOM, Multiple Verticals at TOP
    // So reverse: low score (0) → high pixelY (bottom), high score (100) → low pixelY (top)
    const pixelY = ((100 - pos.y_score) / 100) * usableHeight + minY;

    return {
      vendor_id: pos.vendor_id,
      vendor_name: pos.vendor_name,
      x: pixelX,
      y: pixelY,
      raw_x_score: pos.x_score,
      raw_y_score: pos.y_score,
      reasoning: pos.reasoning,
    };
  });
}

/**
 * Detect collisions between vendor logos
 *
 * Checks if any two logos are closer than the minimum required distance.
 *
 * @param positions - Array of vendor positions with pixel coordinates
 * @param minDistance - Minimum required distance between logo centers (default: 80px)
 * @returns True if any collisions detected, false otherwise
 */
export function detectCollisions(
  positions: VendorPosition[],
  minDistance: number = 80
): boolean {
  // Check all pairs of logos
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const pos1 = positions[i];
      const pos2 = positions[j];

      const distance = calculateDistance(pos1.x, pos1.y, pos2.x, pos2.y);

      if (distance < minDistance) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Enforce edge constraints to keep logos within chart bounds
 *
 * Ensures all logos and their labels remain fully within chart bounds using
 * dynamic buffers that match normalizeCoordinates() calculations.
 * Prevents vendor circles and names from being cut off at edges.
 *
 * @param positions - Array of vendor positions to constrain
 * @param dimensions - Chart dimensions configuration
 * @param fontSize - Font size for vendor name labels (must match normalizeCoordinates)
 * @returns Adjusted positions within bounds
 */
export function enforceEdgeConstraints(
  positions: VendorPosition[],
  dimensions: ChartDimensions,
  fontSize: number
): VendorPosition[] {
  const { width, height, padding, logoSize } = dimensions;

  // Calculate the logo radius (half of diameter)
  const logoRadius = logoSize / 2;

  // Calculate label height
  // Must match calculation in normalizeCoordinates - BRUTE FORCE
  const labelHeight = logoSize * 2.5; // Simple: 2.5x logo size

  // DYNAMIC HORIZONTAL BUFFER FORMULA
  // Must match calculation in normalizeCoordinates
  const labelHorizontalBuffer = Math.max(
    20,                              // Minimum safety margin
    logoRadius + (logoSize * 1.5)    // Logo + label overflow (logoSize * 1.5 per side)
  );

  // Separate top/bottom buffers
  const topBuffer = logoRadius;
  const bottomBuffer = logoRadius + labelHeight;

  // Ensure logo centers stay within bounds
  const minX = padding + labelHorizontalBuffer;
  const maxX = width - padding - labelHorizontalBuffer;
  const minY = padding + topBuffer;
  const maxY = height - padding - bottomBuffer;

  return positions.map((pos) => {
    const adjustedX = Math.max(minX, Math.min(maxX, pos.x));
    const adjustedY = Math.max(minY, Math.min(maxY, pos.y));

    return {
      ...pos,
      x: adjustedX,
      y: adjustedY,
    };
  });
}

/**
 * Adjust positions to resolve collisions
 *
 * When logos are too close together (< minDistance), nudges them apart
 * along the connecting vector. Iteratively adjusts until no collisions
 * or max iterations reached.
 *
 * Algorithm:
 * 1. Find all colliding pairs
 * 2. For each pair, calculate connecting vector
 * 3. Nudge both logos apart along the vector (proportional to minDistance)
 * 4. Enforce edge constraints (keeps logos within bounds)
 * 5. Repeat until no collisions (max 3 iterations)
 *
 * @param positions - Array of vendor positions with potential collisions
 * @param dimensions - Chart dimensions configuration
 * @param fontSize - Font size for vendor name labels (used for boundary enforcement)
 * @param maxIterations - Maximum adjustment iterations (default: 3)
 * @returns Collision detection result with adjusted positions
 */
export function adjustPositions(
  positions: VendorPosition[],
  dimensions: ChartDimensions,
  fontSize: number,
  maxIterations: number = 3
): CollisionDetectionResult {
  const { minDistance } = dimensions;
  let adjustedPositions = [...positions];
  let iterations = 0;

  // Make nudge amount proportional to minDistance (50% of minDistance each direction)
  // This ensures consistent collision resolution across all screen sizes
  const nudgeAmount = minDistance * 0.5;

  while (detectCollisions(adjustedPositions, minDistance) && iterations < maxIterations) {
    // Create a copy for this iteration
    const newPositions = [...adjustedPositions];

    // Find and resolve all collisions
    for (let i = 0; i < newPositions.length; i++) {
      for (let j = i + 1; j < newPositions.length; j++) {
        const pos1 = newPositions[i];
        const pos2 = newPositions[j];

        const distance = calculateDistance(pos1.x, pos1.y, pos2.x, pos2.y);

        if (distance < minDistance && distance > 0) {
          // Calculate vector from pos1 to pos2
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;

          // Normalize the vector
          const magnitude = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / magnitude;
          const unitY = dy / magnitude;

          // Nudge both positions apart along the vector
          // Amount is proportional to screen size (50% of minDistance)
          newPositions[i] = {
            ...pos1,
            x: pos1.x - unitX * nudgeAmount,
            y: pos1.y - unitY * nudgeAmount,
          };

          newPositions[j] = {
            ...pos2,
            x: pos2.x + unitX * nudgeAmount,
            y: pos2.y + unitY * nudgeAmount,
          };
        }
      }
    }

    // Enforce edge constraints after adjustment (keeps logos within bounds)
    adjustedPositions = enforceEdgeConstraints(newPositions, dimensions, fontSize);
    iterations++;
  }

  const hasCollisions = detectCollisions(adjustedPositions, minDistance);

  return {
    hasCollisions,
    adjustedPositions,
  };
}

/**
 * Process vendor positions from n8n response
 *
 * Complete pipeline: normalize coordinates → detect collisions → adjust positions
 *
 * @param rawPositions - Raw positioning data from n8n (0-100 scores)
 * @param dimensions - Chart dimensions configuration
 * @param fontSize - Font size for vendor name labels (used for boundary calculations)
 * @returns Collision detection result with final adjusted positions
 */
export function processVendorPositions(
  rawPositions: VendorScatterplotPosition[],
  dimensions: ChartDimensions,
  fontSize: number
): CollisionDetectionResult {
  // Step 1: Normalize 0-100 scores to pixel coordinates
  const normalizedPositions = normalizeCoordinates(rawPositions, dimensions, fontSize);

  // Step 2: Enforce initial edge constraints
  const constrainedPositions = enforceEdgeConstraints(normalizedPositions, dimensions, fontSize);

  // Step 3: Detect and resolve collisions
  const result = adjustPositions(constrainedPositions, dimensions, fontSize);

  // Step 4: FINAL enforcement - chart boundaries are ABSOLUTE priority
  // Re-apply edge constraints after collision resolution to ensure NO overflow
  const finalPositions = enforceEdgeConstraints(result.adjustedPositions, dimensions, fontSize);

  return {
    ...result,
    adjustedPositions: finalPositions,
  };
}
