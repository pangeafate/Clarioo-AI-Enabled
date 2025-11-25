# Sprint 015: Vendor Comparison Matrix with Wave Charts

**Sprint ID**: SP_015
**Sprint Name**: Vendor Comparison Matrix with Wave Charts
**Duration**: 5-7 days (32-40 hours)
**Status**: ✅ Complete (Completed: November 18, 2024)
**Priority**: High
**Type**: New Feature - Step 4 Vendor Comparison

---

## Executive Summary

Sprint 015 implements the Step 4 Vendor Comparison screen, featuring an innovative visual comparison matrix with continuous wave charts that span vertically across criteria categories. This mobile-first design allows users to compare 3 vendors on mobile (5 on desktop) across multiple evaluation criteria, with smooth Catmull-Rom spline interpolation creating fluid wave patterns that represent match levels (0-100) for each criterion. Users can independently cycle through a vendor queue using arrow buttons, expand vendor details, modify criteria weights, and visualize comparative strengths through color-coded charts.

---

## Problem Statement

### Current State
- Step 3 (Vendor Selection) allows users to select vendors from AI-generated recommendations
- Step 2 (Criteria Builder) defines evaluation criteria organized by categories
- **Gap**: No visual comparison tool to evaluate selected vendors against criteria
- **Gap**: No mechanism to see relative strengths/weaknesses across multiple vendors
- **Gap**: No interactive way to adjust comparison by modifying criteria or switching vendors

### Desired State
- Users can visually compare 3 vendors (mobile) or 5 vendors (desktop) side-by-side
- Each vendor displays as a continuous wave chart showing match levels (0-100) per criterion
- Charts use Catmull-Rom spline interpolation for smooth, professional visualization
- Users can independently switch vendors in each slot using arrow navigation
- Expandable vendor cards show executive summary, AHA feature, and killer features
- Criteria can be modified (weight/importance) or added via CriterionEditSidebar
- Categories can be collapsed/expanded to focus on specific evaluation areas
- Color-coded charts (pastel palette) maintain vendor identity across the interface

---

## User Stories

### Primary User Stories (Must Have - Sprint 015)

**US-015-01**: As a user, I want to see 3 vendors compared side-by-side on mobile so I can evaluate options on any device
**Acceptance Criteria**:
- Mobile displays 3 vendor cards stacked vertically
- Each vendor card shows: company name, logo, match %, info button, remove button
- Info button expands to show: executive summary, AHA feature, killer features
- Vendor cards remain visible when scrolling matrix below
- Match percentage reflects overall vendor score across all criteria

**US-015-02**: As a user, I want to switch vendors independently using arrow buttons so I can explore all candidates
**Acceptance Criteria**:
- Each vendor card has left/right arrow buttons
- Clicking right arrow cycles to next vendor in queue (wraps to first)
- Clicking left arrow cycles to previous vendor in queue (wraps to last)
- Queue counter shows current position (e.g., "3 of 8")
- Other vendor slots remain unchanged when switching one vendor
- Chart colors update automatically when vendor changes
- Smooth fade transition (300ms) when switching vendors

**US-015-03**: As a user, I want to see wave charts for each vendor across criteria so I can visualize comparative strengths
**Acceptance Criteria**:
- Each vendor displays as vertical wave chart in their swimlane
- Chart uses Catmull-Rom spline interpolation for smooth curves
- Chart spans vertically across all criteria in a category
- Each criterion creates a point on the chart (0-100 horizontal position)
- Chart filled with solid color matching vendor's assigned color
- Low match (0-33) positions point on left, Medium (34-66) center, High (67-100) right
- Charts update automatically when criteria weights change

**US-015-04**: As a user, I want to modify criteria directly from the comparison matrix so I can refine my evaluation
**Acceptance Criteria**:
- Clicking criterion card on left opens CriterionEditSidebar (from SP_012)
- Can adjust criterion weight and importance
- Can remove criterion from comparison
- Charts recalculate and animate to new positions after modification
- Category accordion remains in same state during modification

**US-015-05**: As a user, I want to collapse/expand criterion categories so I can focus on specific evaluation areas
**Acceptance Criteria**:
- Categories default to first category expanded, others collapsed
- Click category header to toggle expand/collapse
- Single button (icon only) to collapse all / expand all
- Collapsed categories hide all criteria and charts in that section
- Vendor cards always remain visible at top
- Smooth animation (400ms) for expand/collapse transitions

**US-015-06**: As a user, I want to add new criteria to the comparison so I can evaluate additional factors
**Acceptance Criteria**:
- Placeholder card appears after last criterion in each category
- Clicking placeholder opens dialog to add new criterion
- New criterion gets default match levels (50/100) for all vendors
- Option to "Recalculate with AI" initiates AI simulation for accurate scores
- AI simulation shows loading state and updates all vendor charts
- Charts animate to new positions after criterion added

**US-015-07**: As a desktop user, I want to see 5 vendors compared simultaneously so I can evaluate more options at once
**Acceptance Criteria**:
- Desktop (≥1024px) displays 5 vendor cards horizontally
- Each vendor card positioned above its swimlane column
- All 5 charts visible simultaneously without horizontal scroll
- Each vendor has independent left/right navigation arrows
- Vendor expansion pushes content down (not horizontal)
- Charts maintain aspect ratio and smoothness across screen sizes

---

## Technical Approach

### Architecture Overview

