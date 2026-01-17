/**
 * ExportLoadingModal Component
 * Sprint: SP_027 - Excel & JSON Export Feature
 *
 * Loading modal displayed during export generation
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileDown } from 'lucide-react';
import type { ExportProgress } from '@/types/export.types';

export interface ExportLoadingModalProps {
  isOpen: boolean;
  progress?: ExportProgress;
  format: 'excel' | 'json';
}

export const ExportLoadingModal: React.FC<ExportLoadingModalProps> = ({
  isOpen,
  progress,
  format,
}) => {
  const formatLabel = format === 'excel' ? 'Excel' : 'JSON';

  // Default progress if not provided
  const currentProgress = progress || {
    stage: 'initializing',
    percentage: 0,
    currentTask: `Preparing ${formatLabel} export...`,
  };

  // Stage labels
  const stageLabels = {
    initializing: 'Initializing',
    processing_images: 'Processing Images',
    generating_excel: 'Generating Excel',
    finalizing: 'Finalizing',
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileDown className="h-6 w-6 text-blue-600" />
            <DialogTitle>Exporting to {formatLabel}</DialogTitle>
          </div>
          <DialogDescription>
            Please wait while we generate your {formatLabel} file...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={currentProgress.percentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{currentProgress.percentage}%</span>
              {currentProgress.estimatedTimeRemaining && (
                <span>
                  ~{Math.ceil(currentProgress.estimatedTimeRemaining / 1000)}s remaining
                </span>
              )}
            </div>
          </div>

          {/* Current stage */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>
              {stageLabels[currentProgress.stage]}{currentProgress.currentTask && `: ${currentProgress.currentTask}`}
            </span>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Tip:</span> This may take a moment if you have many vendors or large images.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportLoadingModal;
