# Sprint 28: Template Management with n8n Migration (SP_028)

**Status**: 📋 PLANNED
**Type**: Feature Implementation + n8n Data Tables Integration + Complete Project Snapshots
**Estimated Duration**: 5-6 days (expanded scope: all 7 Excel tabs, template preview/browse)
**Priority**: HIGH
**Date**: TBD

---

## 🎯 Objective

Migrate project templates from static JSON files to n8n Data Tables with Excel upload/download functionality, admin-controlled template management, and usage analytics tracking.

**Core Goal**: Enable admin users to upload complete Excel projects as templates (all 7 tabs), store them in n8n Data Tables, and make them publicly available as browsable pre-populated project snapshots.

**CRITICAL SCOPE**: Templates are now **complete project snapshots**, not just criteria starters. All 7 Excel tabs become inputs, allowing users to browse fully populated projects including comparison matrices, battlecards, and executive summaries. Missing sections simply don't render.

---

## 📋 Current State Analysis

### Current Template Implementation (SP_021)
- **Storage**: Static JSON file (`/src/data/templates/templates.json`)
- **Templates**: 5 expert-validated templates
  - Luxury Fashion Retailer (CX Platform) - 21 criteria
  - B2B SaaS Company (CRM) - 14 criteria
  - Fast-Growing Tech Startup (ATS & Recruiting) - 15 criteria
  - Mid-Size Manufacturing Company (ERP) - 15 criteria
  - Digital Marketing Agency (Project Management) - 15 criteria
- **Categories**: Dynamic (users can create custom categories in CriteriaBuilder)
- **UI**: TemplatesModal with category filtering, TemplateCard components
- **Integration**: Templates → localStorage → Project (no n8n involvement)

### Current Template Structure
```json
{
  "templateId": "luxury-fashion-retailer-001",
  "category": "CX Platform",
  "companyType": "Luxury Fashion Retailer",
  "companyDetails": "30+ boutiques • E-commerce • Europe",
  "currentTool": "Not clearly specified",
  "painQuote": "Our tools don't give us a unified, luxury-grade view",
  "lookingFor": "Customer experience platform. Advanced clienteling...",
  "criteria": [
    {
      "id": "crit_001",
      "name": "Unified 360° Customer Profile",
      "explanation": "Platform provides a single, real-time customer profile...",
      "importance": "high",
      "type": "feature",
      "isArchived": false
    }
  ]
}
```

### Excel Export Structure (SP_027)
The current Excel export has 7 tabs - **ALL NOW BECOME TEMPLATE INPUTS**:
1. **INDEX** - Project metadata (name, category, company context, solution requirements, user info)
2. **1. Evaluation Criteria** - All criteria with importance/type
3. **2. Vendor List** - Vendors with logos and scatter plot
4. **3. Vendor Evaluation** - Comparison matrix with vendor scores
5. **4. Detailed Matching** - Evidence and sources per vendor-criterion
6. **5. Battlecards** - Vendor comparison categories (transposed layout)
7. **6. Pre-Demo Brief** - Executive summary with recommendations

**Template Upload Mapping → localStorage Keys**:
- **Tab 0 (INDEX)** → Project metadata in `clarioo_projects` + `workflow_{projectId}`
  - Extracts: projectName, category, companyContext, solutionRequirements, description
