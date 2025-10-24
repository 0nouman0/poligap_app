# Platform Context System - RAG-like Implementation

## Overview

The Platform Context System provides intelligent, context-aware responses in the chat interface by automatically detecting when users ask questions about the Poligap platform and injecting relevant documentation as context.

## How It Works

### 1. Query Analysis
When a user sends a message, the system analyzes it to determine if it's platform-related:

```typescript
const queryStrategy = determineQueryStrategy(user_query);
// Returns: { isPlatformRelated, useContext, systemMessage, suggestedModel }
```

### 2. Context Detection
The system checks for platform-specific keywords:
- Platform features (contract review, compliance check, etc.)
- Navigation queries ("how to use", "where is", etc.)
- Technical terms (API endpoints, file formats, etc.)
- Compliance standards (GDPR, HIPAA, etc.)
- Troubleshooting queries (errors, issues, etc.)

### 3. Context Injection
If the query is platform-related:
- Loads `docs/platform.md` documentation
- Extracts relevant sections based on query keywords
- Injects context into system message
- Uses best available model (GPT-4o) for accuracy

If the query is general knowledge:
- Uses standard system message
- Relies on model's training data
- No platform context injected

### 4. Smart Context Extraction
Instead of sending the entire documentation (which would exceed token limits), the system:
- Splits documentation into sections
- Identifies relevant sections based on query
- Limits context to ~8000 characters
- Always includes overview and relevant features

## Architecture

```
User Query
    ↓
Query Analysis (platform-context.ts)
    ↓
├─ Platform Query? → Load platform.md → Extract relevant sections → Inject context
└─ General Query? → Use standard system message → No context needed
    ↓
AI Model (via Portkey)
    ↓
Contextual Response
```

## Files

### 1. `docs/platform.md`
**Purpose:** Comprehensive platform documentation  
**Content:**
- Feature descriptions
- API endpoints
- Workflows
- Compliance standards
- Troubleshooting guides
- Use cases
- Technical architecture

**Maintenance:** Update this file when:
- New features are added
- API endpoints change
- Workflows are modified
- New compliance standards are supported

### 2. `src/lib/platform-context.ts`
**Purpose:** Context detection and injection logic  
**Key Functions:**

```typescript
// Detect if query is about the platform
isPlatformQuery(query: string): boolean

// Extract relevant documentation sections
extractRelevantContext(query: string, fullContext: string): string

// Create system message with context
createPlatformSystemMessage(query: string): string

// Determine optimal handling strategy
determineQueryStrategy(query: string): QueryStrategy
```

### 3. `src/app/api/ai-chat/stream-chat/route.ts`
**Purpose:** Chat API with context integration  
**Changes:**
- Imports `determineQueryStrategy`
- Analyzes each query before processing
- Injects appropriate system message
- Logs strategy for debugging

## Usage Examples

### Example 1: Platform Feature Query
**User:** "How do I use the contract review feature?"

**System Behavior:**
1. Detects keywords: "contract review", "feature"
2. Identifies as platform query
3. Loads platform.md
4. Extracts "Contract Review & Analysis" section
5. Injects context into system message
6. Model responds with accurate, platform-specific information

**Response:** "To use the contract review feature, navigate to `/contract-review`..."

### Example 2: General Compliance Query
**User:** "What are the key requirements of GDPR?"

**System Behavior:**
1. Detects keyword: "GDPR"
2. Identifies as platform query (GDPR is in platform docs)
3. Extracts "Compliance Standards Reference" → "GDPR" section
4. Model responds with both general GDPR knowledge AND platform-specific implementation

**Response:** "GDPR has several key requirements... In Poligap, you can check GDPR compliance by..."

### Example 3: General Knowledge Query
**User:** "What is the capital of France?"

**System Behavior:**
1. No platform keywords detected
2. Identified as general query
3. Uses standard system message
4. No platform context injected
5. Model uses training data

**Response:** "The capital of France is Paris."

### Example 4: Troubleshooting Query
**User:** "Why is my document extraction failing?"

**System Behavior:**
1. Detects keywords: "document extraction", "failing"
2. Identifies as platform query
3. Extracts "Troubleshooting" section
4. Provides specific platform solutions

**Response:** "Document extraction can fail for several reasons. First, verify the file is not encrypted..."

## Benefits

### 1. Reduced Hallucinations
- AI has accurate, up-to-date platform information
- Reduces made-up features or incorrect workflows
- Cites actual platform capabilities

### 2. Contextual Awareness
- Understands platform-specific terminology
- Provides relevant feature references
- Links to actual endpoints and workflows

### 3. Efficient Token Usage
- Only injects context when needed
- Extracts relevant sections (not entire docs)
- Balances context vs. response space

### 4. Dual-Mode Operation
- Platform queries: Use documentation context
- General queries: Use model's knowledge
- Seamless switching between modes

### 5. Easy Maintenance
- Single source of truth (platform.md)
- Update docs once, affects all responses
- No code changes needed for content updates

## Configuration

