# Validation Badges Implementation Guide

## Overview
This document contains all code snippets and specifications needed to implement the validation badges feature for the vendor comparison matrix. The feature adds visual validation badges around matrix cell icons with orbital rings.

---

## 1. Feature Specifications

### Visual Requirements
- **Three validation badges**: Vendor (V), Buyer (B), Expert (E)
- **Badge positions**:
  - Vendor: 12 o'clock (top) - Green badge
  - Buyer: 9 o'clock (left) - Blue badge
  - Expert: 3 o'clock (right) - Orange badge
- **Badge size**: 1/5 of icon size, increased by 30% (multiplier: 1.3)
- **Orbital ring**: Single orbit matching icon color with gaps at badge positions
- **Orbit opacity**: 0.0875 (very subtle)
- **Default state**: System validation ON, all badges hidden
- **Toggle behavior**: When System ON, no badges/orbit visible. When any validation active, System turns OFF automatically

### State Management
- **localStorage**: Per-project, per-vendor, per-criterion cell validation
- **Default**: `{ system: true, vendorValidation: false, buyerValidation: false, expertValidation: false }`
- **Background behavior**:
  - System ON: Raw icons only (no colored circle backgrounds)
  - Validations active: Icons with colored circle backgrounds at 100% opacity

---

## 2. Type Definitions

### File: `src/types/validation.types.ts`

```typescript
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
```

---

## 3. ValidationBadges Component

### File: `src/components/vendor-comparison/ValidationBadges.tsx`

