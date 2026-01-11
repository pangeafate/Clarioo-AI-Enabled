# Design Guidelines

**Version**: 1.0
**Last Updated**: January 8, 2026
**Status**: Active

---

## Typography

### Font Family
**Primary**: Inter (Google Fonts)
**Weights**: 300, 400, 500, 600, 700, 800
**Fallback**: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Sizing (Mobile → Desktop)

| Element | Mobile | Tablet | Desktop | Weight | Line Height | Tracking |
|---------|--------|--------|---------|--------|-------------|----------|
| **H1** | 36px | 48px | 56px | 700-800 | 1.1 | -0.02em |
| **H2** | 28px | 36px | 40px | 600-700 | 1.1 | -0.02em |
| **H3** | 24px | 28px | 32px | 600 | 1.2 | normal |
| **H4** | 20px | 24px | 28px | 600 | 1.2 | normal |
| **Body** | 16px | 18px | 18px | 400 | 1.7 | normal |
| **Small** | 14px | 14px | 14px | 500 | 1.5 | 0.05em |

### Colors
- **Headlines**: `#1A1A1A` (warm near-black)
- **Body**: `#4B5563` (warm gray)
- **Muted**: `#6B7280` (light gray)
- **Primary**: `#0066FF` (Clearbit blue)

---

## Colors

### Brand Palette

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Clearbit Blue** | `#0066FF` | `214 100% 50%` | Primary actions, links |
| **Blue Light** | `#3399FF` | `210 100% 60%` | Hover states, gradients |
| **Blue Dark** | `#0052CC` | `214 100% 40%` | Active states |
| **Navy** | `#172B4D` | `217 33% 17%` | Primary text |
| **Slate** | `#42526E` | `215 25% 35%` | Secondary text |
| **Silver** | `#6B778C` | `215 15% 50%` | Muted text |
| **Ash** | `#DFE1E6` | `210 20% 90%` | Borders |
| **Cloud** | `#F4F5F7` | `210 20% 96%` | Light backgrounds |
| **Snow** | `#FAFBFC` | `210 20% 98%` | Lightest backgrounds |

### Gradients

| Name | Definition | Usage |
|------|------------|-------|
| **Button** | `135deg, #0066FF 0%, #3399FF 100%` | Primary buttons |
| **Hero** | `135deg, #FAFBFC 0%, #F4F5F7 100%` | Hero backgrounds |
| **Purple** | `135deg, #6366F1 0%, #8B5CF6 100%` | Accent buttons, highlights |

### Legacy Purple (Phase 0)
- `#6366F1` → `#8B5CF6` (Purple/Indigo gradient)
- Use Clearbit blue for Phase 1+

---

## Spacing

### Scale (Tailwind)
`0.5rem (8px) → 1rem (16px) → 1.5rem (24px) → 2rem (32px) → 3rem (48px)`

### Component Padding (Mobile → Desktop)

| Component | Mobile | Desktop |
|-----------|--------|---------|
| **Container** | `px-2 pb-6` | `p-6` |
| **Card Content** | `p-2` | `p-4` |
| **Criterion Card** | `p-2` | `p-4` |
| **Chat Message** | `px-2 py-1.5` | `p-3` |
| **Section Header** | `px-2 pt-3 pb-3` | `px-6 pt-6 pb-6` |

### Gaps
- **Criterion Stack**: `space-y-2` (mobile) → `space-y-3` (desktop)
- **Icon + Text**: `gap-2` (mobile) → `gap-4` (desktop)
- **Form Fields**: `gap-4` (mobile) → `gap-6` (desktop)

---

## Shadows & Depth

### Shadow Layers

| Name | Definition | Usage |
|------|------------|-------|
| **Soft** | `0 1px 3px rgba(0,0,0,0.05)` | Subtle elevation |
| **Medium** | `0 4px 12px rgba(0,0,0,0.08)` | Cards, dropdowns |
| **Large** | `0 12px 24px rgba(0,0,0,0.12)` | Modals, dialogs |
| **Elevated** | `0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)` | Multi-layer (Clearbit-style) |
| **Button Glow** | `0 2px 8px rgba(0,102,255,0.25)` | Primary button hover |

### Border Radius
- **Small**: `8px`
- **Medium**: `12px`
- **Large**: `16px`
- **XL**: `20px` (Clearbit-style generous rounding)

---

## Animations

### Timing Functions
- **Smooth**: `cubic-bezier(0.4, 0, 0.2, 1)` (0.3s)
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (0.5s)

