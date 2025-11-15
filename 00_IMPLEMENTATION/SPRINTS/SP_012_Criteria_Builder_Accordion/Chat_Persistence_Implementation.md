# SP_012: Project-Specific Chat Persistence and Dynamic UI

## Sprint Goal
Implement project-specific chat history persistence with synthesis display and dynamic chat container height in the Criteria Builder.

## Context
Currently, the chat in CriteriaBuilder component:
- Does not persist chat history across sessions
- Does not isolate chat history per project
- Shows full chat history when switching projects
- Has fixed height that doesn't adapt to content
- Input field scrolls with content (not fixed at bottom)

## User Requirements

### Requirement 1: Project-Specific Chat Isolation
When switching between projects, each project should have its own isolated chat history stored separately in localStorage.

### Requirement 2: Synthesis Display
Instead of displaying the full chat history when switching to a project, display only ONE AI-generated synthesis message that summarizes the previous conversation.

For the MVP, use mock synthesis data from JSON files to imitate AI-generated summaries.

### Requirement 3: Dynamic Chat Height
The chat container should:
- Start small when there are few messages
- Grow taller as more messages are added
- Have a maximum height beyond which scrolling occurs
- Shrink to fit content (no empty space)
- Auto-scroll to latest message when reaching max height

### Requirement 4: Fixed Input Field
The input field should be fixed/sticky at the bottom of the chat container and always remain visible (not scroll out of view).

## Technical Implementation Plan

### Phase 1: Chat Persistence Infrastructure

#### Task 1.1: Modify useCriteriaChat Hook
**File**: `/src/hooks/useCriteriaChat.ts`

Add project-specific localStorage persistence:

```typescript
// Add projectId parameter
export const useCriteriaChat = (projectId: string): UseCriteriaChatReturn => {
  const storageKey = `chat_${projectId}`;

  // Load chat from localStorage on mount
  useEffect(() => {
    const loadChat = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const messages: ChatMessage[] = JSON.parse(saved);
          // Convert timestamp strings back to Date objects
          const parsed = messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setChatMessages(parsed);
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      }
    };
    loadChat();
  }, [projectId, storageKey]);

  // Save chat to localStorage when messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(chatMessages));
      } catch (error) {
        console.error('Failed to save chat:', error);
      }
    }
  }, [chatMessages, storageKey]);

  // ... rest of hook
}
```

#### Task 1.2: Update CriteriaBuilder to Pass ProjectId
**File**: `/src/components/vendor-discovery/CriteriaBuilder.tsx`

Modify CriteriaBuilder to accept and pass projectId:

```typescript
interface CriteriaBuilderProps {
  techRequest: TechRequest;
  onComplete: (criteria: Criteria[]) => void;
  initialCriteria?: Criteria[];
  projectId: string; // NEW: Add projectId prop
}

const CriteriaBuilder = ({
  techRequest,
  onComplete,
  initialCriteria,
  projectId // NEW
}: CriteriaBuilderProps) => {
  // Pass projectId to hook
  const {
    chatMessages,
    isGenerating: isGeneratingChat,
    userMessage,
    setUserMessage,
    addMessage,
    sendMessage,
    initializeChat
  } = useCriteriaChat(projectId); // NEW: Pass projectId

  // ... rest of component
}
```

#### Task 1.3: Update VendorDiscovery to Pass ProjectId
**File**: `/src/components/VendorDiscovery.tsx`

Pass project.id to CriteriaBuilder:

```typescript
{currentStep === 'criteria' && techRequest && (
  <CriteriaBuilder
    techRequest={techRequest}
    onComplete={handleCriteriaComplete}
    initialCriteria={criteria}
    projectId={project.id} // NEW: Pass project ID
  />
)}
```

### Phase 2: Chat Synthesis Display

#### Task 2.1: Create Synthesis Generator Function
**File**: `/src/hooks/useCriteriaChat.ts`

Add synthesis generation from chat history:

