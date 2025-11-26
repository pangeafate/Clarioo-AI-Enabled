/**
 * Typography Configuration - Centralized Font Styles
 *
 * @purpose Single source of truth for all typography across the application
 * @features Mobile-first responsive sizing, semantic colors, consistent weights
 *
 * USAGE:
 * import { TYPOGRAPHY } from '@/styles/typography-config';
 * <h1 className={TYPOGRAPHY.heading.h1}>Title</h1>
 *
 * ORGANIZATION:
 * - Headings: H1-H6 with responsive sizing
 * - Body: Large, default, small variants
 * - Labels: Form labels and UI labels
 * - Buttons: Button text styles
 * - Muted: Secondary/descriptive text
 * - Links: Hyperlink styles
 * - Code: Monospace/code text
 * - Special: Brand-specific text styles
 *
 * COLOR SEMANTICS:
 * - text-foreground: Primary text color (dark navy)
 * - text-muted-foreground: Secondary/descriptive text (gray)
 * - text-primary: Brand blue text
 * - text-destructive: Error/warning text
 * - text-success: Success state text
 *
 * RESPONSIVE BREAKPOINTS:
 * - xs: 375px (small phones)
 * - sm: 640px (large phones)
 * - md: 768px (tablets)
 * - lg: 1024px (laptops)
 * - xl: 1280px (desktops)
 */

