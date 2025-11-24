/**
 * 🎨 PROTOTYPE MODE: Criteria Builder Component
 * Uses mock AI service instead of OpenAI
 */

import { useState, useEffect, useRef, useCallback } from "react";
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
import { ArrowRight, MessageSquare, Plus, Trash2, Bot, User, Star, Upload, Settings, Send, Share2, ArrowUpDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AccordionSection } from "./AccordionSection";
import { CriterionEditSidebar } from "./CriterionEditSidebar";
import { ShareDialog } from "./ShareDialog";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import type { TechRequest, Criteria } from "../VendorDiscovery";
import { useCriteriaGeneration } from "@/hooks/useCriteriaGeneration";
import { useCriteriaChat, type OnCriteriaAction } from "@/hooks/useCriteriaChat";
import { type CriteriaAction, saveCriteriaToStorage, getCriteriaFromStorage } from "@/services/n8nService";
import { storageService } from "@/services/storageService";
import { SPACING } from '@/styles/spacing-config';
import { TYPOGRAPHY } from '@/styles/typography-config';
import { useCriteriaOrder } from '@/hooks/useCriteriaOrder';

interface CriteriaBuilderProps {
  techRequest: TechRequest;
  onComplete: (criteria: Criteria[]) => void;
  initialCriteria?: Criteria[];
  projectId: string; // Project ID for chat isolation
  projectName: string; // Project name for n8n chat context
  projectDescription: string; // Project description for n8n chat context
}

