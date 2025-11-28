import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle, LogOut, User, ArrowLeft, Save, Sparkles, RefreshCw, Square } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CriteriaBuilder from "./vendor-discovery/CriteriaBuilder";
import VendorSelection from "./vendor-discovery/VendorSelection";
import { VendorComparison } from "./VendorComparison";
import VendorInviteNew from "./vendor-discovery/VendorInviteNew";
import { WorkflowNavigation, WORKFLOW_STEPS, type Step } from "./WorkflowNavigation";
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { getCriteriaFromStorage, getProjectByIdFromStorage, needsEmailRetry, retryEmailCollection } from '@/services/n8nService';

/**
 * GAP-1: Workflow State Persistence Structure
 * Stores complete workflow state in localStorage for seamless continuation
 */
interface WorkflowState {
  projectId: string;
  currentStep: Step;
  maxStepReached: number; // Tracks the furthest step user has reached
  lastSaved: string; // ISO timestamp
  techRequest: TechRequest | null;
  criteria: Criteria[];
  selectedVendors: Vendor[];
  shortlistedVendorIds: string[]; // Vendor IDs shortlisted for outreach in invite-pitch stage
}

export interface TechRequest {
  category: string;
  description: string;
  companyInfo?: string;
}

export interface Criteria {
  id: string;
  name: string;
  explanation: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
  isArchived?: boolean; // SP_014: Archive state for low-importance criteria
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, 'yes' | 'no' | 'unknown' | 'star'>;
  criteriaAnswers: Record<string, { yesNo: 'yes' | 'no' | 'partial'; comment: string; }>;
  features: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  category?: string; // SP_016: AI-determined category from n8n
}

export interface VendorDiscoveryProps {
  project: Project;
  onBackToProjects?: () => void;
  isEmbedded?: boolean;
}

/**
 * Helper function to get explanation from criterion
 * Now relies on n8n to provide explanations - no mock data fallback
 */
const backfillExplanation = (criterion: Criteria): string => {
  if (criterion.explanation && criterion.explanation.trim() !== '') {
    return criterion.explanation;
  }
  // No explanation found - n8n should have provided it
  return '';
};