```
VendorComparison.tsx (Main Container - 200 lines)
├── VendorComparisonHeader.tsx (Controls - 80 lines)
│   ├── Collapse All / Expand All button
│   └── Navigation breadcrumb (optional)
├── VendorCardRow.tsx (Mobile: Stack, Desktop: Row - 150 lines)
│   ├── VendorCard.tsx (Individual card - 180 lines) × 3 (mobile) or 5 (desktop)
│   │   ├── Company name, logo, match %
│   │   ├── Left/Right arrow buttons with queue counter
│   │   ├── Info button → VendorExpansion.tsx
│   │   └── Remove button
│   └── VendorExpansion.tsx (Expandable details - 100 lines)
│       ├── Executive summary
│       ├── AHA feature highlight
│       └── Killer features list
├── ComparisonMatrix.tsx (Scrollable matrix - 200 lines)
│   └── CategorySection.tsx (Per category - 150 lines) × N categories
│       ├── CategoryHeader.tsx (Collapsible header - 60 lines)
│       ├── CriteriaColumn.tsx (Left side - 120 lines)
│       │   ├── CriterionCard.tsx (Clickable card - from SP_012)
│       │   └── AddCriterionPlaceholder.tsx (40 lines)
│       └── ChartsGrid.tsx (Right side - 200 lines)
│           └── VendorWaveChart.tsx (SVG chart - 250 lines) × 3 or 5
│               ├── Catmull-Rom spline path generation
│               ├── Filled area with vendor color
│               └── Smooth transitions on data change
└── Hooks & Utilities
    ├── useVendorComparison.ts (State management - 200 lines)
    ├── useChartData.ts (Chart calculations - 150 lines)
    ├── useCatmullRom.ts (Spline interpolation - 100 lines)
    └── comparisonUtils.ts (Helper functions - 120 lines)
```

**Total Estimated Lines**: ~2,200 lines across 15+ new files

---

## Data Structures

### 1. Comparison Data JSON (`/src/data/comparison.json`)