```typescript
/**
 * Generate synthesis message from chat history
 * For MVP, returns a formatted summary of the conversation
 */
const generateSynthesis = (messages: ChatMessage[]): string => {
  if (messages.length === 0) {
    return "Let's start building your evaluation criteria.";
  }

  // Count user messages and AI responses
  const userMsgCount = messages.filter(m => m.role === 'user').length;
  const aiMsgCount = messages.filter(m => m.role === 'assistant').length;

  // Get last AI message as basis for synthesis
  const lastAiMessage = [...messages]
    .reverse()
    .find(m => m.role === 'assistant');

  if (!lastAiMessage) {
    return "Let's continue refining your criteria.";
  }

  // For MVP: Simple synthesis based on message count
  return `Based on our ${userMsgCount} discussion${userMsgCount !== 1 ? 's' : ''}, we've identified and refined evaluation criteria. ${lastAiMessage.content.split('.')[0]}.`;
};
```

#### Task 2.2: Add Synthesis Mode to Hook
**File**: `/src/hooks/useCriteriaChat.ts`

Add option to load in synthesis mode:

```typescript
export interface UseCriteriaChatReturn {
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  userMessage: string;
  setUserMessage: (message: string) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (message: string, context: ChatContext) => Promise<void>;
  initializeChat: (initialMessage: ChatMessage) => void;
  loadWithSynthesis: () => void; // NEW: Load with synthesis display
  fullChatMessages: ChatMessage[]; // NEW: Full history for reference
}

export const useCriteriaChat = (projectId: string): UseCriteriaChatReturn => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [fullChatMessages, setFullChatMessages] = useState<ChatMessage[]>([]); // NEW

  // Load chat from localStorage
  useEffect(() => {
    const loadChat = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const messages: ChatMessage[] = JSON.parse(saved);
          const parsed = messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));

          setFullChatMessages(parsed); // Store full history

          // If there's existing chat, show synthesis
          if (parsed.length > 0) {
            const synthesis = generateSynthesis(parsed);
            setChatMessages([{
              id: 'synthesis',
              role: 'assistant',
              content: synthesis,
              timestamp: new Date()
            }]);
          }
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      }
    };
    loadChat();
  }, [projectId, storageKey]);

  // NEW: Function to load with synthesis
  const loadWithSynthesis = () => {
    if (fullChatMessages.length > 0) {
      const synthesis = generateSynthesis(fullChatMessages);
      setChatMessages([{
        id: 'synthesis',
        role: 'assistant',
        content: synthesis,
        timestamp: new Date()
      }]);
    }
  };

  // Save full chat history (not synthesis)
  useEffect(() => {
    if (chatMessages.length > 0 && chatMessages[0].id !== 'synthesis') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(chatMessages));
        setFullChatMessages(chatMessages);
      } catch (error) {
        console.error('Failed to save chat:', error);
      }
    }
  }, [chatMessages, storageKey]);

  return {
    chatMessages,
    isGenerating,
    userMessage,
    setUserMessage,
    addMessage,
    sendMessage,
    initializeChat,
    loadWithSynthesis,
    fullChatMessages
  };
};
```

### Phase 3: Dynamic Chat Height

#### Task 3.1: Update Chat Container Styling
**File**: `/src/components/vendor-discovery/CriteriaBuilder.tsx`

Modify chat container CSS to implement dynamic height:

```typescript
// Current structure (to be modified):
<div className="border rounded-lg p-4 bg-white shadow-sm h-96 overflow-y-auto mb-4">
  {/* Messages */}
</div>

// NEW structure with dynamic height:
<div className="border rounded-lg bg-white shadow-sm flex flex-col">
  {/* Chat messages with dynamic height */}
  <div className="overflow-y-auto min-h-24 max-h-96 p-4 space-y-4">
    {chatMessages.map((message) => (
      // ... message rendering
    ))}
  </div>

  {/* Fixed input at bottom */}
  <div className="border-t p-4 bg-gray-50">
    {/* Input field */}
  </div>
