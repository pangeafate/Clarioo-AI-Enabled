/**
 * 🎨 MOCK PROJECT SERVICE
 *
 * Purpose: Simulates project management operations for visual prototype.
 * Uses dummy data from /src/data/api/projects.json without real backend.
 *
 * Mock Behavior:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Persistent localStorage storage (survives page refresh)
 * - Simulates realistic network delays (200-500ms)
 * - Category and status-based filtering
 * - Workflow state tracking (5-step process)
 * - Project statistics and counts
 *
 * Integration Notes:
 * - When integrating Supabase, replace with supabase.from('projects') queries
 * - Type interfaces match database schema for easy migration
 * - Remove all simulateDelay() calls
 * - Remove projectsData import and projects array
 * - Replace in-memory operations with database queries
 * - Add proper error handling for database errors
 * - Implement user authentication checks
 *
 * @module services/mock/projectService
 */

import projectsData from '@/data/api/projects.json';
import { simulateDelay, generateId, getCurrentTimestamp } from '@/utils/mockHelpers';
import { filterByUserId, filterByStatus } from '@/utils/dataTransformers';
import type {
  Project,
  WorkflowState,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStatus,
  ApiError
} from '@/types';

// Workflow step data can contain any fields
export interface WorkflowStepData {
  [key: string]: any;
}

// localStorage key for project persistence
const PROJECTS_STORAGE_KEY = 'mock_projects';

// Helper to get projects from localStorage
const getStoredProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // If no stored projects, use initial dummy data
    return [...projectsData] as Project[];
  } catch (error) {
    console.error('Failed to parse stored projects:', error);
    return [...projectsData] as Project[];
  }
};

// Helper to save projects to localStorage
const saveProjects = (projectsToSave: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsToSave));
  } catch (error) {
    console.error('Failed to save projects:', error);
  }
};

// In-memory project storage with localStorage backup
let projects: Project[] = getStoredProjects();

/**
 * Get all projects for a user
 *
 * Purpose: Retrieves all projects belonging to a specific user.
 * Primary method for fetching user's project list.
 *
 * Mock Behavior:
 * - Filters in-memory projects by user_id
 * - Returns all matching projects (no pagination in prototype)
 * - Always succeeds
 * - Simulates 300ms network delay
 *
 * @param userId - User ID (defaults to demo user for prototype)
 * @returns Promise resolving to array of user's projects
 *
 * @example
 * ```typescript
 * const { data, error } = await getProjects('user_123');
 * if (data) {
 *   console.log(`Found ${data.length} projects`);
 * }
 * ```
 *
 * @remarks
 * - Replace with supabase.from('projects').select().eq('user_id', userId) for production
 * - Real implementation should include pagination
 * - Should verify user authentication before fetching
 * - Consider adding sorting options
 */
export const getProjects = async (
  userId: string = 'user_demo_12345'
): Promise<{ data: Project[] | null; error: ApiError | null }> => {
  await simulateDelay(300);

  // Filter projects by user_id using utility
  const userProjects = filterByUserId(projects, userId);

  return {
    data: userProjects,
    error: null
  };
};

/**
 * Get a single project by ID
 *
 * Purpose: Retrieves detailed information for a specific project.
 * Used for project detail pages and editing.
 *
 * Mock Behavior:
 * - Searches in-memory projects by ID
 * - Returns NOT_FOUND error if project doesn't exist
 * - Simulates 200ms network delay
 *
 * @param projectId - Unique project identifier
 * @returns Promise resolving to project data or error
 *
 * @example
 * ```typescript
 * const { data, error } = await getProject('proj_123');
 * if (error) {
 *   console.error('Project not found');
 * } else {
 *   console.log('Project:', data.name);
 * }
 * ```
 *
 * @remarks
 * - Replace with supabase.from('projects').select().eq('id', projectId).single() for production
 * - Should verify user has access to this project
 * - Consider including related data (criteria, vendors, etc.)
 */
export const getProject = async (
  projectId: string
): Promise<{ data: Project | null; error: ApiError | null }> => {
  await simulateDelay(200);

  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return {
      data: null,
      error: { message: 'Project not found', code: 'NOT_FOUND', status: 404 }
    };
  }

  return {
    data: project,
    error: null
  };
};

