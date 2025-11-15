/**
 * CriterionEditSidebar Component - AI-Powered Criterion Editor
 *
 * @purpose Slide-in sidebar for editing and discussing criteria with AI
 * @design Right-side panel with Edit and Chat tabs
 *
 * LAYOUT (SP_012):
 * ┌─────────────────────────────────────┐
 * │ [X] Edit Criterion            Close │
 * │─────────────────────────────────────│
 * │ [ Edit ] [ Chat with AI ]           │
 * │─────────────────────────────────────│
 * │                                     │
 * │ EDIT TAB:                           │
 * │ - Name field                        │
 * │ - Explanation textarea              │
 * │ - Importance select (Low/Med/High)  │
 * │ - Type select                       │
 * │ - Delete button                     │
 * │ - Save button                       │
 * │                                     │
 * │ CHAT TAB:                           │
 * │ - AI chat history                   │
 * │ - Input field                       │
 * │ - Send button                       │
 * │                                     │
 * └─────────────────────────────────────┘
 *
 * FEATURES:
 * - Slides in from right (400px desktop, full-width mobile)
 * - Backdrop overlay (click to close)
 * - Two tabs: Edit and Chat
 * - Smooth animations via Framer Motion
 * - Form validation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Save, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SignalAntenna } from './SignalAntenna';
import { TYPOGRAPHY } from '@/styles/typography-config';
import type { Criteria } from '../VendorDiscovery';

export interface CriterionEditSidebarProps {
  criterion: Criteria | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (criterion: Criteria) => void;
  onDelete: (id: string) => void;
  customTypes: string[];
  mode?: 'edit' | 'create';
  defaultCategory?: string;
}

export const CriterionEditSidebar: React.FC<CriterionEditSidebarProps> = ({
  criterion,
  isOpen,
  onClose,
  onSave,
  onDelete,
  customTypes,
  mode = 'edit',
  defaultCategory = 'feature'
}) => {
  const [editedCriterion, setEditedCriterion] = useState<Criteria | null>(criterion);
  const [chatMessage, setChatMessage] = useState('');

  // Update local state when criterion prop changes or when creating new
  React.useEffect(() => {
    if (mode === 'create' && isOpen) {
      // Initialize with empty criterion for create mode
      setEditedCriterion({
        id: Date.now().toString(),
        name: '',
        explanation: '',
        importance: 'medium',
        type: defaultCategory
      });
    } else if (criterion) {
      setEditedCriterion(criterion);
    }
  }, [criterion, mode, isOpen, defaultCategory]);

  if (!isOpen) {
    return null;
  }

  if (!editedCriterion) {
    return null;
  }

  const handleSave = () => {
    if (editedCriterion) {
      onSave(editedCriterion);
      onClose();
    }
  };

  const handleDelete = () => {
    if (editedCriterion && window.confirm('Are you sure you want to delete this criterion?')) {
      onDelete(editedCriterion.id);
      onClose();
    }
  };

  const allTypes = ['feature', 'technical', 'business', 'compliance', ...customTypes];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-background shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
              <h2 className={TYPOGRAPHY.heading.h5}>
                {mode === 'create' ? 'Create Criterion' : 'Edit Criterion'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-primary-foreground/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="edit" className="flex-1 flex flex-col overflow-auto">
              <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="chat">Chat with AI</TabsTrigger>
              </TabsList>

              {/* Edit Tab */}
              <TabsContent value="edit" className="mt-0 min-h-[600px]">
                <div className="px-4 pb-4">
                  <div className="space-y-4 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Criterion Name</Label>
                      <Input
                        id="name"
                        value={editedCriterion.name}
                        onChange={(e) =>
                          setEditedCriterion({ ...editedCriterion, name: e.target.value })
                        }
                        placeholder="Enter criterion name"
                      />
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <Label htmlFor="explanation">Explanation</Label>
                      <Textarea
                        id="explanation"
                        value={editedCriterion.explanation || ''}
                        onChange={(e) =>
                          setEditedCriterion({ ...editedCriterion, explanation: e.target.value })
                        }
                        placeholder="Detailed explanation of this criterion"
                        className="min-h-[120px] resize-none"
                      />
                    </div>

                    {/* Importance */}
                    <div className="space-y-2">
                      <Label htmlFor="importance">Importance</Label>
                      <div className="flex items-center gap-3">
                        <Select
                          value={editedCriterion.importance}
                          onValueChange={(value: 'low' | 'medium' | 'high') =>
                            setEditedCriterion({ ...editedCriterion, importance: value })
                          }
                        >
                          <SelectTrigger id="importance">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <SignalAntenna importance={editedCriterion.importance} />
                      </div>
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                      <Label htmlFor="type">Category</Label>
                      <Select
                        value={editedCriterion.type}
                        onValueChange={(value: string) =>
                          setEditedCriterion({ ...editedCriterion, type: value })
                        }
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      {mode === 'edit' && (
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={handleDelete}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                      <Button
                        className="flex-1"
                        onClick={handleSave}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {mode === 'create' ? 'Create' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 flex flex-col px-4 pb-4">
                  {/* Chat Messages */}
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-3 py-4">
                      <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-3 flex gap-2">
                          <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <p className={TYPOGRAPHY.muted.small}>
                            I can help you refine this criterion. Ask me questions or tell me how you'd like to improve it!
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>

                  {/* Chat Input */}
                  <div className="space-y-2">
                    <Label htmlFor="chat-message">Message</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="chat-message"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Ask AI to help improve this criterion..."
                        className="resize-none"
                        rows={3}
                      />
                      <Button size="icon" className="flex-shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CriterionEditSidebar;