### Keyframe Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| **pulse-border** | 1.8s | ease-in-out infinite | Input focus glow (33 pulses/min) |
| **pulse-glow** | 2s | ease-in-out infinite | Button hover effects |
| **float** | 3s | ease-in-out infinite | Floating UI elements |
| **shimmer** | 4s | ease-in-out infinite | Loading states |

### Micro-Interactions
- **Card Hover**: Scale `1.02` + shadow increase
- **Button Hover**: Glow + scale `1.05`
- **Icon Bounce**: `translateY(-4px)` on hover
- **Input Focus**: Pulse border + glow

---

## Layout

### Breakpoints
| Size | Width | Target |
|------|-------|--------|
| **xs** | 375px | Small phones |
| **sm** | 640px | Large phones |
| **md** | 768px | Tablets |
| **lg** | 1024px | Laptops |
| **xl** | 1280px | Desktops |
| **2xl** | 1400px | Large desktops |

### Container
- **Max Width**: `1400px`
- **Padding**: `2rem` (responsive)
- **Center**: Always centered

### Grid
- **Desktop Carousel**: 3 cards visible (center focus)
- **Mobile Carousel**: 1 card + swipe
- **Form Fields**: Stacked mobile, side-by-side desktop
- **Vendor Cards**: 1 col (mobile) → 3 cols (desktop)

---

## Design Principles

### Mobile-First
- Design for 80-90% mobile traffic
- Touch-optimized (44px min tap targets)
- Progressive enhancement to desktop

### Visual Hierarchy
1. **Headlines**: Large, bold, gradient text
2. **Actions**: Gradient buttons with glows
3. **Content**: Generous spacing, readable text
4. **Metadata**: Muted, smaller text

### Depth & Layering
- Multi-layer shadows (not single-layer)
- Gradient backgrounds (not flat white)
- Floating card effects (not flush)

### Anti-Patterns to Avoid
| ❌ Don't | ✅ Do |
|---------|-------|
| Pure white backgrounds | Gradient layers |
| Single-layer shadows | Multi-layer depth |
| 8px border-radius | 20px generous rounding |
| Flat solid buttons | Gradient buttons with glow |
| Cold grays (#333, #666) | Warm blacks/grays |

---

## Brand

### Name
**Clarioo** (pronunciation: Clar-ee-oh)
From "clarity" - transparent vendor selection

### Personality
- **Innovative**: Not vanilla enterprise software
- **Transparent**: No black box AI
- **Delightful**: Enjoyable, visually appealing
- **Intelligent**: AI-powered, human-centric
- **Mobile-First**: Optimized for real work

### Tone
- Confident (not arrogant)
- Helpful (not patronizing)
- Clear (no jargon)
- Benefit-focused (not feature-focused)

### Messaging
- "90% routine work automated" ✅
- "Advanced AI algorithms" ❌

### Inspiration
- **Clearbit**: Gradients, bold typography, layered shadows
- **HubSpot**: Interactive carousels, engaging content
- **Shopify**: Clear value propositions, user-friendly
- **iPod**: Circular navigation, intuitive interactions

---

## Implementation Files

| Aspect | File | Line Reference |
|--------|------|----------------|
| **Typography** | `src/styles/typography-config.ts` | Complete system |
| **Spacing** | `src/styles/spacing-config.ts` | Complete system |
| **Colors** | `tailwind.config.ts` | Lines 21-88 |
| **Shadows** | `tailwind.config.ts` | Lines 97-104 |
| **Animations** | `tailwind.config.ts` | Lines 116-197 |
| **Font** | `index.html` | Lines 7-9 |
| **CSS Tokens** | `src/index.css` | Lines 1-136 |

---

## Quick Reference

### Most Common Patterns

**Button (Primary)**
```tsx
className="bg-gradient-button text-white px-6 py-4 rounded-xl shadow-button-glow hover:scale-105 transition-smooth"
```

**Card (Elevated)**
```tsx
className="bg-white p-4 md:p-6 rounded-xl shadow-elevated hover:shadow-large transition-smooth"
```

**Heading (Hero)**
```tsx
className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight"
```

**Body Text**
```tsx
className="text-base md:text-lg text-muted-foreground leading-relaxed"
```

**Input (Animated)**
```tsx
className="border-2 border-input rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary animate-pulse-border"
```

---

**Usage**: Import from `/src/styles/typography-config.ts` and `/src/styles/spacing-config.ts` for consistent application.
