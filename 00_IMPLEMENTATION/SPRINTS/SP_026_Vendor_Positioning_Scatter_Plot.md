# Sprint 26: Vendor Positioning Scatter Plot

**Sprint ID**: SP_026_Vendor_Positioning_Scatter_Plot
**Duration**: 5-7 days
**Start Date**: January 11, 2026
**Date Completed**: January 14, 2026
**Status**: ✅ COMPLETE
**Type**: Feature Implementation + n8n AI Integration

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Sprint Goal](#sprint-goal)
3. [Feature Overview](#feature-overview)
4. [Technical Architecture](#technical-architecture)
5. [Component Specifications](#component-specifications)
6. [n8n Workflow Design](#n8n-workflow-design)
7. [Implementation Phases](#implementation-phases)
8. [Testing Strategy](#testing-strategy)
9. [Success Criteria](#success-criteria)
10. [Risks and Mitigations](#risks-and-mitigations)

---

## Executive Summary

Add an interactive 2x2 scatter plot visualization to the Vendor Discovery page that positions vendor logos along two strategic dimensions: **Solution Scope** (Single-Purpose ↔ Multi-Function) and **Industry Focus** (Vertical-Specific ↔ General Purpose). The positioning is determined by AI analysis via a new n8n workflow, providing users with an intuitive visual understanding of each vendor's strategic positioning in the market landscape.

**Key Deliverables**:
- Interactive Nivo scatter plot component with animated vendor logos
- Synchronized selection state between scatter plot and vendor cards
- New n8n webhook for AI-powered vendor positioning analysis (production + testing)
- Collision detection and intelligent logo placement
- Responsive mobile/desktop layouts with smooth animations
- localStorage caching for positioning data

---

## Sprint Goal

**Primary Goal**: Enable users to visualize vendor strategic positioning through an elegant, AI-powered 2x2 scatter plot that complements the existing vendor card interface.

**User Value**:
- Instantly understand vendor differentiation (single-purpose vs. multi-function)
- Identify industry specialization (vertical-specific vs. general purpose)
- Make informed selection decisions through visual market landscape analysis
- Enjoy a polished, animation-rich user experience

---

## Feature Overview

### User Journey

1. **Initial State** - User navigates to Vendor Selection step (after Criteria Builder)
2. **Vendor Discovery** - Clicks "Discover More" button, triggering `findVendors()` n8n webhook
3. **Vendor Cards Appear** - 6+ vendor cards display with selection checkboxes
4. **Scatter Plot Loading** - Below vendor cards, scatter plot appears with:
   - Vendor logos circling in center
   - Loading text: "Generating scatter plot..." with animated dots
5. **n8n Positioning** - `generateVendorScatterplot()` webhook analyzes vendors and returns coordinates
6. **Animation Complete** - Logos smoothly fly to their final positions on the chart
7. **Interaction** - User can click logos to select/deselect, synchronized with vendor cards

### Visual Design Specifications

#### Scatter Plot Dimensions
- **Desktop**: Rectangular, matching vendor cards section width (~1200px max-width)
  - Height: 500px
  - Aspect ratio: ~2.4:1 (wide rectangular)
- **Mobile**: Square, full viewport width
  - Height: Equal to width (1:1 aspect ratio)
  - No horizontal scrolling required

#### Logo Specifications
- **Size**: 66x66px circular containers
- **Format**: Forced circular crop with `border-radius: 50%`
- **Fallback**: If no logo available, display vendor initials in colored circle
- **Container**: White background with subtle shadow (`box-shadow: 0 2px 8px rgba(0,0,0,0.1)`)

#### Selection States
- **Unselected**:
  - Logo at 100% opacity
  - No halo
  - `z-index: 1`
- **Selected**:
  - Logo at 100% opacity
  - Blue halo ring (8px border, `#3B82F6` color, 50% opacity)
  - `z-index: 10` (appears on top)
  - Smooth glow effect (`box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.5)`)
- **Hover** (desktop only):
  - Slight scale animation (`transform: scale(1.1)`)
  - Increased shadow (`box-shadow: 0 4px 12px rgba(0,0,0,0.2)`)
  - Cursor: pointer
  - Transition: 200ms ease-in-out

#### Axis Labels
- **X-Axis**:
  - Left label: "Single-Purpose" (font-size: 14px, color: #6B7280)
  - Right label: "Multi-Function" (font-size: 14px, color: #6B7280)
  - Position: Bottom edge of chart, outside plot area
- **Y-Axis**:
  - Bottom label: "Vertical-Specific" (font-size: 14px, color: #6B7280)
  - Top label: "General Purpose" (font-size: 14px, color: #6B7280)
  - Position: Left edge of chart, outside plot area
- **Always Visible**: Labels do not fade or animate
- **Font**: Consistent with application typography (Inter, system-ui fallback)

#### Animation Specifications

**1. Loading Animation (Circling Motion)**
- **Duration**: Continuous loop until n8n returns
- **Pattern**: Circular orbit around chart center
  - Radius: 80px from center
  - Speed: 3 seconds per full rotation
  - Easing: `linear` (constant speed)
- **Stagger**: Each logo starts at different position on circle (evenly distributed)
- **Loading Text**:
  - Text: "Generating scatter plot..."
  - Position: Above circling logos, centered
  - Animated dots: Pulse animation (3 dots, sequential fade in/out)
  - Font-size: 16px, color: #6B7280

**2. Fly-to-Position Animation**
- **Trigger**: n8n webhook returns successfully
- **Duration**: 1.2 seconds
- **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like bounce)
- **Sequencing**: All logos animate simultaneously (not sequential)
- **Final Position**: Exact coordinates from n8n (with collision adjustment if needed)

**3. Click/Selection Animation**
- **Duration**: 150ms
- **Effect**: Halo appears with scale animation (`scale(0.8)` → `scale(1)`)
- **Easing**: `ease-out`

### Positioning Logic

#### Collision Detection
- **Minimum Distance**: 80px between any two logo centers
- **Detection Algorithm**: Check distance between all logo pairs after n8n positioning
- **Adjustment Strategy**: If collision detected, nudge logos apart along vector connecting their centers
  - Move each logo 40px away from collision point
  - Preserve relative positioning (maintain general x/y direction)
  - Re-check for new collisions after adjustment (max 3 iterations)
- **Edge Constraints**: Logos cannot be positioned closer than 40px to chart edge

#### Coordinate Normalization
- **n8n Output**: Returns rank 0-100 for each dimension per vendor
  ```json
  {
    "vendor_id": "uuid",
    "vendor_name": "Salesfloor",
    "x_score": 75,  // 0-100: Solution Scope (0=Single-Purpose, 100=Multi-Function)
    "y_score": 45   // 0-100: Industry Focus (0=Vertical-Specific, 100=General Purpose)
  }
  ```
- **Frontend Normalization**:
  - Map 0-100 scores to chart pixel coordinates
  - Apply padding (40px from edges)
  - Adjust for logo size (center logo on coordinate, not top-left)
  - Formula: `pixelX = (x_score / 100) * (chartWidth - 80) + 40`

### Synchronization Logic

#### Scatter Plot ↔ Vendor Cards
- **Shared State**: `selectedVendorIds` array managed in `VendorDiscovery.tsx`
- **Logo Click**:
  1. Toggle vendor ID in `selectedVendorIds`
  2. Trigger re-render of scatter plot (update halo)
  3. Trigger re-render of vendor cards (update checkbox)
  4. No scroll behavior
- **Card Click**:
  1. Toggle vendor ID in `selectedVendorIds`
  2. Trigger re-render of scatter plot (update halo)
  3. Trigger re-render of vendor cards (update checkbox)
- **Visual Feedback**:
  - Logo pulses briefly on click (200ms scale animation)
  - Checkbox animates on card

---

## Technical Architecture

### Component Hierarchy

```
VendorDiscovery.tsx
├── VendorSelection.tsx (existing)
│   ├── Vendor Cards Grid (existing)
│   └── VendorPositioningScatterPlot.tsx (NEW)
│       ├── Nivo ScatterPlot
│       ├── AnimatedVendorLogo.tsx (NEW)
│       ├── LoadingOverlay.tsx (NEW)
│       └── AxisLabels.tsx (NEW)
```

### New Files to Create

1. **`src/components/vendor-discovery/VendorPositioningScatterPlot.tsx`** (400-500 lines)
   - Main scatter plot component
   - Manages positioning state and animations
   - Handles click interactions
   - Integrates with Nivo ResponsiveScatterPlot

2. **`src/components/vendor-discovery/AnimatedVendorLogo.tsx`** (150-200 lines)
   - Individual logo component with animations
   - Handles circular loading motion
   - Handles fly-to-position animation
   - Manages selection halo rendering

3. **`src/hooks/useVendorScatterplot.ts`** (200-250 lines)
   - React hook for vendor positioning logic
   - Calls n8n webhook
   - Manages loading/error states
   - Handles auto-retry logic (2 attempts)
   - Caches results in localStorage

4. **`src/utils/scatterPlotPositioning.ts`** (150-200 lines)
   - Collision detection algorithm
   - Coordinate normalization
   - Logo placement adjustment
   - Edge constraint validation

5. **`src/types/vendorScatterplot.types.ts`** (50-80 lines)
   - TypeScript interfaces for positioning data
   - n8n request/response types
   - Component prop types

### Modified Files

1. **`src/config/webhooks.ts`**
   - Add `VENDOR_SCATTERPLOT` to `PRODUCTION_WEBHOOKS`
   - Add `VENDOR_SCATTERPLOT` to `TESTING_WEBHOOKS`
   - Add `getVendorScatterplotUrl()` getter

2. **`src/services/n8nService.ts`**
   - Add `generateVendorScatterplot()` function
   - Add positioning storage helpers
   - Add positioning cache management

3. **`src/components/vendor-discovery/VendorSelection.tsx`**
   - Add `<VendorPositioningScatterPlot>` below vendor cards
   - Pass `selectedVendorIds` and `setSelectedVendorIds` props
   - Pass `vendors` array to scatter plot

### Dependencies

- **Nivo Charts**: `@nivo/scatterplot` (already in package.json)
- **Framer Motion**: `framer-motion` (already in package.json for animations)
- **Lodash**: `lodash.debounce` (for resize handling - already installed)

---

## Component Specifications

### VendorPositioningScatterPlot Component

**File**: `src/components/vendor-discovery/VendorPositioningScatterPlot.tsx`

**Props**:
```typescript
interface VendorPositioningScatterPlotProps {
  vendors: Vendor[];                    // Array of discovered vendors
  selectedVendorIds: string[];          // Currently selected vendor IDs
  onSelectionChange: (vendorIds: string[]) => void; // Selection callback
  projectId: string;                    // For caching key
  projectName: string;                  // For n8n context
  projectDescription: string;           // For n8n context
  criteria: Criteria[];                 // For n8n context
}
```

**State**:
```typescript
interface ScatterPlotState {
  status: 'loading' | 'positioning' | 'complete' | 'error';
  positions: VendorPosition[];          // Vendor positions with coordinates
  errorMessage: string | null;
  retryCount: number;                   // Auto-retry counter
}

interface VendorPosition {
  vendor_id: string;
  vendor_name: string;
  x: number;                            // Pixel coordinate (after normalization)
  y: number;                            // Pixel coordinate (after normalization)
  raw_x_score: number;                  // Original 0-100 score from n8n
  raw_y_score: number;                  // Original 0-100 score from n8n
}
```

**Lifecycle**:
1. **Mount**: Check localStorage cache for `vendor_scatterplot_positions_{projectId}`
2. **If Cached**: Load positions, skip n8n call, render immediately
3. **If Not Cached**:
   - Show loading animation (circling logos)
   - Call `useVendorScatterplot()` hook
   - Wait for n8n response
   - Normalize coordinates
   - Apply collision detection
   - Cache results
   - Animate to positions
4. **On Vendor Change**: If vendors array changes, clear cache and re-fetch

**Render Logic**:
```typescript
// Pseudo-code structure
if (status === 'error') {
  return <ErrorMessage message={errorMessage} onRetry={handleRetry} />;
}

if (status === 'loading' || status === 'positioning') {
  return (
    <ScatterPlotContainer>
      <LoadingOverlay text="Generating scatter plot..." />
      <CirclingLogos vendors={vendors} />
    </ScatterPlotContainer>
  );
}

// status === 'complete'
return (
  <ResponsiveScatterPlot
    data={normalizedData}
    xScale={{ type: 'linear', min: 0, max: chartWidth }}
    yScale={{ type: 'linear', min: 0, max: chartHeight }}
    nodeComponent={AnimatedVendorLogo}
    axisBottom={null}  // Custom axis labels
    axisLeft={null}    // Custom axis labels
    enableGridX={false}
    enableGridY={false}
    onClick={handleLogoClick}
  >
    <AxisLabels />
  </ResponsiveScatterPlot>
);
```

---

### AnimatedVendorLogo Component

**File**: `src/components/vendor-discovery/AnimatedVendorLogo.tsx`

**Props**:
```typescript
interface AnimatedVendorLogoProps {
  vendor: Vendor;
  position: { x: number; y: number };
  isSelected: boolean;
  isCircling: boolean;                  // Loading animation mode
  circleAngle?: number;                 // Starting angle for circle (0-360)
  onClick: (vendorId: string) => void;
}
```

**Animation Modes**:
1. **Circling Mode** (`isCircling === true`):
   ```typescript
   // Framer Motion animation
   <motion.div
     animate={{
       x: [0, Math.cos(angle) * 80, 0],
       y: [0, Math.sin(angle) * 80, 0],
     }}
     transition={{
       duration: 3,
       repeat: Infinity,
       ease: 'linear',
     }}
   >
     {/* Logo content */}
   </motion.div>
   ```

2. **Fly-to-Position Mode** (`isCircling === false`):
   ```typescript
   <motion.div
     initial={{ x: centerX, y: centerY }}
     animate={{ x: position.x, y: position.y }}
     transition={{
       duration: 1.2,
       ease: [0.34, 1.56, 0.64, 1], // Spring bounce
     }}
   >
     {/* Logo content */}
   </motion.div>
   ```

**Selection Halo**:
```typescript
{isSelected && (
  <motion.div
    className="absolute inset-0 rounded-full"
    style={{
      boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.5)',
      border: '2px solid #3B82F6',
    }}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
  />
)}
```

---

### useVendorScatterplot Hook

**File**: `src/hooks/useVendorScatterplot.ts`

**Interface**:
```typescript
interface UseVendorScatterplotResult {
  positions: VendorPosition[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  retryCount: number;
}

function useVendorScatterplot(
  vendors: Vendor[],
  projectId: string,
  projectName: string,
  projectDescription: string,
  criteria: Criteria[]
): UseVendorScatterplotResult
```

**Logic Flow**:
1. Check localStorage cache: `vendor_scatterplot_positions_{projectId}`
2. If cached and vendor list matches, return cached positions
3. If not cached:
   - Call `generateVendorScatterplot()` from n8nService
   - On success: Normalize coordinates, cache, return
   - On failure: Auto-retry (max 2 attempts with exponential backoff: 2s, 4s)
   - After 2 failures: Set error state, stop retrying
4. Expose `refetch()` for manual retry button

**Auto-Retry Logic**:
```typescript
const fetchWithRetry = async (attempt: number = 0): Promise<void> => {
  try {
    const result = await generateVendorPositioning(/* params */);
    // Success - cache and return
    cachePositions(projectId, result.positionings);
    setPositions(result.positionings);
    setIsLoading(false);
  } catch (error) {
    if (attempt < 2) {
      // Retry after delay
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
      setTimeout(() => {
        setRetryCount(attempt + 1);
        fetchWithRetry(attempt + 1);
      }, delay);
    } else {
      // Max retries reached - show error
      setError('Failed to generate scatter plot. Please try again.');
      setIsLoading(false);
    }
  }
};
```

---

## n8n Workflow Design

### Workflow Overview

**Purpose**: Analyze vendor descriptions and project context to determine strategic positioning along two dimensions.

**Workflow Name** (Production): `Clarioo AI Vendor Scatterplot`
**Webhook Path** (Production): `/webhook/clarioo-vendor-scatterplot`
**Webhook Path** (Testing): `/webhook/clarioo-vendor-scatterplot-test`

**Timeout**: 60 seconds
**AI Model**: GPT-4o-mini (temperature: 0.3, max tokens: 4000)

### Input Schema

```json
{
  "user_id": "uuid-v4-from-localStorage",
  "session_id": "uuid-v4-from-sessionStorage",
  "project_id": "uuid-v4",
  "project_name": "Luxury Retail CX Platform Evaluation",
  "project_description": "We are evaluating clienteling and omnichannel platforms for luxury retail...",
  "project_category": "Customer Experience Software",
  "vendors": [
    {
      "id": "uuid-v4",
      "name": "Salesfloor",
      "description": "Salesfloor is a clienteling and omnichannel CX platform...",
      "website": "https://salesfloor.com"
    }
  ],
  "timestamp": "2026-01-11T10:00:00.000Z"
}
```

**Validation Rules**:
- `user_id`: Required, non-empty string
- `session_id`: Required, non-empty string
- `project_id`: Required, non-empty string
- `project_name`: Required, min 5 characters
- `project_description`: Required, min 20 characters
- `vendors`: Required, non-empty array (min 1 vendor)
  - Each vendor must have: `id`, `name`, `description`
- `timestamp`: Required, ISO 8601 format

### AI Prompt Design

**System Message**:
```
You are a market analyst specializing in software vendor positioning. Your task is to analyze vendors and position them on a 2x2 strategic matrix.

DIMENSION 1 - SOLUTION SCOPE (X-Axis):
- 0-30: Single-Purpose (Highly specialized, narrow feature set, one primary use case)
- 31-70: Hybrid (Moderate feature breadth, 2-3 core capabilities)
- 71-100: Multi-Function (Suite/platform, comprehensive feature set, many use cases)

DIMENSION 2 - INDUSTRY FOCUS (Y-Axis):
- 0-30: Vertical-Specific (Industry-specialized, deep vertical expertise)
- 31-70: Hybrid (Serves 2-3 related verticals or broad with some specialization)
- 71-100: General Purpose (Cross-industry, horizontal solution for all sectors)

SCORING GUIDELINES:
- Base scores on vendor description, website domain, and project context
- Consider typical product positioning language:
  - "platform", "suite", "ecosystem" → Higher solution scope (70-100)
  - "specialized", "designed for [industry]", "built for [vertical]" → Lower industry focus (0-40)
- Ensure score distribution: Avoid clustering all vendors in center (40-60 range)
- Spread vendors across quadrants when differences exist

OUTPUT: Valid JSON only, no markdown.
```

**User Prompt Template**:
```
PROJECT CONTEXT:
Name: {{ $json.project_name }}
Description: {{ $json.project_description }}
Category: {{ $json.project_category }}

VENDORS TO ANALYZE ({{ $json.vendors.length }} total):

{{ $json.vendors.map(v => `
VENDOR: ${v.name}
ID: ${v.id}
Website: ${v.website}
Description: ${v.description}
---
`).join('\n') }}

TASK:
Analyze each vendor and assign scores (0-100) for both dimensions.

Consider:
1. Solution Scope: Does this vendor offer a single-purpose tool or a multi-function platform?
2. Industry Focus: Is this vendor specialized for specific industries or a general-purpose solution?

Use the project context to calibrate positioning (vendors may position differently for this use case).

Return JSON with this exact structure:
{
  "positionings": [
    {
      "vendor_id": "uuid-from-input",
      "vendor_name": "Vendor Name",
      "x_score": 75,  // Solution Scope: 0-100
      "y_score": 40,  // Industry Focus: 0-100
      "reasoning": "Brief 1-sentence explanation of positioning"
    }
  ]
}
```

### Output Schema (Structured Output Parser)

```json
{
  "type": "object",
  "properties": {
    "positionings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "vendor_id": {
            "type": "string",
            "description": "Vendor UUID - copy exactly from input"
          },
          "vendor_name": {
            "type": "string",
            "description": "Vendor name"
          },
          "x_score": {
            "type": "number",
            "description": "Solution Scope score 0-100 (0=Single-Purpose, 100=Multi-Function)",
            "minimum": 0,
            "maximum": 100
          },
          "y_score": {
            "type": "number",
            "description": "Industry Focus score 0-100 (0=Vertical-Specific, 100=General Purpose)",
            "minimum": 0,
            "maximum": 100
          },
          "reasoning": {
            "type": "string",
            "description": "Brief explanation of positioning (1 sentence)"
          }
        },
        "required": ["vendor_id", "vendor_name", "x_score", "y_score"]
      }
    }
  },
  "required": ["positionings"]
}
```

### Response Format

**Success Response (200)**:
```json
{
  "success": true,
  "positionings": [
    {
      "vendor_id": "uuid-v4",
      "vendor_name": "Salesfloor",
      "x_score": 75,
      "y_score": 45,
      "reasoning": "Multi-function platform with luxury retail specialization"
    },
    {
      "vendor_id": "uuid-v4",
      "vendor_name": "Tulip",
      "x_score": 80,
      "y_score": 35,
      "reasoning": "Comprehensive suite specifically built for retail industry"
    }
  ]
}
```

**Error Response (400 - Validation)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "vendors must be a non-empty array"
  }
}
```

**Error Response (500 - Processing)**:
```json
{
  "success": false,
  "error": {
    "code": "AI_PROCESSING_ERROR",
    "message": "Failed to generate vendor positioning"
  }
}
```

### n8n Workflow Nodes

**Node Structure** (same pattern as Compare Vendors workflow):

1. **Webhook Trigger**
   - Type: `n8n-nodes-base.webhook`
   - Method: POST
   - Path: `clarioo-vendor-scatterplot` (production) / `clarioo-vendor-scatterplot-test` (testing)
   - Response Mode: `responseNode`
   - CORS Headers: `Access-Control-Allow-Origin: https://demo.clarioo.io`

2. **Input Validation**
   - Type: `n8n-nodes-base.code`
   - JavaScript: Validate all required fields, vendors array, return validation errors

3. **Check Validation**
   - Type: `n8n-nodes-base.if`
   - Condition: `validation_error === true`
   - True → Return Validation Error (400)
   - False → AI Positioning Agent

4. **AI Positioning Agent**
   - Type: `@n8n/n8n-nodes-langchain.agent`
   - Prompt: System message + user prompt template
   - Tools: None (no web search needed - uses descriptions)
   - Output Parser: Structured Output Parser (JSON schema)

5. **OpenAI Chat Model**
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenAi`
   - Model: `gpt-4o-mini`
   - Temperature: 0.3
   - Max Tokens: 4000

6. **Structured Output Parser**
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`
   - Schema: JSON schema (defined above)

7. **Format Success Response**
   - Type: `n8n-nodes-base.code`
   - JavaScript: Validate output, ensure all vendor_ids match input, return success JSON

8. **Check Success**
   - Type: `n8n-nodes-base.if`
   - Condition: `success === false`
   - True → Handle Processing Error
   - False → Return Success Response (200)

9. **Handle Processing Error**
   - Type: `n8n-nodes-base.code`
   - JavaScript: Format error response with error details

10. **Return Success Response**
    - Type: `n8n-nodes-base.respondToWebhook`
    - Status Code: 200
    - Body: `{{ $json }}`

11. **Return Error Response**
    - Type: `n8n-nodes-base.respondToWebhook`
    - Status Code: 500
    - Body: `{{ $json }}`

---

## Implementation Phases

### Phase 1: Frontend Components (Days 1-2)

**Goal**: Build scatter plot UI with mock data, no n8n integration yet.

**Tasks**:
- [ ] Create `VendorPositioningScatterPlot.tsx` component
  - Nivo ResponsiveScatterPlot integration
  - Mock positioning data (hardcoded coordinates)
  - Axis labels rendering
- [ ] Create `AnimatedVendorLogo.tsx` component
  - Circular loading animation
  - Logo rendering with fallback (initials)
  - Selection halo styling
- [ ] Create `LoadingOverlay.tsx` component
  - Loading text with animated dots
- [ ] Implement collision detection utility (`scatterPlotPositioning.ts`)
  - Minimum distance algorithm
  - Logo nudging logic
  - Edge constraint validation
- [ ] Integrate scatter plot into `VendorSelection.tsx`
  - Position below vendor cards
  - Pass mock data and handlers
- [ ] Test responsive behavior (desktop/mobile)
  - Verify rectangular layout on desktop
  - Verify square layout on mobile
  - Test logo size adjustments

**Acceptance Criteria**:
- [ ] Scatter plot renders with 6 mock vendor logos
- [ ] Logos start circling in center with "Generating..." text
- [ ] After 2 seconds, logos fly to mock positions
- [ ] Clicking logos toggles selection (blue halo appears)
- [ ] No overlapping logos (collision detection works)
- [ ] Mobile view shows square chart with smaller logos

---

### Phase 2: Animation Refinement (Day 3)

**Goal**: Polish animations and interaction feedback.

**Tasks**:
- [ ] Implement fly-to-position animation with spring easing
  - Test different durations (0.8s, 1.0s, 1.2s) - select best feel
  - Ensure all logos animate simultaneously
- [ ] Add hover effects (desktop only)
  - Scale on hover (1.0 → 1.1)
  - Enhanced shadow on hover
- [ ] Add click feedback animation
  - Brief scale pulse on click (150ms)
  - Halo fade-in animation
- [ ] Test animation performance
  - Verify 60fps on desktop
  - Verify smooth performance on mid-range mobile devices
- [ ] Add visual feedback for logo-card synchronization
  - Ensure checkbox updates are visible when logo clicked
  - Consider subtle pulse on corresponding card

**Acceptance Criteria**:
- [ ] Fly-to-position animation feels smooth and natural
- [ ] Hover effects work on desktop (not mobile)
- [ ] Click feedback is responsive (<50ms)
- [ ] No janky animations or dropped frames
- [ ] Logo and card selection states stay in sync

---

### Phase 3: n8n Workflow Implementation (Day 4)

**Goal**: Create production and testing n8n workflows.

**Tasks**:
- [ ] Copy "Clarioo AI Compare Vendors" workflow as template
- [ ] Create production workflow: `Clarioo AI Vendor Scatterplot`
  - Update webhook path: `/webhook/clarioo-vendor-scatterplot`
  - Update validation logic (new input schema)
  - Update AI prompt (positioning analysis)
  - Update structured output parser (positioning schema)
  - Test with sample payload
- [ ] Create testing workflow: `Clarioo AI Vendor Scatterplot TEST`
  - Clone production workflow
  - Update webhook path: `/webhook/clarioo-vendor-scatterplot-test`
  - Use same logic as production
  - Generate test UUID for webhook
- [ ] Test both workflows with Postman/Insomnia
  - Verify 200 success responses
  - Verify 400 validation errors
  - Verify 500 processing errors
  - Verify positioning scores are 0-100
  - Verify all vendor IDs match input

**Acceptance Criteria**:
- [ ] Production webhook returns valid positioning data
- [ ] Testing webhook returns valid positioning data
- [ ] Validation errors return 400 status
- [ ] AI errors return 500 status
- [ ] All vendor IDs in response match input IDs
- [ ] Scores are distributed across quadrants (not all 50/50)

---

### Phase 4: n8n Integration (Day 5)

**Goal**: Connect frontend to n8n webhooks.

**Tasks**:
- [ ] Add webhook URLs to `src/config/webhooks.ts`
  - Add `VENDOR_SCATTERPLOT` to production webhooks
  - Add `VENDOR_SCATTERPLOT` to testing webhooks
  - Add `getVendorScatterplotUrl()` getter
- [ ] Implement `generateVendorScatterplot()` in `n8nService.ts`
  - Request format transformation
  - AbortController for timeout (60s)
  - Error handling
  - Response validation
- [ ] Create `useVendorScatterplot.ts` hook
  - Call n8nService function
  - Manage loading/error states
  - Implement auto-retry logic (2 attempts)
  - Cache results in localStorage
- [ ] Integrate hook into `VendorPositioningScatterPlot.tsx`
  - Replace mock data with real n8n call
  - Handle loading state (show circling animation)
  - Handle success state (fly to positions)
  - Handle error state (show error message + retry button)
- [ ] Add TypeScript types (`vendorScatterplot.types.ts`)
  - Request/response interfaces
  - Vendor position interface
  - Component prop types

**Acceptance Criteria**:
- [ ] Scatter plot calls n8n webhook on mount
- [ ] Loading animation shows while waiting for n8n
- [ ] Logos fly to positions after n8n returns
- [ ] Error message shows if n8n fails
- [ ] Auto-retry works (2 attempts with backoff)
- [ ] Manual retry button works
- [ ] Positioning data cached in localStorage

---

### Phase 5: Testing & Polish (Days 6-7)

**Goal**: Comprehensive testing and bug fixes.

**Tasks**:
- [ ] Test with real project data
  - 6 vendors (typical scenario)
  - 3 vendors (minimum)
  - 10+ vendors (stress test - collision detection)
- [ ] Test edge cases
  - All vendors positioned in same spot (collision detection)
  - Vendors at chart edges (edge constraints)
  - Vendors with no logos (fallback to initials)
- [ ] Test error scenarios
  - n8n timeout (60s)
  - n8n validation error (400)
  - n8n processing error (500)
  - Network offline
- [ ] Test caching behavior
  - Cache hit (instant load)
  - Cache miss (n8n call)
  - Cache invalidation (vendor list changes)
- [ ] Test mobile experience
  - Touch interactions (tap to select)
  - Long-press behavior (future: show details tooltip)
  - Square layout rendering
  - Smaller logo sizes
- [ ] Cross-browser testing
  - Chrome (desktop + mobile)
  - Safari (desktop + mobile)
  - Firefox (desktop)
- [ ] Performance testing
  - Measure animation FPS
  - Measure n8n response time
  - Measure collision detection performance (10+ vendors)
- [ ] Accessibility review
  - Keyboard navigation (disabled per requirements)
  - Screen reader compatibility (not prioritized)
  - Color contrast for axis labels

**Acceptance Criteria**:
- [ ] All edge cases handled gracefully
- [ ] No console errors or warnings
- [ ] Smooth performance on all browsers
- [ ] Mobile experience polished
- [ ] Caching works reliably
- [ ] Error messages are clear and actionable

---

## Testing Strategy

### Unit Tests (Vitest)

**File**: `src/utils/scatterPlotPositioning.test.ts`

**Test Cases**:
- [ ] `normalizeCoordinates()` - Maps 0-100 scores to pixel coordinates correctly
- [ ] `detectCollisions()` - Identifies overlapping logos within minimum distance
- [ ] `adjustPositions()` - Nudges colliding logos apart
- [ ] `enforceEdgeConstraints()` - Keeps logos within chart bounds
- [ ] `calculateDistance()` - Computes distance between two points

**File**: `src/hooks/useVendorScatterplot.test.ts`

**Test Cases**:
- [ ] Returns cached positions if available
- [ ] Calls n8n service if cache miss
- [ ] Handles n8n success response
- [ ] Handles n8n error response
- [ ] Implements auto-retry logic (2 attempts)
- [ ] Exposes manual refetch function

### Integration Tests (React Testing Library)

**File**: `src/components/vendor-discovery/VendorPositioningScatterPlot.test.tsx`

**Test Cases**:
- [ ] Renders loading state initially
- [ ] Shows circling logos during load
- [ ] Renders scatter plot after data loads
- [ ] Handles logo click (toggles selection)
- [ ] Synchronizes with selectedVendorIds prop
- [ ] Shows error message on failure
- [ ] Shows retry button on error
- [ ] Caches positioning data

### E2E Tests (Playwright)

**File**: `test/e2e/vendor-positioning.spec.ts`

**Test Scenarios**:
- [ ] **Happy Path**: User navigates to Vendor Selection → Scatter plot loads → Logos fly to positions → User clicks logo to select
- [ ] **Selection Sync**: User selects vendor card → Scatter plot logo shows halo → User clicks scatter plot logo → Card checkbox updates
- [ ] **Error Recovery**: n8n fails → Error message shows → User clicks retry → Scatter plot loads successfully
- [ ] **Cache Hit**: User visits page twice → Second visit loads instantly from cache
- [ ] **Mobile**: User on mobile device → Square scatter plot renders → Tap logo to select → Visual feedback appears

---

## Success Criteria

### Functional Requirements
- [ ] Scatter plot renders with correct dimensions (rectangular desktop, square mobile)
- [ ] Vendor logos displayed in circular 66x66px containers
- [ ] Logos start circling in center during load
- [ ] Logos fly to final positions after n8n returns (1.2s animation)
- [ ] Selection state synchronized between scatter plot and vendor cards
- [ ] Blue halo appears around selected logos
- [ ] Selected logos appear on top (z-index)
- [ ] Collision detection prevents overlapping logos (min 80px distance)
- [ ] Axis labels always visible and correctly positioned
- [ ] n8n webhook returns positioning data within 60 seconds
- [ ] Auto-retry on failure (2 attempts, exponential backoff)
- [ ] Manual retry button on error
- [ ] Positioning data cached in localStorage

### Non-Functional Requirements
- [ ] Animations run at 60fps on desktop
- [ ] Animations run smoothly on mid-range mobile devices (30fps minimum)
- [ ] n8n response time < 30 seconds (typical case)
- [ ] Cache hit loads scatter plot instantly (<100ms)
- [ ] No console errors or warnings
- [ ] TypeScript compilation succeeds with no errors
- [ ] All tests pass (unit, integration, E2E)

### User Experience Requirements
- [ ] Loading animation feels polished and intentional (not stuttery)
- [ ] Fly-to-position animation feels smooth and natural
- [ ] Click feedback is immediate (<50ms)
- [ ] Hover effects work on desktop (scale + shadow)
- [ ] Touch interactions work on mobile (tap to select)
- [ ] Error messages are clear and actionable
- [ ] Retry button is easily discoverable
- [ ] Scatter plot enhances understanding (not confusing)

---

## Risks and Mitigations

### Risk 1: Performance with 10+ Vendors
**Severity**: Medium
**Likelihood**: Medium

**Description**: Collision detection and animation performance may degrade with many vendors.

**Mitigation**:
- Optimize collision detection algorithm (spatial hashing if needed)
- Limit maximum vendors displayed (e.g., 12 max)
- Use `will-change: transform` CSS for logo animations
- Test with 15 vendors during development

---

### Risk 2: n8n Positioning Quality
**Severity**: High
**Likelihood**: Medium

**Description**: AI may position all vendors in center (40-60 range), reducing visual value.

**Mitigation**:
- Improve AI prompt with explicit spread instructions
- Add prompt examples showing good distribution
- Consider post-processing to force spread (e.g., normalize to full 0-100 range)
- Monitor positioning quality in production, iterate on prompt

---

### Risk 3: Logo Availability
**Severity**: Low
**Likelihood**: High

**Description**: Many vendors may not have logos available.

**Mitigation**:
- Implement fallback: Vendor initials in colored circle (consistent with vendor card design)
- Use avatar color scheme: Hash vendor name → deterministic color
- Test with all vendors having no logos

---

### Risk 4: Mobile Touch Interactions
**Severity**: Medium
**Likelihood**: Low

**Description**: Touch interactions may feel laggy or unresponsive on mobile.

**Mitigation**:
- Use `touch-action: manipulation` CSS for logos
- Implement immediate visual feedback on touchstart (don't wait for touchend)
- Test on real mobile devices (iOS Safari, Chrome Android)
- Consider adding haptic feedback (vibration) on tap

---

### Risk 5: Cache Invalidation
**Severity**: Low
**Likelihood**: Medium

**Description**: Cached positioning data may become stale if vendor descriptions change.

**Mitigation**:
- Include vendor array hash in cache key: `vendor_scatterplot_positions_{projectId}_{vendorHash}`
- Compare vendor list on mount: if different, clear cache and re-fetch
- Add manual "Refresh Positioning" button (icon in scatter plot corner)

---

## Post-Sprint Updates

**Actual Completion**: TBD
**Features Delivered**: TBD
**Carry Over**: TBD
**Retrospective Notes**: TBD

---

## Related Documentation

- **ARCHITECTURE.md**: System architecture and n8n integration patterns
- **CODEBASE_STRUCTURE.md**: Component organization and file structure
- **PROJECT_ROADMAP.md**: Sprint history and future planning
- **GL-TDD.md**: Test-driven development guidelines (Phase 1 testing requirements)
- **DESIGN_GUIDELINES.md**: Visual design system and brand guidelines

---

**Last Updated**: January 11, 2026
**Version**: 1.0
**Status**: 🟢 Ready for Implementation
