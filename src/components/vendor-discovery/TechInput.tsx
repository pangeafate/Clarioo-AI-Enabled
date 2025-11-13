import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import type { TechRequest } from "../VendorDiscovery";
import { useToast } from "@/hooks/use-toast";

interface TechInputProps {
  onSubmit: (request: TechRequest) => void;
  initialData?: TechRequest | null;
  projectId: string;
}

const TechInput = ({ onSubmit, initialData, projectId }: TechInputProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TechRequest>(
    initialData || {
      category: '',
      description: '',
      companyInfo: ''
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  /**
   * Load landing page inputs and create AI summary
   * - Reads data saved by AnimatedInputs.tsx
   * - Generates AI summary from inputs
   * - Auto-detects technology category
   * - Clears localStorage after loading (one-time use)
   */
  useEffect(() => {
    const landingCompanyInfo = localStorage.getItem('landing_company_info');
    const landingTechNeeds = localStorage.getItem('landing_tech_needs');

    if (landingCompanyInfo || landingTechNeeds) {
      // Generate AI summary
      const summary = `Based on your inputs, you're looking for: ${landingTechNeeds || 'technology solutions'}${landingCompanyInfo ? ` for ${landingCompanyInfo}` : ''}`;
      setAiSummary(summary);

      // Auto-detect category from tech needs
      const detectedCategory = landingTechNeeds ? detectCategory(landingTechNeeds) : '';

      // Pre-fill form data
      setFormData(prev => ({
        ...prev,
        companyInfo: landingCompanyInfo || prev.companyInfo,
        description: landingTechNeeds || prev.description,
        category: detectedCategory || prev.category
      }));

      // Clear localStorage after loading (one-time use)
      localStorage.removeItem('landing_company_info');
      localStorage.removeItem('landing_tech_needs');

      // Show success feedback
      toast({
        title: "✨ AI Summary Generated",
        description: "We've analyzed your inputs and pre-selected the category!",
        duration: 3000,
      });

      console.log('✅ AI summary created and category auto-detected');
    }
  }, []); // Run once on mount

  const techCategories = [
    'CRM Software',
    'Project Management',
    'Analytics & BI',
    'Communication Tools',
    'Security Solutions',
    'DevOps & Infrastructure',
    'HR & Talent Management',
    'Marketing Automation',
    'E-commerce Platforms',
    'Data Management',
    'AI & Machine Learning',
    'Other'
  ];

  /**
   * Auto-detect technology category based on description keywords
   */
  const detectCategory = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('crm') || lowerDesc.includes('customer relationship') || lowerDesc.includes('sales')) {
      return 'CRM Software';
    }
    if (lowerDesc.includes('project') || lowerDesc.includes('task') || lowerDesc.includes('workflow')) {
      return 'Project Management';
    }
    if (lowerDesc.includes('analytics') || lowerDesc.includes('bi') || lowerDesc.includes('data visualization')) {
      return 'Analytics & BI';
    }
    if (lowerDesc.includes('communication') || lowerDesc.includes('messaging') || lowerDesc.includes('chat')) {
      return 'Communication Tools';
    }
    if (lowerDesc.includes('security') || lowerDesc.includes('firewall') || lowerDesc.includes('monitoring')) {
      return 'Security Solutions';
    }
    if (lowerDesc.includes('devops') || lowerDesc.includes('infrastructure') || lowerDesc.includes('deployment')) {
      return 'DevOps & Infrastructure';
    }
    if (lowerDesc.includes('hr') || lowerDesc.includes('human resources') || lowerDesc.includes('talent') || lowerDesc.includes('recruitment')) {
      return 'HR & Talent Management';
    }
    if (lowerDesc.includes('marketing') || lowerDesc.includes('email campaign') || lowerDesc.includes('automation')) {
      return 'Marketing Automation';
    }
    if (lowerDesc.includes('e-commerce') || lowerDesc.includes('ecommerce') || lowerDesc.includes('online store')) {
      return 'E-commerce Platforms';
    }
    if (lowerDesc.includes('data') || lowerDesc.includes('database') || lowerDesc.includes('storage')) {
      return 'Data Management';
    }
    if (lowerDesc.includes('ai') || lowerDesc.includes('machine learning') || lowerDesc.includes('ml')) {
      return 'AI & Machine Learning';
    }

    return 'Other';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Please select a technology category';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please describe what you\'re looking for';
    }
    if (formData.description.trim().length < 20) {
      newErrors.description = 'Please provide more details (at least 20 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveTechRequest = async (requestData: TechRequest) => {
    // 🎨 PROTOTYPE MODE: No database persistence
    // In production, this would save to database for analytics
    console.log('Tech request saved (prototype mode):', {
      category: requestData.category,
      description: requestData.description
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);

      // Merge additional notes with company info for complete context
      const completeRequest = {
        ...formData,
        companyInfo: additionalNotes || formData.companyInfo
      };

      // Save to database for analytics
      await saveTechRequest(completeRequest);

      // Continue with the normal flow
      onSubmit(completeRequest);
      setIsSubmitting(false);
    }
  };

  const suggestions = [
    "CRM that integrates with our existing email system",
    "Project management tool for remote teams",
    "Security monitoring for cloud infrastructure",
    "Analytics platform for customer behavior tracking"
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          Tell us what technology you're exploring and we'll help you find the perfect vendors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Summary (if available from landing page) */}
        {aiSummary && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-sm text-primary">AI Summary</p>
                  <p className="text-sm text-muted-foreground">{aiSummary}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="additionalNotes">Would you like to add anything?</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Any additional context, requirements, or specific challenges..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Technology Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Technology Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select a technology category" />
            </SelectTrigger>
            <SelectContent>
              {techCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Detailed Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe what you're looking for, specific features you need, current challenges, team size, etc."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`min-h-[120px] ${errors.description ? 'border-destructive' : ''}`}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formData.description.length} characters</span>
            <span>Minimum 20 characters</span>
          </div>
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="space-y-3">
          <Label>Need inspiration? Try these examples:</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-soft transition-all"
                onClick={() => setFormData({ ...formData, description: suggestion })}
              >
                <CardContent className="p-3">
                  <p className="text-sm">{suggestion}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            variant="professional" 
            size="lg"
            className="gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Continue to Criteria Building"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TechInput;