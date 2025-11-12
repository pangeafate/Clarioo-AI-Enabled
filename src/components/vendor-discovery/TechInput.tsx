import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb } from "lucide-react";
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

  /**
   * GAP-4 FIX: Load landing page inputs from localStorage on mount
   * - Reads data saved by AnimatedInputs.tsx
   * - Pre-fills company info and tech needs
   * - Clears localStorage after loading (one-time use)
   * - Shows success toast when pre-filled
   */
  useEffect(() => {
    const landingCompanyInfo = localStorage.getItem('landing_company_info');
    const landingTechNeeds = localStorage.getItem('landing_tech_needs');

    if (landingCompanyInfo || landingTechNeeds) {
      // Pre-fill form data from landing page inputs
      setFormData(prev => ({
        ...prev,
        companyInfo: landingCompanyInfo || prev.companyInfo,
        description: landingTechNeeds || prev.description
      }));

      // Clear localStorage after loading (one-time use)
      localStorage.removeItem('landing_company_info');
      localStorage.removeItem('landing_tech_needs');

      // Show success feedback
      toast({
        title: "✨ Pre-filled from landing page",
        description: "We've loaded your inputs from the landing page to save you time!",
        duration: 3000,
      });

      console.log('✅ Pre-filled from landing page inputs (GAP-4)');
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
      
      // Save to database for analytics
      await saveTechRequest(formData);
      
      // Continue with the normal flow
      onSubmit(formData);
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
        {/* Company Information */}
        <div className="space-y-2">
          <Label htmlFor="companyInfo">Tell me more about your company</Label>
          <Textarea
            id="companyInfo"
            placeholder="Company size, industry, current tech stack, specific challenges, etc."
            value={formData.companyInfo || ''}
            onChange={(e) => setFormData({ ...formData, companyInfo: e.target.value })}
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