/**
 * Create a new project
 *
 * Purpose: Creates a new vendor discovery project.
 * Initializes project with default workflow state.
 *
 * Mock Behavior:
 * - Validates required fields (name, category)
 * - Generates unique project ID
 * - Sets default status ('draft') if not provided
 * - Initializes workflow state at step 1
 * - Sets created_at and updated_at timestamps
 * - Adds to in-memory storage
 * - Simulates 500ms network delay
 *
 * @param projectData - Project data without auto-generated fields
 * @returns Promise resolving to created project or validation error
 *
 * @example
 * ```typescript
 * const { data, error } = await createProject({
 *   user_id: 'user_123',
 *   name: 'CRM Selection',
 *   description: 'Find the best CRM for our sales team',
 *   category: 'CRM Software',
 *   status: 'draft'
 * });
 * ```
 *
 * @remarks
 * - Replace with supabase.from('projects').insert() for production
 * - Real implementation should auto-populate user_id from session
 * - Should validate category against allowed values
 * - Consider transaction for creating project + initial workflow records
 */
export const createProject = async (
  projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Project | null; error: ApiError | null }> => {
  await simulateDelay(500);

  // Validate required fields
  if (!projectData.name || !projectData.category) {
    return {
      data: null,
      error: { message: 'Name and category are required', code: 'VALIDATION_ERROR', status: 400 }
    };
  }

  // Create new project with generated ID and timestamps
  const now = getCurrentTimestamp();
  const newProject: Project = {
    id: generateId('project'),
    name: projectData.name,
    description: projectData.description || null,
    status: projectData.status || 'draft',
    created_at: now,
    updated_at: now,
    user_id: projectData.user_id,
    category: projectData.category,
    workflow_state: projectData.workflow_state || {
      current_step: 1,
      completed_steps: []
    }
  };

  // Add to in-memory storage
  projects.push(newProject);

  // Persist to localStorage
  saveProjects(projects);

  return {
    data: newProject,
    error: null
  };
};

/**
 * Update an existing project
 *
 * Purpose: Updates project fields.
 * Used for editing project details, changing status, updating workflow.
 *
 * Mock Behavior:
 * - Searches for project by ID
 * - Returns NOT_FOUND if project doesn't exist
 * - Merges updates with existing project data
 * - Updates updated_at timestamp automatically
 * - Prevents updating id and created_at
 * - Simulates 400ms network delay
 *
 * @param projectId - ID of project to update
 * @param updates - Partial project object with fields to update
 * @returns Promise resolving to updated project or error
 *
 * @example
 * ```typescript
 * const { data, error } = await updateProject('proj_123', {
 *   name: 'Updated Project Name',
 *   status: 'in-progress'
 * });
 * ```
 *
 * @remarks
 * - Replace with supabase.from('projects').update().eq('id', projectId) for production
 * - Should verify user owns this project
 * - Consider validating status transitions
 * - Real implementation should use optimistic locking (version field)
 */
export const updateProject = async (
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'created_at'>>
): Promise<{ data: Project | null; error: ApiError | null }> => {
  await simulateDelay(400);

  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return {
      data: null,
      error: { message: 'Project not found', code: 'NOT_FOUND', status: 404 }
    };
  }

  // Update project with new timestamp
  projects[projectIndex] = {
    ...projects[projectIndex],
    ...updates,
    updated_at: getCurrentTimestamp()
  };

  // Persist to localStorage
  saveProjects(projects);

  return {
    data: projects[projectIndex],
    error: null
  };
};

/**
 * Delete a project
 *
 * @param projectId - Project ID to delete
 * @returns Promise with success/error
 */
export const deleteProject = async (
  projectId: string
): Promise<{ error: ProjectError | null }> => {
  await simulateDelay(300);

  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return {
      error: { message: 'Project not found', code: 'NOT_FOUND' }
    };
  }

  // Remove project from storage
  projects.splice(projectIndex, 1);

  // Persist to localStorage
  saveProjects(projects);

  return { error: null };
};