export const TYPOGRAPHY = {
  /**
   * HEADINGS - Page and section titles
   * Mobile-first with progressive scaling
   */
  heading: {
    // H1: Main page titles, hero headlines
    h1: 'text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tight leading-tight',

    // H2: Major section headings
    h2: 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight',

    // H3: Subsection headings
    h3: 'text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground leading-snug',

    // H4: Minor section headings
    h4: 'text-lg xs:text-xl sm:text-2xl md:text-3xl font-semibold text-foreground leading-snug',

    // H5: Small headings, card titles
    h5: 'text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-foreground leading-normal',

    // H6: Smallest headings
    h6: 'text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-foreground leading-normal',
  },

  /**
   * BODY TEXT - Main content and paragraphs
   */
  body: {
    // Large body text (introductions, important content)
    large: 'text-base xs:text-lg sm:text-xl md:text-2xl font-normal text-foreground leading-relaxed',

    // Default body text (most common)
    default: 'text-sm xs:text-base sm:text-lg font-normal text-foreground leading-normal',

    // Small body text (captions, fine print)
    small: 'text-xs xs:text-sm sm:text-base font-normal text-foreground leading-normal',

    // Extra small (mobile-only small text)
    xs: 'text-xs font-normal text-foreground leading-tight',
  },

  /**
   * MUTED TEXT - Secondary, descriptive, helper text
   */
  muted: {
    // Large muted text
    large: 'text-base xs:text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed',

    // Default muted text (descriptions, hints)
    default: 'text-sm xs:text-base sm:text-lg font-medium text-muted-foreground leading-normal',

    // Small muted text (metadata, timestamps)
    small: 'text-xs xs:text-sm font-normal text-muted-foreground leading-normal',

    // Extra small muted
    xs: 'text-xs font-normal text-muted-foreground leading-tight',
  },

  /**
   * LABELS - Form labels, UI labels
   */
  label: {
    // Large labels (prominent form fields)
    large: 'text-base xs:text-lg sm:text-xl font-semibold text-foreground',

    // Default labels (standard form fields)
    default: 'text-sm xs:text-base font-semibold text-foreground',

    // Small labels (compact forms, inline labels)
    small: 'text-xs xs:text-sm font-medium text-foreground',

    // Muted labels (optional fields, helper labels)
    muted: 'text-xs xs:text-sm font-medium text-muted-foreground',
  },

  /**
   * BUTTONS - Button and interactive element text
   */
  button: {
    // Large buttons (CTAs, primary actions)
    large: 'text-base sm:text-lg font-semibold',

    // Default buttons (standard actions)
    default: 'text-sm sm:text-base font-semibold',

    // Small buttons (compact UI, secondary actions)
    small: 'text-xs sm:text-sm font-semibold',

    // Icon buttons (buttons with icons only)
    icon: 'text-sm font-medium',
  },

  /**
   * LINKS - Hyperlinks and clickable text
   */
  link: {
    // Default links
    default: 'text-sm xs:text-base font-medium text-primary hover:underline',

    // Large links
    large: 'text-base xs:text-lg font-medium text-primary hover:underline',

    // Small links
    small: 'text-xs xs:text-sm font-medium text-primary hover:underline',

    // Muted links (less prominent)
    muted: 'text-sm xs:text-base font-medium text-muted-foreground hover:text-foreground hover:underline',
  },

  /**
   * CODE - Monospace text, code snippets
   */
  code: {
    // Inline code
    inline: 'text-sm font-mono text-foreground bg-muted px-1 py-0.5 rounded',

    // Code blocks
    block: 'text-sm font-mono text-foreground leading-relaxed',
  },

  /**
   * SPECIAL - Brand-specific and unique text styles
   */
  special: {
    // Brand gradient text (hero titles, special headings)
    brandGradient: 'text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent',

    // Subtitle/tagline (hero sections)
    subtitle: 'text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-medium leading-relaxed',

    // Badge text (status badges, tags)
    badge: 'text-xs font-semibold uppercase tracking-wide',

    // Tooltip text
    tooltip: 'text-xs font-medium text-foreground',

    // Error text
    error: 'text-sm xs:text-base font-medium text-destructive',

    // Success text
    success: 'text-sm xs:text-base font-medium text-success',

    // Warning text
    warning: 'text-sm xs:text-base font-medium text-warning',
  },

  /**
   * NAVIGATION - Navigation menu text
   */
  nav: {
    // Main navigation links
    default: 'text-sm sm:text-base font-medium text-foreground hover:text-primary',

    // Active navigation links
    active: 'text-sm sm:text-base font-semibold text-primary',

    // Secondary navigation
    secondary: 'text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground',
  },

  /**
   * CARD - Card-specific text styles
   */
  card: {
    // Card titles
    title: 'text-lg xs:text-xl sm:text-2xl font-semibold text-foreground',

    // Card descriptions
    description: 'text-sm xs:text-base font-normal text-muted-foreground leading-normal',

    // Card metadata (dates, authors, etc.)
    metadata: 'text-xs xs:text-sm font-normal text-muted-foreground',

    // Criterion card name (mobile: same as description, desktop: larger + bold + charcoal)
    criterionName: 'text-sm xs:text-base font-bold leading-normal text-gray-800 md:text-lg',
  },

  /**
   * TABLE - Table-specific text styles
   */
  table: {
    // Table headers
    header: 'text-xs xs:text-sm font-semibold text-foreground uppercase tracking-wide',

    // Table cells
    cell: 'text-sm xs:text-base font-normal text-foreground',

    // Table footer
    footer: 'text-xs xs:text-sm font-medium text-muted-foreground',
  },

  /**
   * FORM - Form-specific text styles
   */
  form: {
    // Input text
    input: 'text-sm xs:text-base font-normal text-foreground',

    // Placeholder text
    placeholder: 'text-sm xs:text-base font-normal text-muted-foreground',

    // Helper text
    helper: 'text-xs xs:text-sm font-normal text-muted-foreground',

    // Error text
    error: 'text-xs xs:text-sm font-medium text-destructive',
  },
} as const;

/**
 * TEXT COLORS - Semantic color utilities
 * Use these for one-off color applications
 */
export const TEXT_COLORS = {
  primary: 'text-foreground',
  secondary: 'text-muted-foreground',
  brand: 'text-primary',
  brandGradient: 'bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
  white: 'text-white',
  black: 'text-black',
} as const;

/**
 * FONT WEIGHTS - Weight utilities
 * Use these for one-off weight applications
 */
export const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
} as const;
