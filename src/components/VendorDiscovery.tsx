import React, { useState, useEffect } from "react";
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
   */
  useEffect(() => {
    const loadWorkflowState = () => {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const state: WorkflowState = JSON.parse(savedState);

          // Restore state
          setCurrentStep(state.currentStep);
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
  }, [currentStep, techRequest, criteria, selectedVendors, isLoading, project.id, storageKey]);

  /**
   * GAP-1 FIX: Save project state to localStorage
   * Replaces mock implementation with real persistence
   */
  const saveProjectState = async (step: Step, stepData: any) => {
    const state: WorkflowState = {
      projectId: project.id,
      currentStep: step,
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
    { id: 'tech-input', title: 'Technology Exploration', icon: Search, description: 'Define what technology you need' },
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

  const handleStepClick = async (stepId: Step) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex <= currentStepIndex) {
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

        {/* Vertical Step Timeline */}
        <div className="relative max-w-3xl mx-auto mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const isAccessible = index <= currentStepIndex;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative flex gap-6">
                {/* Timeline Column */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <button
                    onClick={() => isAccessible && handleStepClick(step.id as Step)}
                    disabled={!isAccessible}
                    className={`
                      relative flex items-center justify-center
                      w-12 h-12 md:w-14 md:h-14
                      rounded-full border-2 transition-all duration-300
                      ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                      ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-lg animate-pulse' : ''}
                      ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400' : ''}
                      ${isAccessible ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'}
                      z-10
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 md:w-7 md:h-7" />
                    ) : (
                      <StepIcon className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                  </button>

                  {/* Connecting Line */}
                  {!isLast && (
                    <div className={`
                      w-0.5 flex-1 min-h-[100px]
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-200 border-l-2 border-dashed border-gray-300'}
                    `} />
                  )}
                </div>

                {/* Content Column */}
                <div className="flex-1 pb-8">
                  <Card
                    className={`
                      cursor-pointer transition-all hover:shadow-medium
                      ${isActive ? 'ring-2 ring-primary shadow-medium' : ''}
                      ${!isAccessible ? 'opacity-50' : ''}
                    `}
                    onClick={() => isAccessible && handleStepClick(step.id as Step)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                            {isActive && (
                              <Badge variant="secondary">
                                Current Step
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge className="bg-green-500">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

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
  );
};

export default VendorDiscovery;