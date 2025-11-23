/**
 * 🎯 CRITERIA CHAT HOOK
 *
 * Purpose: Manages AI chat interaction for criteria refinement.
 * Built on top of useChat base hook with specialized features.
 *
 * Features:
 * - Chat synthesis generation for project switching
 * - Project-specific chat persistence in localStorage
 * - AI service integration for conversational refinement
 * - Context preparation (category, current criteria)
 * - Error handling with user feedback
 * - Message history truncation (last 5 messages)
 *
 * @module hooks/useCriteriaChat
 */

import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';
import type { Message } from '@/components/shared/chat';
import {
  sendCriteriaChat,
  type CriteriaAction,
  type ChatMessage as N8nChatMessage,
  type TransformedCriterion
} from '@/services/n8nService';
import { useToast } from '@/hooks/use-toast';

/**
 * Chat message structure (exported for compatibility)
 */
export interface ChatMessage extends Message {}

/**
 * Criteria structure for context
 */
export interface Criteria {
  id: string;
  name: string;
  explanation: string;
  importance: 'low' | 'medium' | 'high';
  type: string;
  isArchived?: boolean;
}

/**
 * Chat context for AI - includes full project info for n8n
 */
export interface ChatContext {
  projectId: string;
  projectName: string;
  projectDescription: string;
  category: string;
  criteria: Criteria[];
}

/**
 * Callback for applying criteria actions
 */
export type OnCriteriaAction = (actions: CriteriaAction[]) => void;

/**
 * Hook return type
 */
export interface UseCriteriaChatReturn {
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  userMessage: string;
  setUserMessage: (message: string) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (message: string, context: ChatContext) => Promise<void>;
  initializeChat: (initialMessage: ChatMessage) => void;
  clearChat: () => void;
  fullChatMessages: ChatMessage[];
  hasChatHistory: boolean;
}

/**
 * Generate synthesis message from chat history
 * Summarizes the conversation for display when switching projects
 *
 * @param messages - Full chat history
 * @returns Synthesis message string
 */
const generateSynthesis = (messages: ChatMessage[]): string => {
  if (messages.length === 0) {
    return "Let's start building your evaluation criteria.";
  }

  // Count user messages
  const userMsgCount = messages.filter(m => m.role === 'user').length;

  // Get last AI message as basis for synthesis
  const lastAiMessage = [...messages]
    .reverse()
    .find(m => m.role === 'assistant');

  if (!lastAiMessage) {
    return "Let's continue refining your criteria.";
  }

  // Extract first sentence from last AI message
  const firstSentence = lastAiMessage.content.split('.')[0];

  // Generate synthesis based on conversation
  if (userMsgCount === 0) {
    return firstSentence + '.';
  }

  return `Based on our ${userMsgCount} discussion${userMsgCount !== 1 ? 's' : ''}, we've refined your evaluation criteria. ${firstSentence}.`;
};

/**
 * Custom hook for AI-powered criteria chat
 *
 * Purpose: Manages conversational AI interaction for criteria refinement.
 * Built on top of useChat with specialized synthesis and AI integration.
 *
 * @param projectId - Unique project identifier for chat isolation
 * @returns Object with chat state and functions
 *
 * @example
 * ```typescript
 * const {
 *   chatMessages,
 *   isGenerating,
 *   userMessage,
 *   setUserMessage,
 *   sendMessage,
 *   initializeChat,
 *   hasChatHistory
 * } = useCriteriaChat(projectId);
 *
 * // Initialize with greeting (only if no history)
 * useEffect(() => {
 *   if (!hasChatHistory) {
 *     initializeChat({
 *       id: '1',
 *       role: 'assistant',
 *       content: 'Hello! I can help you refine your criteria...',
 *       timestamp: new Date()
 *     });
 *   }
 * }, [hasChatHistory]);
 *
 * // Send user message
 * await sendMessage('Add security criteria', {
 *   category: 'CRM Software',
 *   criteria: currentCriteria
 * });
 * ```
 *
 * @remarks
 * - Persists chat history per project in localStorage
 * - Displays synthesis on project load (not full history)
 * - Keeps last 5 messages in context to manage token usage
 * - Automatically handles errors with toast notifications
 * - Loading state can be used to disable input during AI response
 */
