/**
 * 🎨 PROTOTYPE MODE: Vendor Table Component
 * Uses mock AI service instead of OpenAI
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ExternalLink, Star, Filter, Download, RefreshCw, TrendingUp, Award, Users, Globe, Sparkles, Plus, BarChart3, FileSpreadsheet, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVendorComparison } from "@/hooks/useVendorComparison";
import * as exportHelpers from "@/utils/exportHelpers";
import type { TechRequest, Criteria, Vendor } from "../VendorDiscovery";
import ExecutiveSummary from "./ExecutiveSummary";
import { TYPOGRAPHY } from '@/styles/typography-config';
import { LoadingState } from "@/components/shared/loading/LoadingState";
interface VendorTableProps {
  vendors: Vendor[];
  criteria: Criteria[];
  techRequest: TechRequest;
  onVendorsGenerated: (vendors: Vendor[]) => void;
  onComplete?: () => void;
}
const VendorTable = ({
  vendors: initialVendors,
  criteria,
  techRequest,
  onVendorsGenerated,
  onComplete
}: VendorTableProps) => {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'overall'>('overall');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAIComparison, setShowAIComparison] = useState(false);
  const [aiComparisonResult, setAIComparisonResult] = useState<string>('');
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    description: '',
    website: '',
    pricing: '',
    rating: 4.0
  });
  const { toast } = useToast();

  // Use vendor comparison hook for business logic
  const {
    isGenerating,
    generateDetailedComparison,
    calculateOverallScore,
    generateStrategicComparison: generateStrategicComparisonHook
  } = useVendorComparison();

  useEffect(() => {
    setVendors(initialVendors);
    if (initialVendors.length > 0 && initialVendors[0].criteriaScores && Object.keys(initialVendors[0].criteriaScores).length === 0) {
      // If vendors don't have criteria scores, generate them
      handleGenerateComparison();
    }
  }, [initialVendors, criteria, techRequest]);
  /**
   * Handle detailed vendor comparison generation
   * Wrapper around hook method to update local state
   */
  const handleGenerateComparison = async () => {
    setIsLoading(true);

    try {
      const vendorsWithScores = await generateDetailedComparison(
        vendors,
        criteria,
        techRequest
      );

      setVendors(vendorsWithScores);
      onVendorsGenerated(vendorsWithScores);

      toast({
        title: "Comparison completed!",
        description: `Generated detailed comparison for ${vendorsWithScores.length} vendors.`
      });
    } catch (error) {
      console.error('Comparison generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const filteredAndSortedVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || vendor.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || vendor.rating >= parseFloat(filterRating);
    return matchesSearch && matchesRating;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'overall':
        return calculateOverallScore(b, criteria) - calculateOverallScore(a, criteria);
      default:
        return 0;
    }
  });
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-primary text-primary-foreground';
      case 'technical':
        return 'bg-accent text-accent-foreground';
      case 'business':
        return 'bg-success text-success-foreground';
      case 'compliance':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  /**
   * Handle Excel export
   * Uses exportHelpers utility
   */
  const handleExportToExcel = () => {
    const result = exportHelpers.exportToExcel(
      filteredAndSortedVendors,
      criteria,
      techRequest,
      (vendor) => calculateOverallScore(vendor, criteria)
    );

    if (result.success) {
      toast({
        title: "Excel export successful",
        description: `Vendor comparison data has been downloaded as ${result.filename}`
      });
    } else {
      toast({
        title: "Export failed",
        description: result.error || "Failed to export to Excel",
        variant: "destructive"
      });
    }
  };

  /**
   * Handle CSV export
   * Uses exportHelpers utility
   */
  const handleExportToCSV = () => {
    const result = exportHelpers.exportToCSV(
      filteredAndSortedVendors,
      criteria,
      techRequest,
      (vendor) => calculateOverallScore(vendor, criteria)
    );

    if (result.success) {
      toast({
        title: "Export successful",
        description: `Vendor comparison data has been downloaded as ${result.filename}`
      });
    } else {
      toast({
        title: "Export failed",
        description: result.error || "Failed to export to CSV",
        variant: "destructive"
      });
    }
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

    // Generate criteria scores and answers for the new vendor
    const criteriaScores: Record<string, number> = {};
    const criteriaAnswers: Record<string, {
      yesNo: 'yes' | 'no' | 'partial';
      comment: string;
    }> = {};
    criteria.forEach(criterion => {
      // Default score around 3.5 (can be edited later)
      criteriaScores[criterion.id] = 3.5;
      criteriaAnswers[criterion.id] = {
        yesNo: 'partial',
        comment: 'Manual entry - requires validation'
      };
    });
    const vendor: Vendor = {
      id: `custom-${Date.now()}`,
      name: newVendor.name,
      description: newVendor.description || 'Custom vendor',
      website: newVendor.website,
      pricing: newVendor.pricing || 'Contact for pricing',
      rating: newVendor.rating,
      criteriaScores,
      criteriaAnswers,
      features: ['Custom vendor features']
    };
    const updatedVendors = [...vendors, vendor];
    setVendors(updatedVendors);
    onVendorsGenerated(updatedVendors);
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
      description: `${vendor.name} has been added. Re-running AI discovery to update comparison...`
    });

    // Re-run AI comparison to get updated comparison with the new vendor
    setTimeout(() => {
      handleGenerateComparison();
    }, 1000);
  };
  /**
   * Handle strategic comparison generation
   * Wrapper around hook method to update local state
   */
  const handleGenerateStrategicComparison = async () => {
    setIsGeneratingComparison(true);

    try {
      const analysis = await generateStrategicComparisonHook(
        filteredAndSortedVendors,
        criteria,
        techRequest
      );

      if (analysis) {
        setAIComparisonResult(analysis);
        setShowAIComparison(true);

        toast({
          title: "Analysis Generated",
          description: "Strategic vendor analysis completed successfully."
        });
      }
    } catch (error) {
      console.error('Strategic comparison failed:', error);
    } finally {
      setIsGeneratingComparison(false);
    }
  };
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingState
            icon={RefreshCw}
            message="Generating comparison matrix..."
            description="AI is generating detailed comparison scores for selected vendors"
            showProgress={true}
            progress={75}
          />
        </CardContent>
      </Card>
    );
  }
  return <div className="space-y-6">
      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <div>
                <p className={TYPOGRAPHY.heading.h3}>{vendors.length}</p>
                <p className={TYPOGRAPHY.muted.small}>Vendors Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <div>
                <p className={TYPOGRAPHY.heading.h3}>
                  {vendors.length > 0 ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1) : '0'}
                </p>
                <p className={TYPOGRAPHY.muted.small}>Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-success" />
              <div>
                <p className={TYPOGRAPHY.heading.h3}>
                  {vendors.filter(v => calculateOverallScore(v, criteria) >= 4.0).length}
                </p>
                <p className={TYPOGRAPHY.muted.small}>Top Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className={TYPOGRAPHY.heading.h3}>{criteria.length}</p>
                <p className={TYPOGRAPHY.muted.small}>Criteria Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Vendor Comparison
            </span>
            <Button onClick={handleGenerateComparison} variant="default" size="sm" className="gap-2" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate Comparison
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className={TYPOGRAPHY.label.default}>🎨 Prototype Mode</span>
            </div>
            <p className={TYPOGRAPHY.muted.xs}>
              Using curated comparison data for {techRequest.category}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      

      {/* Vendor Comparison Table - Transposed with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Vendor Comparison Matrix ({criteria.length} criteria)
                <Badge variant="secondary">{filteredAndSortedVendors.length} Vendors</Badge>
              </CardTitle>
              <CardDescription>
                Vendors ranked by overall score based on your criteria
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportToExcel} variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              {onComplete && (
                <Button onClick={onComplete} size="sm" className="ml-2">
                  <Mail className="w-4 h-4 mr-2" />
                  Proceed to Invitations
                </Button>
              )}
              <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
                <DialogTrigger asChild>
                  
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Vendor</DialogTitle>
                    <DialogDescription>
                      Add a vendor manually to include in the comparison.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor-name">Vendor Name *</Label>
                      <Input id="vendor-name" value={newVendor.name} onChange={e => setNewVendor(prev => ({
                      ...prev,
                      name: e.target.value
                    }))} placeholder="Enter vendor name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-description">Description</Label>
                      <Input id="vendor-description" value={newVendor.description} onChange={e => setNewVendor(prev => ({
                      ...prev,
                      description: e.target.value
                    }))} placeholder="Brief description" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-website">Website *</Label>
                      <Input id="vendor-website" value={newVendor.website} onChange={e => setNewVendor(prev => ({
                      ...prev,
                      website: e.target.value
                    }))} placeholder="example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-pricing">Pricing</Label>
                      <Input id="vendor-pricing" value={newVendor.pricing} onChange={e => setNewVendor(prev => ({
                      ...prev,
                      pricing: e.target.value
                    }))} placeholder="Contact for pricing" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor-rating">Rating (1-5)</Label>
                      <Input id="vendor-rating" type="number" min="1" max="5" step="0.1" value={newVendor.rating} onChange={e => setNewVendor(prev => ({
                      ...prev,
                      rating: parseFloat(e.target.value) || 4.0
                    }))} />
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
              
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="feature" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="feature" className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary text-primary-foreground">Feature</Badge>
                ({criteria.filter(c => c.type === 'feature').length})
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <Badge variant="outline" className="bg-accent text-accent-foreground">Technical</Badge>
                ({criteria.filter(c => c.type === 'technical').length})
              </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-success text-success-foreground">Business</Badge>
                  ({criteria.filter(c => c.type === 'business').length})
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-warning text-warning-foreground">Compliance</Badge>
                  ({criteria.filter(c => c.type === 'compliance').length})
                </TabsTrigger>
            </TabsList>

            {['feature', 'technical', 'business', 'compliance'].map(type => <TabsContent key={type} value={type} className="mt-4">
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="sticky top-0 z-30 bg-background border-b">
                        <TableHead className="sticky left-0 z-40 bg-background border-r min-w-[200px] shadow-sm">Criterion</TableHead>
                        <TableHead className="sticky left-[200px] z-40 bg-background border-r w-[100px] shadow-sm">Importance</TableHead>
                        {filteredAndSortedVendors.map((vendor, index) => <TableHead key={vendor.id} className="text-center min-w-[140px] max-w-[180px]">
                             <div className="space-y-1">
                               <div className="flex items-center justify-center gap-1">
                                 <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className={`${TYPOGRAPHY.table.header} hover:text-primary/80 transition-colors underline-offset-4 hover:underline`}>
                                   {vendor.name}
                                 </a>
                                 <ExternalLink className="h-3 w-3" />
                               </div>
                               <div className="flex items-center justify-center gap-1">
                                 <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{vendor.rating}</span>
                              </div>
                              <div className={TYPOGRAPHY.label.small}>
                                Overall: {calculateOverallScore(vendor, criteria).toFixed(1)}
                              </div>
                            </div>
                          </TableHead>)}
                        
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {criteria.filter(c => c.type === type).map(criterion => <TableRow key={criterion.id}>
                          <TableCell className="sticky left-0 z-10 bg-background border-r min-w-[180px] max-w-[220px] shadow-sm">
                            <div className="space-y-1">
                              <div className={`${TYPOGRAPHY.table.cell} font-semibold break-words whitespace-normal leading-tight`}>{criterion.name}</div>
                              <Badge variant="outline" className={getTypeColor(criterion.type)}>
                                {criterion.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="sticky left-[200px] z-10 bg-background border-r shadow-sm">
                            <Badge variant="outline" className={getImportanceColor(criterion.importance)}>
                              {criterion.importance}
                            </Badge>
                          </TableCell>
                           {filteredAndSortedVendors.map(vendor => <TableCell key={vendor.id} className="text-center">
                              <div className="flex flex-col items-center gap-2 p-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-warning text-warning" />
                                  <span className={TYPOGRAPHY.label.small}>
                                    {vendor.criteriaScores[criterion.id]?.toFixed(1) || 'N/A'}
                                  </span>
                                </div>
                                <Progress value={(vendor.criteriaScores[criterion.id] || 0) * 20} className="w-16 h-2" />
                                 {vendor.criteriaAnswers[criterion.id] && <div className="space-y-1 w-full">
                                     <Badge variant={vendor.criteriaAnswers[criterion.id].yesNo === 'yes' ? 'default' : vendor.criteriaAnswers[criterion.id].yesNo === 'partial' ? 'secondary' : 'destructive'} className="text-xs">
                                       {vendor.criteriaAnswers[criterion.id].yesNo === 'yes' ? 'Yes' : vendor.criteriaAnswers[criterion.id].yesNo === 'partial' ? 'Partial' : 'No'}
                                     </Badge>
                                     <p className={`${TYPOGRAPHY.muted.xs} leading-tight break-words`}>
                                       {vendor.criteriaAnswers[criterion.id].comment}
                                     </p>
                                     <a href={`https://${vendor.website}/features`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${TYPOGRAPHY.link.small} hover:text-primary/80 transition-colors`}>
                                       <ExternalLink className="h-3 w-3" />
                                       Source
                                     </a>
                                   </div>}
                              </div>
                            </TableCell>)}
                        </TableRow>)}
                      {criteria.filter(c => c.type === type).length === 0 && <TableRow>
                          <TableCell colSpan={filteredAndSortedVendors.length + 2} className={`text-center ${TYPOGRAPHY.muted.default} py-8`}>
                            No {type} criteria defined
                          </TableCell>
                        </TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>)}
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Executive Summary */}
      <ExecutiveSummary
        vendors={filteredAndSortedVendors}
        criteria={criteria}
        techRequest={techRequest}
        calculateOverallScore={(vendor) => calculateOverallScore(vendor, criteria)}
      />

      {/* AI Comparison Analysis */}
      <Dialog open={showAIComparison} onOpenChange={setShowAIComparison}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              AI Strategic Vendor Comparison
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of your vendor options based on requirements and criteria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {aiComparisonResult}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIComparison(false)}>
              Close
            </Button>
            <Button onClick={() => {
            navigator.clipboard.writeText(aiComparisonResult);
            toast({
              title: "Copied to clipboard",
              description: "Analysis copied successfully"
            });
          }}>
              Copy Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default VendorTable;