/**
 * Update project workflow state
 * Helper function to update workflow progress
 *
 * @param projectId - Project ID
 * @param workflowUpdates - Workflow state updates
 * @returns Promise with updated project
 */
export const updateWorkflowState = async (
  projectId: string,
  workflowUpdates: Partial<WorkflowState>
): Promise<{ data: Project | null; error: ApiError | null }> => {
  await simulateDelay(300);

  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return {
      data: null,
      error: { message: 'Project not found', code: 'NOT_FOUND', status: 404 }
    };
  }

  // Merge workflow state with updated timestamp
  projects[projectIndex] = {
    ...projects[projectIndex],
    workflow_state: {
      ...projects[projectIndex].workflow_state,
      ...workflowUpdates
    },
    updated_at: getCurrentTimestamp()
  };

  // Persist to localStorage
  saveProjects(projects);

  return {
    data: projects[projectIndex],
    error: null
  };
};

/**
 * Complete a workflow step
 * Marks a step as completed and moves to next step
 *
 * @param projectId - Project ID
 * @param stepNumber - Step number to complete
 * @param stepData - Data for the completed step
 * @returns Promise with updated project
 */
export const completeWorkflowStep = async (
  projectId: string,
  stepNumber: number,
  stepData: WorkflowStepData
): Promise<{ data: Project | null; error: ApiError | null }> => {
  await simulateDelay(300);

  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return {
      data: null,
      error: { message: 'Project not found', code: 'NOT_FOUND', status: 404 }
    };
  }

  const project = projects[projectIndex];
  const completedSteps = [...project.workflow_state.completed_steps];

  // Add step to completed if not already there
  if (!completedSteps.includes(stepNumber)) {
    completedSteps.push(stepNumber);
  }

  // Update workflow state with new timestamp
  projects[projectIndex] = {
    ...project,
    workflow_state: {
      ...project.workflow_state,
      current_step: stepNumber + 1,
      completed_steps: completedSteps,
      [`step_${stepNumber}_data`]: stepData
    },
    updated_at: getCurrentTimestamp()
  };

  // Persist to localStorage
  saveProjects(projects);

  return {
    data: projects[projectIndex],
    error: null
  };
};

/**
 * Get projects by category
 *
 * @param category - Project category
 * @param userId - User ID (optional)
 * @returns Promise with filtered projects
 */
export const getProjectsByCategory = async (
  category: string,
  userId: string = 'user_demo_12345'
): Promise<{ data: Project[] | null; error: ProjectError | null }> => {
  await simulateDelay(250);

  const filteredProjects = projects.filter(
    p => p.category === category && p.user_id === userId
  );

  return {
    data: filteredProjects,
    error: null
  };
};

/**
 * Get projects by status
 *
 * @param status - Project status
 * @param userId - User ID (optional)
 * @returns Promise with filtered projects
 */
export const getProjectsByStatus = async (
  status: Project['status'],
  userId: string = 'user_demo_12345'
): Promise<{ data: Project[] | null; error: ProjectError | null }> => {
  await simulateDelay(250);

  const filteredProjects = projects.filter(
    p => p.status === status && p.user_id === userId
  );

  return {
    data: filteredProjects,
    error: null
  };
};

/**
 * Reset projects to initial dummy data
 * Utility function for testing
 * Also clears localStorage to start fresh
 */
export const resetProjects = (): void => {
  projects = [...projectsData];
  saveProjects(projects);
};

/**
 * Get project count by status
 * Utility for dashboard metrics
 */
export const getProjectCounts = async (
  userId: string = 'user_demo_12345'
): Promise<{
  total: number;
  draft: number;
  in_progress: number;
  completed: number;
  archived: number;
}> => {
  await simulateDelay(200);

  const userProjects = projects.filter(p => p.user_id === userId);

  return {
    total: userProjects.length,
    draft: userProjects.filter(p => p.status === 'draft').length,
    in_progress: userProjects.filter(p => p.status === 'in_progress').length,
    completed: userProjects.filter(p => p.status === 'completed').length,
    archived: userProjects.filter(p => p.status === 'archived').length
  };
};
