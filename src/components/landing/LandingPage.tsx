/**
 * LandingPage Component - Main Landing Page Integration
 *
 * @prototype Visual demonstration component
 * @purpose Single-page scrollable landing experience integrating all 8 UI elements
 *
 * FEATURES (SP_007):
 * - Integrates all landing page components into cohesive single-page experience
 * - Mobile-first responsive layout (80-90% mobile traffic)
 * - Clearbit-inspired visual design system
 * - State management for authentication and user inputs
 * - Smooth scroll navigation between sections
 *
 * ELEMENTS INTEGRATED:
 * 1. HeroSection (Elements 1 & 2): Title + Subtitle with gradient styling
 * 2. RegistrationToggle (Element 3): Sign In/Sign Up buttons above inputs
 * 3. [Element 4 - iPod Navigation]: Placeholder for future implementation
 * 4. AnimatedInputs (Element 5): Registration-gated inputs with hypnotic animations
 * 5. ArtifactVisualization (Element 6): Workflow visualization showing AI processing
 * 6. [Element 7 - Visual Step Indicator]: Placeholder for future implementation
 * 7. CardCarousel (Element 8): HubSpot-style interactive workflow carousel
 *
 * LAYOUT STRUCTURE:
 * - Gradient hero background for top sections
 * - White background for artifact visualization
 * - Alternating backgrounds for visual rhythm
 * - Generous spacing (16-24px) between sections
 *
 * STATE MANAGEMENT:
 * - Authentication status: From useAuth hook
 * - Input values: Company description + Solution requirements
 * - Sign Up/Sign In toggle: Controls auth modal state
 *
 * FUTURE INTEGRATION:
 * - Auth modal integration: Connect RegistrationToggle to actual auth flow
 * - Input submission: Connect AnimatedInputs to backend API
 * - iPod Navigation: Add quick-jump navigation to sections
 * - Visual Step Indicator: Add progress tracking for authenticated users
 *
 * @see SP_007 Sprint Plan - Phase 1, Task 1.2 (Main Landing Page Integration)
 * @see 00_PLAN/GL-RDD.md - Prototype documentation standards
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import { HeroSection } from './HeroSection';
import { RegistrationToggle } from './RegistrationToggle';
import { AnimatedInputs } from './AnimatedInputs';
import { ArtifactVisualization } from './ArtifactVisualization';
import { CardCarousel } from './CardCarousel';
import { CriteriaCreationAnimation } from './CriteriaCreationAnimation';
import { EmailCollectionModal } from '../email/EmailCollectionModal';
import { WebhookModeToggle } from '../WebhookModeToggle';
import ProjectDashboard from '../ProjectDashboard';
import VendorDiscovery, { Project } from '../VendorDiscovery';
import * as projectService from '@/services/mock/projectService';
import { saveCriteriaToStorage, hasSubmittedEmail, needsEmailRetry, retryEmailCollection } from '@/services/n8nService';

// SP_011: View mode type definition
type ViewMode = 'landing' | 'project';

export const LandingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createProject: createProjectWithAI, isCreating: isCreatingWithAI, error: aiError } = useProjectCreation();

  // SP_011: View state management - controls landing vs project view
  const [currentView, setCurrentView] = useState<ViewMode>('landing');

  // SP_011: Authentication state (temporarily disabled)
  // const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up mode

  const [companyInput, setCompanyInput] = useState('');
  const [solutionInput, setSolutionInput] = useState('');

  // State to track if inputs are expanded in project view
  const [inputsExpanded, setInputsExpanded] = useState(false);

  // Ref for click-outside detection on expanded inputs
  const inputsContainerRef = useRef<HTMLDivElement>(null);

  // Click-outside handler to collapse inputs in project view
  // Uses both mousedown and touchstart for desktop and mobile support
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        currentView === 'project' &&
        inputsExpanded &&
        inputsContainerRef.current &&
        !inputsContainerRef.current.contains(event.target as Node)
      ) {
        setInputsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [currentView, inputsExpanded]);

  // SP_010: Project workflow state management (pattern from Index.tsx)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showCreationAnimation, setShowCreationAnimation] = useState(false);
  const [pendingProject, setPendingProject] = useState<Project | null>(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0); // Force dashboard re-mount

  // SP_017: Email collection modal state
  const [showEmailModal, setShowEmailModal] = useState(false);

  // SP_011: View toggle handler
  const handleViewToggle = () => {
    const newView = currentView === 'landing' ? 'project' : 'landing';
    setCurrentView(newView);

    // When switching to project view, scroll to ProjectDashboard section
    if (newView === 'project') {
      setTimeout(() => {
        const projectsSection = document.getElementById('projects-section');
        if (projectsSection) {
          projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.log('projects-section not found in DOM');
        }
      }, 600);
    } else {
      // Scroll to top when switching to landing view
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // SP_010: Project selection handlers
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    // SP_011: Switch to project view when selecting a project
    setCurrentView('project');
    // Smooth scroll to workflow section
    setTimeout(() => {
      const workflowElement = document.getElementById('workflow-section');
      if (workflowElement) {
        workflowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  /**
   * SP_021: Handle template project creation
   * Called when user creates a project from a template
   */
  const handleTemplateProjectCreated = (project: Project) => {
    console.log('[LandingPage] Template project created:', project);

    // Select the new project
    setSelectedProject(project);

    // Switch to project view
    setCurrentView('project');

    // Force ProjectDashboard to re-mount and reload
    setProjectsLoaded(false);
    setDashboardRefreshKey(prev => prev + 1);

    // Scroll to workflow section
    setTimeout(() => {
      const workflowElement = document.getElementById('workflow-section');
      if (workflowElement) {
        workflowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Auto-select first project when projects are loaded
  const handleProjectsLoaded = (projects: Project[]) => {
    if (projects.length > 0 && !projectsLoaded) {
      // Auto-select first in-progress project, or first project if none are in-progress
      const inProgressProject = projects.find(p => p.status === 'in-progress');
      const projectToSelect = inProgressProject || projects[0];
      setSelectedProject(projectToSelect);
      setProjectsLoaded(true);
    }
  };

  /**
   * Handle animation complete - navigate to newly created project
   */
  const handleAnimationComplete = () => {
    setShowCreationAnimation(false);

    if (pendingProject) {
      // Select the new project, switch to project view, and scroll to workflow
      setSelectedProject(pendingProject);
      setCurrentView('project');
      setProjectsLoaded(false); // Reset to allow re-loading
      setDashboardRefreshKey(prev => prev + 1); // Force ProjectDashboard to re-mount and reload
      setPendingProject(null);

      // Scroll to workflow section
      setTimeout(() => {
        const workflowElement = document.getElementById('workflow-section');
        if (workflowElement) {
          workflowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  /**
   * SP_011: Create new project from category/example selection
   * Used by CategoryDropdown and ExamplesBulletPopover
   */
  const handleCreateCategoryProject = async (title: string, description: string) => {
    setIsCreatingProject(true);

    // Immediately scroll to projects section and show animation
    setCurrentView('project');
    setTimeout(() => {
      const projectsSection = document.getElementById('projects-section');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Show animation after scroll starts
      setShowCreationAnimation(true);
    }, 100);

    try {
      const { data, error } = await projectService.createProject({
        user_id: user?.id || 'user_demo_12345',
        name: title,
        description: description,
        category: 'General',
        status: 'draft',
        workflow_state: {
          current_step: 1,
          completed_steps: []
        }
      });

      if (error) throw new Error(error.message);
      if (!data) throw new Error('No data returned');

      // Map to Project interface
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Store pending project for animation completion handler
      setPendingProject(newProject);

      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    } catch (error) {
      setShowCreationAnimation(false);
      toast({
        title: "Error creating project",
        description: "Could not create the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  /**
   * Create new project from landing page inputs using n8n AI workflow
   * SP_016: Uses n8n to generate project name, description, category, and criteria
   * SP_017: Added email collection check before project creation
   *
   * Flow:
   * 1. Check if email has been submitted
   * 2. If not, show EmailCollectionModal (blocking)
   * 3. On email success, proceed with project creation
   * 4. Show animation IMMEDIATELY
   * 5. Call n8n API in background
   * 6. When n8n returns, store project and criteria
   * 7. Animation continues until complete
   * 8. On animation complete, show project in dashboard
   */
  const handleCreateProject = async () => {
    console.log('[LandingPage] ===== handleCreateProject START =====');

    // Validate inputs - at least one field must have 10+ characters for n8n
    const hasEnoughCompany = companyInput.trim().length >= 10;
    const hasEnoughSolution = solutionInput.trim().length >= 10;

    console.log('[LandingPage] Input validation:', { hasEnoughCompany, hasEnoughSolution });

    if (!hasEnoughCompany && !hasEnoughSolution) {
      console.log('[LandingPage] VALIDATION FAILED - returning early');
      toast({
        title: "More details needed",
        description: "Please provide at least 10 characters in one of the fields for AI processing.",
        variant: "destructive",
      });
      return;
    }

    // SP_017: Check if email has been submitted
    const emailSubmitted = hasSubmittedEmail();
    console.log('[LandingPage] Email submitted check:', emailSubmitted);
    console.log('[LandingPage] localStorage clarioo_email:', localStorage.getItem('clarioo_email'));

    if (!emailSubmitted) {
      // Show email collection modal (blocking)
      console.log('[LandingPage] ===== EMAIL NOT SUBMITTED - SHOWING MODAL AND RETURNING =====');
      setShowEmailModal(true);
      console.log('[LandingPage] showEmailModal set to true, now RETURNING');
      return;
    }

    console.log('[LandingPage] ===== EMAIL ALREADY SUBMITTED - PROCEEDING WITH PROJECT CREATION =====');

    // SP_017: Check if email needs silent retry
    if (needsEmailRetry()) {
      retryEmailCollection().catch(err => {
        console.error('[email-retry] Silent retry failed:', err);
        // Continue anyway - will retry on next action
      });
    }

    // Proceed with project creation
    proceedWithProjectCreation();
  };

  /**
   * SP_017: Handle email collection success
   */
  const handleEmailSuccess = () => {
    console.log('[LandingPage] ===== EMAIL SUCCESS CALLBACK =====');
    setShowEmailModal(false);
    console.log('[LandingPage] Modal closed, now calling proceedWithProjectCreation');
    // Proceed with actual project creation
    proceedWithProjectCreation();
  };

  /**
   * SP_017: Handle email modal close (user clicked outside)
   */
  const handleEmailModalClose = () => {
    setShowEmailModal(false);
  };

  /**
   * SP_017: Actual project creation logic (extracted from handleCreateProject)
   */
  const proceedWithProjectCreation = async () => {
    console.log('[LandingPage] ===== proceedWithProjectCreation START =====');
    setIsCreatingProject(true);

    // IMMEDIATELY show animation and switch to project view
    console.log('[LandingPage] Setting currentView to project and showing animation');
    setCurrentView('project');
    setShowCreationAnimation(true);

    setTimeout(() => {
      const projectsSection = document.getElementById('projects-section');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    try {
      console.log('[LandingPage] Calling n8n AI to create project...');

      // FIX: Read from localStorage instead of state (state might be stale/cleared during re-renders)
      // AnimatedInputs saves to localStorage on every keystroke, so data is always available there
      const companyContext = localStorage.getItem('landing_company_info') || '';
      const solutionRequirements = localStorage.getItem('landing_tech_needs') || '';

      console.log('[LandingPage] Retrieved from localStorage:', {
        companyLength: companyContext.length,
        solutionLength: solutionRequirements.length
      });

      // Call n8n AI to generate project and criteria
      const result = await createProjectWithAI(companyContext.trim(), solutionRequirements.trim());

      console.log('[LandingPage] n8n API result:', result);

      if (!result) {
        throw new Error(aiError || 'Failed to create project with AI');
      }

      // Map transformed project to Project interface for VendorDiscovery
      const newProject: Project = {
        id: result.project.id,
        name: result.project.name,
        description: result.project.description,
        status: result.project.status,
        created_at: result.project.created_at,
        updated_at: result.project.updated_at,
        category: result.project.category,
      };

      // Store pending project for animation completion handler
      setPendingProject(newProject);

      // Clear localStorage landing inputs since they've been used
      localStorage.removeItem('landing_company_info');
      localStorage.removeItem('landing_tech_needs');

      toast({
        title: "Project created with AI",
        description: `Generated ${result.criteria.length} evaluation criteria for "${result.project.name}"`,
      });
    } catch (error) {
      console.error('[LandingPage] Project creation failed:', error);
      // Hide animation on error
      setShowCreationAnimation(false);
      const errorMessage = error instanceof Error ? error.message : 'Could not create the project';
      toast({
        title: "AI Project Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Go back to landing view on error
      setCurrentView('landing');
    } finally {
      setIsCreatingProject(false);
    }
  };

  /**
   * SP_011: Authentication temporarily disabled for registration-free experience
   * FUTURE INTEGRATION: Re-enable when auth is needed
   */
  // const handleOpenAuth = () => {
  //   console.log('Opening auth modal:', isSignUp ? 'Sign Up' : 'Sign In');
  //   // TODO: Implement auth modal/dialog opening logic
  //   // Example: setAuthModalOpen(true);
  // };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-hero-bg"
    >
      {/* Hero Section - Elements 1 & 2 */}
      <HeroSection
        currentView={currentView}
        onViewToggle={handleViewToggle}
        onTemplateProjectCreated={handleTemplateProjectCreated}
      />

      {/* Element 4 - iPod Navigation: Placeholder for future implementation */}
      {/* TODO: Add iPodNavigation component when ready
      <section className="px-4 py-8">
        <iPodNavigation sections={['Hero', 'Inputs', 'Process', 'Workflow']} />
      </section>
      */}

      {/* SP_011: Authentication Toggle - TEMPORARILY DISABLED for registration-free experience */}
      {/* FUTURE: Re-enable when auth is needed */}
      {/* <RegistrationToggle
        isSignUp={isSignUp}
        onToggle={setIsSignUp}
        onOpenAuth={handleOpenAuth}
        isAuthenticated={!!user}
      /> */}

      {/* Animated Inputs - Element 5 */}
      {/* In landing view: always show inputs */}
      {/* In project view: show "+ New Project" button that expands inputs */}
      {currentView === 'project' && !inputsExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-6"
        >
          <Button
            onClick={() => setInputsExpanded(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </motion.div>
      )}

      {(currentView === 'landing' || inputsExpanded) && (
        <div ref={currentView === 'project' ? inputsContainerRef : undefined}>
          <AnimatedInputs
            isAuthenticated={!!user}
            companyInput={companyInput}
            solutionInput={solutionInput}
            onCompanyChange={setCompanyInput}
            onSolutionChange={setSolutionInput}
            onCreateProject={() => {
              handleCreateProject();
              // Collapse inputs after project creation in project view
              if (currentView === 'project') {
                setInputsExpanded(false);
                setCompanyInput('');
                setSolutionInput('');
              }
            }}
            onCreateCategoryProject={handleCreateCategoryProject}
            isCreating={isCreatingWithAI || isCreatingProject}
          />
        </div>
      )}

      {/* SP_011: LANDING VIEW - Marketing Content */}
      <AnimatePresence>
        {currentView === 'landing' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Artifact Visualization - Element 6 */}
            <ArtifactVisualization />

            {/* Card Carousel - Element 8 */}
            <CardCarousel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SP_011: PROJECT VIEW - Scrollable Canvas Workflow */}
      <AnimatePresence>
        {currentView === 'project' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Always show ProjectDashboard at the top */}
            <ProjectDashboard
              key={dashboardRefreshKey}
              onSelectProject={handleSelectProject}
              selectedProjectId={selectedProject?.id}
              onProjectsLoaded={handleProjectsLoaded}
            />

            {/* Show workflow below when project is selected */}
            {selectedProject && (
              <div id="workflow-section" className="scroll-mt-4">
                <VendorDiscovery
                  project={selectedProject}
                  isEmbedded={true}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Element 7 - Visual Step Indicator: Placeholder for future implementation */}
      {/* TODO: Add VisualStepIndicator component when ready
      {!!user && (
        <section className="px-4 py-8 bg-white">
          <VisualStepIndicator currentStep={1} totalSteps={5} />
        </section>
      )}
      */}

      {/* Footer Spacer */}
      <div className="h-16" />

      {/* Criteria Creation Animation */}
      <CriteriaCreationAnimation
        isOpen={showCreationAnimation}
        onComplete={handleAnimationComplete}
        isApiComplete={pendingProject !== null}
      />

      {/* SP_017: Email Collection Modal */}
      <EmailCollectionModal
        isOpen={showEmailModal}
        onSuccess={handleEmailSuccess}
        onClose={handleEmailModalClose}
      />

      {/* Webhook Mode Toggle - Only show on landing page, not in projects view */}
      {currentView === 'landing' && <WebhookModeToggle />}
    </motion.div>
  );
};