```json
{
  "projectId": "proj_001",
  "vendors": [
    {
      "id": "vendor_001",
      "name": "Acme CRM Solutions",
      "logo": "/mockups/logos/acme.png",
      "overallMatch": 87,
      "executiveSummary": "Enterprise CRM platform with AI-powered lead scoring and customizable workflows designed for mid-to-large organizations.",
      "ahaFeature": {
        "title": "Predictive Lead Scoring",
        "description": "AI algorithm analyzes 50+ data points to predict conversion probability with 94% accuracy, automatically prioritizing high-value leads."
      },
      "killerFeatures": [
        "360° customer view with activity timeline",
        "Native mobile apps (iOS/Android) with offline sync",
        "Advanced reporting with custom dashboards",
        "Seamless integration with 200+ business tools"
      ],
      "criteriaScores": {
        "crit_001": 92,  // User-friendly interface
        "crit_002": 85,  // Mobile app quality
        "crit_003": 78,  // Integration capabilities
        "crit_004": 95,  // Reporting & analytics
        "crit_005": 88,  // Customization options
        "crit_006": 82,  // Data security
        "crit_007": 90,  // Customer support
        "crit_008": 75,  // Pricing transparency
        "crit_009": 88,  // Scalability
        "crit_010": 91   // User training resources
      }
    },
    {
      "id": "vendor_002",
      "name": "CloudConnect Pro",
      "logo": "/mockups/logos/cloudconnect.png",
      "overallMatch": 79,
      "executiveSummary": "Cloud-native CRM with focus on real-time collaboration and automated workflows for distributed teams.",
      "ahaFeature": {
        "title": "Real-Time Team Collaboration",
        "description": "Live co-editing of customer records with instant notifications, activity streams, and @mentions for seamless team coordination."
      },
      "killerFeatures": [
        "Real-time collaborative editing",
        "Automated workflow builder (no-code)",
        "Built-in video calling and screen sharing",
        "Advanced permission controls and audit logs"
      ],
      "criteriaScores": {
        "crit_001": 88,
        "crit_002": 72,
        "crit_003": 91,
        "crit_004": 76,
        "crit_005": 84,
        "crit_006": 94,
        "crit_007": 81,
        "crit_008": 69,
        "crit_009": 85,
        "crit_010": 78
      }
    },
    {
      "id": "vendor_003",
      "name": "SalesForce Lite",
      "logo": "/mockups/logos/salesforce-lite.png",
      "overallMatch": 84,
      "executiveSummary": "Simplified CRM platform designed for small-to-medium businesses seeking enterprise features without complexity.",
      "ahaFeature": {
        "title": "One-Click Setup Templates",
        "description": "Industry-specific templates (Real Estate, Healthcare, Finance) with pre-configured workflows, fields, and automations - ready in under 5 minutes."
      },
      "killerFeatures": [
        "Pre-built industry templates",
        "Simple drag-and-drop customization",
        "Affordable tiered pricing ($29-$99/user/month)",
        "Free onboarding and training"
      ],
      "criteriaScores": {
        "crit_001": 95,
        "crit_002": 81,
        "crit_003": 74,
        "crit_004": 82,
        "crit_005": 79,
        "crit_006": 87,
        "crit_007": 93,
        "crit_008": 91,
        "crit_009": 77,
        "crit_010": 86
      }
    },
    {
      "id": "vendor_004",
      "name": "IntegraMax CRM",
      "logo": "/mockups/logos/integramax.png",
      "overallMatch": 76,
      "executiveSummary": "Integration-first CRM platform with 500+ pre-built connectors and open API for custom integrations.",
      "ahaFeature": {
        "title": "Universal Data Sync",
        "description": "Bi-directional sync with any data source using visual mapper - connects CRM, email, calendar, accounting, and marketing tools in real-time."
      },
      "killerFeatures": [
        "500+ pre-built integrations",
        "Visual data mapping tool (no-code)",
        "Webhook automation builder",
        "Custom API with comprehensive docs"
      ],
      "criteriaScores": {
        "crit_001": 74,
        "crit_002": 68,
        "crit_003": 98,
        "crit_004": 79,
        "crit_005": 86,
        "crit_006": 83,
        "crit_007": 72,
        "crit_008": 77,
        "crit_009": 88,
        "crit_010": 75
      }
    },
    {
      "id": "vendor_005",
      "name": "CustomerHub 360",
      "logo": "/mockups/logos/customerhub.png",
      "overallMatch": 81,
      "executiveSummary": "Customer-centric CRM with emphasis on relationship management, customer journey tracking, and retention analytics.",
      "ahaFeature": {
        "title": "Customer Journey Mapping",
        "description": "Visual timeline tracking every customer interaction across channels (email, phone, chat, social) with AI-powered sentiment analysis and churn prediction."
      },
      "killerFeatures": [
        "360° customer journey visualization",
        "Sentiment analysis on all interactions",
        "Churn prediction with ML",
        "Automated retention campaigns"
      ],
      "criteriaScores": {
        "crit_001": 86,
        "crit_002": 79,
        "crit_003": 82,
        "crit_004": 93,
        "crit_005": 81,
        "crit_006": 89,
        "crit_007": 85,
        "crit_008": 73,
        "crit_009": 84,
        "crit_010": 88
      }
    },
    {
      "id": "vendor_006",
      "name": "QuickStart CRM",
      "logo": "/mockups/logos/quickstart.png",
      "overallMatch": 72,
      "executiveSummary": "Budget-friendly CRM for startups and small teams prioritizing ease of use and quick deployment.",
      "ahaFeature": {
        "title": "5-Minute Onboarding",
        "description": "Guided setup wizard with smart defaults, automatic data import from spreadsheets, and instant team invitations - fully operational in 5 minutes."
      },
      "killerFeatures": [
        "Import from Excel/CSV in one click",
        "Free plan for up to 3 users",
        "Mobile-first responsive design",
        "24/7 chat support included"
      ],
      "criteriaScores": {
        "crit_001": 91,
        "crit_002": 85,
        "crit_003": 65,
        "crit_004": 71,
        "crit_005": 68,
        "crit_006": 78,
        "crit_007": 88,
        "crit_008": 94,
        "crit_009": 69,
        "crit_010": 82
      }
    },
    {
      "id": "vendor_007",
      "name": "EnterpriseFlow CRM",
      "logo": "/mockups/logos/enterpriseflow.png",
      "overallMatch": 89,
      "executiveSummary": "Enterprise-grade CRM platform with advanced security, compliance certifications, and dedicated support for Fortune 500 organizations.",
      "ahaFeature": {
        "title": "Compliance Suite",
        "description": "Built-in GDPR, HIPAA, SOC 2 compliance tools with automated audit trails, data residency controls, and right-to-be-forgotten workflows."
      },
      "killerFeatures": [
        "GDPR, HIPAA, SOC 2 certified",
        "Advanced role-based permissions",
        "Dedicated success manager",
        "99.99% uptime SLA"
      ],
      "criteriaScores": {
        "crit_001": 82,
        "crit_002": 76,
        "crit_003": 87,
        "crit_004": 96,
        "crit_005": 92,
        "crit_006": 99,
        "crit_007": 94,
        "crit_008": 71,
        "crit_009": 97,
        "crit_010": 89
      }
    },
    {
      "id": "vendor_008",
      "name": "SmartSales AI",
      "logo": "/mockups/logos/smartsales.png",
      "overallMatch": 85,
      "executiveSummary": "AI-powered CRM leveraging machine learning for predictive analytics, automated data entry, and intelligent recommendations.",
      "ahaFeature": {
        "title": "AI Sales Assistant",
        "description": "Virtual assistant that auto-logs emails, suggests next actions, predicts deal close probability, and generates personalized outreach templates."
      },
      "killerFeatures": [
        "Auto-logging of emails and calls",
        "AI-powered deal scoring",
        "Personalized email templates",
        "Voice-to-text note capture"
      ],
      "criteriaScores": {
        "crit_001": 89,
        "crit_002": 83,
        "crit_003": 80,
        "crit_004": 91,
        "crit_005": 87,
        "crit_006": 85,
        "crit_007": 79,
        "crit_008": 76,
        "crit_009": 86,
        "crit_010": 92
      }
    }
  ],
  "categories": [
    {
      "id": "cat_feature",
      "name": "Feature",
      "criteria": [
        {
          "id": "crit_001",
          "name": "User-friendly interface",
          "explanation": "Intuitive navigation, clean design, minimal learning curve for new users.",
          "importance": "high",
          "weight": 10
        },
        {
          "id": "crit_002",
          "name": "Mobile app quality",
          "explanation": "Native mobile apps with full functionality, offline sync, and responsive performance.",
          "importance": "high",
          "weight": 9
        },
        {
          "id": "crit_003",
          "name": "Integration capabilities",
          "explanation": "Seamless connections with popular business tools (email, calendar, marketing platforms).",
          "importance": "medium",
          "weight": 8
        }
      ]
    },
    {
      "id": "cat_technical",
      "name": "Technical",
      "criteria": [
        {
          "id": "crit_004",
          "name": "Reporting & analytics",
          "explanation": "Comprehensive reporting tools, customizable dashboards, data export options.",
          "importance": "high",
          "weight": 9
        },
        {
          "id": "crit_005",
          "name": "Customization options",
          "explanation": "Ability to tailor fields, workflows, and UI to match specific business processes.",
          "importance": "medium",
          "weight": 7
        },
        {
          "id": "crit_006",
          "name": "Data security",
          "explanation": "Encryption at rest/transit, compliance certifications, access controls, audit logs.",
          "importance": "high",
          "weight": 10
        }
      ]
    },
    {
      "id": "cat_business",
      "name": "Business",
      "criteria": [
        {
          "id": "crit_007",
          "name": "Customer support",
          "explanation": "Availability of support channels (chat, phone, email), response times, quality of help.",
          "importance": "high",
          "weight": 8
        },
        {
          "id": "crit_008",
          "name": "Pricing transparency",
          "explanation": "Clear pricing structure, no hidden fees, flexible plans to match business size.",
          "importance": "medium",
          "weight": 7
        },
        {
          "id": "crit_009",
          "name": "Scalability",
          "explanation": "Platform can grow with business needs, handles increasing users and data volume.",
          "importance": "high",
          "weight": 9
        },
        {
          "id": "crit_010",
          "name": "User training resources",
          "explanation": "Onboarding programs, documentation, video tutorials, certification courses.",
          "importance": "medium",
          "weight": 6
        }
      ]
    }
  ],
  "metadata": {
    "generatedAt": "2024-11-15T10:00:00Z",
    "projectName": "CRM Software Evaluation",
    "totalVendors": 8,
    "totalCriteria": 10
  }
}
```