```typescript
/**
 * ValidationBadges Component
 *
 * Displays small validation badges around matrix cell icons
 * - Vendor validation: Green circle with "V" at 12 o'clock (top)
 * - Buyer validation: Blue circle with "B" at 9 o'clock (left)
 * - Expert validation: Orange circle with "E" at 3 o'clock (right)
 * - Only visible when system validation is OFF
 */

import React from 'react';
import { CellValidation } from '../../types/validation.types';

interface ValidationBadgesProps {
  validation: CellValidation;
  iconSize?: number; // Size of the main icon (badges will be 1/5 of this)
  iconColor?: string; // Color of the orbit (matches icon color)
  fillColor?: string; // Color of the filled ring between icon and orbit (CURRENTLY COMMENTED OUT)
  children: React.ReactNode; // The icon element to wrap
}

export const ValidationBadges: React.FC<ValidationBadgesProps> = ({
  validation,
  iconSize = 20,
  iconColor = 'rgb(156, 163, 175)', // Default gray
  fillColor = 'rgb(243, 244, 246)', // Default light gray
  children,
}) => {
  // Don't show badges if system validation is ON
  if (validation.system) {
    return <>{children}</>;
  }

  const badgeSize = (iconSize / 5) * 1.3; // Badges are 1/5 the size of the icon, increased by 30%

  // Single orbit radius for all badges
  const orbitRadius = iconSize / 2 + badgeSize / 2 + 6;

  // Calculate SVG container size to fit the orbit
  const svgSize = orbitRadius * 2 + badgeSize;

  // Calculate gap size for badges (in degrees)
  const gapAngle = (badgeSize / orbitRadius) * (180 / Math.PI) * 1.5; // Gap for badge

  // Helper to create arc segments with multiple gaps
  const createOrbitWithGaps = () => {
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const gaps = [
      { angle: -90, active: validation.vendorValidation }, // 12 o'clock
      { angle: 0, active: validation.expertValidation },    // 3 o'clock
      { angle: 180, active: validation.buyerValidation },   // 9 o'clock
    ];

    // Filter to only active gaps
    const activeGaps = gaps.filter(g => g.active).map(g => g.angle);

    if (activeGaps.length === 0) {
      // No gaps, draw full circle
      return (
        <circle
          cx={centerX}
          cy={centerY}
          r={orbitRadius}
          fill="none"
          stroke={iconColor}
          strokeWidth="1"
          opacity="0.0875"
        />
      );
    }

    // Sort gaps by angle
    const sortedGaps = [...activeGaps].sort((a, b) => a - b);

    // Create arc segments between gaps
    const segments = [];
    for (let i = 0; i < sortedGaps.length; i++) {
      const currentGapAngle = sortedGaps[i];
      const nextGapAngle = sortedGaps[(i + 1) % sortedGaps.length];

      // End of current gap
      const startAngle = currentGapAngle + gapAngle / 2;
      // Start of next gap
      let endAngle = nextGapAngle - gapAngle / 2;

      // Handle wrap-around
      if (i === sortedGaps.length - 1) {
        endAngle = sortedGaps[0] + 360 - gapAngle / 2;
      }

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + orbitRadius * Math.cos(startRad);
      const y1 = centerY + orbitRadius * Math.sin(startRad);
      const x2 = centerX + orbitRadius * Math.cos(endRad);
      const y2 = centerY + orbitRadius * Math.sin(endRad);

      const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

      segments.push(
        <path
          key={i}
          d={`M ${x1} ${y1} A ${orbitRadius} ${orbitRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
          fill="none"
          stroke={iconColor}
          strokeWidth="1"
          opacity="0.0875"
        />
      );
    }

    return <>{segments}</>;
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Single orbital ring with gaps at badge positions */}
      {(validation.vendorValidation || validation.buyerValidation || validation.expertValidation) && (
        <svg
          className="absolute pointer-events-none"
          style={{
            width: `${svgSize}px`,
            height: `${svgSize}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
          }}
        >
          <defs>
            {/* Mask to create ring shape (donut) */}
            <mask id={`ring-mask-${iconSize}`}>
              <rect width="100%" height="100%" fill="white" />
              {/* Black circle in center to cut out the hole */}
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={iconSize / 2}
                fill="black"
              />
            </mask>
          </defs>

          {/* Filled ring between icon and orbit - CURRENTLY COMMENTED OUT */}
          {/* <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={orbitRadius}
            fill={fillColor}
            opacity="0.49"
            mask={`url(#ring-mask-${iconSize})`}
          /> */}

          {createOrbitWithGaps()}
        </svg>
      )}

      {/* Main icon */}
      <div style={{ zIndex: 10, position: 'relative' }}>
        {children}
      </div>

      {/* Vendor Validation Badge - 12 o'clock (top) */}
      {validation.vendorValidation && (
        <div
          className="absolute flex items-center justify-center bg-green-500 text-white rounded-full font-bold"
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            fontSize: `${badgeSize * 0.6}px`,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${orbitRadius}px))`,
          }}
        >
          V
        </div>
      )}

      {/* Buyer Validation Badge - 9 o'clock (left) */}
      {validation.buyerValidation && (
        <div
          className="absolute flex items-center justify-center bg-blue-500 text-white rounded-full font-bold"
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            fontSize: `${badgeSize * 0.6}px`,
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% - ${orbitRadius}px), -50%)`,
          }}
        >
          B
        </div>
      )}

      {/* Expert Validation Badge - 3 o'clock (right) */}
      {validation.expertValidation && (
        <div
          className="absolute flex items-center justify-center bg-orange-500 text-white rounded-full font-bold"
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            fontSize: `${badgeSize * 0.6}px`,
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${orbitRadius}px), -50%)`,
          }}
        >
          E
        </div>
      )}
    </div>
  );
};
```

---

## 4. Icon Rendering Logic

### Integration in VerticalBarChart Component

```typescript
// Add to renderCriterionState function parameters and logic

// Load validation state for this cell
const validation = projectId
  ? loadCellValidation(projectId, vendorId, criterionId)
  : { system: true, vendorValidation: false, buyerValidation: false, expertValidation: false };

// Check if validations are active (for brighter backgrounds)
const hasActiveValidation = !validation.system &&
  (validation.vendorValidation || validation.buyerValidation || validation.expertValidation);
```

### Icon States with ValidationBadges Wrapper

**GREEN CHECKMARK (yes state):**
```typescript
<div className="flex items-center justify-center h-8 sm:h-9 mb-1">
  <ValidationBadges
    validation={validation}
    iconSize={32}
    iconColor="rgb(22, 163, 74)"
    fillColor="rgb(220, 252, 231)"
  >
    {hasActiveValidation ? (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 lg:bg-green-100/100 flex items-center justify-center flex-shrink-0">
        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
      </div>
    ) : (
      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
    )}
  </ValidationBadges>
</div>
```

