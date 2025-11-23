/**
 * Type Definitions Index
 *
 * Central export point for all TypeScript type definitions.
 * Import types from here rather than individual files:
 *
 * @example
 * ```typescript
 * // Good - single import
 * import { Project, Vendor, Criterion, User } from '@/types';
 *
 * // Avoid - multiple imports
 * import { Project } from '@/types/project.types';
 * import { Vendor } from '@/types/vendor.types';
 * import { Criterion } from '@/types/criteria.types';
 * ```
 *
 * @module types
 */

// ===========================================
// Project Types
// ===========================================
export type {
  ProjectStatus,
  Project,
  WorkflowState,
  ProjectWithWorkflow,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  ProjectSortBy,
  ProjectSortOrder,
  ProjectQueryParams
} from './project.types';

// ===========================================
// Vendor Types
// ===========================================
export type {
  CriteriaAnswer,
  Vendor,
  VendorWithMatch,
  VendorComparison,
  VendorSelectionRequest,
  VendorFilters,
  VendorSortBy,
  VendorSortOrder,
  VendorInvite,
  VendorResponse
} from './vendor.types';

// ===========================================
// Criteria Types
// ===========================================
export type {
  ImportanceLevel,
  Criterion,
  Criteria,
  CriterionBuilderConfig,
  CriterionValidation,
  CreateCriterionRequest,
  UpdateCriterionRequest,
  CriterionWithScores,
  CriterionFilters,
  CriterionSortBy,
  CriterionSortOrder,
  CriterionQueryParams,
  DefaultCriterionType
} from './criteria.types';

export { DEFAULT_CRITERION_TYPES } from './criteria.types';

// ===========================================
// Authentication Types
// ===========================================
export type {
  UserRole,
  UserStatus,
  User,
  UserProfile,
  Session,
  LoginCredentials,
  RegistrationData,
  PasswordResetRequest,
  PasswordResetConfirmation,
  AuthResponse,
  AuthError,
  EmailVerificationRequest,
  EmailVerificationConfirmation,
  UpdateUserRequest,
  ChangePasswordRequest,
  AuthState,
  OAuthProvider,
  OAuthLoginRequest,
  TokenRefreshRequest,
  TokenRefreshResponse,
  UserInvitation,
  AcceptInvitationRequest
} from './auth.types';

// ===========================================
// Common/Utility Types
// ===========================================
export type {
  ApiResponse,
  ApiError,
  ResponseMeta,
  PaginationMeta,
  PaginationParams,
  SortOrder,
  SortParams,
  FilterParams,
  QueryParams,
  LoadingState,
  AsyncState,
  ID,
  Timestamp,
  TimestampedRecord,
  BaseRecord,
  Optional,
  RequiredFields,
  Nullable,
  KeyValuePair,
  SelectOption,
  FileUpload,
  FileUploadState,
  NotificationType,
  Notification,
  ValidationError,
  ValidationResult,
  VoidCallback,
  Callback,
  AsyncCallback,
  ChangeHandler,
  SubmitHandler,
  ErrorHandler,
  Coordinates,
  Address,
  ContactInfo,
  DateRange,
  PriceRange,
  Statistics
} from './common.types';

// ===========================================
// n8n Integration Types
// ===========================================
export type {
  N8nProjectCreationRequest,
  N8nProject,
  N8nCriterion,
  N8nError,
  N8nProjectCreationResponse,
  TransformedProject,
  TransformedCriterion,
  ProjectCreationResult
} from './n8n.types';