### 2. TypeScript Interfaces

```typescript
// /src/types/comparison.types.ts

export interface VendorComparison {
  projectId: string;
  vendors: VendorDetail[];
  categories: CriterionCategory[];
  metadata: ComparisonMetadata;
}

export interface VendorDetail {
  id: string;
  name: string;
  logo: string;
  overallMatch: number; // 0-100
  executiveSummary: string;
  ahaFeature: AhaFeature;
  killerFeatures: string[];
  criteriaScores: Record<string, number>; // criterionId → score (0-100)
}

export interface AhaFeature {
  title: string;
  description: string;
}

export interface CriterionCategory {
  id: string;
  name: string;
  criteria: Criterion[];
}

export interface Criterion {
  id: string;
  name: string;
  explanation: string;
  importance: 'low' | 'medium' | 'high';
  weight: number; // 1-10
}

export interface ComparisonMetadata {
  generatedAt: string;
  projectName: string;
  totalVendors: number;
  totalCriteria: number;
}

// Chart-specific interfaces
export interface ChartPoint {
  criterionId: string;
  value: number; // 0-100
  x: number; // SVG x coordinate
  y: number; // SVG y coordinate
}

export interface WaveChartData {
  vendorId: string;
  color: string;
  points: ChartPoint[];
  pathData: string; // SVG path string
}

// UI State interfaces
export interface VendorSlot {
  slotIndex: number; // 0-2 (mobile) or 0-4 (desktop)
  vendorId: string;
  color: string;
  isExpanded: boolean;
}

export interface CategoryState {
  categoryId: string;
  isExpanded: boolean;
}
```

---

## Component Specifications

### 1. VendorComparison.tsx (Main Container)

**Responsibility**: Orchestrate entire comparison view, manage vendor slots, handle navigation

**Props**: None (loads data from JSON, future: from route params)

**State**:
```typescript
const [comparisonData, setComparisonData] = useState<VendorComparison | null>(null);
const [vendorSlots, setVendorSlots] = useState<VendorSlot[]>([]);
const [categoryStates, setCategoryStates] = useState<CategoryState[]>([]);
const [vendorQueue, setVendorQueue] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

**Key Functions**:
- `loadComparisonData()`: Load from `/src/data/comparison.json`
- `initializeVendorSlots()`: Set initial 3 vendors with random colors
- `cycleVendor(slotIndex, direction)`: Switch vendor in specific slot
- `toggleVendorExpansion(slotIndex)`: Expand/collapse vendor details
- `toggleCategory(categoryId)`: Expand/collapse category
- `toggleAllCategories(expand)`: Collapse all / Expand all
- `removeVendor(slotIndex)`: Remove vendor from comparison
- `updateCriterion(criterionId, updates)`: Handle criterion modifications
- `addCriterion(categoryId, criterion)`: Add new criterion to category

**Layout**:
```tsx
<div className="vendor-comparison">
  <VendorComparisonHeader
    onToggleAll={toggleAllCategories}
  />

  <VendorCardRow
    vendors={vendorSlots}
    vendorQueue={vendorQueue}
    onCycleVendor={cycleVendor}
    onToggleExpansion={toggleVendorExpansion}
    onRemoveVendor={removeVendor}
  />

  <ComparisonMatrix
    categories={comparisonData.categories}
    categoryStates={categoryStates}
    vendorSlots={vendorSlots}
    onToggleCategory={toggleCategory}
    onUpdateCriterion={updateCriterion}
    onAddCriterion={addCriterion}
  />
</div>
```

---

### 2. VendorCard.tsx (Individual Vendor Card)

**Responsibility**: Display vendor info, handle navigation arrows, expansion toggle

**Props**:
```typescript
interface VendorCardProps {
  vendor: VendorDetail;
  slotIndex: number;
  currentIndex: number; // Position in queue
  totalVendors: number; // Total in queue
  color: string;
  isExpanded: boolean;
  onCycleVendor: (slotIndex: number, direction: 'left' | 'right') => void;
  onToggleExpansion: (slotIndex: number) => void;
  onRemoveVendor: (slotIndex: number) => void;
}
```

**Layout**:
```tsx
<div className="vendor-card" style={{ borderColor: color }}>
  {/* Header with navigation */}
  <div className="vendor-card-header">
    <button onClick={() => onCycleVendor(slotIndex, 'left')}>
      <ChevronLeft />
    </button>

    <div className="vendor-info">
      <img src={vendor.logo} alt={vendor.name} />
      <h3>{vendor.name}</h3>
      <div className="match-badge" style={{ backgroundColor: color }}>
        Match {vendor.overallMatch}%
      </div>
    </div>

    <button onClick={() => onCycleVendor(slotIndex, 'right')}>
      <ChevronRight />
    </button>
  </div>

  {/* Queue counter */}
  <div className="queue-counter">
    {currentIndex + 1} of {totalVendors}
  </div>

  {/* Actions */}
  <div className="vendor-actions">
    <button onClick={() => onToggleExpansion(slotIndex)}>
      <Info /> Details
    </button>
    <button onClick={() => onRemoveVendor(slotIndex)}>
      <X /> Remove
    </button>
  </div>

  {/* Expansion panel */}
  {isExpanded && (
    <VendorExpansion
      executiveSummary={vendor.executiveSummary}
      ahaFeature={vendor.ahaFeature}
      killerFeatures={vendor.killerFeatures}
    />
  )}
