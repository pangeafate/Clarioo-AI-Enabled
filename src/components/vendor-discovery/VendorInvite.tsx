import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Phone, Globe, Star, Calendar, Send, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TYPOGRAPHY } from '@/styles/typography-config';
import type { Vendor, Criteria, TechRequest } from '../VendorDiscovery';

interface VendorInviteProps {
  vendors: Vendor[];
  criteria: Criteria[];
  techRequest: TechRequest;
  projectName: string;
}

interface InviteEmail {
  subject: string;
  body: string;
  meetingDate?: string;
  meetingTime?: string;
}

const VendorInvite = ({ vendors, criteria, techRequest, projectName }: VendorInviteProps) => {
  const { toast } = useToast();
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [inviteEmail, setInviteEmail] = useState<InviteEmail>({
    subject: `Invitation to Pitch: ${projectName} - ${techRequest.category} Solution`,
    body: `Dear [Vendor Name] Team,

We are reaching out to invite you to present your ${techRequest.category.toLowerCase()} solution for our project "${projectName}".

Based on our evaluation, your solution shows strong potential for meeting our requirements:

Project Overview:
• Category: ${techRequest.category}
• Budget: ${techRequest.budget}
• Timeline: ${techRequest.urgency} priority
• Key Requirements: ${criteria.map(c => c.name).join(', ')}

We would like to schedule a presentation session where you can:
1. Demonstrate your solution
2. Address our specific requirements
3. Discuss implementation timeline and pricing
4. Answer technical questions from our team

Please let us know your availability for the proposed meeting time, or suggest alternative times that work better for your schedule.

We look forward to learning more about how your solution can help achieve our goals.

Best regards,
[Your Name]
[Your Title]
[Company Name]`,
    meetingDate: '',
    meetingTime: ''
  });
  const [invitedVendors, setInvitedVendors] = useState<Set<string>>(new Set());

  const calculateOverallScore = (vendor: Vendor): number => {
    const totalWeight = criteria.reduce((sum, criterion) => {
      const weight = criterion.importance === 'high' ? 3 : criterion.importance === 'medium' ? 2 : 1;
      return sum + weight;
    }, 0);

    const weightedSum = criteria.reduce((sum, criterion) => {
      const score = vendor.criteriaScores[criterion.id] || 0;
      const weight = criterion.importance === 'high' ? 3 : criterion.importance === 'medium' ? 2 : 1;
      return sum + (score * weight);
    }, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const sortedVendors = [...vendors].sort((a, b) => calculateOverallScore(b) - calculateOverallScore(a));

  const toggleVendorSelection = (vendorId: string) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
  };

  const selectAllVendors = () => {
    if (selectedVendors.size === vendors.length) {
      setSelectedVendors(new Set());
    } else {
      setSelectedVendors(new Set(vendors.map(v => v.id)));
    }
  };

  const sendInvites = () => {
    if (selectedVendors.size === 0) {
      toast({
        title: "No vendors selected",
        description: "Please select at least one vendor to invite.",
        variant: "destructive"
      });
      return;
    }

    // In a real application, this would send actual emails
    const newInvited = new Set([...invitedVendors, ...selectedVendors]);
    setInvitedVendors(newInvited);
    setSelectedVendors(new Set());

    toast({
      title: "Invitations sent successfully",
      description: `Sent invitations to ${selectedVendors.size} vendor${selectedVendors.size > 1 ? 's' : ''}.`
    });
  };

  const previewEmail = (vendor: Vendor) => {
    return {
      ...inviteEmail,
      body: inviteEmail.body.replace('[Vendor Name]', vendor.name)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`${TYPOGRAPHY.heading.h2} mb-2`}>Invite Vendors to Pitch</h2>
        <p className={TYPOGRAPHY.muted.default}>
          Select vendors you'd like to invite to present their solutions
        </p>
      </div>

      {/* Email Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitation Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={inviteEmail.subject}
              onChange={(e) => setInviteEmail({ ...inviteEmail, subject: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Proposed Meeting Date</Label>
              <Input
                id="date"
                type="date"
                value={inviteEmail.meetingDate}
                onChange={(e) => setInviteEmail({ ...inviteEmail, meetingDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="time">Proposed Meeting Time</Label>
              <Input
                id="time"
                type="time"
                value={inviteEmail.meetingTime}
                onChange={(e) => setInviteEmail({ ...inviteEmail, meetingTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              rows={8}
              value={inviteEmail.body}
              onChange={(e) => setInviteEmail({ ...inviteEmail, body: e.target.value })}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendor List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vendor Rankings</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVendors}
              >
                {selectedVendors.size === vendors.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={sendInvites}
                disabled={selectedVendors.size === 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send Invites ({selectedVendors.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedVendors.map((vendor, index) => {
              const overallScore = calculateOverallScore(vendor);
              const isSelected = selectedVendors.has(vendor.id);
              const isInvited = invitedVendors.has(vendor.id);
              
              return (
                <div
                  key={vendor.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5' : 
                    isInvited ? 'border-success bg-success/5' : 'border-border'
                  } ${isInvited ? 'opacity-75' : ''}`}
                  onClick={() => !isInvited && toggleVendorSelection(vendor.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={TYPOGRAPHY.heading.h2}>#{index + 1}</span>
                          <div>
                            <h3 className={TYPOGRAPHY.heading.h5}>{vendor.name}</h3>
                            <p className={TYPOGRAPHY.muted.small}>{vendor.description}</p>
                          </div>
                        </div>
                        {isInvited && (
                          <Badge className="bg-success">
                            <Check className="h-3 w-3 mr-1" />
                            Invited
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className={TYPOGRAPHY.label.default}>{vendor.rating}/5</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Score: {overallScore.toFixed(1)}/5
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={vendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={TYPOGRAPHY.link.small}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        </div>
                        <div className={TYPOGRAPHY.muted.small}>
                          {vendor.pricing}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {vendor.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className={TYPOGRAPHY.special.badge}>
                            {feature}
                          </Badge>
                        ))}
                        {vendor.features.length > 3 && (
                          <Badge variant="outline" className={TYPOGRAPHY.special.badge}>
                            +{vendor.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                            Preview Email
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Email Preview - {vendor.name}</DialogTitle>
                            <DialogDescription>
                              Preview of the invitation email that will be sent
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className={TYPOGRAPHY.label.default}>Subject:</Label>
                              <p className={`${TYPOGRAPHY.body.small} mt-1`}>{previewEmail(vendor).subject}</p>
                            </div>
                            <Separator />
                            <div>
                              <Label className={TYPOGRAPHY.label.default}>Body:</Label>
                              <div className={`mt-2 p-3 bg-muted rounded-lg ${TYPOGRAPHY.body.small} whitespace-pre-wrap`}>
                                {previewEmail(vendor).body}
                              </div>
                            </div>
                            {inviteEmail.meetingDate && inviteEmail.meetingTime && (
                              <>
                                <Separator />
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span className={TYPOGRAPHY.body.small}>
                                    Proposed meeting: {inviteEmail.meetingDate} at {inviteEmail.meetingTime}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gradient-secondary border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className={`${TYPOGRAPHY.heading.h2} text-primary`}>{vendors.length}</div>
              <p className={TYPOGRAPHY.muted.small}>Total Vendors</p>
            </div>
            <div>
              <div className={`${TYPOGRAPHY.heading.h2} text-primary`}>{selectedVendors.size}</div>
              <p className={TYPOGRAPHY.muted.small}>Selected for Invite</p>
            </div>
            <div>
              <div className={`${TYPOGRAPHY.heading.h2} text-success`}>{invitedVendors.size}</div>
              <p className={TYPOGRAPHY.muted.small}>Invitations Sent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorInvite;