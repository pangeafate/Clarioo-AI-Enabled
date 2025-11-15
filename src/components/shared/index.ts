/**
 * Shared Components Library
 *
 * Reusable components extracted from duplicate code patterns.
 * These components follow consistent design patterns and are fully tested.
 *
 * SP_013 - Component Reusability & Code Deduplication
 */

// Loading components
export { LoadingState } from './loading/LoadingState';
export type { LoadingStateProps } from './loading/LoadingState';

// Empty state components
export { EmptyState } from './empty/EmptyState';
export type { EmptyStateProps } from './empty/EmptyState';

// Statistics components
export { StatsCard } from './stats/StatsCard';
export type { StatsCardProps } from './stats/StatsCard';

// Form components
export { AddVendorForm } from './forms/AddVendorForm';
export type { AddVendorFormProps, AddVendorFormData } from './forms/AddVendorForm';
