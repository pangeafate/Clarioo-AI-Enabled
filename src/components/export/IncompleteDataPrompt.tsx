/**
 * IncompleteDataPrompt Component
 * Sprint: SP_027 - Excel & JSON Export Feature
 *
 * Warning modal displayed when user attempts to export incomplete data
 */

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import type { IncompleteDataCheck } from '@/types/export.types';

export interface IncompleteDataPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  dataCheck: IncompleteDataCheck;
}

export const IncompleteDataPrompt: React.FC<IncompleteDataPromptProps> = ({
  isOpen,
  onClose,
  onProceed,
  dataCheck,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <AlertDialogTitle>Export Incomplete Data?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4">
            <div className="space-y-3">
              <p>{dataCheck.message}</p>

              {dataCheck.pendingCells > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-900">
                    <span className="font-semibold">{dataCheck.pendingCells}</span>{' '}
                    {dataCheck.pendingCells === 1 ? 'cell' : 'cells'} will be grayed out in the export.
                  </p>
                </div>
              )}

              {dataCheck.missingTabs.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900 font-semibold mb-1">
                    Missing tabs:
                  </p>
                  <ul className="text-sm text-blue-800 list-disc list-inside">
                    {dataCheck.missingTabs.map((tab) => (
                      <li key={tab}>{tab}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-600 pt-2">
                You can proceed with the export, or wait for the data generation to complete.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Wait for Completion
          </AlertDialogCancel>
          <AlertDialogAction onClick={onProceed}>
            Export Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IncompleteDataPrompt;
