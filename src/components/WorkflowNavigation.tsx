/**
 * WorkflowNavigation Component - Universal Stage Navigation
 *
 * @purpose Universal navigation menu for traveling between workflow stages
 * @features Horizontal timeline with icons, progress tracking, and responsive design
 *
 * STAGES:
 * 1. Criteria Building (MessageSquare icon)
 * 2. Vendor Discovery (Search icon)
 * 3. Vendor Comparison (Table icon)
 * 4. Invite to Pitch (Mail icon)
 *
 * RESPONSIVE DESIGN:
 * - Shrinks proportionally for 350px screens
 * - Progressive sizing: 350px → 375px → 640px → 768px → 1024px
 * - Maintains visual proportions across all screen sizes
 *
 * FEATURES:
 * - Visual progress tracking (completed, active, upcoming)
 * - Click to navigate between accessible stages
 * - Temporary title display on click
 * - Bidirectional navigation (can go back)
 * - Smooth animations with Framer Motion
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Table, Mail, LucideIcon } from 'lucide-react';
import { TYPOGRAPHY } from '@/styles/typography-config';

export type Step = 'criteria' | 'vendor-selection' | 'vendor-comparison' | 'invite-pitch';

export interface WorkflowStep {
  id: Step;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface WorkflowNavigationProps {
  currentStep: Step;
  maxStepReached: number; // Index of furthest step reached
  onStepClick: (stepId: Step) => void;
  className?: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'criteria',
    title: 'Criteria Building',
    icon: MessageSquare,
    description: 'AI helps build evaluation criteria'
  },
  {
    id: 'vendor-selection',
    title: 'Vendor Discovery',
    icon: Search,
    description: 'Find relevant vendors'
  },
  {
    id: 'vendor-comparison',
    title: 'Vendor Comparison',
    icon: Table,
    description: 'Compare vendors in detail'
  },
  {
    id: 'invite-pitch',
    title: 'Invite to Pitch',
    icon: Mail,
    description: 'Invite vendors to present their solutions'
  },
];

export const WorkflowNavigation = ({
  currentStep,
  maxStepReached,
  onStepClick,
  className = ''
}: WorkflowNavigationProps) => {
  const [clickedStepTitle, setClickedStepTitle] = useState<string>('');

  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.id === currentStep);

  // Auto-hide step title after 2 seconds
  useEffect(() => {
    if (clickedStepTitle) {
      const timer = setTimeout(() => {
        setClickedStepTitle('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [clickedStepTitle]);

  const handleStepClick = (stepId: Step, stepIndex: number) => {
    const step = WORKFLOW_STEPS.find(s => s.id === stepId);

    // Always show title when any stage is clicked
    if (step) {
      setClickedStepTitle(step.title);
    }

    // Only navigate if step is accessible (based on maxStepReached)
    if (stepIndex <= maxStepReached) {
      onStepClick(stepId);
    }
  };

  return (
    <div className={`sticky top-0 bg-gradient-secondary z-40 -mx-4 px-4 py-2 ${className}`}>
      <div className="overflow-x-auto">
        <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 min-w-max">
          {WORKFLOW_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const isAccessible = index <= maxStepReached;
            const isLast = index === WORKFLOW_STEPS.length - 1;

            return (
              <div key={step.id} className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
                {/* Circle */}
                <button
                  onClick={() => handleStepClick(step.id, index)}
                  className={`
                    relative flex items-center justify-center
                    w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 transition-all duration-300 flex-shrink-0
                    ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-lg' : ''}
                    ${isCompleted && !isActive ? 'bg-white border-primary text-primary' : ''}
                    ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-400' : ''}
                    ${isAccessible ? 'cursor-pointer hover:scale-110' : 'cursor-pointer opacity-50'}
                  `}
                  aria-label={step.title}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <StepIcon className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                </button>

                {/* Connecting Line */}
                {!isLast && (
                  <div className={`
                    h-0.5 w-8 xs:w-9 sm:w-10 md:w-12 lg:w-16
                    ${index < currentStepIndex ? 'bg-primary' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Title Display - Appears briefly when icon clicked */}
      <motion.div
        animate={{ opacity: clickedStepTitle ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`
          text-center ${TYPOGRAPHY.label.small} text-primary flex items-center justify-center
          transition-all duration-300 overflow-hidden
          ${clickedStepTitle ? 'max-h-10 py-2' : 'max-h-0 py-0'}
        `}
      >
        {clickedStepTitle || '\u00A0'}
      </motion.div>
    </div>
  );
};

// Export steps for use in other components
export { WORKFLOW_STEPS };