**YELLOW STAR (star state):**
```typescript
<div className="flex items-center justify-center h-8 sm:h-9 mb-1">
  <ValidationBadges
    validation={validation}
    iconSize={32}
    iconColor="rgb(234, 179, 8)"
    fillColor="rgb(254, 252, 232)"
  >
    {hasActiveValidation ? (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 lg:bg-yellow-100/100 flex items-center justify-center flex-shrink-0">
        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-yellow-500" />
      </div>
    ) : (
      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-yellow-500" />
    )}
  </ValidationBadges>
</div>
```

**GRAY MINUS (no state):**
```typescript
<div className="flex items-center justify-center h-8 sm:h-9 mb-1">
  <ValidationBadges
    validation={validation}
    iconSize={32}
    iconColor="rgb(156, 163, 175)"
    fillColor="rgb(243, 244, 246)"
  >
    {hasActiveValidation ? (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 lg:bg-gray-100/100 flex items-center justify-center flex-shrink-0">
        <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>
    ) : (
      <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
    )}
  </ValidationBadges>
</div>
```

**GRAY QUESTION MARK (unknown state):**
```typescript
<div className="flex items-center justify-center h-8 sm:h-9 mb-1">
  <ValidationBadges
    validation={validation}
    iconSize={32}
    iconColor="rgb(156, 163, 175)"
    fillColor="rgb(243, 244, 246)"
  >
    {hasActiveValidation ? (
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 lg:bg-gray-100/100 flex items-center justify-center flex-shrink-0">
        <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>
    ) : (
      <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
    )}
  </ValidationBadges>
</div>
```

---

## 5. Modal Toggle Controls

### Parent Component State Management

```typescript
// Imports
import { CellValidation, loadCellValidation, saveCellValidation, DEFAULT_VALIDATION } from '../types/validation.types';

// State
const [currentValidation, setCurrentValidation] = useState<CellValidation>(DEFAULT_VALIDATION);
const [validationKey, setValidationKey] = useState(0);

// Load validation when modal opens
useEffect(() => {
  if (selectedScoreDetail && projectId) {
    const validation = loadCellValidation(
      projectId,
      selectedScoreDetail.vendorId,
      selectedScoreDetail.criterionId
    );
    setCurrentValidation(validation);
  }
}, [selectedScoreDetail, projectId]);

// Toggle handler
const handleValidationToggle = (field: 'system' | 'vendorValidation' | 'buyerValidation' | 'expertValidation') => {
  if (!selectedScoreDetail || !projectId) return;

  let newValidation = { ...currentValidation };

  if (field === 'system') {
    newValidation.system = !newValidation.system;
    if (newValidation.system) {
      // Turn off all validations when System is enabled
      newValidation.vendorValidation = false;
      newValidation.buyerValidation = false;
      newValidation.expertValidation = false;
    }
  } else {
    // Turn off System when any validation is enabled
    if (currentValidation.system) {
      newValidation.system = false;
    }
    newValidation[field] = !newValidation[field];
  }

  saveCellValidation(projectId, selectedScoreDetail.vendorId, selectedScoreDetail.criterionId, newValidation);
  setCurrentValidation(newValidation);
  setValidationKey(prev => prev + 1); // Force re-render of matrix
};
```

### Modal Toggle UI

