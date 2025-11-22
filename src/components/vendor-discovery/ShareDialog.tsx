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
import { Download, Link2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Criteria } from '../VendorDiscovery';
import { TYPOGRAPHY } from '@/styles/typography-config';
import * as XLSX from 'xlsx';

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
   * Copy share link to clipboard
   */
  const handleCopyLink = async () => {
    const shareUrl = generateShareLink();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);

      toast({
        title: '✅ Link copied',
        description: 'Share link has been copied to clipboard',
        duration: 2000
      });

      // Reset copied state after 3 seconds
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      toast({
        title: '⚠️ Copy failed',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
        duration: 2000
      });
    }
  };

  /**
   * Download criteria as Excel file
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

  const shareUrl = generateShareLink();

  return (
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
          {/* Download Option */}
          <div className="space-y-2">
            <Label className={TYPOGRAPHY.label.default}>Download File</Label>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Download className="h-4 w-4" />
              {downloadButtonText}
            </Button>
            <p className={`${TYPOGRAPHY.muted.small} text-gray-500`}>
              {downloadDescription}
            </p>
          </div>

          {/* Share Link Option */}
          <div className="space-y-2">
            <Label className={TYPOGRAPHY.label.default}>Share by Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className={`${TYPOGRAPHY.body.default} flex-1`}
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
  );
};

export default ShareDialog;
