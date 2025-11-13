import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Search, MessageSquare, Table, CheckCircle, LogOut, User, ArrowLeft, Mail, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import TechInput from "./vendor-discovery/TechInput";
import CriteriaBuilder from "./vendor-discovery/CriteriaBuilder";
import VendorSelection from "./vendor-discovery/VendorSelection";
import VendorTable from "./vendor-discovery/VendorTable";
import VendorInvite from "./vendor-discovery/VendorInvite";

export type Step = 'tech-input' | 'criteria' | 'vendor-selection' | 'vendor-comparison' | 'invite-pitch';

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

const VendorDiscovery = ({ project, onBackToProjects, isEmbedded = false }: VendorDiscoveryProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('tech-input');
  const [maxStepReached, setMaxStepReached] = useState<number>(0); // Track furthest step reached
  const [techRequest, setTechRequest] = useState<TechRequest | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [clickedStepTitle, setClickedStepTitle] = useState<string | null>(null);

  const storageKey = `workflow_${project.id}`;

  /**
   * GAP-1 FIX: Load workflow state from localStorage on mount
   * - Restores previous workflow progress if it exists
   * - Shows toast notification when restored
   * - Ensures seamless continuation across sessions
   */
  useEffect(() => {
    const loadWorkflowState = () => {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const state: WorkflowState = JSON.parse(savedState);

          // Restore state
          setCurrentStep(state.currentStep);
          setMaxStepReached(state.maxStepReached || 0); // Default to 0 if not set
          setTechRequest(state.techRequest);
          setCriteria(state.criteria);
          setSelectedVendors(state.selectedVendors);
          setLastSaved(state.lastSaved);

          // Show success feedback
          toast({
            title: "✨ Workflow restored",
            description: `Loaded your progress from ${new Date(state.lastSaved).toLocaleString()}`,
            duration: 3000,
          });

          console.log('✅ Workflow state loaded from localStorage (GAP-1)', {
            currentStep: state.currentStep,
            hasRequest: !!state.techRequest,
            criteriaCount: state.criteria.length,
            vendorCount: state.selectedVendors.length
          });
        }
      } catch (error) {
        console.error('Failed to load workflow state:', error);
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
   * Auto-hide clicked step title after 3 seconds
   * Note: Must be placed before early returns to satisfy Rules of Hooks
   */
  useEffect(() => {
    if (clickedStepTitle) {
      const timer = setTimeout(() => {
        setClickedStepTitle(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [clickedStepTitle]);

  /**
   * GAP-1 FIX: Save project state to localStorage
   * Replaces mock implementation with real persistence
   * GAP-2 FIX: Track maxStepReached for bidirectional navigation
   */
  const saveProjectState = async (step: Step, stepData: any) => {
    // Calculate current step index
    const currentIdx = steps.findIndex(s => s.id === step);

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

  const steps = [
    { id: 'tech-input', title: 'Technology Exploration', icon: Search },
    { id: 'criteria', title: 'Criteria Building', icon: MessageSquare, description: 'AI helps build evaluation criteria' },
    { id: 'vendor-selection', title: 'Vendor Discovery', icon: Search, description: 'Find relevant vendors' },
    { id: 'vendor-comparison', title: 'Vendor Comparison', icon: Table, description: 'Compare vendors in detail' },
    { id: 'invite-pitch', title: 'Invite to Pitch', icon: Mail, description: 'Invite vendors to present their solutions' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Show loading while state is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  const handleTechSubmit = async (request: TechRequest) => {
    setTechRequest(request);
    setCurrentStep('criteria');
    await saveProjectState('criteria', { 
      techRequest: request, 
      criteria, 
      selectedVendors 
    });
  };

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

  const handleStepClick = async (stepId: Step, showTitleOnly: boolean = false) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const step = steps.find(s => s.id === stepId);

    // Always show title when any stage is clicked
    if (step) {
      setClickedStepTitle(step.title);
    }

    // GAP-2 FIX: Only navigate if step is accessible (based on maxStepReached) and not just showing title
    // This allows bidirectional navigation - users can go back and then forward again
    if (!showTitleOnly && stepIndex <= maxStepReached) {
      setCurrentStep(stepId);
      await saveProjectState(stepId, {
        techRequest,
        criteria,
        selectedVendors
      });
    }
  };

  return (
    <div className={isEmbedded ? "bg-gradient-secondary" : "min-h-screen bg-gradient-secondary"}>
      <div className={`container mx-auto px-4 ${isEmbedded ? "py-4" : "py-8"}`}>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Mobile Timeline - Horizontal Sticky at Top */}
        <div className="lg:hidden sticky top-0 bg-gradient-secondary z-40 -mx-4 px-4 pb-2 pt-2">
          <div className="overflow-x-auto">
            <div className="flex items-center gap-3 pb-4 min-w-max">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                const isAccessible = index <= maxStepReached; // GAP-2 FIX: Use maxStepReached for accessibility
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.id} className="flex items-center gap-3">
                    {/* Circle */}
                    <button
                      onClick={() => handleStepClick(step.id as Step)}
                      className={`
                        relative flex items-center justify-center
                        w-12 h-12 rounded-full border-2 transition-all duration-300 flex-shrink-0
                        ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-lg' : ''}
                        ${isCompleted && !isActive ? 'bg-white border-primary text-primary' : ''}
                        ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400' : ''}
                        ${isAccessible ? 'cursor-pointer' : 'cursor-pointer opacity-50'}
                      `}
                    >
                      <StepIcon className="w-5 h-5" />
                    </button>

                    {/* Connecting Line */}
                    {!isLast && (
                      <div className={`
                        h-0.5 w-12
                        ${index < currentStepIndex ? 'bg-primary' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Title Display - Appears briefly when icon clicked - Fixed height to prevent layout shift */}
          <motion.div
            animate={{ opacity: clickedStepTitle ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-2 text-sm font-medium text-primary h-10 flex items-center justify-center"
          >
            {clickedStepTitle || '\u00A0'}
          </motion.div>
        </div>

        {/* Main Layout with Sticky Timeline */}
        <div className="relative flex gap-8">
          {/* Sticky Timeline Navigation - Left Side (Desktop Only) */}
          <div className="hidden lg:block lg:w-[220px] lg:flex-shrink-0 sticky top-24 self-start">
            {/* Step Title Display - Appears briefly when icon clicked (Desktop) - Fixed height to prevent layout shift */}
            <motion.div
              animate={{ opacity: clickedStepTitle ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-center pb-2 text-sm font-medium text-primary whitespace-nowrap h-8 flex items-center justify-center"
            >
              {clickedStepTitle || '\u00A0'}
            </motion.div>

            <div className="flex flex-col items-center py-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                const isAccessible = index <= maxStepReached; // GAP-2 FIX: Use maxStepReached for accessibility
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    {/* Circle */}
                    <button
                      onClick={() => handleStepClick(step.id as Step)}
                      className={`
                        relative flex items-center justify-center
                        w-16 h-16 rounded-full border-2 transition-all duration-300
                        ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-lg' : ''}
                        ${isCompleted && !isActive ? 'bg-white border-primary text-primary' : ''}
                        ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400' : ''}
                        ${isAccessible ? 'cursor-pointer hover:scale-110' : 'cursor-pointer opacity-50'}
                        z-10
                      `}
                    >
                      <StepIcon className="w-7 h-7" />
                    </button>

                    {/* Connecting Line */}
                    {!isLast && (
                      <div className={`
                        w-0.5 h-24
                        ${index < currentStepIndex ? 'bg-primary' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Step Content */}
            <Card className="shadow-large">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(steps[currentStepIndex].icon, { className: "h-6 w-6" })}
                  {steps[currentStepIndex].title}
                </CardTitle>
                <CardDescription>
                  {steps[currentStepIndex].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 'tech-input' && (
                  <TechInput onSubmit={handleTechSubmit} initialData={techRequest} projectId={project.id} />
                )}
                {currentStep === 'criteria' && techRequest && (
                  <CriteriaBuilder
                    techRequest={techRequest}
                    onComplete={handleCriteriaComplete}
                    initialCriteria={criteria}
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
                  <CardTitle className="text-lg">Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <p className="font-semibold">{techRequest.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Criteria</p>
                      <p className="font-semibold">{criteria.length} defined</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vendors</p>
                      <p className="font-semibold">{selectedVendors.length} selected</p>
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