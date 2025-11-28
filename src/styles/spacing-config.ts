/**
 * Centralized Spacing Configuration
 *
 * @purpose Single source of truth for responsive padding, margins, and gaps
 * @usage Import and use predefined spacing patterns across components
 *
 * BENEFITS:
 * - Consistency: All components use same spacing scale
 * - Maintainability: Update spacing globally in one place
 * - Type Safety: TypeScript autocomplete and validation
 * - Documentation: Self-documenting spacing patterns
 *
 * BREAKPOINTS:
 * - xs: ~375px (extra small mobile)
 * - sm: ~640px (small mobile/tablet)
 * - md: ~768px (tablet/desktop)
 * - lg: ~1024px (desktop)
 *
 * @example
 * import { SPACING } from '@/styles/spacing-config';
 *
 * <div className={SPACING.card.content}>
 *   Card content with responsive padding
 * </div>
 */

export const SPACING = {
  /**
   * VENDOR DISCOVERY SECTION
   * Spacing for vendor discovery workflow components
   */
  vendorDiscovery: {
    // Main container wrapper (VendorDiscovery.tsx CardContent)
    container: 'md:p-6 px-2 pb-6',

    // Chat section
    chat: {
      // Chat card wrapper - ultra-compact on desktop for 2-line initial display
      card: 'pt-6 md:pt-3 pt-3 md:p-3 md:px-4 px-2 pb-6 md:pb-3 pb-3',
      // Individual message bubbles
      message: 'md:p-3 px-2 py-1.5',
      // Typing indicator
      typing: 'md:p-3 px-2 py-1.5',
    },

    // Criteria section
    criteria: {
      // Criteria card header
      header: 'md:p-6 md:px-6 px-2 pt-6 md:pt-6 pt-3 pb-6 md:pb-6 pb-3',
      // Criteria card content
      content: 'md:p-6 md:px-6 px-2 pt-0 pb-6 md:pb-6 pb-3',
      // Add new category section
      addCategory: 'md:px-4 px-2 py-3 md:py-3 py-1.5',
    },

    // Accordion sections (categories)
    accordion: {
      // Section header button
      header: 'px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3',
      // Section content container
      content: 'p-2 xs:p-3 sm:p-4 pt-0',
      // Add criterion button
      addButton: 'px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3',
      // Spacing between criterion cards
      spacing: 'space-y-2 xs:space-y-2.5 sm:space-y-3',
    },

    // Individual criterion cards
    criterion: {
      // Criterion card content
      content: 'p-2 xs:p-3 sm:p-4',
      // Header spacing
      headerGap: 'gap-2 xs:gap-3 sm:gap-4',
      // Icon sizes
      icon: 'h-3.5 w-3.5 xs:h-4 xs:w-4',
      iconButton: 'h-7 w-7 xs:h-8 xs:w-8',
    },
  },

  /**
   * LANDING PAGE SECTION
   * Spacing for landing page components
   */
  landing: {
    // Category selector - Scales proportionally from 350px to desktop
    categorySelector: {
      // Gradient outline wrapper - slightly thicker for better visibility
      outline: 'p-[1px] xs:p-[1.5px] sm:p-[2px] md:p-[2.5px]',
      // Text container (left pill) - proportional padding (mobile height +70% total)
      textContainer: 'px-1.5 xs:px-2 sm:px-3 md:px-6 py-2.5 xs:py-3.5 sm:py-5 md:py-4',
      // Button container (right pill) - proportional padding (mobile height +70% total)
      buttonContainer: 'px-1.5 xs:px-2 sm:px-3 md:px-6 py-2.5 xs:py-3.5 sm:py-5 md:py-4',
      // Dropdown panel
      panel: 'px-6 py-4',
    },

    // Animated inputs
    inputs: {
      // Section container
      section: 'px-4 py-12',
      // Grid gap
      grid: 'gap-6',
      // Input padding
      input: 'px-4',
    },

    // Hero section
    hero: {
      // Badge spacing
      badge: 'mb-4 xs:mb-6 sm:mb-8',
      // Button section
      buttonSection: 'gap-1 xs:gap-2 pt-4',
    },

    // View toggle button
    viewToggle: {
      button: 'px-3 xs:px-5 sm:px-8 py-1.5 xs:py-2 sm:py-3',
    },

    // Artifact visualization
    artifact: {
      // Gap patterns
      gap: {
        small: 'gap-3 xs:gap-4 sm:gap-6 md:gap-8',
        medium: 'gap-4 xs:gap-5 sm:gap-6',
      },
      // Card padding
      card: 'px-3 xs:px-4 sm:px-5 md:px-6',
      // Margin patterns
      margin: 'mb-1 xs:mb-2 sm:mb-2.5 md:mb-3',
    },

    // Card carousel
    carousel: {
      section: 'px-4 py-16',
      badges: 'gap-3',
    },
  },

  /**
   * VENDOR COMPARISON SECTION
   * Spacing for vendor comparison workflow components
   */
  vendorComparison: {
    // Vendor card spacing
    card: {
      // Main card container padding - minimal for maximum content space
      container: 'px-2 py-2',
      // Left side (company info) padding
      leftSection: 'pr-2',
      // Right side (killer feature) padding
      rightSection: 'px-3 py-2',
    },

    // Navigation arrows
    navigation: {
      // Gap between arrows and card
      gap: 'gap-2',
    },
  },

  /**
   * COMMON PATTERNS
   * Reusable spacing patterns used across multiple components
   */
  common: {
    // Card components
    card: {
      // Standard card content
      content: 'p-4',
      // Card header
      header: 'p-6',
      // Card with responsive padding
      contentResponsive: 'p-2 xs:p-3 sm:p-4',
    },

    // Grid layouts
    grid: {
      // Standard grid gap
      gap: 'gap-4',
      // Responsive grid gap
      gapResponsive: 'gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3',
    },

    // Container padding
    container: {
      // Standard container
      standard: 'px-4 py-8',
      // Tight container (mobile-optimized)
      tight: 'px-2 py-4',
    },

    // Flex layouts
    flex: {
      // Small gap
      gapSmall: 'gap-2',
      // Medium gap
      gapMedium: 'gap-4',
      // Large gap
      gapLarge: 'gap-6',
      // Responsive gap
      gapResponsive: 'gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3',
    },
  },
} as const;

/**
 * Helper function to combine spacing classes
 * Useful when you need to combine multiple spacing patterns
 *
 * @example
 * combineSpacing(SPACING.card.content, 'mt-4')
 * // Returns: 'p-4 mt-4'
 */
export const combineSpacing = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Type-safe spacing keys
 * Useful for creating dynamic spacing based on component props
 */
export type SpacingKey = keyof typeof SPACING;
export type VendorDiscoverySpacingKey = keyof typeof SPACING.vendorDiscovery;
export type LandingSpacingKey = keyof typeof SPACING.landing;
export type CommonSpacingKey = keyof typeof SPACING.common;