### Adjusting Context Size
Edit `platform-context.ts`:

```typescript
// Current limit: 8000 characters
if (combinedContext.length > 8000) {
  return combinedContext.substring(0, 8000) + '...';
}

// Increase for more context (uses more tokens):
if (combinedContext.length > 12000) {
  return combinedContext.substring(0, 12000) + '...';
}
```

### Adding Keywords
Edit `PLATFORM_KEYWORDS` array in `platform-context.ts`:

```typescript
const PLATFORM_KEYWORDS = [
  // Add new feature keywords
  'new-feature-name',
  'another-feature',
  // ...
];
```

### Changing Model Selection
Edit `determineQueryStrategy` in `platform-context.ts`:

```typescript
return {
  isPlatformRelated: true,
  useContext: true,
  systemMessage: createPlatformSystemMessage(query),
  suggestedModel: 'gpt-4o-mini', // Use faster model
};
```

## Performance Considerations

### Token Usage
- Platform context: ~2000-8000 tokens
- Conversation history: ~500-2000 tokens
- User query: ~50-500 tokens
- Response: ~500-4000 tokens
- **Total:** ~3000-14500 tokens per request

### Caching
- Platform.md is cached in memory after first load
- No file I/O on subsequent requests
- Cache persists until server restart

### Response Time
- Context detection: <10ms
- Context extraction: <50ms
- AI generation: 2-10 seconds (streaming)
- **Total:** Similar to non-context queries

## Monitoring & Debugging

### Log Messages
The system logs query strategy for each request:

```
🎯 Query strategy: {
  isPlatformRelated: true,
  useContext: true,
  suggestedModel: 'gpt-4o'
}
```

### Debugging Tips

1. **Check if context is being used:**
   - Look for "Query strategy" log
   - `isPlatformRelated: true` means context is injected

2. **Verify context loading:**
   - Look for "✅ Platform context loaded successfully"
   - If missing, check `docs/platform.md` exists

3. **Test keyword detection:**
   ```typescript
   import { isPlatformQuery } from '@/lib/platform-context';
   console.log(isPlatformQuery("How do I use contract review?"));
   // Should return: true
   ```

4. **Inspect system message:**
   ```typescript
   import { createPlatformSystemMessage } from '@/lib/platform-context';
   console.log(createPlatformSystemMessage("What is GDPR?"));
   // Shows exact context being sent to AI
   ```

## Best Practices

### For Developers

1. **Keep platform.md updated:**
   - Update when features change
   - Add new sections for new features
   - Keep examples current

2. **Test keyword detection:**
   - Add tests for new features
   - Verify keywords trigger context
   - Check false positives

3. **Monitor token usage:**
   - Track average tokens per request
   - Adjust context size if needed
   - Balance accuracy vs. cost

### For Users

1. **Be specific in queries:**
   - "How do I analyze a contract?" (Good)
   - "Tell me about contracts" (Too vague)

2. **Use platform terminology:**
   - Mention feature names
   - Reference specific workflows
   - Ask about actual capabilities

3. **Provide context in follow-ups:**
   - Reference previous answers
   - Build on conversation
   - Clarify when needed

## Future Enhancements

### Potential Improvements

1. **Vector Search:**
   - Use embeddings for semantic search
   - Better section matching
   - More accurate context extraction

2. **Multi-Document Support:**
   - Include API documentation
   - Reference code examples
   - Link to external resources

3. **Dynamic Context:**
   - Load user-specific settings
   - Include organization policies
   - Personalize responses

4. **Analytics:**
   - Track context usage
   - Measure response accuracy
   - Identify documentation gaps

5. **Feedback Loop:**
   - Learn from user corrections
   - Improve keyword detection
   - Refine context extraction

## Troubleshooting

### Issue: Context not being injected
**Symptoms:** AI gives generic answers about platform features  
**Solutions:**
- Check `docs/platform.md` exists
- Verify keywords in query
- Check logs for "Query strategy"
- Test with explicit platform terms

### Issue: Responses too generic
**Symptoms:** AI doesn't use platform-specific information  
**Solutions:**
- Add more keywords to detection
- Increase context size limit
- Improve platform.md content
- Use more specific queries

### Issue: Token limit exceeded
**Symptoms:** Responses cut off or errors  
**Solutions:**
- Reduce context size limit
- Limit conversation history
- Use shorter queries
- Reduce max_tokens parameter

### Issue: Slow responses
**Symptoms:** Long wait times for answers  
**Solutions:**
- Use faster model (gpt-4o-mini)
- Reduce context size
- Limit conversation history
- Check Portkey API status

## Summary

The Platform Context System provides a RAG-like implementation that:
- ✅ Detects platform-related queries automatically
- ✅ Injects relevant documentation as context
- ✅ Reduces AI hallucinations about platform features
- ✅ Maintains general knowledge for non-platform queries
- ✅ Optimizes token usage with smart extraction
- ✅ Easy to maintain (single source of truth)

This ensures users get accurate, contextual answers about Poligap while maintaining the AI's ability to answer general questions.
