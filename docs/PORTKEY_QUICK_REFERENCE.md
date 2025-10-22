# ⚡ Portkey AI - Quick Reference Card

## 🚀 Import & Initialize

```typescript
import { getAIClient } from "@/lib/ai-client";

const aiClient = getAIClient();
```

---

## 💬 Chat (Non-streaming)

```typescript
const response = await aiClient.createChatCompletion(
  [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Your question here" }
  ],
  {
    taskType: "chat",
    strategy: "balanced",
    temperature: 0.7,
    maxTokens: 2000
  }
);

const text = response.choices[0].message.content;
```

---

## 🌊 Chat (Streaming)

```typescript
const stream = await aiClient.createStreamingCompletion(messages, {
  taskType: "chat",
  temperature: 0.7,
  maxTokens: 2000
});

const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Process chunk
}
```

---

## 🤖 Agent Task

```typescript
const response = await aiClient.createChatCompletion(
  [
    { role: "system", content: "Agent system prompt" },
    { role: "user", content: "Agent task" }
  ],
  {
    taskType: "agent",      // Uses GPT-4o
    strategy: "performance", // Best quality
    temperature: 0.2,        // Factual
    maxTokens: 4000
  }
);
```

---

## 📊 Usage Stats

```typescript
const stats = aiClient.getUsageStats();

console.log(stats);
/*
{
  totalRequests: 47,
  totalTokens: 125430,
  avgLatency: 1247,
  providerBreakdown: {
    "groq-prod-cfefa4": 30,
    "temp-openai-pro-f51bf0": 15
  }
}
*/
```

---

## 🎛️ Task Types

| Type | Provider | Model | Use Case |
|------|----------|-------|----------|
| `"chat"` | Groq | Llama 3.3 70B | Fast conversations |
| `"agent"` | OpenAI | GPT-4o | Complex reasoning |
| `"analysis"` | AWS | Claude 3.5 | Data processing |
| `"generation"` | OpenRouter | Claude 3.5 | Content creation |

---

## 🎯 Strategies

| Strategy | Behavior |
|----------|----------|
| `"balanced"` | Auto-select based on task type (default) |
| `"cost-optimized"` | Always use Groq (cheapest) |
| `"performance"` | Always use OpenAI (best quality) |

---

## 🔄 Failover Chain

```
Primary Provider → OpenAI → Groq → Error
```

---

## 🌡️ Temperature Guide

| Value | Use Case |
|-------|----------|
| `0.2` | Factual, structured output |
| `0.7` | Balanced (default) |
| `0.8` | Creative content |

---

## 🛣️ API Routes

### Chat Streaming
```
POST /api/ai-chat/stream-chat
Body: { user_query, session_id?, max_tokens?, temperature? }
```

### Compliance Agent
```
POST /api/compliance-agent
Body: { action, data, stream? }
```

### Copyright Detector
```
POST /api/copyright-detector
Body: { action, data, stream? }
```

---

## 🔑 Virtual Keys

```typescript
PORTKEY_VIRTUAL_KEYS = {
  OPENAI: "temp-openai-pro-f51bf0",
  AWS: "aws-prod-2095a3",
  GROQ: "groq-prod-cfefa4",
  OPENROUTER: "openrouter-prod-555c0a"
}
```

---

## 🐛 Debugging

### Check Logs
```
🔄 Attempting AI request with provider: groq-prod-cfefa4
✅ AI request successful with groq-prod-cfefa4 (847ms)
📊 Usage: groq-prod-cfefa4 | 1247 tokens | 847ms
```

### Error Messages
```
"All AI providers failed. Last error: [details]"
```

---

## 🪝 Frontend Hook (useUserId)

```typescript
import { useUserIdWithLoading } from "@/hooks/useUserId";

const { userId, isLoading } = useUserIdWithLoading();

if (isLoading) return <LoadingSpinner />;
```

---

## 📚 Full Documentation

See: `docs/guides/PORTKEY_AI_INTEGRATION.md`

---

**Version:** 2.0.0  
**Status:** Production Ready ✅
