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
import aiSummariesData from "@/data/api/aiSummaries.json";
import projectsData from "@/data/api/projects.json";

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
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [headerText, setHeaderText] = useState<string>(aiSummariesData.default);

  /**
   * Load project data based on projectId
   * - Finds the project in projects.json
   * - Pre-fills category from project data
   * - Triggers AI summary display via category useEffect
   */
  useEffect(() => {
    if (projectId) {
      const project = projectsData.find(p => p.id === projectId);
      if (project && project.category) {
        // Pre-fill category from project data
        setFormData(prev => ({
          ...prev,
          category: project.category
        }));

        console.log(`✅ Category pre-filled from project: ${project.category}`);
      }
    }
  }, [projectId]);

  /**
   * Load landing page inputs
   * - Reads data saved by AnimatedInputs.tsx
   * - Auto-detects technology category
   * - Pre-fills form with landing page data
   * - Clears localStorage after loading (one-time use)
   */
  useEffect(() => {
    const landingCompanyInfo = localStorage.getItem('landing_company_info');
    const landingTechNeeds = localStorage.getItem('landing_tech_needs');

    if (landingCompanyInfo || landingTechNeeds) {
      // Auto-detect category from tech needs
      const detectedCategory = landingTechNeeds ? detectCategory(landingTechNeeds) : '';

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

      console.log('✅ Category auto-detected from landing page inputs');
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

  /**
   * Update header text when category changes
   * Displays AI-generated summary based on selected category
   */
  useEffect(() => {
    if (formData.category) {
      const summary = generateDetailedSummary(formData.category, additionalNotes);
      setHeaderText(summary);
    } else {
      setHeaderText(aiSummariesData.default);
    }
  }, [formData.category, additionalNotes]);

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
   * Generate detailed summary based on category from JSON data
   * Reads AI-generated summaries from centralized JSON file
   */
  const generateDetailedSummary = (category: string, userInput: string): string => {
    // Try to get summary from JSON data
    const summary = aiSummariesData.summaries[category as keyof typeof aiSummariesData.summaries];

    if (summary) {
      return summary;
    }

    // Fallback for 'Other' category with user input
    if (userInput) {
      return `Based on your description: "${userInput}", we'll help you find the right technology solutions that match your specific requirements. Our AI will analyze your needs and suggest the most suitable vendors in the market.`;
    }

    return aiSummariesData.default;
  };

  /**
   * Highlight key terms in text with pulsating blue styling
   * Wraps keywords in span elements with animation class
   */
  const highlightKeywords = (text: string): JSX.Element => {
    // Comprehensive list of keywords to highlight
    const keywords = [
      // Numbers with context
      '20 salespeople', '20 seats', '15 people', '30 people', '5 time zones',
      '100K+ leads', '50K+ daily active users', '10 engineers', '200+ employees',
      '150 employees', '5000+ SKUs', '15+ sources', '10K+ orders/month', '1M+ predictions/day',

      // Technology/tool names
      'HubSpot', 'Slack', 'GitHub', 'Microsoft 365', 'AWS', 'Kubernetes',
      'CRM', 'SQL', 'CI/CD', 'ERP', 'SIEM', 'Python/R',

      // Key technical terms and phrases
      'mobile-first', 'add-ons', 'Real-Time collaboration', 'agile methodologies',
      'multi-channel', 'advanced segmentation', 'container orchestration', 'auto-scaling',
      'multi-region deployment', 'SOC 2', 'GDPR', '99.9% uptime SLA',
      'real-time dashboards', 'self-service analytics', 'video conferencing',
      'instant messaging', 'file sharing', 'real-time threat detection',
      'automated incident response', 'applicant tracking', 'onboarding workflows',
      'performance management', 'time-off tracking', 'multi-vendor support',
      'PCI compliance', 'data warehouse', 'data quality monitoring',
      'automated model training', 'version control', 'real-time inference'
    ];

    // Sort keywords by length (longest first) to avoid partial matches
    const sortedKeywords = keywords.sort((a, b) => b.length - a.length);

    // Create regex pattern that matches any keyword (case-insensitive)
    const pattern = new RegExp(
      `(${sortedKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi'
    );

    // Split text by keywords and wrap matches
    const parts = text.split(pattern);

    return (
      <>
        {parts.map((part, index) => {
          // Check if this part matches any keyword (case-insensitive)
          const isKeyword = sortedKeywords.some(
            keyword => keyword.toLowerCase() === part.toLowerCase()
          );

          if (isKeyword) {
            return (
              <span
                key={index}
                className="font-bold text-brand-blue animate-pulse-blue"
              >
                {part}
              </span>
            );
          }

          return <span key={index}>{part}</span>;
        })}
      </>
    );
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
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse-subtle blur-sm" />
          <div className="relative border-2 border-primary/20 rounded-2xl p-6 bg-card/50 backdrop-blur-sm">
            <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {highlightKeywords(headerText)}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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