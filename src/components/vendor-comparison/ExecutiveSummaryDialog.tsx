/**
 * ExecutiveSummaryDialog Component
 * Sprint: SP_015
 *
 * Full viewport popup showing AI-generated executive summary
 * with key criteria, vendor recommendations, differentiators, and call prep
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Bot, Share2, Send, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { TYPOGRAPHY } from '../../styles/typography-config';
import { useToast } from '../../hooks/use-toast';
import { ShareDialog } from '../vendor-discovery/ShareDialog';
import type { Criteria } from '../VendorDiscovery';
import type { ExecutiveSummaryData } from '../../services/n8nService';

// Default empty executive summary structure when no data from n8n
const defaultExecutiveSummary = {
  title: 'Executive Summary',
  generatedAt: new Date().toISOString(),
  sections: {
    keyCriteria: {
      title: 'Key Evaluation Criteria',
      content: 'Complete the vendor comparison to see key criteria analysis.',
      highPriority: ['Run vendor comparison to analyze criteria']
    },
    vendorRecommendations: {
      title: 'Vendor Recommendations',
      topPicks: [] as Array<{ rank: number; name: string; matchScore: number; reasoning: string }>
    },
    keyDifferentiators: {
      title: 'Key Differentiators',
      differentiators: [] as Array<{ category: string; leader: string; details: string }>
    },
    riskFactors: {
      title: 'Risk Factors & Call Preparation',
      description: 'Complete the vendor comparison to generate call preparation questions.',
      questionsToAsk: [] as Array<{ vendor: string; questions: string[] }>,
      generalConsiderations: [
        'Ensure alignment with your technical requirements',
        'Consider total cost of ownership',
        'Evaluate vendor support and training options'
      ]
    }
  }
};

interface ExecutiveSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: () => void;
  onRegenerate?: () => void;
  criteria?: Criteria[];
  projectId?: string;
  summaryData?: ExecutiveSummaryData | null;
  isLoading?: boolean;
  error?: string | null;
  onGenerate?: () => void;
}

export const ExecutiveSummaryDialog: React.FC<ExecutiveSummaryDialogProps> = ({
  isOpen,
  onClose,
  onOpenChat,
  onRegenerate,
  criteria = [],
  projectId = 'comparison',
  summaryData,
  isLoading = false,
  error,
  onGenerate
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Transform n8n data to display format or use default
  const summary = summaryData ? {
    title: 'Executive Summary',
    generatedAt: new Date().toISOString(),
    sections: {
      keyCriteria: {
        title: 'Key Evaluation Criteria',
        content: `Based on ${summaryData.keyCriteria.length} high-priority criteria.`,
        highPriority: summaryData.keyCriteria.map(c => c.name)
      },
      vendorRecommendations: {
        title: 'Vendor Recommendations',
        topPicks: summaryData.vendorRecommendations.map(v => ({
          rank: v.rank,
          name: v.name,
          matchScore: v.matchPercentage,
          reasoning: v.overallAssessment
        }))
      },
      keyDifferentiators: {
        title: 'Key Differentiators',
        differentiators: summaryData.keyDifferentiators.map(d => ({
          category: d.category,
          leader: d.leader,
          details: d.details
        }))
      },
      riskFactors: {
        title: 'Risk Factors & Call Preparation',
        description: `Questions to ask ${summaryData.riskFactors.vendorSpecific.length} vendors during evaluation calls.`,
        questionsToAsk: summaryData.riskFactors.vendorSpecific,
        generalConsiderations: summaryData.riskFactors.generalConsiderations
      }
    }
  } : defaultExecutiveSummary;

  // Auto-generate on open if no data and not loading
  React.useEffect(() => {
    if (isOpen && !summaryData && !isLoading && !error && onGenerate) {
      onGenerate();
    }
  }, [isOpen, summaryData, isLoading, error, onGenerate]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (onOpenChat) {
      onOpenChat();
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', content: chatMessage }]);

    // Mock AI response (in production, this would call the AI service)
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `Based on the executive summary, I can help you understand more about the vendor comparison. ${chatMessage.toLowerCase().includes('salesforce') ? 'Salesforce leads in customization and enterprise features, but consider the total cost of ownership.' : 'Would you like me to elaborate on any specific section or vendor?'}`
      }]);
    }, 1000);

    setChatMessage('');
  };

  const handleCopy = async () => {
    const formattedText = generateFormattedText();

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Executive summary has been copied',
        duration: 2000
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
        duration: 2000
      });
    }
  };

  const generateFormattedText = () => {
    const sections = summary.sections;
    let text = `# ${summary.title}\n\n`;

    // Key Criteria
    text += `## ${sections.keyCriteria.title}\n\n`;
    text += `${sections.keyCriteria.content}\n\n`;
    text += `**High Priority Criteria:**\n`;
    sections.keyCriteria.highPriority.forEach(item => {
      text += `- ${item}\n`;
    });
    text += '\n';

    // Vendor Recommendations
    text += `## ${sections.vendorRecommendations.title}\n\n`;
    sections.vendorRecommendations.topPicks.forEach(pick => {
      text += `### ${pick.rank}. ${pick.name} (${pick.matchScore}% Match)\n`;
      text += `${pick.reasoning}\n\n`;
    });

    // Key Differentiators
    text += `## ${sections.keyDifferentiators.title}\n\n`;
    sections.keyDifferentiators.differentiators.forEach(diff => {
      text += `**${diff.category}** - Leader: ${diff.leader}\n`;
      text += `${diff.details}\n\n`;
    });

    // Risk Factors
    text += `## ${sections.riskFactors.title}\n\n`;
    text += `${sections.riskFactors.description}\n\n`;

    sections.riskFactors.questionsToAsk.forEach(vendorQuestions => {
      text += `### Questions for ${vendorQuestions.vendor}:\n`;
      vendorQuestions.questions.forEach(q => {
        text += `- ${q}\n`;
      });
      text += '\n';
    });

    text += `### General Considerations:\n`;
    sections.riskFactors.generalConsiderations.forEach(item => {
      text += `- ${item}\n`;
    });

    return text;
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-2 sm:inset-4 md:inset-6 lg:inset-8 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with action buttons */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className={`${TYPOGRAPHY.heading.h5} text-gray-900`}>
                  Executive Summary
                </h2>
                <div className="flex items-center gap-2">
                  {/* Regenerate Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRegenerate}
                    disabled={isLoading}
                    title="Regenerate summary"
                    className="h-8 w-8"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    title="Copy to clipboard"
                    className="h-8 w-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Bot Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenChat}
                    title="Chat with AI"
                    className="h-8 w-8"
                  >
                    <Bot className="h-4 w-4" />
                  </Button>

                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    title="Close"
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                      <p className={`${TYPOGRAPHY.body.default} text-gray-600`}>
                        Generating executive summary...
                      </p>
                      <p className={`${TYPOGRAPHY.muted.default} text-gray-500 mt-2`}>
                        This may take up to 2 minutes
                      </p>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isLoading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                      <p className={`${TYPOGRAPHY.body.default} text-red-700 mb-4`}>
                        {error}
                      </p>
                      <Button onClick={onGenerate} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* Content - only show when we have data and not loading/error */}
                  {!isLoading && !error && (
                    <>
                      {/* Title */}
                      <div className="text-center mb-8">
                        <h1 className={`${TYPOGRAPHY.heading.h4} text-gray-900 mb-2`}>
                          {summary.title}
                        </h1>
                        <p className={`${TYPOGRAPHY.muted.default} text-gray-500`}>
                          Generated on {new Date(summary.generatedAt).toLocaleDateString()}
                        </p>
                      </div>

                  {/* Key Criteria Section */}
                  <section>
                    <h3 className={`${TYPOGRAPHY.heading.h6} text-primary mb-3`}>
                      {summary.sections.keyCriteria.title}
                    </h3>
                    <p className={`${TYPOGRAPHY.body.default} text-gray-700 mb-4`}>
                      {summary.sections.keyCriteria.content}
                    </p>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className={`${TYPOGRAPHY.label.default} text-blue-800 mb-2`}>
                        High Priority Criteria:
                      </p>
                      <p className={`${TYPOGRAPHY.body.small} text-blue-700`}>
                        {summary.sections.keyCriteria.highPriority.join(', ')}
                      </p>
                    </div>
                  </section>

                  {/* Vendor Recommendations Section */}
                  <section>
                    <h3 className={`${TYPOGRAPHY.heading.h6} text-primary mb-4`}>
                      {summary.sections.vendorRecommendations.title}
                    </h3>
                    <div className="space-y-4">
                      {summary.sections.vendorRecommendations.topPicks.map((pick) => (
                        <div
                          key={pick.rank}
                          className="bg-gray-50 rounded-xl p-4 border-l-4 border-primary"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-primary text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                              {pick.rank}
                            </span>
                            <h4 className={`${TYPOGRAPHY.heading.h6} text-gray-900`}>
                              {pick.name}
                            </h4>
                            <span className={`${TYPOGRAPHY.label.small} text-primary bg-primary/10 px-2 py-0.5 rounded`}>
                              {pick.matchScore}% Match
                            </span>
                          </div>
                          <p className={`${TYPOGRAPHY.body.small} text-gray-700`}>
                            {pick.reasoning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Key Differentiators Section */}
                  <section>
                    <h3 className={`${TYPOGRAPHY.heading.h6} text-primary mb-4`}>
                      {summary.sections.keyDifferentiators.title}
                    </h3>
                    <div className="space-y-3">
                      {summary.sections.keyDifferentiators.differentiators.map((diff, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`${TYPOGRAPHY.label.default} text-gray-900`}>
                              {diff.category}
                            </span>
                            <span className={`${TYPOGRAPHY.label.small} text-green-700 bg-green-100 px-2 py-0.5 rounded`}>
                              Leader: {diff.leader}
                            </span>
                          </div>
                          <p className={`${TYPOGRAPHY.body.small} text-gray-600`}>
                            {diff.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Risk Factors & Call Prep Section */}
                  <section>
                    <h3 className={`${TYPOGRAPHY.heading.h6} text-primary mb-3`}>
                      {summary.sections.riskFactors.title}
                    </h3>
                    <p className={`${TYPOGRAPHY.body.default} text-gray-700 mb-4`}>
                      {summary.sections.riskFactors.description}
                    </p>

                    {/* Questions per Vendor */}
                    <div className="space-y-4 mb-6">
                      {summary.sections.riskFactors.questionsToAsk.map((vendorQuestions, index) => (
                        <div key={index} className="bg-orange-50 rounded-xl p-4">
                          <h4 className={`${TYPOGRAPHY.label.default} text-orange-800 mb-3`}>
                            Questions for {vendorQuestions.vendor}:
                          </h4>
                          <ul className="space-y-2">
                            {vendorQuestions.questions.map((q, qIndex) => (
                              <li key={qIndex} className="flex items-start gap-2">
                                <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                                <span className={`${TYPOGRAPHY.body.small} text-orange-900`}>
                                  {q}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* General Considerations */}
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <h4 className={`${TYPOGRAPHY.label.default} text-yellow-800 mb-3`}>
                        General Considerations:
                      </h4>
                      <ul className="space-y-2">
                        {summary.sections.riskFactors.generalConsiderations.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-1 flex-shrink-0">•</span>
                            <span className={`${TYPOGRAPHY.body.small} text-yellow-900`}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                    </>
                  )}
                </div>
              </div>

              {/* Footer with Download/Share Button */}
              <div className="flex justify-center p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(true)}
                  className={`${TYPOGRAPHY.button.default} gap-2 min-w-[240px]`}
                >
                  <Share2 className="h-4 w-4" />
                  Download or Share
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        criteria={criteria}
        projectId={projectId}
        title="Download or Share"
        description="Download the executive summary or share via link"
        downloadButtonText="Download Executive Summary"
        downloadDescription="Download as Excel file (.xlsx)"
      />

      {/* Slide-in Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-[60]"
              onClick={() => setIsChatOpen(false)}
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white shadow-2xl z-[70] flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <h3 className={TYPOGRAPHY.heading.h6}>Chat with AI</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  className="hover:bg-primary-foreground/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {/* Initial AI message */}
                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-3 flex gap-2">
                      <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className={TYPOGRAPHY.body.small}>
                        I can help you understand the executive summary better. Ask me about specific vendors, criteria, or recommendations!
                      </p>
                    </CardContent>
                  </Card>

                  {/* Chat history */}
                  {chatHistory.map((msg, index) => (
                    <Card
                      key={index}
                      className={msg.role === 'user' ? 'bg-gray-100 ml-8' : 'bg-blue-50 border-blue-100 mr-8'}
                    >
                      <CardContent className="p-3 flex gap-2">
                        {msg.role === 'assistant' && (
                          <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        )}
                        <p className={TYPOGRAPHY.body.small}>{msg.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about vendors, criteria, or recommendations..."
                    className="resize-none"
                    rows={2}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExecutiveSummaryDialog;