</div>
```

**Animations**:
- Fade transition (300ms) when switching vendors
- Smooth expand/collapse (400ms) for expansion panel
- Color change animation (200ms) when vendor switches

---

### 3. VendorWaveChart.tsx (SVG Wave Chart)

**Responsibility**: Render Catmull-Rom spline chart for one vendor across criteria

**Props**:
```typescript
interface VendorWaveChartProps {
  vendor: VendorDetail;
  criteria: Criterion[];
  color: string;
  categoryId: string;
  width: number; // SVG width
  height: number; // SVG height
}
```

**Key Functions**:
- `generateChartPoints()`: Convert criterion scores to SVG coordinates
- `calculateCatmullRomPath()`: Generate smooth spline path through points
- `getHorizontalPosition(score)`: Map score (0-100) to x-coordinate
- `getVerticalPosition(index, total)`: Map criterion index to y-coordinate

**Catmull-Rom Algorithm**:
```typescript
// useCatmullRom.ts
function catmullRomSpline(points: ChartPoint[], tension: number = 0.5): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}
```

**Layout**:
```tsx
<svg width={width} height={height} className="vendor-wave-chart">
  <defs>
    <linearGradient id={`gradient-${vendor.id}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity="0.8" />
      <stop offset="100%" stopColor={color} stopOpacity="0.3" />
    </linearGradient>
  </defs>

  {/* Filled area */}
  <path
    d={chartData.pathData + ` L ${width} ${height} L 0 ${height} Z`}
    fill={`url(#gradient-${vendor.id})`}
    className="chart-fill"
  />

  {/* Chart line */}
  <path
    d={chartData.pathData}
    stroke={color}
    strokeWidth="3"
    fill="none"
    className="chart-line"
  />

  {/* Optional: Criterion points */}
  {chartData.points.map((point, idx) => (
    <circle
      key={idx}
      cx={point.x}
      cy={point.y}
      r="4"
      fill={color}
      className="chart-point"
    />
  ))}
</svg>
```

**Responsive Sizing**:
- Mobile: Full width of container, height = 50px per criterion
- Desktop: 1/5th of container width, same height calculation
- Maintains smooth curves across all screen sizes

---

### 4. CategorySection.tsx (Criterion Category)

**Responsibility**: Display category header, criteria list, and vendor charts

**Props**:
```typescript
interface CategorySectionProps {
  category: CriterionCategory;
  isExpanded: boolean;
  vendorSlots: VendorSlot[];
  onToggle: (categoryId: string) => void;
  onUpdateCriterion: (criterionId: string, updates: Partial<Criterion>) => void;
  onAddCriterion: (categoryId: string, criterion: Criterion) => void;
}
```

**Layout**:
```tsx
<div className="category-section">
  {/* Header */}
  <CategoryHeader
    category={category}
    isExpanded={isExpanded}
    onToggle={onToggle}
  />

  {/* Content (collapsed = hidden) */}
  {isExpanded && (
    <div className="category-content">
      {/* Left: Criteria column */}
      <CriteriaColumn
        criteria={category.criteria}
        categoryId={category.id}
        onUpdateCriterion={onUpdateCriterion}
        onAddCriterion={onAddCriterion}
      />

      {/* Right: Charts grid */}
      <ChartsGrid
        vendorSlots={vendorSlots}
        category={category}
      />
    </div>
  )}
</div>
```

**Animation**:
- Smooth height transition (400ms) on expand/collapse
- Fade in/out (300ms) for chart visibility

---

### 5. CriteriaColumn.tsx (Left-side Criteria List)

**Responsibility**: Display criterion cards, handle clicks to edit

**Props**:
```typescript
interface CriteriaColumnProps {
  criteria: Criterion[];
  categoryId: string;
  onUpdateCriterion: (criterionId: string, updates: Partial<Criterion>) => void;
  onAddCriterion: (categoryId: string, criterion: Criterion) => void;
}
```

**State**:
```typescript
const [selectedCriterion, setSelectedCriterion] = useState<Criterion | null>(null);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
```

**Layout**:
```tsx
<div className="criteria-column">
  {criteria.map((criterion) => (
    <CriterionCard
      key={criterion.id}
      criterion={criterion}
      onClick={() => {
        setSelectedCriterion(criterion);
        setIsSidebarOpen(true);
      }}
    />
  ))}

  <AddCriterionPlaceholder onClick={handleAddCriterion} />

  {/* Reuse from SP_012 */}
  {isSidebarOpen && selectedCriterion && (
    <CriterionEditSidebar
      criterion={selectedCriterion}
      onSave={(updates) => {
        onUpdateCriterion(selectedCriterion.id, updates);
        setIsSidebarOpen(false);
      }}
      onClose={() => setIsSidebarOpen(false)}
    />
  )}
</div>
```

---

### 6. ChartsGrid.tsx (Right-side Charts)

**Responsibility**: Render vendor wave charts side-by-side

**Props**:
```typescript
interface ChartsGridProps {
  vendorSlots: VendorSlot[];
  category: CriterionCategory;
}
```

**Layout (Mobile)**:
```tsx
<div className="charts-grid charts-grid-mobile">
  {vendorSlots.map((slot) => (
    <div key={slot.slotIndex} className="chart-column">
      <VendorWaveChart
        vendor={getVendorById(slot.vendorId)}
        criteria={category.criteria}
        color={slot.color}
        categoryId={category.id}
        width={containerWidth}
        height={50 * category.criteria.length}
      />
    </div>
  ))}
</div>
```

**Layout (Desktop)**:
```tsx
<div className="charts-grid charts-grid-desktop">
  {vendorSlots.map((slot) => (
    <div key={slot.slotIndex} className="chart-column">
      <VendorWaveChart
        vendor={getVendorById(slot.vendorId)}
        criteria={category.criteria}
        color={slot.color}
        categoryId={category.id}
        width={containerWidth / 5}
        height={50 * category.criteria.length}
      />
    </div>
  ))}
</div>
```

---

## Color Palette

### Pastel Color System (10 colors for queue rotation)

```typescript
// /src/utils/comparisonUtils.ts

export const VENDOR_COLORS = [
  '#A8D5BA', // Soft mint green
  '#FFB4A2', // Soft coral
  '#B4C7E7', // Soft periwinkle blue
  '#F7CAC9', // Soft rose pink
  '#C5B9E0', // Soft lavender
  '#FFE5B4', // Soft peach
  '#B2D8D8', // Soft teal
  '#E6C9A8', // Soft tan
  '#D5A6BD', // Soft mauve
  '#A8C5A8', // Soft sage
];

export function assignVendorColor(index: number): string {
  return VENDOR_COLORS[index % VENDOR_COLORS.length];
}

export function getRandomVendorColors(count: number): string[] {
  const shuffled = [...VENDOR_COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

---

## Responsive Breakpoints

### Mobile (< 768px)
- 3 vendor cards stacked vertically
- Each card full width
- Charts stacked vertically below cards
- Criteria column: 40% width, Charts: 60% width

### Tablet (768px - 1023px)
- 3 vendor cards in horizontal row
- Cards: 32% width each (with gaps)
- Charts side-by-side below cards
- Criteria column: 30% width, Charts: 70% width

### Desktop (≥ 1024px)
- 5 vendor cards in horizontal row
- Cards: 18% width each (with gaps)
- Charts side-by-side below cards
- Criteria column: 25% width, Charts: 75% width (5 equal columns)

---

## Implementation Phases

### Phase 1: Data & Core Setup (Day 1 - 8 hours)

**Tasks**:
1. Create `comparison.types.ts` with all TypeScript interfaces
2. Create `comparison.json` with 8 vendors, 3 categories, 10 criteria
3. Create `comparisonUtils.ts` with color assignment and helpers
4. Set up `VendorComparison.tsx` main container with data loading
5. Create `useVendorComparison.ts` hook for state management
6. Write tests for data loading and initial state

**Deliverables**:
- ✅ TypeScript types defined
- ✅ Mock data JSON created
- ✅ Main container component scaffolded
- ✅ Data loading functional
- ✅ Tests passing (data loading, color assignment)

**Definition of Done**:
- [ ] `comparison.json` has 8 vendors with complete data
- [ ] All TypeScript interfaces compile without errors
- [ ] `VendorComparison.tsx` loads and displays vendor count
- [ ] Color assignment works correctly
- [ ] Unit tests passing (≥80% coverage for utilities)

---

### Phase 2: Vendor Cards & Navigation (Day 2 - 8 hours)

**Tasks**:
1. Create `VendorCard.tsx` with layout and styling
2. Create `VendorCardRow.tsx` for responsive stacking
3. Implement left/right arrow navigation with queue cycling
4. Add queue counter display
5. Create `VendorExpansion.tsx` for expandable details
6. Implement expand/collapse animation
7. Add remove vendor functionality
8. Write tests for vendor navigation and expansion

**Deliverables**:
- ✅ Vendor cards display with name, logo, match %
- ✅ Arrow buttons cycle through vendor queue
- ✅ Queue counter shows position (e.g., "3 of 8")
- ✅ Expansion panel shows summary, AHA, killer features
- ✅ Remove button removes vendor from slot
- ✅ Smooth animations (300ms fade, 400ms expand)
- ✅ Tests passing (navigation, expansion, removal)

**Definition of Done**:
- [ ] 3 vendor cards display on mobile, 5 on desktop
- [ ] Independent navigation works for each vendor slot
- [ ] Expansion panel animates smoothly
- [ ] Remove button updates UI correctly
- [ ] Responsive layout works across breakpoints
- [ ] Tests passing (≥70% coverage for components)

---

### Phase 3: Wave Chart Rendering (Days 3-4 - 12 hours)

**Tasks**:
1. Create `useCatmullRom.ts` hook for spline calculations
2. Create `VendorWaveChart.tsx` SVG component
3. Implement chart point generation from criterion scores
4. Implement Catmull-Rom spline path calculation
5. Add filled area with gradient
6. Add stroke line with vendor color
7. Create `useChartData.ts` hook for chart state
8. Implement responsive chart sizing
9. Add smooth transitions for data changes
10. Write tests for spline calculations and chart rendering

**Deliverables**:
- ✅ Catmull-Rom spline algorithm working correctly
- ✅ Charts render smoothly with proper interpolation
- ✅ Chart points positioned correctly (0-100 → x-coordinate)
- ✅ Filled area uses vendor color with gradient
- ✅ Charts span vertically across all criteria
- ✅ Responsive sizing works across breakpoints
- ✅ Smooth animations on data change (300ms)
- ✅ Tests passing (spline math, chart generation)

**Definition of Done**:
- [ ] Charts render with smooth Catmull-Rom curves
- [ ] Filled area displays with gradient (vendor color)
- [ ] Chart height = 50px per criterion
- [ ] Low (0-33), Medium (34-66), High (67-100) positioning works
- [ ] Charts update smoothly when vendors change
- [ ] Responsive sizing maintains smoothness
- [ ] Tests passing (≥80% coverage for chart logic)

---

### Phase 4: Comparison Matrix (Day 5 - 8 hours)

**Tasks**:
1. Create `CategorySection.tsx` with accordion behavior
2. Create `CategoryHeader.tsx` with toggle button
3. Create `CriteriaColumn.tsx` with criterion cards
4. Create `ChartsGrid.tsx` for side-by-side chart layout
5. Implement collapse/expand all functionality
6. Connect `CriterionEditSidebar` from SP_012
7. Implement criterion modification with chart recalculation
8. Add smooth expand/collapse animations
9. Write tests for category toggling and criterion editing

**Deliverables**:
- ✅ Categories display with collapsible headers
- ✅ First category expanded by default, others collapsed
- ✅ Collapse all / Expand all button functional
- ✅ Criterion cards clickable to open edit sidebar
- ✅ Charts grid displays vendor charts side-by-side
- ✅ Criterion modifications trigger chart recalculation
- ✅ Smooth animations (400ms expand/collapse)
- ✅ Tests passing (accordion, editing, recalculation)

**Definition of Done**:
- [ ] All categories render with correct criteria
- [ ] Accordion behavior works smoothly
- [ ] CriterionEditSidebar opens/closes correctly
- [ ] Criterion weight changes recalculate charts
- [ ] Charts animate to new positions (300ms)
- [ ] Collapsed categories hide all charts
- [ ] Tests passing (≥70% coverage for matrix logic)

---

### Phase 5: Add Criterion & Polish (Days 6-7 - 8 hours)

**Tasks**:
1. Create `AddCriterionPlaceholder.tsx` component
2. Create `AddCriterionDialog.tsx` for new criterion input
3. Implement default match levels (50/100) for new criteria
4. Add "Recalculate with AI" button with loading state
5. Implement AI simulation for accurate scores
6. Add chart animation for new criterion insertion
7. Polish animations, transitions, loading states
8. Final responsive testing across devices
9. Comprehensive testing of all interactions
10. Update documentation (PROGRESS.md, PROJECT_ROADMAP.md)

**Deliverables**:
- ✅ Add criterion placeholder visible in each category
- ✅ Add criterion dialog allows name, explanation, weight input
- ✅ New criterion gets default scores (50/100)
- ✅ AI recalculation button triggers loading state
- ✅ Charts animate when new criterion added
- ✅ All animations smooth and performant
- ✅ Loading states display correctly
- ✅ Responsive design perfect across all breakpoints
- ✅ Tests passing (≥80% overall coverage)
- ✅ Documentation updated

**Definition of Done**:
- [ ] Add criterion flow works end-to-end
- [ ] Default scores display correctly
- [ ] AI recalculation simulates realistic delay (2-3s)
- [ ] Charts update smoothly after recalculation
- [ ] No visual glitches or layout shifts
- [ ] Mobile (350px), Tablet (768px), Desktop (1024px+) tested
- [ ] All tests passing (≥80% coverage)
- [ ] PROGRESS.md and PROJECT_ROADMAP.md updated
- [ ] Sprint retrospective documented

---

## Test Strategy

### Unit Tests (Vitest)

**Utilities** (`comparisonUtils.test.ts`):
- Color assignment logic
- Queue cycling calculations
- Match percentage calculations
- Criterion score aggregation

**Hooks** (`useVendorComparison.test.ts`, `useCatmullRom.test.ts`, `useChartData.test.ts`):
- Vendor slot management
- Category state toggling
- Catmull-Rom spline calculations
- Chart point generation

**Expected Coverage**: 80%+ for utilities and hooks

### Component Tests (React Testing Library)

**Components**:
- `VendorCard.tsx`: Render, navigation, expansion, removal
- `VendorWaveChart.tsx`: Chart rendering, path generation, color application
- `CategorySection.tsx`: Accordion behavior, chart visibility
- `CriteriaColumn.tsx`: Criterion card clicks, sidebar opening

**Expected Coverage**: 70%+ for components

### Integration Tests (Optional for this sprint)

**Flows**:
- Load comparison → Display 3 vendors → Cycle vendor → Charts update
- Click criterion → Modify weight → Charts recalculate
- Expand category → Charts appear → Collapse → Charts disappear

---

## Dependencies

### New Dependencies (to install)

```json
{
  "dependencies": {
    // No new runtime dependencies needed
  },
  "devDependencies": {
    // Testing already set up in SP_008
  }
}
```

**Note**: All functionality can be built with existing dependencies (React, TypeScript, Tailwind, Framer Motion, shadcn/ui).

---

## File Structure

```
/src/components/vendor-discovery/
├── VendorComparison.tsx (Main container - 200 lines)
├── VendorCardRow.tsx (Responsive row/stack - 150 lines)
├── VendorCard.tsx (Individual card - 180 lines)
├── VendorExpansion.tsx (Expandable details - 100 lines)
├── ComparisonMatrix.tsx (Matrix container - 200 lines)
├── CategorySection.tsx (Category accordion - 150 lines)
├── CategoryHeader.tsx (Category header - 60 lines)
├── CriteriaColumn.tsx (Left criteria list - 120 lines)
├── ChartsGrid.tsx (Charts layout - 200 lines)
├── VendorWaveChart.tsx (SVG chart - 250 lines)
├── AddCriterionPlaceholder.tsx (40 lines)
└── AddCriterionDialog.tsx (120 lines)

/src/hooks/
├── useVendorComparison.ts (State management - 200 lines)
├── useCatmullRom.ts (Spline calculations - 100 lines)
└── useChartData.ts (Chart data generation - 150 lines)

/src/utils/
└── comparisonUtils.ts (Helper functions - 120 lines)

/src/types/
└── comparison.types.ts (TypeScript interfaces - 80 lines)

/src/data/
└── comparison.json (Mock data - 400 lines)

/test/unit/
├── comparisonUtils.test.ts (Utility tests - 150 lines)
├── useCatmullRom.test.ts (Spline tests - 120 lines)
├── useChartData.test.ts (Chart tests - 100 lines)
├── VendorCard.test.tsx (Component tests - 180 lines)
├── VendorWaveChart.test.tsx (Chart tests - 200 lines)
└── CategorySection.test.tsx (Accordion tests - 150 lines)
```

**Total New Files**: 24 files
**Total Estimated Lines**: ~3,000 lines (code + tests)

---

## Success Metrics

### Functional Requirements

- [ ] 3 vendors display on mobile (≤767px)
- [ ] 5 vendors display on desktop (≥1024px)
- [ ] Independent vendor navigation works in all slots
- [ ] Queue counter shows correct position
- [ ] Vendor expansion displays all required info
- [ ] Remove vendor updates UI correctly
- [ ] Wave charts render with Catmull-Rom splines
- [ ] Charts display correct match levels (0-100)
- [ ] Charts use vendor-specific colors from pastel palette
- [ ] Categories collapse/expand smoothly
- [ ] First category expanded by default
- [ ] Collapse all / Expand all button works
- [ ] Criterion cards open edit sidebar
- [ ] Criterion modifications recalculate charts
- [ ] Add criterion creates new criterion with defaults
- [ ] AI recalculation simulates loading state

### Performance Metrics

- [ ] Initial load < 2 seconds
- [ ] Vendor switch animation < 300ms
- [ ] Chart recalculation < 100ms
- [ ] Category expand/collapse < 400ms
- [ ] No layout shifts during animations
- [ ] Smooth 60fps animations on mobile

### Quality Metrics

- [ ] Build succeeds with 0 TypeScript errors
- [ ] All ESLint warnings resolved
- [ ] Test coverage ≥80% (utilities/hooks)
- [ ] Test coverage ≥70% (components)
- [ ] All tests passing (100% pass rate)
- [ ] No console errors during usage
- [ ] Responsive design works 350px - 1920px

---

## Risks & Mitigation

### Risk 1: Catmull-Rom Spline Complexity
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Start with simple linear interpolation, upgrade to Catmull-Rom in Phase 3
- Use well-tested algorithm from math libraries
- Create comprehensive unit tests for spline calculations
- Fallback to simple curves if performance issues arise

### Risk 2: Chart Performance with Multiple Vendors
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Use React.memo for VendorWaveChart to prevent unnecessary re-renders
- Debounce chart recalculations during criterion modifications
- Lazy load charts for collapsed categories
- Profile performance and optimize SVG rendering if needed

### Risk 3: Complex State Management
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- Use custom hook (useVendorComparison) to encapsulate all state logic
- Write comprehensive tests for state transitions
- Document state flow in sprint plan
- Consider Zustand/Redux if state becomes unmanageable

### Risk 4: Mobile Responsiveness with Charts
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Test on real devices early (iPhone SE, Android)
- Use responsive SVG viewBox instead of fixed dimensions
- Implement touch-friendly spacing (≥44px tap targets)
- Add horizontal scroll if charts too cramped

### Risk 5: Integration with Existing Components
**Probability**: Low
**Impact**: Low
**Mitigation**:
- Reuse CriterionEditSidebar from SP_012 as-is
- Match existing design system (colors, spacing, typography)
- Follow established patterns from VendorDiscovery.tsx
- Test integration with existing navigation

---

## Exit Criteria

### Must Have (Sprint Cannot Complete Without)

- [ ] All functional requirements met (16 items)
- [ ] All performance metrics met (6 items)
- [ ] All quality metrics met (7 items)
- [ ] Build succeeds with 0 errors
- [ ] Tests passing (≥80% utilities, ≥70% components)
- [ ] Responsive design works across all breakpoints
- [ ] Documentation updated (PROGRESS.md, PROJECT_ROADMAP.md)
- [ ] No regressions in existing features

### Should Have (Highly Desirable)

- [ ] AI recalculation simulation implemented
- [ ] Add criterion with default scores functional
- [ ] All 5 phases completed
- [ ] Animations smooth and performant
- [ ] Mobile testing on real devices

### Could Have (Nice to Have, Can Defer)

- [ ] Advanced chart interactions (hover tooltips)
- [ ] Export comparison to PDF/Excel
- [ ] Vendor comparison summary card
- [ ] Keyboard navigation for vendor cycling

---

## Next Steps After SP_015

### Immediate (Week After Sprint)

1. **User Testing**: Gather feedback on comparison visualization
2. **Performance Profiling**: Identify any bottlenecks with 8+ vendors
3. **Mobile Testing**: Test on various devices and screen sizes
4. **Documentation**: Create user guide for comparison features

### Short-term (Next Sprint)

1. **Step 5 Integration**: Connect to Vendor Invite (existing component)
2. **Enhanced AI**: Real AI-powered criterion scoring (replace mock)
3. **Export Features**: Export comparison matrix to Excel/PDF
4. **Sharing**: Share comparison via link

### Long-term (Future Sprints)

1. **Advanced Charts**: Interactive tooltips, zoom, pan
2. **Custom Scoring**: Allow users to define scoring formulas
3. **Comparison History**: Save and revisit past comparisons
4. **Collaborative Comparison**: Multi-user comparison sessions

---

## Appendix

### A. Catmull-Rom Spline Resources

- **Wikipedia**: https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
- **Algorithm Tutorial**: https://www.mvps.org/directx/articles/catmull/
- **SVG Path Reference**: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths

### B. Color Accessibility

All pastel colors must meet WCAG AA contrast ratio (4.5:1) against white background for text readability. Chart colors are decorative and don't require contrast compliance.

### C. Browser Compatibility

- **Target Browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **SVG Support**: All modern browsers support SVG path, fill, gradient
- **CSS Grid/Flexbox**: Full support in target browsers
- **Framer Motion**: React 18+ compatible

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-11-15 | System | Initial sprint plan created |

---

**Sprint Plan Status**: 📋 Ready for Execution
**Estimated Effort**: 32-40 hours (5-7 days)
**Prerequisites**: SP_012 complete (CriterionEditSidebar), SP_008 complete (Testing framework)
**Next Sprint**: SP_016 (Step 5 Integration & Export Features)

---

*This sprint plan follows GL-TDD (Test-Driven Development), GL-RDD (README-Driven Development), and project CLAUDE.md guidelines.*