</div>
```

Key CSS changes:
- **Container**: `flex flex-col` to stack messages and input
- **Messages Area**:
  - `min-h-24` (96px) - Start small
  - `max-h-96` (384px) - Maximum height
  - `overflow-y-auto` - Scroll when max height reached
  - Remove fixed height
- **Input Area**:
  - `border-t` - Visual separation
  - `bg-gray-50` - Slight background difference
  - Outside scrollable area (fixed at bottom)

#### Task 3.2: Implement Auto-Scroll
**File**: `/src/components/vendor-discovery/CriteriaBuilder.tsx`

Add ref and auto-scroll logic:

```typescript
const CriteriaBuilder = ({ techRequest, onComplete, initialCriteria, projectId }: CriteriaBuilderProps) => {
  // ... existing state

  // NEW: Ref for chat messages container
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // NEW: Auto-scroll when new messages added
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      // Check if we're near the bottom (within 100px)
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // Only auto-scroll if user is already near bottom
      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatMessages]);

  return (
    // ...
    <div
      ref={chatContainerRef}
      className="overflow-y-auto min-h-24 max-h-96 p-4 space-y-4"
    >
      {/* Messages */}
    </div>
    // ...
  );
};
```

### Phase 4: Integration and Testing

#### Task 4.1: Update Initialization Logic
Ensure CriteriaBuilder properly initializes with synthesis when loading existing project:

```typescript
useEffect(() => {
  // Only initialize with project summary if no chat history exists
  if (fullChatMessages.length === 0) {
    const projectSummary = generateDetailedSummary(techRequest.category);
    const initialMessage = {
      id: '1',
      role: 'assistant' as const,
      content: projectSummary,
      timestamp: new Date()
    };
    initializeChat(initialMessage);

    if (!initialCriteria || initialCriteria.length === 0) {
      generateInitialCriteria(techRequest).then(({ criteria: generatedCriteria, message }) => {
        setCriteria(generatedCriteria);
        addMessage(message);
      });
    }
  }
  // If chat history exists, synthesis is already loaded by useCriteriaChat
}, [techRequest, initialCriteria, fullChatMessages]);
```

#### Task 4.2: Manual Testing Checklist
- [ ] Create new project → Chat starts with AI summary
- [ ] Add messages → Chat grows in height
- [ ] Reach max height → Scrollbar appears
- [ ] New message added → Auto-scrolls to bottom
- [ ] Switch to different project → Different chat history loads
- [ ] Switch back → Original chat shows synthesis
- [ ] Continue conversation → Messages append to history
- [ ] Refresh page → Chat persists correctly
- [ ] Input field always visible at bottom

## Files Modified

1. `/src/hooks/useCriteriaChat.ts`
   - Add projectId parameter
   - Add localStorage persistence (load/save)
   - Add synthesis generation
   - Add synthesis mode display

2. `/src/components/vendor-discovery/CriteriaBuilder.tsx`
   - Add projectId prop
   - Pass projectId to useCriteriaChat
   - Update chat container styling (dynamic height)
   - Add auto-scroll logic
   - Update initialization to handle synthesis

3. `/src/components/VendorDiscovery.tsx`
   - Pass project.id to CriteriaBuilder

## Success Criteria

✅ Each project has isolated chat history in localStorage
✅ Switching projects shows synthesis message only
✅ Chat container starts small and grows with content
✅ Chat has maximum height with scrolling
✅ Input field fixed at bottom (always visible)
✅ Auto-scrolls to new messages when at max height
✅ Chat persists across page refreshes
✅ No empty space in chat container

## Technical Notes

### localStorage Structure
```
chat_[projectId] → ChatMessage[]
```

Example:
```typescript
chat_proj_123 → [
  { id: '1', role: 'assistant', content: 'Hello...', timestamp: '2024-01-15T10:00:00Z' },
  { id: '2', role: 'user', content: 'Add security criteria', timestamp: '2024-01-15T10:01:00Z' },
  { id: '3', role: 'assistant', content: 'I've added...', timestamp: '2024-01-15T10:01:30Z' }
]
```

### Synthesis Format (MVP)
Simple template-based synthesis:
```
"Based on our [X] discussion[s], we've identified and refined evaluation criteria. [First sentence of last AI message]."
```

### CSS Height Strategy
- **min-h-24**: 6rem = 96px (small starting height)
- **max-h-96**: 24rem = 384px (maximum before scrolling)
- Container naturally grows between these bounds based on content

## Future Enhancements (Post-MVP)

1. AI-powered synthesis generation using OpenAI/Anthropic
2. Expandable synthesis (click to view full history)
3. Chat export functionality
4. Search within chat history
5. Message editing/deletion
6. Rich text formatting in messages
