/**
 * 🎨 PROTOTYPE MODE: Vendor Selection Component
 * Uses mock AI service instead of OpenAI
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RefreshCw,
  Sparkles,
  Plus,
  ExternalLink,
  Trash2,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TechRequest, Criteria, Vendor } from "../VendorDiscovery";
import { useVendorDiscovery } from "@/hooks/useVendorDiscovery";
import { TYPOGRAPHY } from "@/styles/typography-config";
import { LoadingState } from "@/components/shared/loading/LoadingState";

interface VendorSelectionProps {
  criteria: Criteria[];
  techRequest: TechRequest;
  onComplete: (selectedVendors: Vendor[]) => void;
}

const VendorSelection = ({ criteria, techRequest, onComplete }: VendorSelectionProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    description: '',
    website: '',
    pricing: '',
    rating: 4.0
  });
  const { toast } = useToast();

  // Use vendor discovery hook for business logic
  const {
    isDiscovering,
    discoverVendors: discoverVendorsFromHook
  } = useVendorDiscovery();

  useEffect(() => {
    handleDiscoverVendors();
  }, [criteria, techRequest]);

  /**
   * Handle vendor discovery
   * Wrapper around hook method to update local state
   */
  const handleDiscoverVendors = async () => {
    setIsLoading(true);

    try {
      const discoveredVendors = await discoverVendorsFromHook(
        techRequest,
        criteria,
        10 // maxVendors - aligned with CRM mock data (10 vendors)
      );

      setVendors(discoveredVendors);

      // Auto-select all vendors initially
      const allIds = new Set(discoveredVendors.map(v => v.id));
      setSelectedVendorIds(allIds);

      toast({
        title: "Vendors discovered!",
        description: `Found ${discoveredVendors.length} vendors for your ${techRequest.category} needs.`
      });
    } catch (error) {
      console.error('Vendor discovery failed:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const toggleVendorSelection = (vendorId: string) => {
    const newSelection = new Set(selectedVendorIds);
    if (newSelection.has(vendorId)) {
      newSelection.delete(vendorId);
    } else {
      newSelection.add(vendorId);
    }
    setSelectedVendorIds(newSelection);
  };

  const addCustomVendor = () => {
    if (!newVendor.name.trim() || !newVendor.website.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please provide at least vendor name and website.",
        variant: "destructive"
      });
      return;
    }

    const vendor: Vendor = {
      id: `custom-${Date.now()}`,
      name: newVendor.name,
      description: newVendor.description || 'Custom vendor',
      website: newVendor.website,
      pricing: newVendor.pricing || 'Contact for pricing',
      rating: newVendor.rating,
      criteriaScores: {},
      criteriaAnswers: {},
      features: []
    };

    const updatedVendors = [...vendors, vendor];
    setVendors(updatedVendors);
    setSelectedVendorIds(prev => new Set([...prev, vendor.id]));
    setShowAddVendor(false);
    setNewVendor({
      name: '',
      description: '',
      website: '',
      pricing: '',
      rating: 4.0
    });

    toast({
      title: "Vendor added successfully",
      description: `${vendor.name} has been added to your list.`
    });
  };

  const removeVendor = (vendorId: string) => {
    setVendors(prev => prev.filter(v => v.id !== vendorId));
    setSelectedVendorIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(vendorId);
      return newSet;
    });
  };

  const saveVendorSelection = async (selectedVendors: Vendor[]) => {
    // 🎨 PROTOTYPE MODE: No database persistence
    // In production, this would save to database for analytics
    console.log('Vendor selection saved (prototype mode):', {
      vendor_count: selectedVendors.length,
      selected_vendors: selectedVendors.map(v => v.name)
    });
  };

  const handleComplete = async () => {
    const selectedVendors = vendors.filter(vendor => selectedVendorIds.has(vendor.id));
    if (selectedVendors.length === 0) {
      toast({
        title: "No vendors selected",
        description: "Please select at least one vendor to proceed.",
        variant: "destructive"
      });
      return;
    }
    
    // Save selection to database for analytics
    await saveVendorSelection(selectedVendors);
    
    onComplete(selectedVendors);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingState
            icon={RefreshCw}
            message="Discovering vendors..."
            description={`AI is finding ${techRequest.category} vendors based on your requirements`}
            showProgress={true}
            progress={75}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat with AI
        </Button>
        <Button onClick={handleDiscoverVendors} variant="default" size="sm" className="gap-2" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Rediscover
        </Button>
      </div>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Vendor</DialogTitle>
            <DialogDescription>
              Add a vendor to include in the comparison
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Vendor Name *</Label>
              <Input
                id="vendor-name"
                value={newVendor.name}
                onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter vendor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-description">Description</Label>
              <Input
                id="vendor-description"
                value={newVendor.description}
                onChange={(e) => setNewVendor(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-website">Website *</Label>
              <Input
                id="vendor-website"
                value={newVendor.website}
                onChange={(e) => setNewVendor(prev => ({ ...prev, website: e.target.value }))}
                placeholder="company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-pricing">Pricing</Label>
              <Input
                id="vendor-pricing"
                value={newVendor.pricing}
                onChange={(e) => setNewVendor(prev => ({ ...prev, pricing: e.target.value }))}
                placeholder="$50/month or Contact for pricing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-rating">Rating (1-5)</Label>
              <Input
                id="vendor-rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={newVendor.rating}
                onChange={(e) => setNewVendor(prev => ({ ...prev, rating: parseFloat(e.target.value) || 4.0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVendor(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomVendor}>
              Add Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Vendors for Comparison</CardTitle>
          <CardDescription>
            Found {vendors.length} vendors. Select the ones you want to compare in detail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <Card key={vendor.id} className={`cursor-pointer transition-all ${
                selectedVendorIds.has(vendor.id) ? 'ring-2 ring-primary' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-end mb-3 gap-2">
                    {vendor.id.startsWith('custom-') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVendor(vendor.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Checkbox
                      checked={selectedVendorIds.has(vendor.id)}
                      onCheckedChange={() => toggleVendorSelection(vendor.id)}
                    />
                  </div>

                  <div className="space-y-2">
                    {/* Vendor logo and name - inline */}
                    <div className="flex items-center gap-2">
                      {vendor.website && (
                        <img
                          src={`https://img.logo.dev/${vendor.website.replace(/^https?:\/\//, '').split('/')[0]}?token=pk_Fvbs8Zl6SWiC5WEoP8Qzbg`}
                          alt={`${vendor.name} logo`}
                          className="w-10 h-10 rounded object-contain flex-shrink-0 bg-white"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 className={`${TYPOGRAPHY.body.small} font-bold`}>{vendor.name}</h3>
                    </div>

                    <p className={`${TYPOGRAPHY.card.metadata} leading-tight`}>
                      {vendor.description}
                    </p>

                    <div className={`flex items-center justify-end ${TYPOGRAPHY.body.xs}`}>
                      <a
                        href={`https://${vendor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Vendor Placeholder - Matches vendor card dimensions */}
            <button
              onClick={() => setShowAddVendor(true)}
              className="border border-dashed border-gray-300 rounded-lg bg-white hover:border-primary hover:bg-primary/5 transition-all p-4 flex items-center justify-center min-h-[140px]"
            >
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary group">
                <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className={TYPOGRAPHY.button.default}>Add Vendor</span>
              </div>
            </button>
          </div>

          {vendors.length === 0 && (
            <div className={`text-center py-8 ${TYPOGRAPHY.muted.default}`}>
              No vendors found. Try adjusting your search criteria or add vendors manually.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary & Continue */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <p className={TYPOGRAPHY.body.default}>
                {selectedVendorIds.size} of {vendors.length} vendors selected
              </p>
              <p className={TYPOGRAPHY.muted.small}>
                Ready to proceed with detailed comparison analysis
              </p>
            </div>
            <Button onClick={handleComplete} disabled={selectedVendorIds.size === 0} className="w-full md:w-auto">
              Continue to Comparison
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSelection;