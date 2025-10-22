# Portkey AI Integration - Complete Implementation Guide

## 🎯 Overview

The application now uses **Portkey** as a unified AI gateway with intelligent routing, automatic failover, and multi-provider support.

**Completed on:** January 22, 2025  
**Status:** ✅ Production Ready

---

## 📊 What Changed

### Before (Problems)
- ❌ Direct API calls to Gemini and OpenAI
- ❌ No failover mechanism
- ❌ Hardcoded provider selection
- ❌ No usage tracking
- ❌ No cost optimization
- ❌ Virtual keys unused

### After (Solutions)
- ✅ Unified AI client via Portkey
- ✅ Automatic failover on errors
- ✅ Intelligent provider routing
- ✅ Real-time usage tracking
- ✅ Cost-optimized model selection
- ✅ All virtual keys actively used

---

## 🗂️ New Architecture

### File Structure
```
src/
├── lib/
│   ├── ai-client.ts        ← NEW: Unified AI client
│   └── portkey.ts          ← DEPRECATED: Legacy wrapper
├── hooks/
│   └── useUserId.ts        ← NEW: Clean userId management
└── app/api/
    ├── ai-chat/stream-chat/route.ts       ← REFACTORED: Portkey streaming
    ├── compliance-agent/route.ts          ← REFACTORED: Portkey + streaming
    └── copyright-detector/route.ts        ← REFACTORED: Portkey + streaming
```

---

## 🔑 Virtual Keys Configuration

Your Portkey virtual keys (from `.env.local`):

```typescript
export const PORTKEY_VIRTUAL_KEYS = {
  OPENAI: "temp-openai-pro-f51bf0",      // GPT-4o, GPT-4o-mini
  AWS: "aws-prod-2095a3",                // Claude 3.5 Sonnet (Bedrock)
  GROQ: "groq-prod-cfefa4",              // Llama 3.3 70B
  OPENROUTER: "openrouter-prod-555c0a",  // Multi-model access
};
```

### Provider Routing Strategy

| Task Type | Primary Provider | Model | Reason |
|-----------|-----------------|-------|---------|
| **Chat** | GROQ | llama-3.3-70b-versatile | Fast & cost-effective |
| **Agent** | OPENAI | gpt-4o | Best reasoning quality |
| **Analysis** | AWS | claude-3-5-sonnet | Enterprise workloads |
| **Generation** | OPENROUTER | claude-3.5-sonnet | Diverse model access |

### Failover Chain
```
Primary → OpenAI → Groq → (Error thrown)
```

---

## 🚀 Usage Examples

### 1. Chat Streaming (Frontend)

```typescript
// In your component
const response = await fetch('/api/ai-chat/stream-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_query: "Explain quantum computing",
    session_id: "conv_123",
    max_tokens: 2000,
    temperature: 0.7
  })
});

// Handle SSE stream
const reader = response.body.getReader();
// ... streaming logic
```

**What happens:**
1. Request hits API route
2. AI client selects **Groq** (fast chat)
3. Streams via Portkey with failover
4. Returns SSE format for frontend

### 2. Agent Tasks (Non-streaming)

```typescript
// Compliance check
const response = await fetch('/api/compliance-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: "Fetch new regulatory changes in EU and US for data protection",
    data: {
      jurisdictions: ["EU", "US"],
      topics: ["data_protection"],
      since_timestamp: "2025-01-01T00:00:00Z"
    },
    stream: false  // Set to true for streaming
  })
});

const result = await response.json();
// { plan: {...}, content: "...", usage: {...}, provider: "portkey" }
```

**What happens:**
1. Request hits agent API
2. AI client selects **OpenAI GPT-4o** (best reasoning)
3. Returns structured JSON plan
4. Tracks token usage

### 3. Agent Streaming (Real-time)

```typescript
// Same as above, but with stream: true
const response = await fetch('/api/compliance-agent', {
  method: 'POST',
  body: JSON.stringify({
    action: "...",
    data: {...},
    stream: true  // Enable streaming
  })
});

// Handle SSE events
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // Parse: {"event": "AgentThinking", "content": "..."}
  // Or: {"event": "AgentCompleted", "plan": {...}}
}
```

---

## 💡 Direct Integration (Backend)

### Import and Use

```typescript
import { getAIClient } from "@/lib/ai-client";

const aiClient = getAIClient();

// Non-streaming completion
const response = await aiClient.createChatCompletion(
  [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "What is AI?" }
  ],
  {
    taskType: "chat",        // or "agent", "analysis", "generation"
    strategy: "balanced",    // or "cost-optimized", "performance"
    temperature: 0.7,
    maxTokens: 2000
  }
);

const content = response.choices[0].message.content;
```

### Streaming

```typescript
const stream = await aiClient.createStreamingCompletion(
  messages,
  {
    taskType: "agent",
    strategy: "performance",  // Use best model
    temperature: 0.2,
    maxTokens: 4000
  }
);

// Process stream
const reader = stream.getReader();
// ... handle chunks
```

---

## 📈 Usage Tracking

### View Statistics