- **Tab 1 (Criteria)** → `workflow_{projectId}.criteria`
  - Data starts row 4: [#, Criterion, Explanation, Importance, Type]
- **Tab 2 (Vendors)** → `workflow_{projectId}.selectedVendors`
  - Data starts row 6: [#, Logo, Vendor, Description, Website]
- **Tab 3 (Comparison Matrix)** → `comparison_state_{projectId}`
  - Icon-based grid with category column, vendor scores
- **Tab 4 (Detailed Matching)** → `stage1_results_{projectId}` + `stage2_results_{projectId}`
  - Columns: Category, Vendor, Criterion, Status, Evidence, Sources
- **Tab 5 (Battlecards)** → `clarioo_battlecards_state_{projectId}`
  - Transposed: categories as rows, vendors as columns
- **Tab 6 (Pre-Demo Brief)** → `clarioo_executive_summary_{projectId}`
  - Structured: keyCriteria, vendorRecommendations, keyDifferentiators, riskFactors

**Important**: Tabs 0-2 are REQUIRED (project metadata, criteria, vendors). Tabs 3-6 are OPTIONAL (if missing, those sections won't render in the browsable template).

---

## 🎯 Sprint Requirements

### 1. Admin Mode Toggle System
**Location**: Bottom of project page (next to Testing mode toggle)

**Requirements**:
- 5-digit passcode: `71956`
- Toggle persists in localStorage (`clarioo_admin_mode`)
- When enabled:
  - "Upload Template Excel" button appears in TemplatesModal
  - Delete icons (🗑️) appear on template cards in TemplatesModal
- Toast notification on activation: "Admin mode activated"

**UI Placement**:
```
┌─────────────────────────────────────┐
│ VendorDiscovery Page                │
│ (project content)                   │
│                                     │
│                                     │
│                                     │
│ [Bottom Section]                    │
│ ┌───────────────┐ ┌───────────────┐│
│ │ Testing Mode  │ │ Admin Mode    ││
│ │ [OFF] [ON]    │ │ [🔒] [OFF]    ││
│ └───────────────┘ └───────────────┘│
└─────────────────────────────────────┘
```

### 2. Template Upload Functionality

**Upload Flow**:
1. Admin clicks "Upload Template Excel" in TemplatesModal
2. File picker opens (accept: `.xlsx, .xls`)
3. Frontend validates file
4. Send Excel file to n8n webhook (multipart/form-data)
5. n8n parses Excel → extracts criteria (Tab 1) & vendors (Tab 2, optional)
6. n8n validates structure
7. n8n saves to Data Table
8. Frontend receives success → refreshes template list
9. Toast: "Template uploaded successfully"

**Validation Rules** (Frontend + n8n):
- **Tabs 0-2 (REQUIRED)**:
  - Max 30 criteria per template
  - Max 20 vendors per template (if included)
  - Required fields: `projectName`, `category`, `lookingFor`, at least 1 criterion with valid structure
- **Tabs 3-6 (OPTIONAL)**:
  - No validation - parse if present, set to null if missing
  - Invalid/corrupted data in optional tabs → Skip that tab, continue upload
  - Partial templates (e.g., only criteria, no battlecards) are VALID

### 3. Template Deletion

**Delete Flow**:
1. Admin clicks delete icon (🗑️) on template card
2. Confirmation dialog: "Delete template '{templateName}'? This cannot be undone."
3. On confirm → DELETE request to n8n
4. n8n removes from Data Table
5. Frontend updates template list
6. Toast: "Template deleted"

**Safety**:
- Two-step confirmation (no accidental deletes)
- Cannot delete if template is currently being used by active projects (optional safeguard)

### 3a. Template Preview & Browse Behavior

**CRITICAL SCOPE CHANGE**: Templates are now **complete project snapshots** that users can browse before using.

**When User Clicks Template Card**:
1. Load complete template from n8n (all 7 tabs of data)
2. Open preview modal showing:
   - **Project Metadata** (from INDEX tab)
   - **Criteria List** (Tab 1) - Always visible
   - **Vendor List** (Tab 2) - If exists
   - **Comparison Matrix** (Tab 3) - If exists
   - **Battlecards** (Tab 5) - If exists
   - **Executive Summary** (Tab 6) - If exists
3. User can scroll through entire pre-populated project
4. "Use Template" button → Creates project with ALL localStorage keys populated

**Missing Data Handling**:
- Sections with null data → Don't render in preview
- Example: Template with only criteria + vendors → Shows criteria builder and vendor list, hides comparison/battlecards sections
- Template completeness indicator: Badge showing "Basic Template" vs "Complete Project Snapshot"

**UI Implications**:
- TemplatesModal → Shows template cards with completeness badges
- Template Preview Modal → New component showing full browsable project
- Navigation: When template used, navigate to appropriate step based on completeness

### 4. n8n Data Tables Schema

#### Table 1: `clarioo_templates`
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `template_id` | STRING (PK) | UUID | `tpl_550e8400-e29b-41d4-a716-446655440000` |
| `category` | STRING | Template category | `CX Platform` |
| `company_type` | STRING | Company description | `Luxury Fashion Retailer` |
| `company_details` | STRING | Company metadata | `30+ boutiques • E-commerce • Europe` |
| `company_context` | STRING (nullable) | Company context from INDEX tab | `Leading luxury fashion retailer...` |
| `solution_requirements` | STRING (nullable) | Solution requirements from INDEX | `Need unified customer view...` |
| `current_tool` | STRING (nullable) | Current tool pain | `Not clearly specified` |
| `pain_quote` | STRING (nullable) | Pain point quote | `Our tools don't give us...` |
| `looking_for` | STRING | Solution requirements | `Customer experience platform...` |
| `criteria` | JSON | Array of criteria objects (Tab 1) | `[{id, name, explanation, importance, type}]` |
| `vendors` | JSON (nullable) | Array of vendor objects (Tab 2) | `[{id, name, description, website}]` |
| `comparison_matrix` | JSON (nullable) | Comparison state from Tab 3 | `{criteria: {...}, vendors: {...}}` |
| `stage1_results` | JSON (nullable) | Detailed matching from Tab 4 | `{vendorCriteria: [...]}` |
| `stage2_results` | JSON (nullable) | Additional results from Tab 4 | `{...}` |
| `battlecards` | JSON (nullable) | Battlecards state from Tab 5 | `{rows: [...], categories: [...]}` |
| `executive_summary` | JSON (nullable) | Pre-Demo Brief from Tab 6 | `{keyCriteria: [...], recommendations: [...]}` |
| `created_at` | DATETIME | Upload timestamp | `2026-01-14T12:00:00Z` |
| `created_by` | STRING | User ID who uploaded | `user_550e8400-e29b-41d4-a716-446655440000` |
| `usage_count` | INTEGER | Number of times used | `45` |
| `is_active` | BOOLEAN | Soft delete flag | `true` |

#### Table 2: `clarioo_template_usage`
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `usage_id` | STRING (PK) | UUID | `usage_550e8400-e29b-41d4-a716-446655440000` |
| `template_id` | STRING (FK) | Template used | `tpl_550e8400-e29b-41d4-a716-446655440000` |
| `user_id` | STRING | User who used template | `user_550e8400-e29b-41d4-a716-446655440000` |
| `project_id` | STRING | Project created | `proj_550e8400-e29b-41d4-a716-446655440000` |
| `used_at` | DATETIME | When used | `2026-01-14T12:30:00Z` |

**Data Table Notes**:
- **Required fields**: `template_id`, `category`, `looking_for`, `criteria` (tabs 0-2)
- **Optional fields**: `comparison_matrix`, `stage1_results`, `stage2_results`, `battlecards`, `executive_summary` (tabs 3-6)
- All JSON fields must match localStorage structure exactly for seamless project restoration
- `vendors` JSON optional but recommended for complete template snapshots
- `usage_count` incremented on each template use (denormalized for performance)
- `is_active` allows soft delete (preserve usage history)
- Templates with partial data (e.g., only criteria, no battlecards) are valid - missing sections simply won't render

### 5. n8n Webhook Workflow Architecture

**Single Workflow**: `clarioo-template-manager`

**Endpoints**:
- Testing: `http://localhost:8080/webhook/template-manager-testing`
- Production: `https://n8n.lakestrom.com/webhook/template-manager-production`

**Operations** (determined by `action` field):

#### Operation 1: List Templates (`GET`)
**Request**: `GET /webhook/template-manager?action=list&category={category}`

**Query Params**:
- `action=list`
- `category` (optional): Filter by category, default: all

**Response**:
```json
{
  "success": true,
  "templates": [
    {
      "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
      "category": "CX Platform",
      "company_type": "Luxury Fashion Retailer",
      "looking_for": "Customer experience platform...",
      "criteria_count": 21,
      "vendor_count": 0,
      "usage_count": 45,
      "created_at": "2026-01-14T12:00:00Z"
    }
  ],
  "count": 5
}
```

**n8n Flow**:
1. Webhook Trigger (GET)
2. Input Validation (check `action=list`)
3. Data Tables: Read `clarioo_templates` (filter by category if provided, is_active=true)
4. Format response (exclude full criteria/vendors for list view)
5. Return success response

---

#### Operation 2: Get Single Template (`GET`)
**Request**: `GET /webhook/template-manager?action=get&template_id={id}`

**Query Params**:
- `action=get`
- `template_id` (required): Template ID

**Response**:
```json
{
  "success": true,
  "template": {
    "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
    "category": "CX Platform",
    "company_type": "Luxury Fashion Retailer",
    "company_details": "30+ boutiques • E-commerce • Europe",
    "current_tool": null,
    "pain_quote": "Our tools don't give us...",
    "looking_for": "Customer experience platform...",
    "criteria": [...],  // Full criteria array
    "vendors": [...],   // Full vendors array (if exists)
    "usage_count": 45,
    "created_at": "2026-01-14T12:00:00Z"
  }
}
```

**n8n Flow**:
1. Webhook Trigger (GET)
2. Input Validation (check `action=get`, `template_id`)
3. Data Tables: Read `clarioo_templates` WHERE template_id = {id}
4. Return full template object with criteria
5. Increment usage_count in tracking table

---

#### Operation 3: Upload Template (`POST`)
**Request**: `POST /webhook/template-manager`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `action=upload`
- `excel_file`: Excel file (binary)
- `user_id`: User ID who is uploading
- `category` (optional): Override category from Excel

**Response**:
```json
{
  "success": true,
  "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
  "message": "Template uploaded successfully",
  "criteria_count": 21,
  "vendor_count": 5
}
```

**Error Response** (validation failure):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Template exceeds maximum criteria count",
    "details": {
      "criteria_count": 35,
      "max_allowed": 30
    }
  }
}
```

**n8n Flow**:
1. Webhook Trigger (POST, multipart)
2. **Excel Parser Node** (convert Excel → JSON)
   - Read Tab 1 "1. Evaluation Criteria" → criteria array
   - Read Tab 2 "2. Vendor List" → vendors array (optional)
   - Extract project metadata (INDEX tab or infer)
3. **Input Validation Code Node**:
   ```javascript
   const criteria = items[0].json.criteria || [];
   const vendors = items[0].json.vendors || [];

   // Validate criteria count
   if (criteria.length > 30) {
     return [{
       json: {
         validation_error: true,
         error_code: 'CRITERIA_LIMIT_EXCEEDED',
         error_message: `Template has ${criteria.length} criteria. Maximum allowed: 30.`
       }
     }];
   }

   // Validate vendor count
   if (vendors.length > 20) {
     return [{
       json: {
         validation_error: true,
         error_code: 'VENDOR_LIMIT_EXCEEDED',
         error_message: `Template has ${vendors.length} vendors. Maximum allowed: 20.`
       }
     }];
   }

   // Validate required fields
   const errors = [];
   if (!items[0].json.looking_for) errors.push('looking_for is required');
   if (!items[0].json.category) errors.push('category is required');
   if (criteria.length === 0) errors.push('At least 1 criterion is required');

   // Validate criterion structure
   criteria.forEach((c, i) => {
     if (!c.name) errors.push(`Criterion ${i+1}: name is required`);
     if (!c.explanation) errors.push(`Criterion ${i+1}: explanation is required`);
     if (!['low', 'medium', 'high'].includes(c.importance)) {
       errors.push(`Criterion ${i+1}: importance must be low/medium/high`);
     }
   });

   if (errors.length > 0) {
     return [{
       json: {
         validation_error: true,
         error_code: 'INVALID_STRUCTURE',
         error_message: errors.join(', ')
       }
     }];
   }

   return [{
     json: {
       validation_error: false,
       ...items[0].json
     }
   }];
   ```
4. **If Node**: Check validation_error
   - TRUE → Return error response (400)
   - FALSE → Continue to save
5. **Generate Template ID Code Node**:
   ```javascript
   return [{
     json: {
       ...items[0].json,
       template_id: `tpl_${crypto.randomUUID()}`,
       created_at: new Date().toISOString(),
       usage_count: 0,
       is_active: true
     }
   }];
   ```
6. **Data Tables: Insert** into `clarioo_templates`
7. Return success response (200)

---

#### Operation 4: Delete Template (`DELETE`)
**Request**: `DELETE /webhook/template-manager`

**Body**:
```json
{
  "action": "delete",
  "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

**n8n Flow**:
1. Webhook Trigger (DELETE)
2. Input Validation (check `action=delete`, `template_id`, `user_id`)
3. **Data Tables: Update** `clarioo_templates` SET is_active = false WHERE template_id = {id}
   - Soft delete preserves usage history
4. Return success response

---

#### Operation 5: Track Usage (`POST`)
**Request**: `POST /webhook/template-manager`

**Body**:
```json
{
  "action": "track_usage",
  "template_id": "tpl_550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_550e8400-e29b-41d4-a716-446655440000",
  "project_id": "proj_550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "usage_count": 46
}
```

**n8n Flow**:
1. Webhook Trigger (POST)
2. Input Validation
3. **Data Tables: Insert** into `clarioo_template_usage`
4. **Data Tables: Update** `clarioo_templates` SET usage_count = usage_count + 1
5. Return new usage_count

---

### 6. Frontend Service Layer

**File**: `src/services/templateService.ts`

**New Functions**:

```typescript
/**
 * Get all templates from n8n
 */
export async function getTemplatesFromN8n(
  category?: string
): Promise<Template[]> {
  const endpoint = getN8nEndpoint('template-manager');
  const params = new URLSearchParams({ action: 'list' });
  if (category) params.append('category', category);

  const response = await fetch(`${endpoint}?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  return data.templates || [];
}

/**
 * Get single template from n8n
 */
export async function getTemplateByIdFromN8n(
  templateId: string
): Promise<Template | null> {
  const endpoint = getN8nEndpoint('template-manager');
  const params = new URLSearchParams({
    action: 'get',
    template_id: templateId
  });

  const response = await fetch(`${endpoint}?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  return data.success ? data.template : null;
}

/**
 * Upload template Excel to n8n
 */
export async function uploadTemplateExcel(
  file: File,
  userId: string,
  category?: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  const endpoint = getN8nEndpoint('template-manager');

  const formData = new FormData();
  formData.append('action', 'upload');
  formData.append('excel_file', file);
  formData.append('user_id', userId);
  if (category) formData.append('category', category);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error?.message || 'Upload failed'
      };
    }

    return {
      success: true,
      templateId: data.template_id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Delete template from n8n
 */
export async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const endpoint = getN8nEndpoint('template-manager');

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        template_id: templateId,
        user_id: userId
      })
    });

    const data = await response.json();
    return { success: data.success };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Track template usage
 */
export async function trackTemplateUsage(
  templateId: string,
  userId: string,
  projectId: string
): Promise<void> {
  const endpoint = getN8nEndpoint('template-manager');

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_usage',
        template_id: templateId,
        user_id: userId,
        project_id: projectId
      })
    });
  } catch (error) {
    console.error('Failed to track template usage:', error);
    // Non-blocking error
  }
}

/**
 * Helper: Get n8n endpoint based on mode
 */
function getN8nEndpoint(webhookName: string): string {
  const mode = localStorage.getItem('clarioo_webhook_mode') || 'production';

  if (mode === 'testing') {
    return `http://localhost:8080/webhook/${webhookName}-testing`;
  }

  return `https://n8n.lakestrom.com/webhook/${webhookName}-production`;
}
```

---

### 7. Admin Mode UI Components

#### Component 1: AdminModeToggle
**File**: `src/components/admin/AdminModeToggle.tsx`

```tsx
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Unlock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ADMIN_CODE = '71956';

export function AdminModeToggle() {
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem('clarioo_admin_mode') === 'true'
  );
  const [showDialog, setShowDialog] = useState(false);
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // Enabling admin mode - show passcode dialog
      setShowDialog(true);
    } else {
      // Disabling admin mode
      setIsAdmin(false);
      localStorage.setItem('clarioo_admin_mode', 'false');
      toast({
        title: 'Admin mode disabled',
        duration: 2000
      });
    }
  };

  const handleSubmitCode = () => {
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      localStorage.setItem('clarioo_admin_mode', 'true');
      setShowDialog(false);
      setCode('');
      toast({
        title: '✅ Admin mode activated',
        description: 'Template management unlocked',
        duration: 2000
      });
    } else {
      toast({
        title: '❌ Invalid code',
        description: 'Please try again',
        variant: 'destructive',
        duration: 2000
      });
      setCode('');
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Label className="flex items-center gap-2">
          {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          Admin Mode
        </Label>
        <Switch checked={isAdmin} onCheckedChange={handleToggle} />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
            <DialogDescription>
              Enter the 5-digit admin code to enable template management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter 5-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={5}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitCode();
              }}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmitCode} className="flex-1">
                Unlock
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setCode('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

#### Component 2: TemplateUploadButton
**File**: `src/components/templates/TemplateUploadButton.tsx`

```tsx
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadTemplateExcel } from '@/services/templateService';
import { getUserId } from '@/services/n8nService';

interface TemplateUploadButtonProps {
  onUploadSuccess: () => void;
}

export function TemplateUploadButton({ onUploadSuccess }: TemplateUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: '❌ Invalid file type',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
        duration: 3000
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '❌ File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
        duration: 3000
      });
      return;
    }

    setIsUploading(true);

    try {
      const userId = getUserId();
      const result = await uploadTemplateExcel(file, userId);

      if (result.success) {
        toast({
          title: '✅ Template uploaded',
          description: 'Template is now available to all users',
          duration: 3000
        });
        onUploadSuccess();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: '❌ Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {isUploading ? 'Uploading...' : 'Upload Template Excel'}
      </Button>
    </>
  );
}
```

---

#### Component 3: Updated TemplateCard with Delete
**File**: `src/components/templates/TemplateCard.tsx` (modifications)

```tsx
// Add delete button when admin mode is active
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface TemplateCardProps {
  template: Template;
  onClick: () => void;
  isAdminMode?: boolean;  // NEW PROP
  onDelete?: (templateId: string) => void;  // NEW PROP
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  isAdminMode = false,
  onDelete
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(template.templateId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card onClick={onClick} className="...existing classes...">
        {/* Existing card content */}

        {/* Delete button (admin only) */}
        {isAdminMode && onDelete && (
          <div className="absolute top-2 right-2">
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.lookingFor}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
```

---

#### Component 4: Updated TemplatesModal
**File**: `src/components/templates/TemplatesModal.tsx` (modifications)

```tsx
import { TemplateUploadButton } from './TemplateUploadButton';
import { getTemplatesFromN8n } from '@/services/templateService';

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAdminMode = localStorage.getItem('clarioo_admin_mode') === 'true';

  // Load templates from n8n on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const templatesFromN8n = await getTemplatesFromN8n();
      setTemplates(templatesFromN8n);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: '❌ Failed to load templates',
        description: 'Please try again',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const userId = getUserId();
    const result = await deleteTemplate(templateId, userId);

    if (result.success) {
      toast({
        title: '✅ Template deleted',
        duration: 2000
      });
      loadTemplates(); // Refresh list
    } else {
      toast({
        title: '❌ Delete failed',
        description: result.error || 'Please try again',
        variant: 'destructive',
        duration: 3000
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="...">
        <DialogHeader>
          <DialogTitle>Browse Templates</DialogTitle>
          {isAdminMode && (
            <TemplateUploadButton onUploadSuccess={loadTemplates} />
          )}
        </DialogHeader>

        {/* Template grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {templates.map(template => (
            <TemplateCard
              key={template.templateId}
              template={template}
              onClick={() => handleTemplateClick(template)}
              isAdminMode={isAdminMode}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

### 8. Template Migration Script

**Purpose**: Migrate existing 5 templates from JSON to n8n Data Tables

**Script**: `scripts/migrate-templates-to-n8n.ts`

```typescript
import fs from 'fs';
import path from 'path';

const TEMPLATES_JSON_PATH = path.join(__dirname, '../src/data/templates/templates.json');
const N8N_ENDPOINT = 'https://n8n.lakestrom.com/webhook/template-manager-production';

async function migrateTemplates() {
  // Read existing templates
  const templatesJson = fs.readFileSync(TEMPLATES_JSON_PATH, 'utf-8');
  const templates = JSON.parse(templatesJson);

  console.log(`Migrating ${templates.length} templates to n8n...`);

  for (const template of templates) {
    try {
      // Convert template to n8n format
      const payload = {
        action: 'upload',
        template_id: template.templateId,
        category: template.category,
        company_type: template.companyType,
        company_details: template.companyDetails,
        current_tool: template.currentTool,
        pain_quote: template.painQuote,
        looking_for: template.lookingFor,
        criteria: template.criteria,
        vendors: [], // No vendors in current templates
        created_at: new Date().toISOString(),
        created_by: 'system_migration',
        usage_count: 0,
        is_active: true
      };

      // Send to n8n
      const response = await fetch(N8N_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Migrated: ${template.lookingFor}`);
      } else {
        console.error(`❌ Failed: ${template.lookingFor}`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error migrating ${template.lookingFor}:`, error);
    }
  }

  console.log('Migration complete!');
}

migrateTemplates();
```

**Run**: `npx ts-node scripts/migrate-templates-to-n8n.ts`

---

## 📊 Implementation Checklist

### Phase 1: n8n Infrastructure (Day 1-2)
- [ ] Create `clarioo_templates` Data Table in n8n with expanded schema (20 columns including comparison_matrix, battlecards, etc.)
- [ ] Create `clarioo_template_usage` Data Table in n8n
- [ ] Build n8n workflow: `clarioo-template-manager`
  - [ ] Webhook Trigger (GET/POST/DELETE)
  - [ ] Input Validation node
  - [ ] **Excel Parser node (ALL 7 TABS)**:
    - [ ] Tab 0: INDEX metadata extraction
    - [ ] Tab 1: Criteria parsing (row 4+)
    - [ ] Tab 2: Vendor list parsing (row 6+)
    - [ ] Tab 3: Comparison matrix parsing (optional)
    - [ ] Tab 4: Detailed matching parsing (optional)
    - [ ] Tab 5: Battlecards parsing (optional)
    - [ ] Tab 6: Executive summary parsing (optional)
  - [ ] Data Tables Read/Insert/Update nodes
  - [ ] Response formatting nodes (include all 7 tab fields)
  - [ ] Error handling branches
- [ ] Deploy to testing (localhost:8080)
- [ ] Deploy to production (n8n.lakestrom.com)
- [ ] Test all 5 operations manually with complete Excel templates

### Phase 2: Frontend Service Layer (Day 1-2)
- [ ] Update `templateService.ts`:
  - [ ] `getTemplatesFromN8n()`
  - [ ] `getTemplateByIdFromN8n()`
  - [ ] `uploadTemplateExcel()`
  - [ ] `deleteTemplate()`
  - [ ] `trackTemplateUsage()`
- [ ] Add type definitions for n8n responses
- [ ] Test service functions with Postman/curl

### Phase 3: Admin Mode UI (Day 2)
- [ ] Create `AdminModeToggle` component
- [ ] Integrate toggle in VendorDiscovery page footer
- [ ] Add localStorage persistence for admin mode
- [ ] Create passcode dialog (code: 71956)
- [ ] Test toggle functionality

### Phase 4: Template Management UI (Day 2-4)
- [ ] Create `TemplateUploadButton` component
- [ ] Update `TemplateCard`:
  - [ ] Add delete functionality (admin only)
  - [ ] Add completeness badge ("Basic" vs "Complete Snapshot")
  - [ ] Show tab indicators (criteria, vendors, battlecards, etc.)
- [ ] **Create `TemplatePreviewModal` component (NEW)**:
  - [ ] Load complete template (all 7 tabs)
  - [ ] Show project metadata section
  - [ ] Show criteria list (always visible)
  - [ ] Show vendor list (if exists)
  - [ ] Show comparison matrix preview (if exists)
  - [ ] Show battlecards preview (if exists)
  - [ ] Show executive summary preview (if exists)
  - [ ] Conditional rendering based on available data
  - [ ] "Use Template" button → Populate ALL localStorage keys
- [ ] Update `TemplatesModal`:
  - [ ] Load templates from n8n (with all fields)
  - [ ] Show upload button (admin only)
  - [ ] Show delete buttons (admin only)
  - [ ] Handle delete confirmation
  - [ ] Open TemplatePreviewModal on card click
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test upload/delete/preview flows

### Phase 5: Template Usage & Project Population (Day 4)
- [ ] Update `createProjectFromTemplate()`:
  - [ ] Populate `workflow_{projectId}` with criteria + vendors
  - [ ] Populate `comparison_state_{projectId}` (if template has comparison data)
  - [ ] Populate `stage1_results_{projectId}` (if template has detailed matching)
  - [ ] Populate `clarioo_battlecards_state_{projectId}` (if template has battlecards)
  - [ ] Populate `clarioo_executive_summary_{projectId}` (if template has executive summary)
  - [ ] Set appropriate `currentStep` based on template completeness
  - [ ] Call `trackTemplateUsage()` for analytics
- [ ] Test project creation from complete templates
- [ ] Test project creation from partial templates (only criteria)
- [ ] Verify ALL localStorage keys populated correctly
- [ ] Verify usage_count increment in n8n
- [ ] Test navigation to appropriate step based on template completeness

### Phase 6: Migration & Cleanup (Day 4-5)
- [ ] Create migration script for 5 existing templates:
  - [ ] Migrate as "Basic Templates" (criteria + metadata only, tabs 0-2)
  - [ ] Set comparison_matrix, battlecards, executive_summary to null
  - [ ] Mark as "Basic Template" type for future enhancement
- [ ] Run migration script
- [ ] Verify migrated templates in n8n Data Tables
- [ ] (Optional) Create 1-2 "Complete Snapshot" templates from existing projects:
  - [ ] Export complete Excel from existing project
  - [ ] Upload via admin UI to test full 7-tab parsing
- [ ] Update `TemplatesModal` to use n8n exclusively
- [ ] Remove static `templates.json` (or keep as backup)
- [ ] Test end-to-end template flows:
  - [ ] Browse basic templates
  - [ ] Browse complete snapshot templates
  - [ ] Create project from basic template (criteria only)
  - [ ] Create project from complete template (all data)
  - [ ] Upload new template (admin)
  - [ ] Delete template (admin)

### Phase 7: Documentation & Testing (Day 5)
- [ ] Update PROGRESS.md
- [ ] Update PROJECT_ROADMAP.md
- [ ] Update FEATURE_LIST.md (if exists)
- [ ] Test all scenarios:
  - [ ] Non-admin user (no upload/delete buttons)
  - [ ] Admin activation with correct code (71956)
  - [ ] Admin activation with wrong code
  - [ ] **Excel upload scenarios**:
    - [ ] Basic template (tabs 0-2 only) - Success
    - [ ] Complete snapshot (all 7 tabs) - Success
    - [ ] Partial template (tabs 0-2 + some optional tabs) - Success
    - [ ] Invalid file (no criteria) - Validation error
    - [ ] Exceeds limits (31 criteria) - Validation error
    - [ ] Corrupted Excel file - Parse error
  - [ ] **Template preview scenarios**:
    - [ ] Preview basic template (shows only criteria)
    - [ ] Preview complete template (shows all sections)
    - [ ] Preview partial template (conditional sections)
  - [ ] **Template usage scenarios**:
    - [ ] Use basic template → Navigate to criteria builder
    - [ ] Use complete template → Navigate to battlecards view
    - [ ] Verify ALL localStorage keys populated
  - [ ] Template deletion
  - [ ] Template usage tracking
  - [ ] Category filtering
- [ ] Create user guide for admin template management
- [ ] Create Excel template reference guide (tab structure documentation)

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] Admin mode toggle works with 5-digit code (71956)
- [ ] Upload button visible only in admin mode
- [ ] Delete buttons visible only in admin mode
- [ ] **Excel upload parses ALL 7 tabs correctly**:
  - [ ] Tab 0 (INDEX): Metadata extraction
  - [ ] Tab 1 (Criteria): Required, max 30
  - [ ] Tab 2 (Vendors): Required, max 20
  - [ ] Tabs 3-6: Optional, parse if present
- [ ] Validation enforces max 30 criteria, max 20 vendors for required tabs
- [ ] Templates stored in n8n Data Tables with ALL fields
- [ ] Templates list loaded from n8n (not JSON)
- [ ] **Template preview shows ALL available sections**
- [ ] **Template usage populates ALL localStorage keys**
- [ ] Navigation goes to appropriate step based on template completeness
- [ ] Template deletion soft-deletes (preserves history)
- [ ] Usage tracking increments on template use
- [ ] All 5 existing templates migrated to n8n (as basic templates)
- [ ] At least 1 complete snapshot template created for testing

### Non-Functional Requirements
- [ ] Upload completes within 30 seconds
- [ ] Template list loads within 3 seconds
- [ ] No console errors
- [ ] Mobile-responsive admin UI
- [ ] Clear error messages for validation failures
- [ ] Toast notifications for all actions

---

## 🔧 Technical Notes

### Excel Parsing Strategy
The n8n workflow will use the **Spreadsheet File** node to parse all 7 Excel tabs:

```javascript
// Example n8n Code node for extracting ALL TABS from Excel
const workbook = items[0].binary.data;

// Helper: Find value by label in INDEX tab
function findValueByLabel(sheet, label) {
  for (let row = 1; row <= 100; row++) {
    const cellA = sheet[`A${row}`];
    if (cellA && cellA.v && cellA.v.toString().includes(label)) {
      const cellB = sheet[`B${row}`];
      return cellB ? cellB.v : null;
    }
  }
  return null;
}

// ============ TAB 0: INDEX - Project Metadata ============
const indexSheet = workbook.Sheets['INDEX'];
const projectName = findValueByLabel(indexSheet, 'Project Name:') || '';
const category = findValueByLabel(indexSheet, 'Category:') || '';
const companyContext = findValueByLabel(indexSheet, 'Company Context:') || '';
const solutionRequirements = findValueByLabel(indexSheet, 'Solution Requirements:') || '';
const description = findValueByLabel(indexSheet, 'Description:') || '';

// ============ TAB 1: Criteria - Data starts row 4 ============
const criteriaSheet = workbook.Sheets['1. Evaluation Criteria'];
const criteria = [];
let critRowIndex = 4;

while (criteriaSheet[`A${critRowIndex}`]) {
  criteria.push({
    id: `crit_${String(critRowIndex - 3).padStart(3, '0')}`,
    name: criteriaSheet[`B${critRowIndex}`]?.v || '',
    explanation: criteriaSheet[`C${critRowIndex}`]?.v || '',
    importance: (criteriaSheet[`D${critRowIndex}`]?.v || 'medium').toLowerCase(),
    type: (criteriaSheet[`E${critRowIndex}`]?.v || 'feature').toLowerCase(),
    isArchived: false
  });
  critRowIndex++;
}

// ============ TAB 2: Vendor List - Data starts row 6 ============
const vendorSheet = workbook.Sheets['2. Vendor List'];
const vendors = [];
let vendorRowIndex = 6;

while (vendorSheet[`A${vendorRowIndex}`]) {
  vendors.push({
    id: `vendor_${String(vendorRowIndex - 5).padStart(3, '0')}`,
    name: vendorSheet[`C${vendorRowIndex}`]?.v || '',
    description: vendorSheet[`D${vendorRowIndex}`]?.v || '',
    website: vendorSheet[`E${vendorRowIndex}`]?.v || '',
    // Logo parsing would require binary image handling (skip for initial version)
  });
  vendorRowIndex++;
}

// ============ TAB 3: Comparison Matrix (OPTIONAL) ============
const comparisonSheet = workbook.Sheets['3. Vendor Evaluation'];
let comparisonMatrix = null;

if (comparisonSheet) {
  // Parse comparison matrix structure
  // This is complex - would need to map criteria × vendors grid with icons
  // For MVP: Store raw sheet data or simplified JSON structure
  comparisonMatrix = {
    // Simplified structure - would need full parsing logic
    note: 'Comparison matrix parsed from Excel',
    // Add actual parsing based on excelExportService.ts structure
  };
}

// ============ TAB 4: Detailed Matching (OPTIONAL) ============
const detailedSheet = workbook.Sheets['4. Detailed Matching'];
let stage1Results = null;

if (detailedSheet) {
  // Parse evidence rows
  stage1Results = {
    vendorCriteria: [],
    // Add actual parsing based on Tab 4 structure
  };
}

// ============ TAB 5: Battlecards (OPTIONAL) ============
const battlecardsSheet = workbook.Sheets['5. Battlecards'];
let battlecards = null;

if (battlecardsSheet) {
  // Parse transposed battlecards (categories as rows, vendors as columns)
  battlecards = {
    rows: [],
    categories: [],
    // Add actual parsing based on generateBattlecardsTab() structure
  };
}

// ============ TAB 6: Pre-Demo Brief (OPTIONAL) ============
const summarySheet = workbook.Sheets['6. Pre-Demo Brief'];
let executiveSummary = null;

if (summarySheet) {
  // Parse executive summary sections
  executiveSummary = {
    keyCriteria: [],
    vendorRecommendations: [],
    keyDifferentiators: [],
    riskFactors: [],
    recommendation: '',
    // Add actual parsing based on generateExecutiveSummaryTab() structure
  };
}

// Return complete template object
return [{
  json: {
    projectName,
    category,
    companyContext,
    solutionRequirements,
    description,
    criteria,
    vendors,
    comparisonMatrix,      // nullable
    stage1Results,         // nullable
    battlecards,           // nullable
    executiveSummary       // nullable
  }
}];
```

**Parsing Implementation Notes**:
- **Required tabs** (0-2): Must parse successfully or upload fails
- **Optional tabs** (3-6): Parse if present, set to null if missing
- **Tab 3-6 complexity**: Full parsing logic should replicate the reverse of `excelExportService.ts` generation functions
- **MVP approach**: Initial version can store simplified structures, enhance parsing in future iterations
- **Icon mapping** (Tab 3): Convert Excel icons (✓, ⭐, X, +/-, ?, 🔄) back to status codes

### Category Handling
Categories are **dynamic** (like in CriteriaBuilder):
- New categories auto-created when template uploaded
- No validation against predefined list
- Category filter shows all unique categories from templates

### localStorage Structure Match & Template Usage Flow
All template JSON fields must exactly match localStorage structure for seamless restoration:

**Template Usage Flow** (when user clicks "Use Template"):
1. Generate new `projectId`
2. Create project entry in `clarioo_projects` array with template metadata
3. Populate ALL localStorage keys from template data:

```javascript
// Tab 0-1: Project metadata + criteria
localStorage.setItem(`workflow_${projectId}`, JSON.stringify({
  projectId,
  criteria: template.criteria,              // Tab 1 data
  selectedVendors: template.vendors || [],  // Tab 2 data
  currentStep: template.vendors?.length > 0 ? 'vendor-comparison' : 'vendor-selection',
  techRequest: template.solutionRequirements,
  companyContext: template.companyContext,
}));

// Tab 3: Comparison matrix (if exists)
if (template.comparisonMatrix) {
  localStorage.setItem(`comparison_state_${projectId}`,
    JSON.stringify(template.comparisonMatrix));
}

// Tab 4: Detailed matching (if exists)
if (template.stage1Results) {
  localStorage.setItem(`stage1_results_${projectId}`,
    JSON.stringify(template.stage1Results));
}

// Tab 5: Battlecards (if exists)
if (template.battlecards) {
  localStorage.setItem(`clarioo_battlecards_state_${projectId}`,
    JSON.stringify(template.battlecards));
}

// Tab 6: Executive summary (if exists)
if (template.executiveSummary) {
  localStorage.setItem(`clarioo_executive_summary_${projectId}`,
    JSON.stringify(template.executiveSummary));
}
```

**Navigation Logic**:
- If template has `vendors` → Navigate to "Vendor Comparison" step
- If template has `comparisonMatrix` → Navigate to "Comparison Matrix" view
- If template has `battlecards` → Navigate to "Battlecards" view
- Otherwise → Navigate to "Criteria Builder" step

**Browsable Template Behavior**:
- User can scroll through entire pre-populated project
- Missing sections (null fields) → Don't render those UI components
- Example: Template with criteria + vendors but no battlecards → Battlecards section hidden

---

## 📚 Related Sprints

- **SP_021**: Project Templates Feature (JSON-based templates)
- **SP_022**: Template Carousel Section (UI foundation)
- **SP_027**: Excel & JSON Export Feature (export format reference)

---

## 🚨 Risks & Mitigations

### Risk 1: Excel Parsing Complexity
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Use n8n's built-in Spreadsheet File node (battle-tested)
- Test with all 7 tab formats from SP_027
- Provide clear Excel template documentation
- Show example Excel file for download

### Risk 2: Large File Uploads
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Enforce 10MB file size limit
- Use multipart/form-data (efficient for binary)
- Show upload progress bar
- Timeout after 30 seconds

### Risk 3: Admin Code Security
**Impact**: Low
**Probability**: Low
**Mitigation**:
- Code stored only in frontend (not in localStorage)
- Admin mode persists but requires re-auth on page reload
- No sensitive operations (only template management)
- Consider IP whitelisting for production (future)

### Risk 4: Template Data Corruption
**Impact**: High
**Probability**: Low
**Mitigation**:
- Strict validation in n8n workflow
- Soft delete (is_active flag) preserves data
- Keep JSON backup as fallback
- Regular n8n Data Table exports

---

## 📈 Future Enhancements (Post-Sprint)

### Sprint 29: Template Sharing & Collaboration
- Share template via link
- Private vs public templates
- Template forking (duplicate & modify)
- Template rating/reviews
- Template categories & tags

### Sprint 30: Advanced Template Analytics
- Usage heatmap (which templates used most)
- Category popularity trends
- Template effectiveness metrics
- A/B testing different template structures

### Sprint 31: Template Marketplace
- User-submitted templates (community library)
- Template approval workflow
- Featured templates section
- Template search & filters

---

## 🎓 Learning Outcomes

### n8n Skills
- Excel parsing with Spreadsheet File node
- Data Tables CRUD operations
- Multipart file upload handling
- Soft delete patterns
- Usage tracking implementation

### Frontend Skills
- Admin mode toggle pattern
- File upload with validation
- n8n service integration
- localStorage persistence
- React alert dialogs

### Architecture Skills
- Single workflow for multiple operations
- Data normalization (usage_count denormalized)
- Backward-compatible migration
- Static → Dynamic data migration

---

## ✅ Definition of Done

- [ ] All checklist items completed
- [ ] All success criteria met
- [ ] Code reviewed
- [ ] n8n workflow tested (testing + production)
- [ ] Frontend UI tested (desktop + mobile)
- [ ] Admin mode toggle functional
- [ ] Excel upload/download tested
- [ ] Template deletion tested
- [ ] Usage tracking verified
- [ ] Migration script executed
- [ ] Documentation updated
- [ ] No regressions in existing template functionality
- [ ] Sprint document finalized

---

**Sprint Owner**: Engineering Team
**Stakeholders**: Product, Design, QA
**Dependencies**: None
**Blockers**: None

---

## 📝 Sprint Planning Notes

**SCOPE EXPANSION DURING PLANNING**:
This sprint underwent a fundamental scope change during the planning phase:

**Original Scope** (Initial Draft):
- Templates as "project starters" with criteria + basic metadata (tabs 0-2 only)
- Upload Excel → Parse only criteria and vendors
- User creates project → Starts with empty comparison matrix, no battlecards

**Final Scope** (After Requirements Clarification):
- Templates as "complete project snapshots" with ALL 7 Excel tabs
- Upload Excel → Parse ALL tabs (INDEX, criteria, vendors, comparison, battlecards, executive summary)
- User creates project → ALL localStorage keys populated, browse complete pre-populated project
- Missing data → Sections simply don't render (partial templates are valid)

**Impact**:
- Increased complexity: 7-tab parsing instead of 2-tab parsing
- New feature: Template preview/browse modal showing complete project
- Increased duration: 3-4 days → 5-6 days
- Increased value: Templates become powerful project snapshots, not just criteria starters

**Key Decision**: Templates can be "Basic" (tabs 0-2 only) OR "Complete Snapshots" (all 7 tabs). Both types are valid and supported.

---

*This sprint plan is based on the current implementation analysis and user requirements. Adjustments may be needed during implementation based on n8n capabilities and unforeseen technical constraints.*
