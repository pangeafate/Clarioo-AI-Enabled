/**
 * 🎨 PROTOTYPE MODE: Criteria Builder Component
 * Uses mock AI service instead of OpenAI
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, MessageSquare, Plus, Trash2, Bot, User, Star, Upload, Settings, Send } from "lucide-react";
import { AccordionSection } from "./AccordionSection";
import { CriterionEditSidebar } from "./CriterionEditSidebar";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import type { TechRequest, Criteria } from "../VendorDiscovery";
import { useCriteriaGeneration } from "@/hooks/useCriteriaGeneration";
import { useCriteriaChat } from "@/hooks/useCriteriaChat";
import { storageService } from "@/services/storageService";
import aiSummariesData from "@/data/api/aiSummaries.json";

interface CriteriaBuilderProps {
  techRequest: TechRequest;
  onComplete: (criteria: Criteria[]) => void;
  initialCriteria?: Criteria[];
  projectId: string; // NEW: Project ID for chat isolation
}

const CriteriaBuilder = ({ techRequest, onComplete, initialCriteria, projectId }: CriteriaBuilderProps) => {
  const [criteria, setCriteria] = useState<Criteria[]>(initialCriteria || []);
  const [newCriterion, setNewCriterion] = useState({
    name: '',
    explanation: '',
    importance: 'medium' as 'low' | 'medium' | 'high',
    type: 'feature' as string
  });
  const [customTypes, setCustomTypes] = useState<string[]>(() => {
    const saved = storageService.getItem<string[]>('custom_criterion_types');
    return saved ?? [];
  });
  const [newCustomType, setNewCustomType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // SP_012: Accordion state for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['feature']) // Feature section expanded by default
  );
  const [editingCriterion, setEditingCriterion] = useState<Criteria | null>(null);
  const [newCriterionCategory, setNewCriterionCategory] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { toast } = useToast();

  // Use custom hooks for business logic
  const {
    isGenerating: isGeneratingCriteria,
    generateInitialCriteria,
    generateFallbackCriteria
  } = useCriteriaGeneration();

  const {
    chatMessages,
    isGenerating: isGeneratingChat,
    userMessage,
    setUserMessage,
    addMessage,
    sendMessage,
    initializeChat,
    hasChatHistory
  } = useCriteriaChat(projectId); // Pass projectId for chat isolation

  // Combined loading state for UI
  const isGenerating = isGeneratingCriteria || isGeneratingChat;

  // Ref for chat container auto-scroll
  const chatContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to latest message when chat messages change
   * Only scrolls if user is already near the bottom
   */
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      // Check if we're near the bottom (within 100px)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // Only auto-scroll if user is already near bottom or if it's a new chat
      if (isNearBottom || chatMessages.length <= 2) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [chatMessages]);

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

  /**
   * Generate detailed summary from AI summaries data
   */
  const generateDetailedSummary = (category: string): string => {
    // Try to get summary from JSON data
    const summary = aiSummariesData.summaries[category as keyof typeof aiSummariesData.summaries];

    if (summary) {
      return summary;
    }

    return aiSummariesData.default;
  };

  // Initialize with AI summary message from Technology Exploration step
  /**
   * Initialize chat and criteria only if no chat history exists
   * If chat history exists, the synthesis is automatically loaded by useCriteriaChat
   */
  useEffect(() => {
    // Only initialize if there's no existing chat history
    if (!hasChatHistory) {
      // Get the detailed summary for this category (same as shown in Tech Input step)
      const projectSummary = generateDetailedSummary(techRequest.category);

      const initialMessage = {
        id: '1',
        role: 'assistant' as const,
        content: projectSummary,
        timestamp: new Date()
      };
      initializeChat(initialMessage);

      // Only generate initial criteria if no initial criteria were provided
      if (!initialCriteria || initialCriteria.length === 0) {
        generateInitialCriteria(techRequest).then(({ criteria: generatedCriteria, message }) => {
          setCriteria(generatedCriteria);
          addMessage(message);
        });
      }

      console.log('✅ Initialized new chat for project', { projectId });
    } else {
      console.log('✅ Loaded existing chat synthesis for project', { projectId });
    }
  }, [techRequest, initialCriteria, hasChatHistory, projectId]);

  /**
   * Sync local criteria state when initialCriteria changes
   * This handles navigation back to completed steps
   * Ensures saved criteria are displayed when returning to this stage
   */
  useEffect(() => {
    if (initialCriteria && initialCriteria.length > 0) {
      setCriteria(initialCriteria);
    }
  }, [initialCriteria]);

  // Handle chat message send
  const handleSendMessage = async () => {
    await sendMessage(userMessage, {
      category: techRequest.category,
      criteria
    });
  };

  const addCustomType = () => {
    if (!newCustomType.trim()) {
      toast({
        title: "Missing type name",
        description: "Please enter a name for the custom type.",
        variant: "destructive"
      });
      return;
    }

    const allTypes = ['feature', 'technical', 'business', 'compliance', ...customTypes];
    if (allTypes.includes(newCustomType.toLowerCase())) {
      toast({
        title: "Type already exists",
        description: "This criterion type already exists.",
        variant: "destructive"
      });
      return;
    }

    const updatedCustomTypes = [...customTypes, newCustomType];
    setCustomTypes(updatedCustomTypes);
    storageService.setItem('custom_criterion_types', updatedCustomTypes);
    setNewCustomType('');

    toast({
      title: "Custom type created",
      description: `"${newCustomType}" has been added as a custom criterion type.`
    });
  };

  const removeCustomType = (typeToRemove: string) => {
    const updatedCustomTypes = customTypes.filter(type => type !== typeToRemove);
    setCustomTypes(updatedCustomTypes);
    storageService.setItem('custom_criterion_types', updatedCustomTypes);

    // Update any criteria using this type to 'feature'
    setCriteria(prev => prev.map(c => 
      c.type === typeToRemove ? { ...c, type: 'feature' } : c
    ));
    
    toast({
      title: "Custom type removed",
      description: `"${typeToRemove}" has been removed. Criteria using this type have been updated to "feature".`
    });
  };

  const addCriterion = () => {
    if (!newCriterion.name.trim()) {
      toast({
        title: "Missing criterion name",
        description: "Please enter a name for the criterion.",
        variant: "destructive"
      });
      return;
    }

    const criterion: Criteria = {
      id: Date.now().toString(),
      ...newCriterion
    };

    setCriteria(prev => [...prev, criterion]);
    setNewCriterion({ name: '', explanation: '', importance: 'medium', type: 'feature' });
    
    toast({
      title: "Criterion added",
      description: `"${criterion.name}" has been added to your evaluation criteria.`
    });
  };

  const removeCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, updates: Partial<Criteria>) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Parse criteria from Excel
        const uploadedCriteria: Criteria[] = [];
        jsonData.forEach((row: any, index: number) => {
          const name = row['Criterion'] || row['Name'] || row['criterion'] || row['name'];
          const importance = (row['Importance'] || row['importance'] || 'medium').toLowerCase();
          const type = (row['Type'] || row['type'] || 'feature').toLowerCase();

          if (name) {
            uploadedCriteria.push({
              id: `uploaded-${index}`,
              name: String(name),
              importance: ['low', 'medium', 'high'].includes(importance) ? importance as 'low' | 'medium' | 'high' : 'medium',
              type: ['feature', 'technical', 'business', 'compliance'].includes(type) ? type as 'feature' | 'technical' | 'business' | 'compliance' : 'feature'
            });
          }
        });

        if (uploadedCriteria.length > 0) {
          setCriteria(prev => [...prev, ...uploadedCriteria]);
          toast({
            title: "Criteria uploaded",
            description: `Successfully imported ${uploadedCriteria.length} criteria from your Excel file.`
          });
        } else {
          toast({
            title: "No criteria found",
            description: "Please ensure your Excel file has columns named 'Criterion', 'Importance', and 'Type'.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to parse the Excel file. Please check the format.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
        // Reset the input
        event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleComplete = () => {
    if (criteria.length === 0) {
      toast({
        title: "No criteria defined",
        description: "Please add at least one evaluation criterion.",
        variant: "destructive"
      });
      return;
    }

    onComplete(criteria);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-primary';
      case 'technical': return 'bg-accent';
      case 'business': return 'bg-success';
      case 'compliance': return 'bg-warning';
      default: return customTypes.includes(type) ? 'bg-purple-500 text-white' : 'bg-secondary';
    }
  };

  const getAllTypes = () => {
    return ['feature', 'technical', 'business', 'compliance', ...customTypes];
  };

  // SP_012: Accordion helper functions
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getCriteriaByType = (type: string) => {
    return criteria.filter(c => c.type === type);
  };

  const getOtherTypes = () => {
    const standardTypes = ['feature', 'technical', 'business', 'compliance'];

    // Get types from criteria
    const typesInCriteria = criteria
      .map(c => c.type)
      .filter(type => !standardTypes.includes(type));

    // Combine with custom types and remove duplicates
    const allCustomTypes = [...new Set([...customTypes, ...typesInCriteria])];

    return allCustomTypes;
  };

  const handleAddCriterion = (categoryType: string) => {
    setNewCriterionCategory(categoryType);
  };

  const handleCreateCriterion = (criterion: Criteria) => {
    // Add the new criterion
    setCriteria(prev => [...prev, criterion]);
    setNewCriterionCategory(null);

    toast({
      title: "Criterion created",
      description: `"${criterion.name}" has been added to your evaluation criteria.`
    });
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Missing category name",
        description: "Please enter a name for the category.",
        variant: "destructive"
      });
      return;
    }

    const allTypes = getAllTypes();
    if (allTypes.includes(newCategoryName.toLowerCase())) {
      toast({
        title: "Category already exists",
        description: "This category name already exists.",
        variant: "destructive"
      });
      return;
    }

    // Add to custom types
    const updatedCustomTypes = [...customTypes, newCategoryName.toLowerCase()];
    setCustomTypes(updatedCustomTypes);
    storageService.setItem('custom_criterion_types', updatedCustomTypes);

    // Reset state
    setIsCreatingCategory(false);
    setNewCategoryName('');

    // Expand the new section
    setExpandedSections(prev => new Set([...prev, newCategoryName.toLowerCase()]));

    toast({
      title: "Category created",
      description: `"${newCategoryName}" has been added as a new category.`
    });
  };

  const handleCancelCreateCategory = () => {
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  return (
    <div className="space-y-6">
        {/* AI Chat Interface */}
        {techRequest && (
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="pt-6 flex flex-col">
              {/* Chat History - Dynamic Height Container */}
              <div
                ref={chatContainerRef}
                className="overflow-y-auto min-h-24 max-h-96 mb-4"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="space-y-4 pr-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-primary' : 'bg-primary/10'}`}>
                          {message.role === 'user' ? (
                            <User className="h-5 w-5 text-primary-foreground" />
                          ) : (
                            <Bot className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white border border-blue-100'
                        }`}>
                          <p className="text-sm leading-relaxed">
                            {message.role === 'assistant' ? highlightKeywords(message.content) : message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isGenerating && (
                    <div className="flex gap-3">
                      <div className="flex gap-2">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="bg-white border border-blue-100 p-3 rounded-lg">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Input Area - Fixed at bottom */}
              <div className="space-y-2 flex-shrink-0">
                <Label className="text-sm font-medium text-gray-700">Would you like to add anything?</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Any additional context, requirements, or specific challenges..."
                    className="min-h-[80px] resize-none flex-1"
                    disabled={isGenerating}
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isGenerating || !userMessage.trim()}
                    size="icon"
                    className="self-end mb-0.5"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SP_012: Current Criteria - Accordion View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Evaluation Criteria ({criteria.length})
              <Badge variant="secondary">{criteria.filter(c => c.importance === 'high').length} High Priority</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Feature Section */}
            <AccordionSection
              title="Feature"
              criteria={getCriteriaByType('feature')}
              isExpanded={expandedSections.has('feature')}
              onToggle={() => toggleSection('feature')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
            />

            {/* Technical Section */}
            <AccordionSection
              title="Technical"
              criteria={getCriteriaByType('technical')}
              isExpanded={expandedSections.has('technical')}
              onToggle={() => toggleSection('technical')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
            />

            {/* Business Section */}
            <AccordionSection
              title="Business"
              criteria={getCriteriaByType('business')}
              isExpanded={expandedSections.has('business')}
              onToggle={() => toggleSection('business')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
            />

            {/* Compliance Section */}
            <AccordionSection
              title="Compliance"
              criteria={getCriteriaByType('compliance')}
              isExpanded={expandedSections.has('compliance')}
              onToggle={() => toggleSection('compliance')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
            />

            {/* Other Types Section - Custom categories */}
            {getOtherTypes().map(type => (
              <AccordionSection
                key={type}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
                criteria={getCriteriaByType(type)}
                isExpanded={expandedSections.has(type)}
                onToggle={() => toggleSection(type)}
                onEditCriterion={(criterion) => setEditingCriterion(criterion)}
                onAddCriterion={handleAddCriterion}
              />
            ))}

            {/* Add New Category Placeholder */}
            {!isCreatingCategory ? (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg bg-white hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="px-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary group">
                  <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Add New Category</span>
                </div>
              </button>
            ) : (
              <div className="border rounded-lg bg-white border-l-4 border-l-purple-400">
                <div className="px-4 py-3 flex items-center gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name (e.g., Security, Performance)"
                    className="flex-1"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCategory();
                      } else if (e.key === 'Escape') {
                        handleCancelCreateCategory();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelCreateCategory}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateCategory}
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Old table code - Remove from here */}
        {false && (
          <Card>
          <CardContent>
            <Tabs defaultValue="feature" className="w-full">
              <ScrollArea className="w-full">
                <TabsList className={`grid w-full ${getAllTypes().length <= 4 ? 'grid-cols-4' : 'grid-cols-6'} gap-1`}>
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
                  {customTypes.map((type) => (
                    <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-500 text-white">{type}</Badge>
                      ({criteria.filter(c => c.type === type).length})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>

              {getAllTypes().map((type) => (
                <TabsContent key={type} value={type} className="mt-4">
                  <div className="border rounded-lg">
                    {criteria.length > 20 ? (
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40%]">Criterion Name</TableHead>
                              <TableHead className="w-[20%]">Importance</TableHead>
                              <TableHead className="w-[20%]">Type</TableHead>
                              <TableHead className="w-[20%]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {criteria.filter(c => c.type === type).map((criterion) => (
                              <TableRow key={criterion.id}>
                                <TableCell>
                                   <Textarea
                                     value={criterion.name}
                                     onChange={(e) => {
                                       updateCriterion(criterion.id, { name: e.target.value });
                                       // Auto-resize the textarea
                                       e.target.style.height = 'auto';
                                       e.target.style.height = e.target.scrollHeight + 'px';
                                     }}
                                     className="border-0 bg-transparent p-0 min-h-0 font-medium focus-visible:ring-0 resize-none overflow-hidden"
                                     style={{ height: 'auto' }}
                                     onInput={(e) => {
                                       const target = e.target as HTMLTextAreaElement;
                                       target.style.height = 'auto';
                                       target.style.height = target.scrollHeight + 'px';
                                     }}
                                   />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={criterion.importance}
                                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                                      updateCriterion(criterion.id, { importance: value })
                                    }
                                  >
                                    <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={criterion.type}
                                    onValueChange={(value: string) => 
                                      updateCriterion(criterion.id, { type: value })
                                    }
                                  >
                                    <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0">
                                      <SelectValue>
                                        <Badge variant="outline" className={getTypeColor(criterion.type)}>
                                          {criterion.type}
                                        </Badge>
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="feature">Feature</SelectItem>
                                      <SelectItem value="technical">Technical</SelectItem>
                                      <SelectItem value="business">Business</SelectItem>
                                      <SelectItem value="compliance">Compliance</SelectItem>
                                      {customTypes.map((type) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCriterion(criterion.id)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {criteria.filter(c => c.type === type).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                  No {type} criteria defined yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">Criterion Name</TableHead>
                            <TableHead className="w-[20%]">Importance</TableHead>
                            <TableHead className="w-[20%]">Type</TableHead>
                            <TableHead className="w-[20%]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {criteria.filter(c => c.type === type).map((criterion) => (
                            <TableRow key={criterion.id}>
                              <TableCell>
                                 <Textarea
                                   value={criterion.name}
                                   onChange={(e) => {
                                     updateCriterion(criterion.id, { name: e.target.value });
                                     // Auto-resize the textarea
                                     e.target.style.height = 'auto';
                                     e.target.style.height = e.target.scrollHeight + 'px';
                                   }}
                                   className="border-0 bg-transparent p-0 min-h-0 font-medium focus-visible:ring-0 resize-none overflow-hidden"
                                   style={{ height: 'auto' }}
                                   onInput={(e) => {
                                     const target = e.target as HTMLTextAreaElement;
                                     target.style.height = 'auto';
                                     target.style.height = target.scrollHeight + 'px';
                                   }}
                                 />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={criterion.importance}
                                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                                    updateCriterion(criterion.id, { importance: value })
                                  }
                                >
                                  <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={criterion.type}
                                  onValueChange={(value: string) => 
                                    updateCriterion(criterion.id, { type: value })
                                  }
                                >
                                  <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0">
                                    <SelectValue>
                                      <Badge variant="outline" className={getTypeColor(criterion.type)}>
                                        {criterion.type}
                                      </Badge>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="feature">Feature</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="compliance">Compliance</SelectItem>
                                    {customTypes.map((type) => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCriterion(criterion.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {criteria.filter(c => c.type === type).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No {type} criteria defined yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        )}

        {/* Upload Excel File */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Criteria from Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="text-sm font-medium mb-1">
                    Upload Excel Spreadsheet
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expected columns: Criterion, Importance, Type
                  </div>
                </Label>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </div>
              {isUploading && (
                <div className="text-center text-sm text-muted-foreground">
                  Processing Excel file...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleComplete}
            variant="professional"
            size="lg"
            className="gap-2"
            disabled={criteria.length === 0}
          >
            Find Vendors
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Criterion Edit/Create Sidebar */}
        <CriterionEditSidebar
          criterion={editingCriterion}
          isOpen={editingCriterion !== null || newCriterionCategory !== null}
          onClose={() => {
            setEditingCriterion(null);
            setNewCriterionCategory(null);
          }}
          onSave={(criterion) => {
            if (newCriterionCategory !== null) {
              // Create mode
              handleCreateCriterion(criterion);
            } else {
              // Edit mode
              updateCriterion(criterion.id, criterion);
              setEditingCriterion(null);
            }
          }}
          onDelete={(id) => {
            removeCriterion(id);
            setEditingCriterion(null);
          }}
          customTypes={customTypes}
          mode={newCriterionCategory !== null ? 'create' : 'edit'}
          defaultCategory={newCriterionCategory || 'feature'}
        />
    </div>
  );
};

export default CriteriaBuilder;