const VendorDiscovery = ({ project, onBackToProjects, isEmbedded = false }: VendorDiscoveryProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('criteria');
  const [maxStepReached, setMaxStepReached] = useState<number>(0); // Track furthest step reached
  const [techRequest, setTechRequest] = useState<TechRequest | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
  const [shortlistedVendorIds, setShortlistedVendorIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isComparisonGenerating, setIsComparisonGenerating] = useState(false);
  const [shouldTriggerDiscovery, setShouldTriggerDiscovery] = useState(false); // Flag to trigger vendor discovery manually

  const storageKey = `workflow_${project.id}`;

  // Listen for comparison generation status from VendorComparison
  useEffect(() => {
    const handleGenerationStatus = (event: CustomEvent<{ isGenerating: boolean }>) => {
      setIsComparisonGenerating(event.detail.isGenerating);
    };

    window.addEventListener('comparisonGenerationStatus', handleGenerationStatus as EventListener);
    return () => {
      window.removeEventListener('comparisonGenerationStatus', handleGenerationStatus as EventListener);
    };
  }, []);

  /**
   * GAP-1 FIX: Load workflow state from localStorage on mount
   * - Restores previous workflow progress if it exists
   * - Shows toast notification when restored
   * - Ensures seamless continuation across sessions
   *
   * GAP-5 FIX: Initialize techRequest from project data if not in localStorage
   * - Creates techRequest from project.description and project.name
   * - Enables Criteria Builder to work for newly created projects
   *
   * 🐛 CRITICAL FIX: Always prioritize n8n storage for criteria
   * - n8n storage is the source of truth for criteria
   * - Workflow state is only for navigation/vendors/other state
   * - This prevents old criteria from persisting when switching projects
   */
  useEffect(() => {
    const loadWorkflowState = () => {
      // 🔥 FIX: IMMEDIATELY reset to 'criteria' when project loads to prevent stale state
      // This prevents VendorSelection from rendering with old project's 'vendor-selection' step
      setCurrentStep('criteria');

      // Set loading to true when project changes to prevent showing stale state
      setIsLoading(true);

      try {
        // 🔥 ALWAYS load fresh criteria from n8n storage first (source of truth)
        const n8nCriteria = getCriteriaFromStorage(project.id);
        const n8nProject = getProjectByIdFromStorage(project.id);

        console.log('[VendorDiscovery] Loading project', {
          projectId: project.id,
          n8nCriteriaCount: n8nCriteria.length,
          hasN8nProject: !!n8nProject
        });

        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const state: WorkflowState = JSON.parse(savedState);

          // 🐛 BUGFIX: Auto-detect and clear old AI-generated criterion IDs
          // Check if criteria have old 'ai-X' format instead of 'crm_X' format
          if (state.criteria && state.criteria.length > 0) {
            const hasOldAIIds = state.criteria.some(c => c.id.startsWith('ai-'));
            if (hasOldAIIds) {
              console.warn('⚠️ Detected old AI-generated criterion IDs (ai-X format). Clearing localStorage and forcing fresh start with crm-X IDs...');
              localStorage.removeItem(storageKey);
              toast({
                title: "🔄 Workflow Reset Required",
                description: "Old data format detected. Please restart the workflow from the beginning.",
                variant: "destructive",
                duration: 5000,
              });
              setIsLoading(false);
              return; // Don't restore old state
            }
          }

          // 🔥 FIX: For projects with n8n-generated criteria, ALWAYS start at 'criteria' step for review
          // This prevents auto-triggering vendor discovery when user clicks "Explore with Clarioo"
          const hasN8nCriteria = n8nCriteria.length > 0;

          // GAP-5: Handle legacy data with 'tech-input' step (removed in this update)
          // If currentStep is 'tech-input', default to 'criteria' instead
          const validatedStep = hasN8nCriteria ? 'criteria' :  // Force criteria review for n8n projects
            state.currentStep === 'tech-input' ? 'criteria' :
            state.currentStep;

          // Restore workflow navigation state
          console.log('[VendorDiscovery] 🔧 Setting currentStep:', validatedStep, '(hasN8nCriteria:', hasN8nCriteria, ')');
          setCurrentStep(validatedStep);
          setMaxStepReached(state.maxStepReached || 0); // Default to 0 if not set
          setTechRequest(state.techRequest);

          // 🔥 CRITICAL: Always use n8n criteria if available (source of truth)
          // Only fall back to workflow state criteria if n8n has none
          if (n8nCriteria.length > 0) {
            const mappedCriteria: Criteria[] = n8nCriteria.map(c => ({
              id: c.id,
              name: c.name,
              explanation: c.explanation,
              importance: c.importance,
              type: c.type,
              isArchived: c.isArchived || false
            }));

            setCriteria(mappedCriteria);
            console.log('✅ Using fresh n8n criteria (overriding workflow state)', {
              n8nCount: mappedCriteria.length,
              workflowCount: state.criteria.length
            });
          } else {
            // No n8n criteria - fall back to workflow state
            const migratedCriteria = state.criteria.map(c => ({
              ...c,
              explanation: backfillExplanation(c)
            }));
            setCriteria(migratedCriteria);

            const withoutExplanation = migratedCriteria.filter(c => !c.explanation || c.explanation.trim() === '').length;
            if (withoutExplanation > 0) {
              console.warn(`⚠️ ${withoutExplanation} of ${migratedCriteria.length} criteria still have no explanations after migration`);
            }
            console.log('✅ Using workflow state criteria (no n8n criteria found)', {
              criteriaCount: migratedCriteria.length
            });
          }

          setSelectedVendors(state.selectedVendors);
          setShortlistedVendorIds(state.shortlistedVendorIds || []); // Default to empty array for legacy data
          setLastSaved(state.lastSaved);

          // Show success feedback
          toast({
            title: "✨ Workflow restored",
            description: `Loaded your progress from ${new Date(state.lastSaved).toLocaleString()}`,
            duration: 3000,
          });

          console.log('✅ Workflow state loaded from localStorage (GAP-1)', {
            currentStep: validatedStep,
            wasLegacyTechInput: state.currentStep === 'tech-input',
            hasRequest: !!state.techRequest,
            criteriaCount: (n8nCriteria.length > 0 ? n8nCriteria.length : state.criteria.length),
            vendorCount: state.selectedVendors.length,
            shortlistedCount: (state.shortlistedVendorIds || []).length
          });
        } else {
          // GAP-5: No saved state - initialize techRequest from project data
          // SP_016: Check for n8n-generated criteria first

          // CRITICAL: Reset workflow state to initial values for new projects
          // This ensures new projects start fresh at step 1
          setCurrentStep('criteria');
          setMaxStepReached(0);
          setSelectedVendors([]);
          setShortlistedVendorIds([]);
          setLastSaved(null);

          if (n8nCriteria.length > 0) {
            // SP_016: We have n8n-generated criteria - use them
            console.log('✅ Loading n8n-generated criteria', {
              projectId: project.id,
              criteriaCount: n8nCriteria.length
            });

            // Map n8n criteria to app format
            const mappedCriteria: Criteria[] = n8nCriteria.map(c => ({
              id: c.id,
              name: c.name,
              explanation: c.explanation,
              importance: c.importance,
              type: c.type,
              isArchived: c.isArchived || false
            }));

            setCriteria(mappedCriteria);

            // Initialize techRequest from n8n project data
            const initialRequest: TechRequest = {
              category: n8nProject?.category || 'General',
              description: n8nProject?.techRequest?.solutionRequirements || project.name || '',
              companyInfo: n8nProject?.techRequest?.companyContext || project.description || ''
            };

            setTechRequest(initialRequest);

            toast({
              title: "AI-generated criteria loaded",
              description: `${mappedCriteria.length} evaluation criteria ready for review`,
              duration: 3000,
            });
          } else {
            // No n8n criteria - reset criteria as well
            setCriteria([]);

            // Parse project description to extract category and companyInfo
            const initialRequest: TechRequest = {
              category: 'General', // Default category
              description: project.name || '',
              companyInfo: project.description || ''
            };

            setTechRequest(initialRequest);

            console.log('✅ Initialized techRequest from project data (GAP-5)', {
              projectId: project.id,
              projectName: project.name,
              hasDescription: !!project.description
            });
          }
        }
      } catch (error) {
        console.error('Failed to load workflow state:', error);

        // Reset all state to initial values on error
        setCurrentStep('criteria');
        setMaxStepReached(0);
        setSelectedVendors([]);
        setShortlistedVendorIds([]);
        setCriteria([]);
        setLastSaved(null);

        // GAP-5: On error, still initialize techRequest from project data
        const initialRequest: TechRequest = {
          category: 'General',
          description: project.name || '',
          companyInfo: project.description || ''
        };
        setTechRequest(initialRequest);

        toast({
          title: "⚠️ Could not restore workflow",
          description: "Starting fresh workflow",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, storageKey]); // toast omitted - stable function, including it causes re-render loop

  /**
   * GAP-1 FIX: Auto-save workflow state on changes
   * - Saves to localStorage whenever state changes
   * - Updates lastSaved timestamp
   * - Debounced to avoid excessive saves
   */
  useEffect(() => {
    if (!isLoading) {
      const state: WorkflowState = {
        projectId: project.id,
        currentStep,
        maxStepReached,
        lastSaved: new Date().toISOString(),
        techRequest,
        criteria,
        selectedVendors,
        shortlistedVendorIds
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        setLastSaved(state.lastSaved);
        console.log('💾 Workflow auto-saved (GAP-1)');
      } catch (error) {
        console.error('Failed to save workflow state:', error);
      }
    }
  }, [currentStep, maxStepReached, techRequest, criteria, selectedVendors, shortlistedVendorIds, isLoading, project.id, storageKey]);

  /**
   * GAP-1 FIX: Save project state to localStorage
   * Replaces mock implementation with real persistence
   * GAP-2 FIX: Track maxStepReached for bidirectional navigation
   */
  const saveProjectState = async (step: Step, stepData: any) => {
    // Calculate current step index
    const currentIdx = WORKFLOW_STEPS.findIndex(s => s.id === step);

    // Update maxStepReached if we've progressed further
    const newMaxStep = Math.max(maxStepReached, currentIdx);
    setMaxStepReached(newMaxStep);

    const state: WorkflowState = {
      projectId: project.id,
      currentStep: step,
      maxStepReached: newMaxStep,
      lastSaved: new Date().toISOString(),
      techRequest: stepData.techRequest || techRequest,
      criteria: stepData.criteria || criteria,
      selectedVendors: stepData.selectedVendors || selectedVendors,
      shortlistedVendorIds: stepData.shortlistedVendorIds || shortlistedVendorIds
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      setLastSaved(state.lastSaved);
      console.log('✅ Project state saved (GAP-1):', {
        projectId: project.id,
        step,
        maxStepReached: newMaxStep,
        hasVendors: state.selectedVendors.length,
        hasCriteria: state.criteria.length
      });
    } catch (error) {
      console.error('Failed to save project state:', error);
      toast({
        title: "⚠️ Save failed",
        description: "Could not save workflow progress",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;

  // Show loading while state is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={TYPOGRAPHY.muted.default}>Loading project...</p>
        </div>
      </div>
    );
  }

  const handleCriteriaComplete = async (newCriteria: Criteria[]) => {
    setCriteria(newCriteria);
    setShouldTriggerDiscovery(true); // Set flag to trigger vendor discovery when Step 3 mounts
    setCurrentStep('vendor-selection');
    await saveProjectState('vendor-selection', {
      techRequest,
      criteria: newCriteria,
      selectedVendors
    });
    scrollToSectionTitle();
  };

  const handleVendorSelectionComplete = async (vendors: Vendor[]) => {
    setSelectedVendors(vendors);
    setCurrentStep('vendor-comparison');
    await saveProjectState('vendor-comparison', {
      techRequest,
      criteria,
      selectedVendors: vendors
    });
    scrollToSectionTitle();
  };

  const handleComparisonComplete = async () => {
    setCurrentStep('invite-pitch');
    await saveProjectState('invite-pitch', {
      techRequest,
      criteria,
      selectedVendors
    });
    scrollToSectionTitle();
  };

  const handleVendorsGenerated = async (newVendors: Vendor[]) => {
    setSelectedVendors(newVendors);
    await saveProjectState(currentStep, {
      techRequest,
      criteria,
      selectedVendors: newVendors
    });
  };

  const handleShortlistChange = (newShortlistedIds: string[]) => {
    setShortlistedVendorIds(newShortlistedIds);
    // State will auto-save via useEffect dependency
  };

  /**
   * Scroll to section title with offset for sticky navigation
   */
  const scrollToSectionTitle = () => {
    setTimeout(() => {
      const sectionTitle = document.getElementById('workflow-section-title');
      if (sectionTitle) {
        // Get the sticky navigation height (approximately 60-80px)
        const navHeight = 80;
        const elementPosition = sectionTitle.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100); // Small delay to ensure DOM is updated
  };

  const handleStepClick = async (stepId: Step) => {
    // SP_017: Silent email retry on navigation
    if (needsEmailRetry()) {
      retryEmailCollection().catch(err => {
        console.error('[email-retry] Silent retry failed during step navigation:', err);
      });
    }

    // GAP-2 FIX: Navigation handled by WorkflowNavigation component
    // This allows bidirectional navigation - users can go back and then forward again
    setCurrentStep(stepId);
    await saveProjectState(stepId, {
      techRequest,
      criteria,
      selectedVendors
    });

    // Scroll to section title
    scrollToSectionTitle();
  };

  return (
    <div className={isEmbedded ? "bg-gradient-secondary" : "min-h-screen bg-gradient-secondary"}>
      <div className={`container mx-auto px-4 ${isEmbedded ? "py-4" : "py-8"}`}>
        {/* Universal Workflow Navigation */}
        <WorkflowNavigation
          currentStep={currentStep}
          maxStepReached={maxStepReached}
          onStepClick={handleStepClick}
        />

        {/* Main Content Area */}
        <div className="relative">
          <div className="w-full">
            {/* Step Content */}
            <Card className="shadow-large">
              <CardHeader id="workflow-section-title">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {React.createElement(WORKFLOW_STEPS[currentStepIndex].icon, { className: "h-6 w-6" })}
                      {WORKFLOW_STEPS[currentStepIndex].title}
                    </CardTitle>
                    <CardDescription>
                      {currentStep === 'vendor-comparison'
                        ? `${WORKFLOW_STEPS[currentStepIndex].description}: ${selectedVendors.length} vendors`
                        : WORKFLOW_STEPS[currentStepIndex].description}
                    </CardDescription>
                  </div>
                  {/* Executive Summary and Regenerate/Stop Buttons - Only show on vendor-comparison step */}
                  {currentStep === 'vendor-comparison' && (
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      {isComparisonGenerating ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Dispatch custom event to stop generation
                            window.dispatchEvent(new CustomEvent('stopComparisonGeneration'));
                            toast({
                              title: "Generation stopped",
                              description: "Partial results have been preserved.",
                            });
                          }}
                          className="gap-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-500"
                        >
                          <Square className="h-4 w-4" />
                          Stop Generation
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Clear compared vendors from localStorage and trigger regeneration
                            const comparedVendorsKey = `compared_vendors_${project.id}`;
                            localStorage.removeItem(comparedVendorsKey);
                            // Dispatch custom event to trigger comparison restart
                            window.dispatchEvent(new CustomEvent('regenerateComparison'));
                            toast({
                              title: "Regenerating comparison",
                              description: "Re-analyzing all vendors against criteria...",
                            });
                          }}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Regenerate
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          // Dispatch custom event to open executive summary in VendorComparison
                          window.dispatchEvent(new CustomEvent('openExecutiveSummary'));
                        }}
                        className="bg-primary hover:bg-primary/90 text-white gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Executive Summary
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className={SPACING.vendorDiscovery.container}>
                {currentStep === 'criteria' && techRequest && (
                  <CriteriaBuilder
                    key={project.id} // Force remount on project change to reset all internal state
                    techRequest={techRequest}
                    onComplete={handleCriteriaComplete}
                    initialCriteria={isLoading ? [] : criteria} // Don't pass stale criteria while loading
                    projectId={project.id}
                    projectName={project.name}
                    projectDescription={project.description || ''}
                  />
                )}
                {currentStep === 'vendor-selection' && criteria.length > 0 && (
                  <VendorSelection
                    key={project.id} // Force remount on project change to reset all internal state
                    criteria={criteria}
                    techRequest={techRequest!}
                    onComplete={handleVendorSelectionComplete}
                    projectId={project.id}
                    projectName={project.name}
                    projectDescription={project.description || ''}
                    shouldTriggerDiscovery={shouldTriggerDiscovery}
                    onDiscoveryComplete={() => setShouldTriggerDiscovery(false)}
                  />
                )}
                {currentStep === 'vendor-comparison' && selectedVendors.length > 0 && (
                  <VendorComparison
                    projectId={project.id}
                    vendors={selectedVendors}
                    criteria={criteria}
                    techRequest={techRequest!}
                    onVendorsGenerated={handleVendorsGenerated}
                    onComplete={handleComparisonComplete}
                    shortlistedVendorIds={shortlistedVendorIds}
                    onShortlistChange={handleShortlistChange}
                  />
                )}
                {currentStep === 'invite-pitch' && selectedVendors.length > 0 && (
                  <VendorInviteNew
                    vendors={selectedVendors}
                    criteria={criteria}
                    techRequest={techRequest!}
                    projectName={project.name}
                    shortlistedVendorIds={shortlistedVendorIds}
                  />
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            {techRequest && (
              <Card className="mt-8 bg-gradient-secondary border-0">
                <CardHeader>
                  <CardTitle className={TYPOGRAPHY.card.title}>Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className={TYPOGRAPHY.label.muted}>Category</p>
                      <p className={TYPOGRAPHY.label.default}>{techRequest.category}</p>
                    </div>
                    <div>
                      <p className={TYPOGRAPHY.label.muted}>Criteria</p>
                      <p className={TYPOGRAPHY.label.default}>{criteria.length} defined</p>
                    </div>
                    <div>
                      <p className={TYPOGRAPHY.label.muted}>Vendors</p>
                      <p className={TYPOGRAPHY.label.default}>{selectedVendors.length} selected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDiscovery;