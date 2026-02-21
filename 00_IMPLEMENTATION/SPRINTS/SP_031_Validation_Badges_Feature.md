# SP_031 - Validation Badges for Vendor Comparison Matrix

**Date**: February 21, 2026
**Status**: ✅ COMPLETE
**Type**: UI Enhancement / New Feature
**Duration**: 1 day
**Priority**: MEDIUM
**Dependencies**: SP_018 (Two-Stage Comparison), SP_019 (Vendor Comparison Component)

---

## Objective

Add visual validation badges to each cell icon in the vendor comparison matrix. These badges indicate whether a data point has been independently validated by the vendor, the buyer, or an external expert. Validation state is toggled per-cell from the existing cell detail modal and persisted in localStorage.

---

## Problem Being Solved

The comparison matrix displays AI-generated assessment icons (checkmark, star, minus, question mark) but provides no way for users to mark which cells have been manually verified by a human source. Buyers may want to record that a vendor confirmed a capability, or that an expert independently verified a finding, directly on the matrix for reference.

---

## Feature Description

### Three Validation Types

Each comparison matrix cell can be independently validated by three parties:

- **Vendor (V)** — The vendor themselves confirmed this data point. Shown as a green badge at 12 o'clock.
- **Buyer (B)** — The buying team verified this through their own research. Shown as a blue badge at 9 o'clock.
- **Expert (E)** — An external expert or analyst validated this. Shown as an orange badge at 3 o'clock.

### Visual Design

When any validation is active, an orbital ring appears around the cell icon at a subtle opacity (0.0875), matching the icon's color. Validation badges appear as small colored circles at clock positions on the orbit, with their letter (V, B, or E) inside. The orbital ring has a gap cut out at each active badge position.

```
Default State (System ON):
   ✓   (raw icon, no ring)

Validated State (System OFF + badges active):
      V
   ●─────●
   │  ✓  │
   B     E
   └─────┘
   (icon + orbit + badges at 12, 9, 3 o'clock)
```

### System Validation Mode

- **System ON** (default): AI-only data, no badges or orbit visible. Icons appear as plain icons without circle backgrounds.
- **System OFF**: Manual validations can be toggled. Icons show with colored circle backgrounds at 100% opacity.
- Enabling any validation (V/B/E) automatically turns System OFF.
- Re-enabling System turns all three validations OFF and removes all badges.

### Toggle Controls

Toggle switches for System, Vendor, Buyer, and Expert validation appear inside the existing cell detail modal (the drawer that shows evidence and source links when a cell is clicked). Changes take effect immediately on the matrix.

---

## Files Implemented

| File | Type | Description |
|------|------|-------------|
| `src/types/validation.types.ts` | New | `CellValidation` interface, default state, localStorage get/set utilities |
| `src/components/vendor-comparison/ValidationBadges.tsx` | New | Renders orbital ring with SVG arc segments and absolute-positioned badge circles |
| `src/components/vendor-comparison/VerticalBarChart.tsx` | Modified | Wraps all icon states (yes/no/unknown/star) in `ValidationBadges`, loads validation per-cell |
| `src/components/VendorComparisonNew.tsx` | Modified | Adds validation state, toggle handler, and toggle UI in cell detail modal |
| `00_IMPLEMENTATION/VALIDATION_BADGES_IMPLEMENTATION_GUIDE.md` | New | Full specification with code snippets, visual reference, and implementation checklist |

---

## Technical Approach

### State Storage

Validation is stored per cell in localStorage with the key pattern:
```
validation_{projectId}_{vendorId}_{criterionId}
```

Default state for every cell is `{ system: true, vendorValidation: false, buyerValidation: false, expertValidation: false }`.

### Matrix Re-render

The parent component (`VendorComparisonNew`) holds a `validationKey` counter. When the user toggles a validation, `validationKey` increments, forcing both `VerticalBarChart` instances (mobile and desktop) to re-mount and re-read localStorage — displaying the updated badge state immediately.

### SVG Orbital Ring with Gaps

The orbital ring is drawn using SVG arc path segments. For each active badge, a gap is cut in the ring at that badge's angular position. The gap angle is calculated proportionally to badge size relative to orbit radius. If no badges are active but the system is OFF, a full circle is drawn.

### Z-Index Layering

- SVG ring: `z-index: 0` (behind everything)
- Main icon: `z-index: 10, position: relative` (on top of ring)
- Badge circles: Absolute positioned, appear on top of the ring

---

## Impact

- Buyers can record human validation on any matrix cell without leaving the comparison view
- Validation state persists across page refreshes (localStorage)
- No new n8n webhooks required — purely frontend feature
- Zero impact on existing AI comparison data or caching logic