const CriteriaBuilder = ({ techRequest, onComplete, initialCriteria, projectId, projectName, projectDescription }: CriteriaBuilderProps) => {
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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const { toast } = useToast();

  // Use criteria ordering hook
  const {
    isSortedByImportance,
    toggleSorting,
    getOrderedCriteria,
    updateOrder,
    saveCurrentOrder
  } = useCriteriaOrder(projectId);

  // Handle sorting toggle
  // Note: Custom order is already saved on each drag via updateOrder in AccordionSection
  // No need to call saveCurrentOrder here - it would overwrite custom order with original order
  const handleSortingToggle = () => {
    toggleSorting();
  };

  // Use custom hooks for business logic
  const {
    isGenerating: isGeneratingCriteria,
    generateInitialCriteria,
    generateFallbackCriteria
  } = useCriteriaGeneration();

  /**
   * Handle criteria actions from n8n chat response
   * Applies create/update/delete operations to criteria state
   */
  const handleCriteriaAction: OnCriteriaAction = useCallback((actions: CriteriaAction[]) => {
    setCriteria(prevCriteria => {
      let updated = [...prevCriteria];

      for (const action of actions) {
        switch (action.type) {
          case 'create':
            if (action.criterion) {
              // Map n8n criterion format to app format
              // n8n uses "description", app uses "explanation"
              const criterion = action.criterion as any;
              const newCriterion: Criteria = {
                id: criterion.id,
                name: criterion.name,
                explanation: criterion.description || criterion.explanation || '',
                importance: criterion.importance,
                type: criterion.type,
                isArchived: criterion.isArchived || false
              };
              updated.push(newCriterion);
              console.log('[CriteriaBuilder] Created criterion:', newCriterion.name, 'with explanation:', newCriterion.explanation);
            }
            break;
          case 'update':
            if (action.criterion) {
              // n8n uses "description", app uses "explanation"
              const criterion = action.criterion as any;
              updated = updated.map(c =>
                c.id === criterion.id
                  ? {
                      id: criterion.id,
                      name: criterion.name,
                      explanation: criterion.description || criterion.explanation || '',
                      importance: criterion.importance,
                      type: criterion.type,
                      isArchived: criterion.isArchived || false
                    }
                  : c
              );
              console.log('[CriteriaBuilder] Updated criterion:', criterion.name);
            }
            break;
          case 'delete':
            if (action.criterion_id) {
              updated = updated.filter(c => c.id !== action.criterion_id);
              console.log('[CriteriaBuilder] Deleted criterion:', action.criterion_id);
            }
            break;
        }
      }

      return updated;
    });
  }, []);

  const {
    chatMessages,
    isGenerating: isGeneratingChat,
    userMessage,
    setUserMessage,
    addMessage,
    sendMessage,
    initializeChat,
    clearChat,
    hasChatHistory
  } = useCriteriaChat(projectId, handleCriteriaAction);

  // Combined loading state for UI
  const isGenerating = isGeneratingCriteria || isGeneratingChat;

  // Ref for chat container auto-scroll
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Ref to track if chat has been initialized for this project
  const hasInitialized = useRef(false);
  const previousProjectId = useRef<string>(projectId);

  // Ref to prevent persistence during project switching
  const isLoadingCriteria = useRef(false);

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
                className={`${TYPOGRAPHY.body.default.replace('font-normal', 'font-bold')} text-brand-blue animate-pulse-blue`}
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
   * Generate detailed summary - now uses project data from n8n
   */
  const generateDetailedSummary = (category: string): string => {
    return `I've analyzed your requirements for ${category} solutions and generated evaluation criteria covering features, technical capabilities, business factors, and compliance considerations.`;
  };

  // Initialize criteria only (no automatic chat messages)
  /**
   * Initialize criteria if none provided
   * Chat messages only come from actual n8n interactions initiated by user
   */
  useEffect(() => {
    // Reset initialization flag when project changes
    if (projectId !== previousProjectId.current) {
      hasInitialized.current = false;
      previousProjectId.current = projectId;
    }

    // Only initialize once per project
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // Only generate initial criteria if no initial criteria were provided
      if (!initialCriteria || initialCriteria.length === 0) {
        generateInitialCriteria(techRequest).then(({ criteria: generatedCriteria }) => {
          setCriteria(generatedCriteria);
        });
      }

      console.log('✅ Initialized criteria for project', { projectId });
    }
  }, [
    projectId,
    techRequest,
    generateInitialCriteria,
    initialCriteria
  ]);

  /**
   * Sync local criteria state when initialCriteria changes
   * This handles navigation back to completed steps
   * Ensures saved criteria are displayed when returning to this stage
   *
   * 🐛 CRITICAL FIX: Always prioritize n8n storage over initialCriteria prop
   * This prevents stale criteria from overwriting fresh n8n-generated criteria
   */
  useEffect(() => {
    // Set loading flag to prevent persistence effect from running
    isLoadingCriteria.current = true;

    // Load from n8n storage first (source of truth)
    const n8nCriteria = getCriteriaFromStorage(projectId);

    if (n8nCriteria.length > 0) {
      // Use fresh criteria from n8n storage
      const mappedCriteria: Criteria[] = n8nCriteria.map(c => ({
        id: c.id,
        name: c.name,
        explanation: c.explanation,
        importance: c.importance,
        type: c.type,
        isArchived: c.isArchived || false
      }));
      setCriteria(mappedCriteria);
      console.log('[CriteriaBuilder] Loaded criteria from n8n storage:', n8nCriteria.length);
    } else if (initialCriteria && initialCriteria.length > 0) {
      // Fall back to initialCriteria only if n8n storage is empty
      setCriteria(initialCriteria);
      console.log('[CriteriaBuilder] Using initialCriteria prop:', initialCriteria.length);
    }

    // Clear loading flag after state update takes effect
    setTimeout(() => {
      isLoadingCriteria.current = false;
    }, 0);
  }, [initialCriteria, projectId]);

  /**
   * Persist criteria to localStorage whenever they change
   * This ensures chat-based modifications are saved immediately
   *
   * 🐛 CRITICAL FIX: Don't save during project switching to prevent race condition
   */
  useEffect(() => {
    // Skip saving if we're in the middle of loading criteria for a new project
    if (isLoadingCriteria.current) {
      console.log('[CriteriaBuilder] Skipping persistence during project load');
      return;
    }

    if (criteria.length > 0 && projectId) {
      // Map Criteria to TransformedCriterion format for storage
      const transformedCriteria = criteria.map(c => ({
        id: c.id,
        name: c.name,
        explanation: c.explanation || '',
        importance: c.importance,
        type: c.type,
        isArchived: c.isArchived || false
      }));
      saveCriteriaToStorage(projectId, transformedCriteria);
      console.log('[CriteriaBuilder] Criteria persisted to storage:', criteria.length);
    }
  }, [criteria, projectId]);

  // Handle chat message send
  const handleSendMessage = async () => {
    await sendMessage(userMessage, {
      projectId,
      projectName,
      projectDescription,
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

    // Generate unique ID for new criterion
    const criterion: Criteria = {
      id: `criterion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
            // Generate unique ID for uploaded criterion
            uploadedCriteria.push({
              id: `uploaded-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
              name: String(name),
              importance: ['low', 'medium', 'high'].includes(importance) ? importance as 'low' | 'medium' | 'high' : 'medium',
              type: ['feature', 'technical', 'business', 'compliance'].includes(type) ? type as 'feature' | 'technical' | 'business' | 'compliance' : 'feature',
              explanation: row['Explanation'] || row['explanation'] || '' // Also capture explanation if provided
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

  /**
   * SP_014: Handle importance change from swipe gestures
   * Updates criteria state with new importance level and archived status
   */
  const handleImportanceChange = (id: string, importance: 'low' | 'medium' | 'high', isArchived: boolean) => {
    setCriteria(prev => prev.map(c =>
      c.id === id
        ? { ...c, importance, isArchived }
        : c
    ));
  };

  return (
    <div className="space-y-6">
        {/* AI Chat Interface */}
        {techRequest && (
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className={`${SPACING.vendorDiscovery.chat.card} flex flex-col`}>
              {/* Robot Welcome Message - hidden after user sends first message */}
              {!chatMessages.some(msg => msg.role === 'user') && (
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 bg-white border border-blue-100 rounded-lg p-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      Hello! I have generated a few key criteria for your search. You can modify them, delete or ask for more just by telling me! I can also explain things.
                    </p>
                  </div>
                </div>
              )}

              {/* Chat History - Dynamic Height Container */}
              <div
                ref={chatContainerRef}
                className="overflow-y-auto min-h-24 max-h-96 mb-4"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="space-y-4 pr-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 flex-1 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-primary' : 'bg-primary/10'}`}>
                          {message.role === 'user' ? (
                            <User className="h-5 w-5 text-primary-foreground" />
                          ) : (
                            <Bot className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className={`${SPACING.vendorDiscovery.chat.message} rounded-lg flex-1 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white border border-blue-100'
                        }`}>
                          <p className={`text-sm xs:text-base sm:text-lg font-normal leading-relaxed ${
                            message.role === 'user' ? 'text-white' : 'text-foreground'
                          }`}>
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
                        <div className={`bg-white border border-blue-100 ${SPACING.vendorDiscovery.chat.typing} rounded-lg`}>
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
                <Label className={TYPOGRAPHY.label.default}>Would you like to add anything?</Label>
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
                  <div className="flex flex-col gap-1 self-end mb-0.5">
                    <Button
                      onClick={clearChat}
                      disabled={isGenerating || chatMessages.length === 0}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Clear chat history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={isGenerating || !userMessage.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SP_012: Current Criteria - Accordion View */}
        <Card>
          <CardHeader className={SPACING.vendorDiscovery.criteria.header}>
            <CardTitle className={`${TYPOGRAPHY.card.title} flex items-start sm:items-center justify-between gap-2 sm:gap-3`}>
              <span>Evaluation Criteria ({criteria.length})</span>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                <Badge variant="secondary" className="whitespace-nowrap">
                  {criteria.filter(c => c.importance === 'high').length} High Priority
                </Badge>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isSortedByImportance}
                    onCheckedChange={handleSortingToggle}
                    id="sorting-toggle"
                  />
                  <label
                    htmlFor="sorting-toggle"
                    className={`${TYPOGRAPHY.muted.small} cursor-pointer flex items-center gap-1 whitespace-nowrap`}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    Sort by Importance
                  </label>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className={`space-y-2 ${SPACING.vendorDiscovery.criteria.content}`}>
            {/* Feature Section */}
            <AccordionSection
              title="Feature"
              criteria={getCriteriaByType('feature')}
              isExpanded={expandedSections.has('feature')}
              onToggle={() => toggleSection('feature')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
              onImportanceChange={handleImportanceChange}
              isSortedByImportance={isSortedByImportance}
              getOrderedCriteria={getOrderedCriteria}
              onOrderChange={(orderedIds) => updateOrder('feature', orderedIds)}
            />

            {/* Technical Section */}
            <AccordionSection
              title="Technical"
              criteria={getCriteriaByType('technical')}
              isExpanded={expandedSections.has('technical')}
              onToggle={() => toggleSection('technical')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
              onImportanceChange={handleImportanceChange}
              isSortedByImportance={isSortedByImportance}
              getOrderedCriteria={getOrderedCriteria}
              onOrderChange={(orderedIds) => updateOrder('technical', orderedIds)}
            />

            {/* Business Section */}
            <AccordionSection
              title="Business"
              criteria={getCriteriaByType('business')}
              isExpanded={expandedSections.has('business')}
              onToggle={() => toggleSection('business')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
              onImportanceChange={handleImportanceChange}
              isSortedByImportance={isSortedByImportance}
              getOrderedCriteria={getOrderedCriteria}
              onOrderChange={(orderedIds) => updateOrder('business', orderedIds)}
            />

            {/* Compliance Section */}
            <AccordionSection
              title="Compliance"
              criteria={getCriteriaByType('compliance')}
              isExpanded={expandedSections.has('compliance')}
              onToggle={() => toggleSection('compliance')}
              onEditCriterion={(criterion) => setEditingCriterion(criterion)}
              onAddCriterion={handleAddCriterion}
              onImportanceChange={handleImportanceChange}
              isSortedByImportance={isSortedByImportance}
              getOrderedCriteria={getOrderedCriteria}
              onOrderChange={(orderedIds) => updateOrder('compliance', orderedIds)}
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
                onImportanceChange={handleImportanceChange}
                isSortedByImportance={isSortedByImportance}
                getOrderedCriteria={getOrderedCriteria}
                onOrderChange={(orderedIds) => updateOrder(type, orderedIds)}
              />
            ))}

            {/* Add New Category Placeholder */}
            {!isCreatingCategory ? (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="w-full border border-dashed border-gray-300 rounded-lg bg-white hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className={`${SPACING.vendorDiscovery.accordion.header} flex items-center justify-center gap-1.5 xs:gap-2 text-muted-foreground hover:text-primary group`}>
                  <Plus className="h-4 w-4 xs:h-5 xs:w-5 group-hover:scale-110 transition-transform" />
                  <span className={`${TYPOGRAPHY.button.default}`}>Add New Category</span>
                </div>
              </button>
            ) : (
              <div className="border rounded-lg bg-white border-l-4 border-l-purple-400">
                <div className={`${SPACING.vendorDiscovery.criteria.addCategory} flex items-center gap-2`}>
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
                    className={TYPOGRAPHY.button.small}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateCategory}
                    className={TYPOGRAPHY.button.small}
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
                                     className={`border-0 bg-transparent p-0 min-h-0 ${TYPOGRAPHY.body.default} focus-visible:ring-0 resize-none overflow-hidden`}
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
                                <TableCell colSpan={4} className={`${TYPOGRAPHY.muted.default} text-center py-8`}>
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
                                   className={`border-0 bg-transparent p-0 min-h-0 ${TYPOGRAPHY.body.default} focus-visible:ring-0 resize-none overflow-hidden`}
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
                              <TableCell colSpan={4} className={`${TYPOGRAPHY.muted.default} text-center py-8`}>
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

        {/* Download or Share Button */}
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            onClick={() => setIsShareDialogOpen(true)}
            className={`${TYPOGRAPHY.button.default} gap-2 min-w-[240px]`}
          >
            <Share2 className="h-4 w-4" />
            Download or Share
          </Button>
        </div>

        {/* Upload Criteria Button */}
        <div className="flex flex-col items-center gap-2">
          <Label
            htmlFor="excel-upload"
            className={`${TYPOGRAPHY.button.default} cursor-pointer inline-flex h-10 min-w-[240px] items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-4 py-2 ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`}
          >
            <Upload className="h-4 w-4" />
            Upload Criteria
          </Label>
          <div className={`${TYPOGRAPHY.muted.small} text-center`}>
            Accepted file types: Word, PDF, Excel
          </div>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls,.doc,.docx,.pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
          {isUploading && (
            <div className={`${TYPOGRAPHY.muted.default} text-center`}>
              Processing file...
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleComplete}
            variant="professional"
            size="lg"
            className={`${TYPOGRAPHY.button.large} gap-2`}
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

        {/* Share Dialog */}
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          criteria={criteria}
          projectId={projectId}
        />
    </div>
  );
};

export default CriteriaBuilder;