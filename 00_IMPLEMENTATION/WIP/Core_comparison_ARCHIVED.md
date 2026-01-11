### Core Comparison Matrix — Design Document

### 1) Purpose

The **Core Comparison Matrix** is an AI-generated, vendor-level comparison table that appears **under the existing Detailed Criteria Matrix**. It explains **high-level, real-world differences** between the selected vendors so users do not need to go to Google/ChatGPT for basic context.

It is intentionally **not a criteria grid** and should not be a rewrite of the criteria grid. It is closer to a “battle card” or “RFI-lite” overview that highlights structural differences, positioning, and practical buying considerations.

---

### 2) Placement and timing

- **Location in UI:** directly **below** the Detailed Criteria Matrix (existing component).
- **Trigger:** starts generating immediately after the user confirms the vendor set for comparison.
- **Parallelism:** can run **in parallel** with any evaluation tasks. It must not block page render.
- IMPORTANT: Generation is done using n8n workflow - first all vendors are searched for how they are normally compared - pricing plans, best for and so on, nuances that really differ the the vendors from one another. Based on this search the comparison categories are created and the data + evidence links are filled in the category x vendor intersections

EXAMPLE:

| **Feature** | **Dojo** | **Zettle (PayPal POS)** |
| --- | --- | --- |
| **Best For** | High-volume retail & hospitality | Small shops, mobile vendors, freelancers |
| **Contract** | Rolling monthly or 12 months | No contract; pay-as-you-go |
| **Monthly Fee** | Starts at ~£20–£40+ (depends on plan) | £0 |
| **Transaction Fee** | Custom quotes (typically lower for high volume) | Fixed 1.75% |
| **Payout Speed** | Next-day (standard) | 1–3 business days |
| **Support** | 24/7 UK-based phone & email | Weekdays 9-5 (phone/chat) |

---

### 3) Required UI layout

- **Vendors are columns** (horizontal), same orientation as the existing Vendor Comparison matrix.
- **Rows are AI-chosen topics**, specific to the selected vendor set.
- The component contains two parts:
    1. **Key Differences (summary strip)** above the table
    2. **Core Comparison Table** (topics × vendors)

### 3.1 Key Differences (summary strip)

- 5–10 concise bullets that summarize the most important cross-vendor differences.
- Must call out “why these vendors are different” in a way a non-expert can understand (the “consultant flavor”).
- No ranking language (“best”, “winner”). Use neutral phrasing (“X focuses on… while Y emphasizes…”).

### 3.2 Core Comparison Table

- **Columns:** one per vendor
    - Vendor name, optional logo
    - Optional website link
- **Rows:** 8–12 rows
    - Row title
    - Optional one-line “What this means” tooltip/hover/expand help text
- **Cells:** 1–3 lines of text, scannable

---

### 4) Row policy (AI decides, but with hard guardrails)

### 4.1 Minimum and maximum

- **Minimum rows:** 8 (hard requirement)
- **Maximum rows:** 12 (default cap to preserve usability)

### 4.2 AI-chosen topics must be vendor-specific

The AI should choose topics that best explain differences **for this particular vendor set**.

Examples of vendor-set-specific topics:

- “Designed for multi-location operations vs single-location”
- “Requires hardware bundle vs software-only”
- “Best if you already use ecosystem X”
- “Works as standalone system vs best as add-on to existing suite”

The AI should avoid generic rows that do not differentiate the selected vendors.

### 4.3 Coverage constraint (must-have categories)

Even though topics are AI-chosen, the final set must include at least:

- **1 commercial row** (pricing and/or contracting)
- **1 market focus row** (geography and/or segment and/or verticals)
- **1 implementation row** (time-to-value, complexity, onboarding)
- **1 differentiation/tradeoffs row** (headline tradeoffs across vendors)

### 4.4 Candidate topic pool (starting point, not fixed)

The AI may pick from (and add beyond) this pool:

- Contracting and procurement friction
- Pricing posture / pricing model
- Geography / market focus
- Target customer segment (SMB/mid-market/enterprise)
- Vertical/industry specialization
- Implementation complexity / time-to-value
- Integrations / ecosystem fit
- Data residency / hosting model (only if relevant/discoverable)
- Security/compliance posture (only if relevant/discoverable)
- Support and services model
- Company maturity/stage signals (only if discoverable)
- Differentiation and tradeoffs (always eligible)

### 4.5 Row replacement rule (quality control)

If a chosen topic produces mostly unknown cells (for example, “Unknown” for 70%+ of vendor cells), the AI should **replace that row** with another topic from the pool (still keeping ≥ 8 rows).

---

### 5) Cell content requirements

### 5.1 Non-empty cells

No blank cells. Every cell must be one of:

- A short factual/synthesized statement, or
- **“Unknown / not found”**

### 5.2 Source URL

- Each cell  must include  source links.

### 5.4 Tone and safety

- No hype or marketing claims.
- No invented customers, compliance certifications, or benchmark numbers.
- Avoid absolute language when confidence is not Confirmed.

---

### 6) Data inputs to generation

Minimum inputs:

- Project context text (project description)
- Selected vendors list:
    - vendor_id
    - vendor_name
    - vendor_website (if available)

Optional inputs (recommended if already available):

- Vendor brief descriptions from the vendor search step
- Known pricing snippets
- Any metadata you already store (category, tags, etc.)

---

### 7) Expected output format (structured, to support rendering)

The AI generation must return a structured object (even if the UI ultimately renders it as a table):

- **key_differences:** array of bullet strings (5–10)
- **rows:** array of row objects (8–12)
    - row_id (stable id for UI diffing)
    - title
    - definition (1 sentence, optional but recommended)
    - cells: array aligned to vendors
        - vendor_id
        - text
        - confidence: Confirmed | Likely | Unknown
        - source_url (optional)

This structure enables:

- Progressive fill
- Stable row order
- Avoiding UI jitter on refresh

---

### 8) Runtime behavior

### 8.1 Loading states

- Show a skeleton table quickly (vendor headers + placeholder rows).
- Fill in Key Differences first if possible, then table rows.

### 8.2 Regeneration behavior

- Regenerate when vendor selection changes.
- If regenerating, keep previous output visible until the new one is ready, then swap (prevents flicker).

### 8.3 Progressive refinement (optional)

Two-pass approach is allowed:

- Pass 1: fast draft (row selection + initial cell content)
- Pass 2: improve unknowns and refine wording

Do not reorder rows drastically in pass 2 unless necessary.

---

### 9) Acceptance criteria (Definition of Done)

1. For any comparison with 2+ selected vendors, the module renders **below** the criteria matrix.
2. Vendors are horizontal columns; rows are topics; table is readable and scannable.
3. Output contains **8–12 AI-chosen vendor-specific rows**, always ≥ 8.
4. Includes a **Key Differences** strip above the table.
5. No blank cells; missing info is shown as “Unknown / not found” with confidence.
6. Works on mobile via horizontal scroll for vendor columns.

---

### 10) Notes this module must satisfy

- It must add context beyond feature criteria: customers, geography, maturity/stage, verticals, and headline differences.
- It must explain why vendors that look similar in criteria can still differ meaningfully (the “consultant explanation”).