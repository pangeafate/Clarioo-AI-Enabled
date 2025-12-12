/**
 * Template Service
 *
 * This service handles template-related operations including:
 * - Loading templates from JSON data
 * - Filtering templates by category
 * - Creating projects from templates
 *
 * @module services/templateService
 */

import type { Template } from '@/types/template.types';
import type { Criterion } from '@/types/criteria.types';
import type { Project } from '@/types/project.types';
import templatesData from '@/data/templates/templates.json';

/**
 * Generate unique ID for projects
 */
const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Load all templates from JSON data
 *
 * @returns Promise resolving to array of all templates
 *
 * @example
 * ```typescript
 * const templates = await getTemplates();
 * console.log(`Loaded ${templates.length} templates`);
 * ```
 */
export async function getTemplates(): Promise<Template[]> {
  // Simulate async loading (useful for future API integration)
  return Promise.resolve(templatesData as Template[]);
}

/**
 * Get template by ID
 *
 * @param id - Template ID to find
 * @returns Template if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const template = getTemplateById('luxury-fashion-retailer-001');
 * if (template) {
 *   console.log(`Found template: ${template.name}`);
 * }
 * ```
 */
export function getTemplateById(id: string): Template | undefined {
  return (templatesData as Template[]).find(t => t.templateId === id);
}

/**
 * Get unique categories from all templates
 *
 * @returns Array of unique category names
 *
 * @example
 * ```typescript
 * const categories = getTemplateCategories();
 * // Returns: ['CX Platform', 'Project Management', 'CRM', ...]
 * ```
 */
export function getTemplateCategories(): string[] {
  const templates = templatesData as Template[];
  const categories = templates.map(t => t.category);
  return Array.from(new Set(categories)).sort();
}

/**
 * Filter templates by categories
 *
 * @param templates - Array of templates to filter
 * @param categories - Array of category names to filter by
 * @returns Filtered templates matching any of the specified categories
 *
 * @example
 * ```typescript
 * const allTemplates = await getTemplates();
 * const cxTemplates = filterTemplatesByCategories(allTemplates, ['CX Platform']);
 * ```
 */
export function filterTemplatesByCategories(
  templates: Template[],
  categories: string[]
): Template[] {
  if (categories.length === 0) {
    return templates;
  }
  return templates.filter(t => categories.includes(t.category));
}

/**
 * Get projects from localStorage
 *
 * @returns Array of projects
 */
function getProjects(): Project[] {
  try {
    const data = localStorage.getItem('clarioo_projects');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading projects from localStorage:', error);
    return [];
  }
}

/**
 * Create project from template
 *
 * This function:
 * 1. Generates a new project ID
 * 2. Creates a project object with template data
 * 3. Saves project to localStorage
 * 4. Saves criteria to localStorage
 * 5. Saves workflow state to localStorage
 *
 * @param template - Template to create project from
 * @returns Promise with project ID and success status
 *
 * @example
 * ```typescript
 * const template = getTemplateById('luxury-fashion-retailer-001');
 * if (template) {
 *   const result = await createProjectFromTemplate(template);
 *   if (result.success) {
 *     console.log(`Created project: ${result.projectId}`);
 *     navigate(`/vendor-discovery/${result.projectId}`);
 *   }
 * }
 * ```
 *
 * @remarks
 * - Does NOT call n8n webhook (templates are pre-configured)
 * - Saves to localStorage only
 * - Sets currentStep to 'criteria-builder' (user can review/modify criteria)
 * - Transforms template criteria to match app format
 */
export async function createProjectFromTemplate(
  template: Template
): Promise<{ projectId: string; success: boolean; error?: string }> {
  try {
    // 1. Generate project ID
    const projectId = generateId();
    const now = new Date().toISOString();

    // 2. Compile project description from template fields
    // Format: "I am [companyType], with [companyDetails], looking for the following solution [lookingFor] because my current tools [currentTool] lead to the following problem [painQuote]"
    const descriptionParts: string[] = [];

    if (template.companyType) {
      descriptionParts.push(`I am ${template.companyType}`);
    }

    if (template.companyDetails) {
      descriptionParts.push(`with ${template.companyDetails}`);
    }

    if (template.lookingFor) {
      descriptionParts.push(`looking for the following solution ${template.lookingFor}`);
    }

    if (template.currentTool && template.painQuote) {
      descriptionParts.push(`because my current tools ${template.currentTool} lead to the following problem ${template.painQuote}`);
    } else if (template.painQuote) {
      descriptionParts.push(`to solve ${template.painQuote}`);
    }

    const compiledDescription = descriptionParts.join(', ');

    // 3. Create project object
    const project: Project = {
      id: projectId,
      name: template.lookingFor,
      description: compiledDescription,
      category: template.category,
      status: 'in-progress',
      created_at: now,
      updated_at: now,
    };

    // 3. Save to localStorage - projects list
    const projects = getProjects();
    projects.push(project);
    localStorage.setItem('clarioo_projects', JSON.stringify(projects));

    // 4. Transform and save criteria
    // Template criteria use Criterion interface, need to ensure isArchived is set
    const criteria: Criterion[] = template.criteria.map(c => ({
      ...c,
      isArchived: c.isArchived || false,
      // Ensure explanation is populated (template uses 'explanation')
      explanation: c.explanation || c.description || '',
    }));

    localStorage.setItem(`criteria_${projectId}`, JSON.stringify(criteria));

    // 5. Save workflow state
    // Set to 'criteria-builder' so user can review/modify criteria before vendor discovery
    const workflowState = {
      currentStep: 'criteria-builder',
      techRequest: {
        category: template.category,
        description: compiledDescription,
        companyInfo: template.companyDetails || '',
      },
      criteria: criteria,
      selectedVendors: [],
    };

    localStorage.setItem(`workflow_${projectId}`, JSON.stringify(workflowState));

    console.log('[templateService] Created project from template:', {
      projectId,
      templateId: template.templateId,
      projectName: template.lookingFor,
      compiledDescription,
      criteriaCount: criteria.length,
    });

    return { projectId, success: true };
  } catch (error) {
    console.error('[templateService] Error creating project from template:', error);
    return {
      projectId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}
