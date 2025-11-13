import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, Bot } from "lucide-react";
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
      // Auto-detect category from tech needs
      const detectedCategory = landingTechNeeds ? detectCategory(landingTechNeeds) : '';

      // Generate detailed AI summary based on detected category
      const summary = generateDetailedSummary(detectedCategory, landingTechNeeds || '');
      setAiSummary(summary);

      // Pre-fill form data with landing page inputs
      setFormData(prev => ({
        ...prev,
        companyInfo: landingCompanyInfo || prev.companyInfo,
        category: detectedCategory || prev.category
      }));

      // Pre-fill additional notes with tech needs
      if (landingTechNeeds) {
        setAdditionalNotes(landingTechNeeds);
      }

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

  /**
   * Sync local form state when initialData changes
   * This handles navigation back to completed steps
   * Ensures saved data is displayed when returning to this stage
   */
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Also sync additional notes if stored in companyInfo
      if (initialData.companyInfo) {
        setAdditionalNotes(initialData.companyInfo);
      }
    }
  }, [initialData]);

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

  /**
   * Generate detailed mock summary based on category
   * Creates realistic project descriptions for different technology needs
   */
  const generateDetailedSummary = (category: string, userInput: string): string => {
    const summaries: Record<string, string> = {
      'CRM Software': 'I am looking for a lightweight CRM for 50 sales people. The team is sitting remotely in different countries, and working from mobile phones. The CRM should be mobile-first, extremely easy to use, but expandable with addons. I am ready to evaluate both established solutions and startups alike.',
      'Project Management': 'I need a project management tool for a distributed team of 30 people across 5 time zones. We handle multiple concurrent projects with complex dependencies and need real-time collaboration features. The solution should integrate with Slack and GitHub, support agile methodologies, and provide detailed reporting for stakeholders.',
      'Analytics & BI': 'Looking for a business intelligence platform that can handle large datasets (10M+ rows) and provide real-time dashboards for executive leadership. We need self-service analytics for non-technical users, seamless integration with our SQL databases, and the ability to create custom visualizations. Mobile access is essential for our C-suite.',
      'Communication Tools': 'Seeking a unified communication platform for 200+ employees that combines video conferencing, instant messaging, and file sharing. Must support international calling, have excellent mobile apps, and integrate with Microsoft 365. Priority is ease of use and reliability for daily all-hands meetings.',
      'Security Solutions': 'We need an enterprise-grade security monitoring solution for our cloud infrastructure (AWS). Looking for real-time threat detection, automated incident response, and compliance reporting for SOC 2 and GDPR. The solution should integrate with our existing SIEM and provide 24/7 threat intelligence.',
      'DevOps & Infrastructure': 'Searching for a CI/CD platform that can handle microservices architecture with 50+ services. Need container orchestration, automated testing, blue-green deployments, and seamless Kubernetes integration. Must support both on-premise and cloud deployments with detailed logging and monitoring.',
      'HR & Talent Management': 'Looking for an all-in-one HR platform for a company of 150 employees. Need applicant tracking, onboarding workflows, performance management, and time-off tracking. Integration with payroll systems is critical, and the interface should be intuitive for both HR staff and employees.',
      'Marketing Automation': 'Need a marketing automation platform that can handle multi-channel campaigns across email, social media, and SMS. Looking for advanced segmentation, A/B testing, lead scoring, and native CRM integration. Must support our enterprise-level traffic (500K contacts) with detailed analytics and ROI tracking.',
      'E-commerce Platforms': 'Searching for a scalable e-commerce solution for a B2B marketplace with 5000+ SKUs. Need multi-vendor support, complex pricing rules, integration with ERP systems, and international shipping capabilities. Must handle high transaction volumes (10K+ orders/month) with PCI compliance.',
      'Data Management': 'Looking for a modern data warehouse solution that can consolidate data from 15+ sources including CRM, ERP, and marketing tools. Need real-time data pipelines, data quality monitoring, and support for both structured and unstructured data. Cloud-native architecture preferred with strong data governance features.',
      'AI & Machine Learning': 'Seeking an ML platform for deploying predictive models in production. Need support for Python/R, automated model training, version control, and real-time inference APIs. Must handle our scale (1M+ predictions/day) with monitoring for model drift and explainability features for regulatory compliance.',
      'Other': userInput ? `Based on your description: "${userInput}", we'll help you find the right technology solutions that match your specific requirements. Our AI will analyze your needs and suggest the most suitable vendors in the market.` : 'Please provide more details about what technology you\'re looking for, and we\'ll help you find the perfect vendors for your specific needs.'
    };

    return summaries[category] || summaries['Other'];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Please select a technology category';
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
        <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
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
                <Bot className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-sm text-primary">Based on your input, this is what you are looking for:</p>
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


        {/* Quick Suggestions */}
        <div className="space-y-3">
          <Label>Need inspiration? Try these examples:</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-soft transition-all"
                onClick={() => setAdditionalNotes(suggestion)}
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