# OpenAI Assistants API Integration Guide

## 🎯 Overview

This application now uses **OpenAI's native Assistants API** with proper SSE (Server-Sent Events) streaming, matching the `enterprise-search-frontend` pattern.

**Date:** January 22, 2025  
**Status:** ✅ **PRODUCTION READY**

---

## 📊 Streaming Format

### SSE Event Format (Compatible with enterprise-search-frontend)

```
event: run.started
data: {"event":"run.started","content":"","created_at":1705939200000}

event: message.delta
data: {"event":"message.delta","content":"Hello","full_content":"Hello","created_at":1705939201000}

event: message.delta
data: {"event":"message.delta","content":" world","full_content":"Hello world","created_at":1705939202000}

event: message.completed
data: {"event":"message.completed","content":"Hello world","message_id":"msg_abc123","created_at":1705939203000}

event: run.completed
data: {"event":"run.completed","run_id":"run_xyz789","status":"completed","content":"Hello world","metrics":{...},"created_at":1705939204000}
```

---

## 🏗️ Architecture

### File Structure
```
src/
├── lib/
│   ├── openai-assistant.ts        ← NEW: OpenAI Assistants client
│   └── ai-client.ts               ← Existing: Portkey client
└── app/api/
    └── openai-assistant/
        └── stream/
            └── route.ts           ← NEW: SSE streaming endpoint
```

### Why OpenAI Assistants?

| Feature | Direct API | Assistants API |
|---------|------------|----------------|
| **Streaming** | Manual chunks | Built-in SSE events |
| **Tools** | Manual function calling | Automatic tool execution |
| **Context** | Manual thread management | Automatic message history |
| **Files** | Separate file handling | Built-in file attachments |
| **Code Interpreter** | Not available | ✅ Built-in |
| **File Search** | Manual RAG | ✅ Built-in vector search |

---

## 🚀 Quick Start

### 1. Create an Assistant

```typescript
// GET /api/openai-assistant/stream?action=create&name=My Assistant

const response = await fetch('/api/openai-assistant/stream?action=create&name=ComplianceBot&instructions=You are a compliance expert');
const { assistant_id } = await response.json();
// Store this assistant_id for future use
```

### 2. Create a Thread (Conversation)

```typescript
// GET /api/openai-assistant/stream?action=thread

const response = await fetch('/api/openai-assistant/stream?action=thread');
const { thread_id } = await response.json();
// Store this thread_id for the conversation
```

### 3. Stream a Response

```typescript
// POST /api/openai-assistant/stream

const response = await fetch('/api/openai-assistant/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_query: "What are GDPR requirements?",
    thread_id: "thread_abc123",      // From step 2
    assistant_id: "asst_xyz789",     // From step 1
    additional_instructions: "Focus on EU regulations"
  })
});

// Handle SSE stream (see examples below)
```

---

## 💻 Frontend Integration

### Using the Existing `useAIResponseStream` Hook

Your existing hook from enterprise-search-frontend **already supports** this SSE format!

```typescript
import useAIResponseStream from "@/app/(app)/chat/hooks/useAIResponseStream";

const { streamResponse } = useAIResponseStream();

await streamResponse({
  apiUrl: '/api/openai-assistant/stream',
  requestBody: {
    user_query: "Your question here",
    thread_id: threadId,
    assistant_id: assistantId,
  },
  onChunk: (chunk) => {
    console.log('Event:', chunk.event);
    
    if (chunk.event === 'message.delta') {
      // Append delta content to UI
      setText(prev => prev + chunk.content);
    } else if (chunk.event === 'run.completed') {
      // Finalize message
      console.log('Final:', chunk.content);
      console.log('Metrics:', chunk.metrics);
    } else if (chunk.event === 'tool.started') {
      // Show tool execution
      console.log('Using tool:', chunk.tool_name);
    }
  },
  onError: (error) => {
    console.error('Stream error:', error);
  },
  onComplete: () => {
    console.log('Stream completed');
  }
});
```

---

## 📦 Features

### 1. Code Interpreter

```typescript
// Enable in assistant creation
const assistant = await assistantClient.createAssistant({
  name: "Data Analyst",
  tools: [
    { type: "code_interpreter" }  // ✅ Executes Python code
  ]
});

// Use it
await fetch('/api/openai-assistant/stream', {
  method: 'POST',
  body: JSON.stringify({
    user_query: "Analyze this data: [1,2,3,4,5] and create a chart",
    thread_id,
    assistant_id
  })
});

// Stream events:
// event: tool.started
// data: {"tool_name":"code_interpreter",...}
//
// event: tool.delta  
// data: {"content":"import matplotlib...",...}
//
// event: tool.completed
// data: {"result":"Chart saved to...",...}
```

### 2. File Search (RAG)

