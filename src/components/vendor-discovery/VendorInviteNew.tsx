/**
 * VendorInviteNew Component - Invite to Pitch Stage
 *
 * @purpose Send invitation emails to shortlisted vendors
 * @design Mobile-first with vendor cards, email template, and validation
 *
 * FEATURES:
 * - Display shortlisted vendors with logo, name, email, checkbox
 * - Email template with subject, vendor badges, calendly, sender info
 * - Dynamic email body with project/criteria content
 * - Validation on Send (name, title, company required)
 * - "Unable to find email" message for vendors without email
 * - Add vendor dropdown with non-shortlisted vendors + custom entry
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Mail,
  Plus,
  Send,
  Trash2,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { SPACING } from '@/styles/spacing-config';
import type { Vendor, Criteria, TechRequest } from '../VendorDiscovery';

interface VendorInviteNewProps {
  vendors: Vendor[];
  criteria: Criteria[];
  techRequest: TechRequest;
  projectName: string;
  shortlistedVendorIds: string[];
}

interface VendorWithEmail extends Vendor {
  email?: string;
}

interface SenderInfo {
  name: string;
  email: string;
  company: string;
}

const VendorInviteNew: React.FC<VendorInviteNewProps> = ({
  vendors,
  criteria,
  techRequest,
  projectName,
  shortlistedVendorIds,
}) => {
  const { toast } = useToast();

  // Map vendors to include email placeholder
  // Note: n8n vendors don't include emails - would need to be added via n8n workflow
  const vendorsWithEmail: VendorWithEmail[] = useMemo(() => {
    return vendors.map(vendor => ({
      ...vendor,
      email: undefined, // Emails would come from n8n if needed
    }));
  }, [vendors]);

  // Filter shortlisted vendors
  const shortlistedVendors = useMemo(() => {
    return vendorsWithEmail.filter(v => shortlistedVendorIds.includes(v.id));
  }, [vendorsWithEmail, shortlistedVendorIds]);

  // Non-shortlisted vendors for dropdown
  const nonShortlistedVendors = useMemo(() => {
    return vendorsWithEmail.filter(v => !shortlistedVendorIds.includes(v.id));
  }, [vendorsWithEmail, shortlistedVendorIds]);

  // State for selected vendors to invite (subset of shortlisted)
  const [selectedToInvite, setSelectedToInvite] = useState<Set<string>>(
    new Set(shortlistedVendorIds)
  );

  // Custom added vendors (must be declared before availableForDropdown)
  const [customVendors, setCustomVendors] = useState<VendorWithEmail[]>([]);

  // Vendors available for dropdown (not already in invite list)
  const availableForDropdown = useMemo(() => {
    const currentInviteIds = new Set([
      ...shortlistedVendors.map(v => v.id),
      ...customVendors.map(v => v.id)
    ]);
    return nonShortlistedVendors.filter(v => !currentInviteIds.has(v.id));
  }, [nonShortlistedVendors, shortlistedVendors, customVendors]);

  // Sender information
  const [senderInfo, setSenderInfo] = useState<SenderInfo>({
    name: '',
    email: '',
    company: '',
  });

  // Email subject
  const [emailSubject, setEmailSubject] = useState(
    `Invitation to Present: ${projectName}`
  );

  // Email body (editable)
  const [emailBody, setEmailBody] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add custom vendor dialog
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customVendorName, setCustomVendorName] = useState('');
  const [customVendorEmail, setCustomVendorEmail] = useState('');

  // Multi-select in dropdown
  const [dropdownSelectedIds, setDropdownSelectedIds] = useState<Set<string>>(new Set());

  // Combined list: shortlisted + custom added
  const allInviteVendors = useMemo(() => {
    return [...shortlistedVendors, ...customVendors];
  }, [shortlistedVendors, customVendors]);

  // Toggle vendor selection - unchecking removes from list
  const toggleVendorSelection = (vendorId: string) => {
    if (selectedToInvite.has(vendorId)) {
      // Remove from selection
      setSelectedToInvite(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
      // If it's a custom vendor (added from dropdown), remove from customVendors
      if (customVendors.find(v => v.id === vendorId)) {
        setCustomVendors(prev => prev.filter(v => v.id !== vendorId));
      }
    } else {
      // Add to selection
      setSelectedToInvite(prev => new Set([...prev, vendorId]));
    }
  };

  // Toggle vendor selection in dropdown
  const toggleDropdownSelection = (vendorId: string) => {
    setDropdownSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  // Add all selected vendors from dropdown
  const handleAddSelectedVendors = () => {
    const vendorsToAdd = availableForDropdown.filter(v => dropdownSelectedIds.has(v.id));
    if (vendorsToAdd.length === 0) return;

    // Add to custom vendors list
    setCustomVendors(prev => [...prev, ...vendorsToAdd]);
    // Auto-select for invitation
    setSelectedToInvite(prev => {
      const newSet = new Set(prev);
      vendorsToAdd.forEach(v => newSet.add(v.id));
      return newSet;
    });
    // Clear dropdown selection
    setDropdownSelectedIds(new Set());

    toast({
      title: `${vendorsToAdd.length} vendor${vendorsToAdd.length > 1 ? 's' : ''} added`,
      description: vendorsToAdd.map(v => v.name).join(', '),
    });
  };

  // Add custom vendor
  const handleAddCustomVendor = () => {
    if (!customVendorName.trim()) return;

    const customVendor: VendorWithEmail = {
      id: `custom_${Date.now()}`,
      name: customVendorName.trim(),
      email: customVendorEmail.trim() || undefined,
      description: '',
      website: '',
      pricing: '',
      rating: 0,
      criteriaScores: {},
      criteriaAnswers: {},
      features: [],
    };

    setCustomVendors(prev => [...prev, customVendor]);
    setSelectedToInvite(prev => new Set([...prev, customVendor.id]));
    setCustomVendorName('');
    setCustomVendorEmail('');
    setIsAddCustomOpen(false);

    toast({
      title: 'Custom vendor added',
      description: `${customVendor.name} has been added to the invite list.`,
    });
  };

  // Remove custom vendor
  const handleRemoveCustomVendor = (vendorId: string) => {
    setCustomVendors(prev => prev.filter(v => v.id !== vendorId));
    setSelectedToInvite(prev => {
      const newSet = new Set(prev);
      newSet.delete(vendorId);
      return newSet;
    });
  };

  // Generate email body
  const generateEmailBody = (vendorName: string) => {
    const activeCriteria = criteria.filter(c => !c.isArchived);
    // Sort by importance: high first, then medium, then low
    const sortedCriteria = [...activeCriteria].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.importance] - order[b.importance];
    });

    // Take top 5 criteria
    const topCriteria = sortedCriteria.slice(0, 5);
    const hasMore = sortedCriteria.length > 5;

    return `Dear [Recipient's name will populate automatically],

We are currently evaluating solutions for ${techRequest.description || projectName} and would like to invite you to present your offering.

${techRequest.companyInfo ? `About Us: ${techRequest.companyInfo}\n\n` : ''}Key Requirements:
${topCriteria.map(c => `• ${c.name} (${c.importance.charAt(0).toUpperCase() + c.importance.slice(1)} Priority)`).join('\n')}${hasMore ? '\n• etc.' : ''}

We look forward to learning more about how your solution can address our needs.

Best regards,
${senderInfo.name || '[Your Name]'}
${senderInfo.company || '[Your Company]'}
${senderInfo.email || '[Your Email]'}`;
  };

  // Update email body when sender info changes
  useEffect(() => {
    setEmailBody(generateEmailBody('[Vendor Name]'));
  }, [senderInfo.name, senderInfo.email, senderInfo.company, criteria, techRequest]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!senderInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!senderInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!senderInfo.company.trim()) {
      newErrors.company = 'Company is required';
    }

    const selectedCount = Array.from(selectedToInvite).filter(id =>
      allInviteVendors.find(v => v.id === id && v.email)
    ).length;

    if (selectedCount === 0) {
      newErrors.vendors = 'Select at least one vendor with email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle send
  const handleSend = () => {
    if (!validateForm()) {
      toast({
        title: 'Please fill required fields',
        description: 'Name, title, and company are required to send invitations.',
        variant: 'destructive',
      });
      return;
    }

    const vendorsToSend = allInviteVendors.filter(
      v => selectedToInvite.has(v.id) && v.email
    );

    // Mock send - in production this would call an API
    console.log('Sending invitations to:', vendorsToSend);

    toast({
      title: 'Invitations sent!',
      description: `Successfully sent invitations to ${vendorsToSend.length} vendors.`,
    });
  };

  // Handle Calendly click (placeholder)
  const handleCalendlyClick = () => {
    toast({
      title: 'Calendly integration',
      description: 'This will open Calendly scheduling link configuration.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Shortlisted Vendors Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={TYPOGRAPHY.heading.h6}>
            Vendors to Invite ({Array.from(selectedToInvite).length} selected)
          </h3>

          {/* Add Vendor Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {availableForDropdown.length > 0 && (
                <>
                  {availableForDropdown.map(vendor => (
                    <DropdownMenuItem
                      key={vendor.id}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDropdownSelection(vendor.id);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox
                          checked={dropdownSelectedIds.has(vendor.id)}
                          onCheckedChange={() => toggleDropdownSelection(vendor.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {vendor.website && (
                          <img
                            src={`https://img.logo.dev/${vendor.website.replace(/^https?:\/\//, '').split('/')[0]}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`}
                            alt=""
                            className="w-4 h-4 rounded"
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                        <span className="flex-1 truncate">{vendor.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  {dropdownSelectedIds.size > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={handleAddSelectedVendors}
                        >
                          Add {dropdownSelectedIds.size} Vendor{dropdownSelectedIds.size > 1 ? 's' : ''}
                        </Button>
                      </div>
                    </>
                  )}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setIsAddCustomOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Vendor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vendor Cards */}
        <div className="space-y-3">
          {allInviteVendors.map(vendor => (
            <Card
              key={vendor.id}
              className={`transition-colors ${
                selectedToInvite.has(vendor.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedToInvite.has(vendor.id)}
                    onCheckedChange={() => toggleVendorSelection(vendor.id)}
                    disabled={!vendor.email}
                  />

                  {/* Logo */}
                  {vendor.website && (
                    <img
                      src={`https://img.logo.dev/${vendor.website.replace(/^https?:\/\//, '').split('/')[0]}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`}
                      alt={`${vendor.name} logo`}
                      className="w-10 h-10 rounded-md object-contain flex-shrink-0 bg-white"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  )}

                  {/* Vendor Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{vendor.name}</div>
                    {vendor.email ? (
                      <div className="text-sm text-gray-500 truncate">
                        {vendor.email}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-amber-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unable to find email
                      </div>
                    )}
                  </div>

                  {/* Remove button for custom vendors */}
                  {vendor.id.startsWith('custom_') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCustomVendor(vendor.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {allInviteVendors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No vendors shortlisted for invitation.</p>
              <p className="text-sm">
                Go back to Vendor Comparison to shortlist vendors.
              </p>
            </div>
          )}
        </div>

        {errors.vendors && (
          <p className="text-sm text-red-500 mt-2">{errors.vendors}</p>
        )}
      </div>

      {/* Email Template Section */}
      {allInviteVendors.length > 0 && (
        <div className="space-y-4">
          <h3 className={TYPOGRAPHY.heading.h6}>Email Template</h3>

          {/* Subject Line */}
          <div>
            <Label htmlFor="subject" className={TYPOGRAPHY.label.default}>
              Subject Line
            </Label>
            <Input
              id="subject"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Calendly Button */}
          <div>
            <Label className={TYPOGRAPHY.label.default}>
              Meeting Scheduling
            </Label>
            <Button
              variant="outline"
              onClick={handleCalendlyClick}
              className="w-full mt-1 justify-start gap-2"
            >
              <Calendar className="h-4 w-4" />
              Add Calendly Link
            </Button>
          </div>

          {/* Sender Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name" className={TYPOGRAPHY.label.default}>
                Your Name *
              </Label>
              <Input
                id="name"
                value={senderInfo.name}
                onChange={e =>
                  setSenderInfo(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="John Doe"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email" className={TYPOGRAPHY.label.default}>
                Email for Vendor Responses *
              </Label>
              <Input
                id="email"
                type="email"
                value={senderInfo.email}
                onChange={e =>
                  setSenderInfo(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder="you@company.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="company" className={TYPOGRAPHY.label.default}>
                Your Company *
              </Label>
              <Input
                id="company"
                value={senderInfo.company}
                onChange={e =>
                  setSenderInfo(prev => ({ ...prev, company: e.target.value }))
                }
                placeholder="Acme Inc."
                className={errors.company ? 'border-red-500' : ''}
              />
              {errors.company && (
                <p className="text-xs text-red-500 mt-1">{errors.company}</p>
              )}
            </div>
          </div>

          {/* Email Body (Editable) */}
          <div>
            <Label htmlFor="emailBody" className={TYPOGRAPHY.label.default}>
              Email Body
            </Label>
            <Textarea
              id="emailBody"
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              rows={16}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {/* Send Button */}
          <div className="flex justify-end gap-2 sm:gap-3 pt-4">
            <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 flex-1 sm:flex-none">
              <Copy className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Copy to Clipboard</span>
            </Button>
            <Button onClick={handleSend} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 flex-1 sm:flex-none">
              <Send className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Send Invitations</span>
            </Button>
          </div>
        </div>
      )}

      {/* Add Custom Vendor Dialog */}
      <Dialog open={isAddCustomOpen} onOpenChange={setIsAddCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Vendor</DialogTitle>
            <DialogDescription>
              Add a vendor that's not in the current list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="customName">Vendor Name *</Label>
              <Input
                id="customName"
                value={customVendorName}
                onChange={e => setCustomVendorName(e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>
            <div>
              <Label htmlFor="customEmail">Email (Optional)</Label>
              <Input
                id="customEmail"
                type="email"
                value={customVendorEmail}
                onChange={e => setCustomVendorEmail(e.target.value)}
                placeholder="sales@vendor.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddCustomOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomVendor}
              disabled={!customVendorName.trim()}
            >
              Add Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorInviteNew;