```typescript
{/* Validation Section */}
<div className="space-y-3">
  <h4 className="text-sm font-semibold text-gray-700">Validation Status</h4>

  {/* System Toggle */}
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm text-gray-600 group-hover:text-gray-900">
      System Validation
    </span>
    <button
      onClick={() => handleValidationToggle('system')}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors
        ${currentValidation.system ? 'bg-gray-600' : 'bg-gray-300'}
      `}
    >
      <span className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${currentValidation.system ? 'translate-x-5' : 'translate-x-1'}
      `} />
    </button>
  </label>

  {/* Vendor Validation Toggle */}
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-4 h-4 bg-green-500 text-white rounded-full text-xs font-bold">
        V
      </span>
      Vendor Validated
    </span>
    <button
      onClick={() => handleValidationToggle('vendorValidation')}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors
        ${currentValidation.vendorValidation ? 'bg-green-600' : 'bg-gray-300'}
      `}
    >
      <span className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${currentValidation.vendorValidation ? 'translate-x-5' : 'translate-x-1'}
      `} />
    </button>
  </label>

  {/* Buyer Validation Toggle */}
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full text-xs font-bold">
        B
      </span>
      Buyer Validated
    </span>
    <button
      onClick={() => handleValidationToggle('buyerValidation')}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors
        ${currentValidation.buyerValidation ? 'bg-blue-600' : 'bg-gray-300'}
      `}
    >
      <span className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${currentValidation.buyerValidation ? 'translate-x-5' : 'translate-x-1'}
      `} />
    </button>
  </label>

  {/* Expert Validation Toggle */}
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm text-gray-600 group-hover:text-gray-900 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-xs font-bold">
        E
      </span>
      Expert Validated
    </span>
    <button
      onClick={() => handleValidationToggle('expertValidation')}
      className={`
        relative inline-flex h-5 w-9 items-center rounded-full transition-colors
        ${currentValidation.expertValidation ? 'bg-orange-600' : 'bg-gray-300'}
      `}
    >
      <span className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${currentValidation.expertValidation ? 'translate-x-5' : 'translate-x-1'}
      `} />
    </button>
  </label>
</div>
```

---

## 6. Key Implementation Notes

### Z-Index Layering
- SVG orbital ring: `zIndex: 0` (behind)
- Main icon: `zIndex: 10, position: relative` (on top)
- Badges: Absolute positioned above everything

### Orbit Calculation
- Orbit radius: `iconSize / 2 + badgeSize / 2 + 6`
- Gap angle: `(badgeSize / orbitRadius) * (180 / Math.PI) * 1.5`
- Badge positions use trigonometry with `transform: translate()`

### Color Scheme
- **Vendor badge**: `bg-green-500` (Green)
- **Buyer badge**: `bg-blue-500` (Blue)
- **Expert badge**: `bg-orange-500` (Orange)
- **Orbit color**: Matches icon color (passed via `iconColor` prop)

### Conditional Rendering
- **System ON**: Raw icons only, no circles
- **Validations active**: Icons with colored circles at 100% opacity
- **Badges**: Only shown when `validation.system === false`

---

## 7. Dependencies

```json
{
  "react": "^18.x",
  "lucide-react": "^0.x",
  "framer-motion": "^10.x"
}
```

### Required Icon Components
- `Check` - Checkmark icon
- `Star` - Star icon
- `Minus` - Minus/dash icon
- `HelpCircle` - Question mark icon

---

## 8. Implementation Checklist

- [ ] Create `validation.types.ts` with all type definitions and localStorage utilities
- [ ] Create `ValidationBadges.tsx` component with SVG orbital rendering
- [ ] Update icon rendering logic in main comparison component
- [ ] Add validation state management to parent component
- [ ] Add modal toggle UI for validation controls
- [ ] Test localStorage persistence across page refreshes
- [ ] Verify z-index layering (icon on top of orbit)
- [ ] Verify badge positioning at 12, 9, and 3 o'clock
- [ ] Verify orbit color matches icon color for each state
- [ ] Verify System toggle behavior (hides all when ON)

---

## 9. Visual Reference

```
Default State (System ON):
  ✓  (just icon, no circle)

Validated State (System OFF + badges):
  ●───V───●
  │   ✓   │
  B       E
  └───────┘
  (icon with circle + orbit + badges at 12, 9, 3 o'clock)
```

### Badge Colors
- **V** (Vendor): Green circle `#10b981` (green-500)
- **B** (Buyer): Blue circle `#3b82f6` (blue-500)
- **E** (Expert): Orange circle `#f97316` (orange-500)

### Orbit Colors (match icon)
- Green checkmark: `rgb(22, 163, 74)` (green-600)
- Yellow star: `rgb(234, 179, 8)` (yellow-600)
- Gray minus/question: `rgb(156, 163, 175)` (gray-400)

---

## END OF DOCUMENT
