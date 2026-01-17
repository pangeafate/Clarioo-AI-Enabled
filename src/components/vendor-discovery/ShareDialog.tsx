/**
 * ShareDialog Component - Share Criteria with Team
 *
 * @purpose Popup dialog for sharing criteria list via download or link
 * @design Modal with two sharing options: download file and copy link
 *
 * FEATURES:
 * - Download criteria as Excel file
 * - Generate and copy shareable link
 * - Copy confirmation toast
 * - Clean modal UI
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Link2, Copy, Check, FileSpreadsheet, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Criteria } from '../VendorDiscovery';
import { TYPOGRAPHY } from '@/styles/typography-config';
import * as XLSX from 'xlsx';
import { exportProjectToExcel } from '@/services/excelExportService';
import { exportProjectToJSON } from '@/services/jsonExportService';
import { ExportLoadingModal } from '@/components/export/ExportLoadingModal';

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: Criteria[];
  projectId: string;
  // Custom text props for different contexts
  title?: string;
  description?: string;
  downloadButtonText?: string;
  downloadDescription?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  criteria,
  projectId,
  title = 'Download or Share',
  description = 'Download the criteria list or share via link',
  downloadButtonText = 'Download Criteria List',
  downloadDescription = 'Download as Excel file (.xlsx)'
}) => {
  const { toast } = useToast();
  const [linkCopied, setLinkCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'json'>('excel');

  /**
   * Generate shareable link for criteria
   * For now, creates a link with project ID encoded
   */
  const generateShareLink = (): string => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/criteria/${projectId}`;
    return shareUrl;
  };

  /**
   * Copy share link to clipboard - Feature in development
   */
  const handleCopyLink = async () => {
    toast({
      title: 'Feature in development, coming up soon!',
      duration: 2000
    });
  };

  /**
   * Handle input field interaction - Feature in development
   */
  const handleInputInteraction = () => {
    toast({
      title: 'Feature in development, coming up soon!',
      duration: 2000
    });
  };

  /**
   * Download criteria as Excel file (basic)
   */
  const handleDownload = () => {
    try {
      // Prepare data for Excel
      const excelData = criteria.map(c => ({
        'Criterion': c.name,
        'Explanation': c.explanation || '',
        'Importance': c.importance.charAt(0).toUpperCase() + c.importance.slice(1),
        'Type': c.type.charAt(0).toUpperCase() + c.type.slice(1),
        'Status': c.isArchived ? 'Archived' : 'Active'
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Criteria');

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = [
        { wch: Math.min(maxWidth, Math.max(...excelData.map(row => row.Criterion.length), 10)) },
        { wch: Math.min(maxWidth, Math.max(...excelData.map(row => row.Explanation.length), 12)) },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 }
      ];
      worksheet['!cols'] = colWidths;

      // Generate file name
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `criteria-list-${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      toast({
        title: '✅ Download started',
        description: `Downloading ${fileName}`,
        duration: 2000
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: '⚠️ Download failed',
        description: 'Could not generate Excel file',
        variant: 'destructive',
        duration: 2000
      });
    }
  };

  /**
   * Export full project to Excel (SP_027)
   */
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportFormat('excel');

    try {
      // Get project name from clarioo_projects array
      const projectsData = localStorage.getItem('clarioo_projects');
      let projectName = 'Project';

      if (projectsData) {
        try {
          const projects = JSON.parse(projectsData);
          const project = projects.find((p: any) => p.id === projectId);
          if (project && project.name) {
            projectName = project.name;
          }
        } catch (error) {
          console.error('[ShareDialog] Failed to parse clarioo_projects:', error);
        }
      }

      const result = await exportProjectToExcel({
        projectId,
        projectName,
      });

      setIsExporting(false);

      if (result.success) {
        toast({
          title: '✅ Excel exported',
          description: `Downloaded ${result.filename}`,
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      setIsExporting(false);
      console.error('Excel export error:', error);
      toast({
        title: '⚠️ Export failed',
        description: error instanceof Error ? error.message : 'Could not generate Excel file',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  /**
   * Export full project to JSON (SP_027)
   */
  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportFormat('json');

    try {
      // Get project name from clarioo_projects array
      const projectsData = localStorage.getItem('clarioo_projects');
      let projectName = 'Project';

      if (projectsData) {
        try {
          const projects = JSON.parse(projectsData);
          const project = projects.find((p: any) => p.id === projectId);
          if (project && project.name) {
            projectName = project.name;
          }
        } catch (error) {
          console.error('[ShareDialog] Failed to parse clarioo_projects:', error);
        }
      }

      const result = await exportProjectToJSON({
        projectId,
        projectName,
      });

      setIsExporting(false);

      if (result.success) {
        toast({
          title: '✅ JSON exported',
          description: `Downloaded ${result.filename}`,
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      setIsExporting(false);
      console.error('JSON export error:', error);
      toast({
        title: '⚠️ Export failed',
        description: error instanceof Error ? error.message : 'Could not generate JSON file',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const shareUrl = generateShareLink();

  return (
    <>
      <ExportLoadingModal
        isOpen={isExporting}
        format={exportFormat}
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={TYPOGRAPHY.heading.h6}>
            {title}
          </DialogTitle>
          <DialogDescription className={TYPOGRAPHY.muted.default}>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* SP_027: Full Project Export Options */}
          <div className="space-y-2 pt-2 border-t">
            <Label className={TYPOGRAPHY.label.default}>Full Project Export</Label>

            {/* Export to Excel */}
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Complete Project (Excel)
            </Button>

            {/* Export to JSON */}
            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={isExporting}
            >
              <FileJson className="h-4 w-4" />
              Export Project Data (JSON)
            </Button>

            <p className={`${TYPOGRAPHY.muted.small} text-gray-500`}>
              Export all project data including vendors, criteria, and evaluations
            </p>
          </div>

          {/* Share Link Option */}
          <div className="space-y-2">
            <Label className={TYPOGRAPHY.label.default}>Share by Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                onClick={handleInputInteraction}
                onFocus={handleInputInteraction}
                onSelect={handleInputInteraction}
                className={`${TYPOGRAPHY.body.default} flex-1 select-none cursor-pointer`}
              />
              <Button
                onClick={handleCopyLink}
                variant={linkCopied ? 'default' : 'outline'}
                size="icon"
                className="flex-shrink-0"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className={`${TYPOGRAPHY.muted.small} text-gray-500`}>
              Anyone with the link can view the criteria
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ShareDialog;