```typescript
// Enable in assistant creation
const assistant = await assistantClient.createAssistant({
  name: "Document Expert",
  tools: [
    { type: "file_search" }  // ✅ Built-in vector search
  ]
});

// Upload files
const file = await assistantClient.uploadFile(fileBuffer, "policy.pdf");

// Use in chat
await fetch('/api/openai-assistant/stream', {
  method: 'POST',
  body: JSON.stringify({
    user_query: "What does the policy say about data retention?",
    thread_id,
    assistant_id,
    file_ids: [file.id]  // Attach files
  })
});
```

### 3. Multimodal (Images)

```typescript
// Assistants API supports vision automatically
await fetch('/api/openai-assistant/stream', {
  method: 'POST',
  body: JSON.stringify({
    user_query: "What's in this image? [image_url]",
    thread_id,
    assistant_id
  })
});
```

---

## 🔧 Direct Library Usage

### Import and Use

```typescript
import { getAssistantClient } from "@/lib/openai-assistant";

const client = getAssistantClient();

// Create assistant
const assistant = await client.createAssistant({
  name: "Helper",
  instructions: "You help with tasks",
  model: "gpt-4o",
  tools: [
    { type: "code_interpreter" },
    { type: "file_search" }
  ]
});

// Create thread
const thread = await client.createThread();

// Add message
await client.addMessage(thread.id, "Hello!");

// Stream response
const stream = await client.createStreamingRun(
  thread.id,
  assistant.id
);

// stream is a ReadableStream in SSE format
```

---

## 📋 Event Types

| Event | Description | Data Fields |
|-------|-------------|-------------|
| `run.started` | Run begins | `event`, `content`, `created_at` |
| `message.delta` | Text chunk | `event`, `content`, `full_content`, `created_at` |
| `message.completed` | Message done | `event`, `content`, `message_id`, `created_at` |
| `run.completed` | Run finished | `event`, `run_id`, `status`, `content`, `metrics`, `created_at` |
| `tool.started` | Tool execution begins | `event`, `tool_call_id`, `tool_name`, `tool_args` |
| `tool.delta` | Tool progress | `event`, `tool_call_id`, `content` |
| `tool.completed` | Tool finished | `event`, `tool_call_id`, `result` |
| `error` | Error occurred | `event`, `error` |

---

## 🎯 Migration from Portkey

### Side-by-Side Comparison

#### Portkey (Multi-provider routing)
```typescript
import { getAIClient } from "@/lib/ai-client";

const aiClient = getAIClient();
const response = await aiClient.createChatCompletion(messages, {
  taskType: "chat",
  strategy: "balanced"
});
```

#### OpenAI Assistants (Advanced features)
```typescript
import { getAssistantClient } from "@/lib/openai-assistant";

const client = getAssistantClient();
const stream = await client.createStreamingRun(threadId, assistantId);
```

### When to Use Which?

| Use Case | Recommended |
|----------|-------------|
| Simple chat | Portkey (`ai-client.ts`) |
| Multi-provider | Portkey |
| Cost optimization | Portkey |
| Code execution | **OpenAI Assistants** |
| File search/RAG | **OpenAI Assistants** |
| Complex agents | **OpenAI Assistants** |
| Long conversations | **OpenAI Assistants** (threads) |

---

## 🧪 Testing

### Test Assistant Creation

```bash
curl "http://localhost:3000/api/openai-assistant/stream?action=create&name=TestBot"
```

### Test Thread Creation

```bash
curl "http://localhost:3000/api/openai-assistant/stream?action=thread"
```

### Test Streaming

```bash
curl -N -X POST http://localhost:3000/api/openai-assistant/stream \
  -H "Content-Type: application/json" \
  -d '{
    "user_query": "Hello, how are you?",
    "thread_id": "thread_xyz",
    "assistant_id": "asst_abc"
  }'
```

---

## 🚨 Troubleshooting

### Issue: "Assistant ID is required"
**Solution:** Create an assistant first via GET endpoint with `action=create`

### Issue: Streaming not working
**Solution:** 
1. Check that you're not buffering the response
2. Verify `Content-Type: text/event-stream` header
3. Use `-N` flag with curl for testing

### Issue: Thread not found
**Solution:** Create a new thread via GET endpoint with `action=thread`

---

## 📚 Resources

- [OpenAI Assistants API Docs](https://platform.openai.com/docs/assistants/overview)
- [Streaming Guide](https://platform.openai.com/docs/assistants/tools/streaming)
- [File Search](https://platform.openai.com/docs/assistants/tools/file-search)
- [Code Interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter)

---

## 🔮 Next Steps

1. **Store assistant/thread IDs** in Supabase
2. **Add file upload** endpoint
3. **Implement tool functions** (custom functions)
4. **Add message history** UI
5. **Monitor usage** via OpenAI dashboard

---

**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Compatible with:** enterprise-search-frontend SSE format