export const useCriteriaChat = (
  projectId: string,
  onCriteriaAction?: OnCriteriaAction
): UseCriteriaChatReturn => {
  const storageKey = `chat_${projectId}`;

  // Base chat hook for state management
  const {
    messages,
    inputValue: userMessage,
    setInputValue: setUserMessage,
    isTyping: isGenerating,
    setIsTyping: setIsGenerating,
    addMessage: baseAddMessage,
    clearMessages: baseClearMessages,
  } = useChat({ storageKey });

  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const [fullChatMessages, setFullChatMessages] = useState<ChatMessage[]>([]);
  const [hasChatHistory, setHasChatHistory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  // Track if this project's chat has been active in this session
  // This prevents showing synthesis when navigating within the app
  const sessionActiveKey = `chat_active_${projectId}`;

  /**
   * Load chat history and generate synthesis on project change
   * Only runs once per project change
   * Shows full history if chat was active in this session (navigating within app)
   * Shows synthesis only on fresh session load (e.g., page refresh)
   */
  useEffect(() => {
    // Skip if already loaded for this project
    if (loadedProjectId === projectId) return;

    // Reset initialization flag on project change
    setIsInitialized(false);

    try {
      const saved = localStorage.getItem(storageKey);

      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp || Date.now())
        }));

        setFullChatMessages(messagesWithDates);
        setHasChatHistory(messagesWithDates.length > 0);

        if (messagesWithDates.length > 0) {
          // Always show full conversation history
          setDisplayMessages(messagesWithDates);
          setIsInitialized(true);
          console.log('✅ Chat restored', {
            projectId,
            messageCount: messagesWithDates.length
          });
        } else {
          setDisplayMessages([]);
        }
      } else {
        setFullChatMessages([]);
        setDisplayMessages([]);
        setHasChatHistory(false);
      }

      // Mark this project as loaded
      setLoadedProjectId(projectId);
    } catch (error) {
      console.error('Failed to load chat:', error);
      setFullChatMessages([]);
      setDisplayMessages([]);
      setHasChatHistory(false);
      setLoadedProjectId(projectId);
    }
  }, [projectId, storageKey, loadedProjectId, sessionActiveKey]);

  /**
   * Sync messages with base hook when they change (not synthesis)
   * Only syncs after initialization to prevent duplicate messages
   */
  useEffect(() => {
    // Skip sync if not yet initialized by initializeChat
    if (!isInitialized) return;

    if (messages.length > 0 && messages[0].id !== 'synthesis') {
      setDisplayMessages(messages);
      setFullChatMessages(messages);
      setHasChatHistory(true);
    }
  }, [messages, isInitialized]);

  /**
   * Initialize chat with a message
   * Replaces synthesis with actual conversation
   *
   * @param initialMessage - Initial chat message
   */
  const initializeChat = useCallback((initialMessage: ChatMessage) => {
    setDisplayMessages([initialMessage]);
    baseAddMessage(initialMessage);
    setIsInitialized(true);
    // Mark chat as active in this session
    sessionStorage.setItem(sessionActiveKey, 'true');
  }, [baseAddMessage, sessionActiveKey]);

  /**
   * Add a message to chat history
   *
   * @param message - Message to add
   */
  const addMessage = useCallback((message: ChatMessage) => {
    setDisplayMessages(prev => [...prev, message]);
    baseAddMessage(message);
    // Ensure sync effect is enabled after first message is added
    if (!isInitialized) {
      setIsInitialized(true);
    }
    // Mark chat as active in this session
    sessionStorage.setItem(sessionActiveKey, 'true');
  }, [baseAddMessage, isInitialized, sessionActiveKey]);

  /**
   * Clear all chat messages and reset state
   * Removes from localStorage and resets display
   */
  const clearChat = useCallback(() => {
    setDisplayMessages([]);
    setFullChatMessages([]);
    setHasChatHistory(false);
    setIsInitialized(false);
    baseClearMessages();
    // Also clear from localStorage directly
    localStorage.removeItem(storageKey);
    // Clear session active flag
    sessionStorage.removeItem(sessionActiveKey);
    console.log('[useCriteriaChat] Chat cleared for project:', projectId);
  }, [baseClearMessages, storageKey, projectId, sessionActiveKey]);

  /**
   * Send user message and get AI response via n8n
   *
   * @param message - User's message text
   * @param context - Chat context with project info, category and current criteria
   */
  const sendMessage = useCallback(async (message: string, context: ChatContext): Promise<void> => {
    if (!message.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // If currently showing synthesis, replace it with actual conversation
    // Otherwise append to existing messages
    setDisplayMessages(prev => {
      const isSynthesis = prev.length === 1 && prev[0].id === 'synthesis';
      if (isSynthesis) {
        console.log('[useCriteriaChat] Replacing synthesis with user message');
        return [userMsg];
      }
      return [...prev, userMsg];
    });
    baseAddMessage(userMsg);
    setUserMessage('');
    setIsGenerating(true);
    // Ensure sync effect is enabled
    if (!isInitialized) {
      setIsInitialized(true);
    }

    try {
      // Prepare chat history for n8n (last 10 messages)
      // Handle timestamp which can be Date object or string (from localStorage)
      const chatHistory: N8nChatMessage[] = displayMessages.slice(-10).map(msg => {
        let timestamp: string;
        if (msg.timestamp instanceof Date) {
          timestamp = msg.timestamp.toISOString();
        } else if (typeof msg.timestamp === 'string') {
          timestamp = msg.timestamp;
        } else {
          timestamp = new Date().toISOString();
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp
        };
      });

      // Map criteria to n8n format
      const n8nCriteria: TransformedCriterion[] = context.criteria.map(c => ({
        id: c.id,
        name: c.name,
        explanation: c.explanation || '',
        importance: c.importance,
        type: c.type,
        isArchived: c.isArchived || false
      }));

      // Call n8n criteria chat API
      const response = await sendCriteriaChat(
        context.projectId,
        context.projectName,
        context.projectDescription,
        context.category,
        n8nCriteria,
        message,
        chatHistory
      );

      // Add AI response to chat
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      console.log('[useCriteriaChat] Adding AI response:', {
        messageLength: response.message?.length,
        content: response.message?.substring(0, 100)
      });

      setDisplayMessages(prev => {
        console.log('[useCriteriaChat] Previous messages:', prev.length, '-> Adding 1');
        return [...prev, aiResponse];
      });
      baseAddMessage(aiResponse);

      // Apply criteria actions if any
      if (response.actions && response.actions.length > 0 && onCriteriaAction) {
        console.log('[useCriteriaChat] Applying actions:', response.actions);
        onCriteriaAction(response.actions);

        // Show toast for actions
        const actionSummaries = response.actions.map(a => a.summary).join(', ');
        toast({
          title: 'Criteria Updated',
          description: actionSummaries,
          duration: 4000
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast({
        title: 'AI Response Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      console.error('[useCriteriaChat] Error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [displayMessages, baseAddMessage, setUserMessage, setIsGenerating, toast, isInitialized, onCriteriaAction]);

  return {
    chatMessages: displayMessages,
    isGenerating,
    userMessage,
    setUserMessage,
    addMessage,
    sendMessage,
    initializeChat,
    clearChat,
    fullChatMessages,
    hasChatHistory
  };
};