```typescript
import { getAIClient } from "@/lib/ai-client";

const aiClient = getAIClient();
const stats = aiClient.getUsageStats();

console.log(stats);
/* Output:
{
  totalRequests: 47,
  totalTokens: 125430,
  avgLatency: 1247,
  providerBreakdown: {
    "groq-prod-cfefa4": 30,
    "temp-openai-pro-f51bf0": 15,
    "aws-prod-2095a3": 2
  }
}
*/
```

**Metrics tracked:**
- Request count per provider
- Total tokens used
- Average latency
- Provider distribution

---

## 🛠️ Configuration Options

### Task Types
- `"chat"` - Conversational AI (fast)
- `"agent"` - Complex reasoning (quality)
- `"analysis"` - Data processing (enterprise)
- `"generation"` - Content creation (diverse)

### Strategies
- `"cost-optimized"` - Always use Groq (cheapest)
- `"performance"` - Always use OpenAI (best quality)
- `"balanced"` - Auto-route based on task type (default)

### Override Examples

```typescript
// Force OpenAI for all requests
const response = await aiClient.createChatCompletion(messages, {
  taskType: "chat",
  strategy: "performance",  // Forces OpenAI
  temperature: 0.8
});

// Use cheapest option
const response = await aiClient.createChatCompletion(messages, {
  taskType: "chat",
  strategy: "cost-optimized",  // Forces Groq
  maxTokens: 500
});
```

---

## 🔍 Debugging

### Enable Logging

All AI requests log to console:
```
🔄 Attempting AI request with provider: groq-prod-cfefa4
✅ AI request successful with groq-prod-cfefa4 (847ms)
📊 Usage: groq-prod-cfefa4 | 1247 tokens | 847ms
```

### Error Handling

```typescript
try {
  const response = await aiClient.createChatCompletion(messages, config);
} catch (error) {
  // Error after all providers fail
  console.error(error.message);
  // "All AI providers failed. Last error: Rate limit exceeded"
}
```

### Failover Flow

```
1. Try Primary (e.g., Groq)
   ↓ Failed
2. Try OpenAI
   ↓ Failed
3. Try Groq (if not already tried)
   ↓ Failed
4. Throw error
```

---

## 🧪 Testing

### Test Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/ai-chat/stream-chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_query": "Hello, test message",
    "max_tokens": 100
  }'
```

### Test Agent Endpoint

```bash
curl -X POST http://localhost:3000/api/compliance-agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Test compliance check",
    "data": {"test": true}
  }'
```

---

## 📋 Migration Checklist

- [x] Created unified AI client (`lib/ai-client.ts`)
- [x] Refactored chat API to use Portkey
- [x] Refactored compliance agent with streaming
- [x] Refactored copyright detector with streaming  
- [x] Created `useUserId` hook
- [x] Simplified chat frontend
- [x] Deprecated old `portkey.ts`
- [x] Tested build (successful)
- [x] All virtual keys in use
- [x] Usage tracking implemented
- [x] Automatic failover working

---

## 🎓 Best Practices

### 1. Always Use Task Types
```typescript
// ✅ Good
aiClient.createChatCompletion(messages, { taskType: "chat" });

// ❌ Bad - defaults to "chat" but unclear intent
aiClient.createChatCompletion(messages, {});
```

### 2. Set Appropriate Temperature
```typescript
// For factual/structured output
{ temperature: 0.2 }

// For creative content
{ temperature: 0.8 }

// For balanced responses
{ temperature: 0.7 }  // Default
```

### 3. Handle Streaming Properly
```typescript
// Always check for completion
if (event === "AgentCompleted") {
  // Finalize UI, parse JSON plan
} else if (event === "AgentThinking") {
  // Show progress
}
```

### 4. Monitor Usage
```typescript
// Log stats periodically
setInterval(() => {
  console.log(aiClient.getUsageStats());
}, 60000); // Every minute
```

---

## 🚨 Troubleshooting

### Issue: "All AI providers failed"
**Solution:** Check:
1. `PORTKEY_API_KEY` in `.env.local`
2. Virtual keys are valid
3. Network connectivity
4. Portkey dashboard for rate limits

### Issue: Streaming not working
**Solution:**
1. Ensure `stream: true` in request body
2. Check SSE parsing logic
3. Verify content-type header
4. Test with `curl --no-buffer`

### Issue: Wrong provider selected
**Solution:**
1. Check `strategy` parameter
2. Verify `taskType` is correct
3. Review routing logic in `ai-client.ts`

---

## 📞 Support

For issues or questions:
1. Check logs in browser console
2. Review Portkey dashboard
3. See usage stats with `getUsageStats()`
4. Test endpoints with curl

---

## 🔮 Future Enhancements

- [ ] Add cost calculation per request
- [ ] Implement request caching
- [ ] Add retry with exponential backoff
- [ ] Create admin dashboard for usage stats
- [ ] Add custom model override per request
- [ ] Implement prompt templates
- [ ] Add A/B testing for models

---

**Last Updated:** January 22, 2025  
**Version:** 2.0.0  
**Status:** Production Ready ✅
