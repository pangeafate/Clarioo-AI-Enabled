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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { HeroSection } from './HeroSection';
import { RegistrationToggle } from './RegistrationToggle';
import { AnimatedInputs } from './AnimatedInputs';
import { ArtifactVisualization } from './ArtifactVisualization';
import { CardCarousel } from './CardCarousel';
import ProjectDashboard from '../ProjectDashboard';
import VendorDiscovery, { Project } from '../VendorDiscovery';

export const LandingPage = () => {
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up mode
  const [companyInput, setCompanyInput] = useState('');
  const [solutionInput, setSolutionInput] = useState('');

  // SP_010: Project workflow state management (pattern from Index.tsx)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  // SP_010: Project selection handlers
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    // Smooth scroll to workflow section
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
   * FUTURE INTEGRATION: Connect to Auth modal
   * Currently placeholder - will open auth modal/dialog
   */
  const handleOpenAuth = () => {
    console.log('Opening auth modal:', isSignUp ? 'Sign Up' : 'Sign In');
    // TODO: Implement auth modal/dialog opening logic
    // Example: setAuthModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-hero-bg"
    >
      {/* Hero Section - Elements 1 & 2 */}
      <HeroSection />

      {/* Registration Toggle - Element 3 */}
      <RegistrationToggle
        isSignUp={isSignUp}
        onToggle={setIsSignUp}
        onOpenAuth={handleOpenAuth}
        isAuthenticated={!!user}
      />

      {/* Element 4 - iPod Navigation: Placeholder for future implementation */}
      {/* TODO: Add iPodNavigation component when ready
      <section className="px-4 py-8">
        <iPodNavigation sections={['Hero', 'Inputs', 'Process', 'Workflow']} />
      </section>
      */}

      {/* Animated Inputs - Element 5 */}
      <AnimatedInputs
        isAuthenticated={!!user}
        companyInput={companyInput}
        solutionInput={solutionInput}
        onCompanyChange={setCompanyInput}
        onSolutionChange={setSolutionInput}
      />

      {/* SP_010: PRE-AUTH ONLY - Marketing Content */}
      <AnimatePresence>
        {!user && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Artifact Visualization - Element 6 (Pre-Auth Only - US-11.1) */}
            <ArtifactVisualization />

            {/* Card Carousel - Element 8 */}
            <CardCarousel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SP_010: POST-AUTH ONLY - Scrollable Canvas Workflow */}
      <AnimatePresence>
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Always show ProjectDashboard at the top */}
            <ProjectDashboard
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
    </motion.div>
  );
};
