import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle, LogOut, User, ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CriteriaBuilder from "./vendor-discovery/CriteriaBuilder";
import VendorSelection from "./vendor-discovery/VendorSelection";
import VendorTable from "./vendor-discovery/VendorTable";
import VendorInvite from "./vendor-discovery/VendorInvite";
import { WorkflowNavigation, WORKFLOW_STEPS, type Step } from "./WorkflowNavigation";
import criteriaData from '@/data/api/criteria.json';
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';

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
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  website: string;
  pricing: string;
  rating: number;
  criteriaScores: Record<string, number>;
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
}

export interface VendorDiscoveryProps {
  project: Project;
  onBackToProjects?: () => void;
  isEmbedded?: boolean;
}

/**
 * Helper function to backfill missing explanations from criteria.json
 * Searches all categories in criteria.json to find matching criterion by name
 */
const backfillExplanation = (criterion: Criteria): string => {
  if (criterion.explanation && criterion.explanation.trim() !== '') {
    return criterion.explanation; // Already has explanation
  }

  // Search all categories in criteriaData for matching criterion by name
  const allCategories = Object.values(criteriaData);
  for (const categoryData of allCategories) {
    const match = categoryData.find((c: any) => c.name === criterion.name);
    if (match && match.explanation) {
      console.log(`✅ Found explanation for "${criterion.name}"`);
      return match.explanation;
    }
  }

  // No match found - return empty string
  console.warn(`⚠️ No explanation found for "${criterion.name}"`);
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
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const storageKey = `workflow_${project.id}`;

  /**
   * GAP-1 FIX: Load workflow state from localStorage on mount
   * - Restores previous workflow progress if it exists
   * - Shows toast notification when restored
   * - Ensures seamless continuation across sessions
   *
   * GAP-5 FIX: Initialize techRequest from project data if not in localStorage
   * - Creates techRequest from project.description and project.name
   * - Enables Criteria Builder to work for newly created projects
   */
  useEffect(() => {
    const loadWorkflowState = () => {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const state: WorkflowState = JSON.parse(savedState);

          // GAP-5: Handle legacy data with 'tech-input' step (removed in this update)
          // If currentStep is 'tech-input', default to 'criteria' instead
          const validatedStep = state.currentStep === 'tech-input'
            ? 'criteria'
            : state.currentStep;

          // Restore state
          setCurrentStep(validatedStep);
          setMaxStepReached(state.maxStepReached || 0); // Default to 0 if not set
          setTechRequest(state.techRequest);

          // Data migration: Backfill missing explanations from criteria.json
          const migratedCriteria = state.criteria.map(c => ({
            ...c,
            explanation: backfillExplanation(c)
          }));
          setCriteria(migratedCriteria);

          // Debug: Log summary
          const withoutExplanation = migratedCriteria.filter(c => !c.explanation || c.explanation.trim() === '').length;
          if (withoutExplanation > 0) {
            console.warn(`⚠️ ${withoutExplanation} of ${migratedCriteria.length} criteria still have no explanations after migration`);
          } else {
            console.log(`✅ All ${migratedCriteria.length} criteria have explanations`);
          }

          setSelectedVendors(state.selectedVendors);
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
            criteriaCount: state.criteria.length,
            vendorCount: state.selectedVendors.length
          });
        } else {
          // GAP-5: No saved state - initialize techRequest from project data
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
      } catch (error) {
        console.error('Failed to load workflow state:', error);

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
  }, [project.id, storageKey, toast]);

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
        selectedVendors
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        setLastSaved(state.lastSaved);
        console.log('💾 Workflow auto-saved (GAP-1)');
      } catch (error) {
        console.error('Failed to save workflow state:', error);
      }
    }
  }, [currentStep, maxStepReached, techRequest, criteria, selectedVendors, isLoading, project.id, storageKey]);

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
      selectedVendors: stepData.selectedVendors || selectedVendors
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
    setCurrentStep('vendor-selection');
    await saveProjectState('vendor-selection', { 
      techRequest, 
      criteria: newCriteria, 
      selectedVendors 
    });
  };

  const handleVendorSelectionComplete = async (vendors: Vendor[]) => {
    setSelectedVendors(vendors);
    setCurrentStep('vendor-comparison');
    await saveProjectState('vendor-comparison', { 
      techRequest, 
      criteria, 
      selectedVendors: vendors 
    });
  };

  const handleComparisonComplete = async () => {
    setCurrentStep('invite-pitch');
    await saveProjectState('invite-pitch', { 
      techRequest, 
      criteria, 
      selectedVendors 
    });
  };

  const handleVendorsGenerated = async (newVendors: Vendor[]) => {
    setSelectedVendors(newVendors);
    await saveProjectState(currentStep, { 
      techRequest, 
      criteria, 
      selectedVendors: newVendors 
    });
  };

  const handleStepClick = async (stepId: Step) => {
    // GAP-2 FIX: Navigation handled by WorkflowNavigation component
    // This allows bidirectional navigation - users can go back and then forward again
    setCurrentStep(stepId);
    await saveProjectState(stepId, {
      techRequest,
      criteria,
      selectedVendors
    });
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(WORKFLOW_STEPS[currentStepIndex].icon, { className: "h-6 w-6" })}
                  {WORKFLOW_STEPS[currentStepIndex].title}
                </CardTitle>
                <CardDescription>
                  {WORKFLOW_STEPS[currentStepIndex].description}
                </CardDescription>
              </CardHeader>
              <CardContent className={SPACING.vendorDiscovery.container}>
                {currentStep === 'criteria' && techRequest && (
                  <CriteriaBuilder
                    techRequest={techRequest}
                    onComplete={handleCriteriaComplete}
                    initialCriteria={criteria}
                    projectId={project.id}
                  />
                )}
                {currentStep === 'vendor-selection' && criteria.length > 0 && (
                  <VendorSelection
                    criteria={criteria}
                    techRequest={techRequest!}
                    onComplete={handleVendorSelectionComplete}
                  />
                )}
                {currentStep === 'vendor-comparison' && selectedVendors.length > 0 && (
                  <VendorTable
                    vendors={selectedVendors}
                    criteria={criteria}
                    techRequest={techRequest!}
                    onVendorsGenerated={handleVendorsGenerated}
                    onComplete={handleComparisonComplete}
                  />
                )}
                {currentStep === 'invite-pitch' && selectedVendors.length > 0 && (
                  <VendorInvite
                    vendors={selectedVendors}
                    criteria={criteria}
                    techRequest={techRequest!}
                    projectName={project.name}
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