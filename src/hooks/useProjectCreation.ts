/**
 * useProjectCreation Hook
 *
 * React hook for creating projects with AI-generated criteria via n8n workflow.
 * Handles the API call, loading state, error handling, and localStorage persistence.
 *
 * @module hooks/useProjectCreation
 */

import { useState, useCallback } from 'react';
import {
  createProjectWithAI,
  saveProjectToStorage,
  saveCriteriaToStorage,
} from '@/services/n8nService';
import type { ProjectCreationResult } from '@/types';

export interface UseProjectCreationReturn {
  /** Create a project with AI-generated criteria */
  createProject: (
    companyContext: string,
    solutionRequirements: string
  ) => Promise<ProjectCreationResult | null>;
  /** Whether a creation request is in progress */
  isCreating: boolean;
  /** Error message if creation failed */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Hook for creating projects with AI-generated criteria
 *
 * @example
 * ```typescript
 * const { createProject, isCreating, error } = useProjectCreation();
 *
 * const handleCreate = async () => {
 *   const result = await createProject(companyContext, solutionRequirements);
 *   if (result) {
 *     // Navigate to workflow with result.project.id
 *   }
 * };
 *
 * return (
 *   <button onClick={handleCreate} disabled={isCreating}>
 *     {isCreating ? 'Creating...' : 'Create with AI'}
 *   </button>
 *   {error && <div className="error">{error}</div>}
 * );
 * ```
 */
export const useProjectCreation = (): UseProjectCreationReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createProject = useCallback(async (
    companyContext: string,
    solutionRequirements: string
  ): Promise<ProjectCreationResult | null> => {
    setIsCreating(true);
    setError(null);

    try {
      // Call n8n API
      const result = await createProjectWithAI(companyContext, solutionRequirements);

      // Save to localStorage
      saveProjectToStorage(result.project);
      saveCriteriaToStorage(result.project.id, result.criteria);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createProject,
    isCreating,
    error,
    clearError,
  };
};

export default useProjectCreation;
