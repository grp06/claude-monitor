# UI Specification: Claude Code Prompt Analysis Tool

## Overview

The Claude Code Prompt Analysis Tool provides a web interface for users to browse and analyze their Claude Code conversations. The primary goal is to help users improve their prompting skills by comparing their original prompts with AI-improved versions and receiving actionable feedback.

## Core User Journey

1. **View Recent Conversations**: Users can browse their recent Claude Code sessions
2. **Analyze Prompts**: For each conversation, users can compare their original prompt with the AI-rewritten version
3. **Get Improvement Suggestions**: Users can request AI-powered analysis of their prompting patterns and receive personalized tips

## Main Interface Structure

### Conversation List View

**Layout**: Full-screen vertical list with collapsible conversation cards

**Key Components**:
- **Conversation Header**: Session identifier (e.g., "Conversation session-abc123")
- **Timestamp**: When the conversation was created/modified
- **Toggle Mechanism**: Expandable/collapsible interface
- **Prompt Count**: Number of prompts in the conversation (e.g., "3 prompts")

**Styling**:
- Clean, minimal design with proper spacing
- Cards with subtle borders and hover effects
- Collapsed state shows only header and basic info
- Expanded state reveals detailed prompt analysis

### Expanded Conversation View

When a conversation toggle is opened, display:

#### Side-by-Side Prompt Comparison

**Left Column - Original Prompt**:
- Label: "Your Original Prompt"
- Full text of the user's submitted prompt
- Preserves all formatting and context
- Background: Light neutral color

**Right Column - AI-Improved Prompt**:
- Label: "AI-Rewritten Prompt"
- The improved version created by the LLM
- Shows how the prompt could be more effective
- Background: Light accent color

**Layout Details**:
- Equal width columns (50/50 split)
- Fixed height with scrolling for long prompts
- Monospace font for code-like readability
- Clear visual distinction between original and improved

#### Prompting Advice Button

**Location**: Below the prompt comparison section

**Design**:
- Prominent call-to-action button
- Label: "Get Prompting Advice"
- Icon: Lightbulb or suggestion-related
- Initially disabled/non-functional (placeholder for future feature)
- Clear indication that it's a future feature

**Future Functionality**:
- When clicked, analyzes all prompts in the conversation
- Provides specific feedback on:
  - What was improved in the AI version
  - Common prompting patterns to avoid
  - Tips for writing clearer, more effective prompts
  - Context about why certain changes were made

## Data Flow and State Management

### Conversation Data Structure
```typescript
interface Conversation {
  id: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  prompts: Prompt[];
}

interface Prompt {
  id: string;
  originalPrompt: string;
  aiPrompt: string;
  timestamp: Date;
}
```

### UI States

1. **Loading**: Show skeleton loaders while fetching conversations
2. **Empty**: Display helpful message when no conversations exist
3. **Error**: Graceful error handling with retry options
4. **Analysis Pending**: Future state when advice generation is in progress

## Responsive Design

### Desktop (>1024px)
- Full side-by-side layout
- Multiple columns for prompt comparison
- Generous spacing and typography

### Tablet (768px-1024px)
- Side-by-side layout maintained
- Reduced padding and font sizes
- Touch-friendly interaction areas

### Mobile (<768px)
- Stacked vertical layout for prompts
- Single column design
- Accordion-style conversation toggles
- Optimized touch targets

## Accessibility Considerations

- **Keyboard Navigation**: Full keyboard support for toggles and buttons
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: High contrast ratios for readability
- **Focus Indicators**: Clear focus states for interactive elements
- **Alt Text**: Descriptive labels for icons and images

## Future Enhancements

### Phase 1: Core Analysis
- Implement "Get Prompting Advice" functionality
- AI analysis of prompting patterns
- Highlighted differences between original and improved prompts
- Category-based feedback (clarity, specificity, context)

### Phase 2: Advanced Features
- Prompt templates and examples
- Historical trend analysis
- Export functionality for conversations
- Search and filtering capabilities

### Phase 3: Social Features
- Shareable prompt analysis
- Community prompt examples
- Leaderboards for prompt improvement
- Collaborative prompt review

## Technical Implementation Notes

### Framework: Next.js + Convex
- Server-side rendering for initial page load
- Real-time updates via Convex subscriptions
- Optimized data fetching with proper loading states

### Styling: Tailwind CSS
- Utility-first approach
- Dark/light mode support
- Consistent design tokens
- Responsive design utilities

### State Management
- Convex for server state
- React Query for client-side caching
- Optimistic updates for better UX

## User Experience Principles

1. **Progressive Disclosure**: Show essential info first, details on demand
2. **Context Preservation**: Maintain conversation context when analyzing prompts
3. **Actionable Feedback**: All suggestions should be specific and implementable
4. **Privacy First**: User data stays local, analysis happens client-side where possible
5. **Performance**: Fast loading, smooth interactions, minimal latency

## Success Metrics

- **User Engagement**: Time spent analyzing prompts
- **Prompt Quality**: Improvement in user's original prompt quality over time
- **Feature Usage**: Adoption rate of the "Get Prompting Advice" feature
- **User Satisfaction**: Feedback on the clarity and helpfulness of suggestions
