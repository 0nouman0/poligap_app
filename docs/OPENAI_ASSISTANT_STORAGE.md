# OpenAI Assistant Integration with Persistent Storage

## Overview

The OpenAI Assistant integration now includes full persistent storage of threads, assistants, and conversation history in Supabase. This ensures conversation continuity and allows you to track which assistant and thread is associated with each conversation.

## Database Schema

### New Columns Added to `agent_conversations`

- `openai_thread_id` (TEXT): OpenAI thread ID for conversation context
- `openai_assistant_id` (TEXT): OpenAI assistant ID used for this conversation
- `assistant_metadata` (JSONB): Additional metadata about assistant configuration
- `thread_created_at` (TIMESTAMPTZ): When the OpenAI thread was created

## Usage Examples

### 1. Create a Conversation with OpenAI Assistant

```typescript
import { getAssistantClient } from '@/lib/openai-assistant';
import { createConversationWithAssistant } from '@/lib/utils/chatHistory';

// Create assistant
const assistantClient = getAssistantClient();
const assistant = await assistantClient.createAssistant({
  name: "Compliance Assistant",
  instructions: "You are a helpful compliance assistant...",
  model: "gpt-4o",
});

// Create conversation in database
const { conversation } = await createConversationWithAssistant({
  chatName: "Compliance Review Session",
  userId: currentUserId,
  companyId: currentCompanyId,
  openaiAssistantId: assistant.id,
  assistantMetadata: {
    name: "Compliance Assistant",
    model: "gpt-4o",
    instructions: "You are a helpful compliance assistant...",
  },
});

// Create OpenAI thread and link to conversation
const thread = await assistantClient.createThread({
  conversationId: conversation.id,
  assistantId: assistant.id,
  metadata: { purpose: "compliance_review" },
});

console.log('Conversation created with thread:', thread.id);
```

### 2. Continue an Existing Conversation

```typescript
import { getAssistantClient } from '@/lib/openai-assistant';

const assistantClient = getAssistantClient();

// Fetch conversation from database (includes openai_thread_id)
const conversation = await getConversationById(conversationId);

if (conversation.openai_thread_id) {
  // Add message to existing thread
  await assistantClient.addMessage(
    conversation.openai_thread_id,
    "What are the key compliance requirements?"
  );

  // Stream response
  const stream = await assistantClient.createStreamingRun(
    conversation.openai_thread_id,
    conversation.openai_assistant_id
  );

  // Handle streaming response
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = new TextDecoder().decode(value);
    // Process SSE events: event: message.delta, run.completed, etc.
  }
}
```

### 3. Update Existing Conversation with Thread Info

```typescript
import { updateConversationThread } from '@/lib/utils/chatHistory';

// If you create a thread separately
const thread = await assistantClient.createThread();

// Link it to existing conversation
await updateConversationThread(
  conversationId,
  thread.id,
  assistantId,
  { model: "gpt-4o", purpose: "contract_review" }
);
```

### 4. Retrieve Conversation History with Assistant Info

```typescript
import { getChatHistory } from '@/lib/utils/chatHistory';

const { conversations } = await getChatHistory(userId);

conversations.forEach(conv => {
  console.log('Chat:', conv.chat_name);
  console.log('Has OpenAI Thread:', conv.hasOpenAIThread);
  console.log('Has Assistant:', conv.hasAssistant);
  console.log('Thread ID:', conv.openai_thread_id);
  console.log('Assistant ID:', conv.openai_assistant_id);
  console.log('Metadata:', conv.assistant_metadata);
});
```

## GraphQL Queries

### Create Conversation with Assistant

```graphql
mutation CreateConversation(
  $chat_name: String!
  $user_id: UUID!
  $company_id: UUID
  $openai_thread_id: String
  $openai_assistant_id: String
  $assistant_metadata: JSON
) {
  insertIntoagent_conversationsCollection(
    objects: [{
      chat_name: $chat_name
      user_id: $user_id
      company_id: $company_id
      openai_thread_id: $openai_thread_id
      openai_assistant_id: $openai_assistant_id
      assistant_metadata: $assistant_metadata
      thread_created_at: "now()"
      status: "active"
    }]
  ) {
    records {
      id
      chat_name
      openai_thread_id
      openai_assistant_id
      created_at
    }
  }
}
```

### Update Conversation Thread

```graphql
mutation UpdateConversationThread(
  $id: UUID!
  $openai_thread_id: String
  $openai_assistant_id: String
  $assistant_metadata: JSON
) {
  updateagent_conversationsCollection(
    filter: { id: { eq: $id } }
    set: {
      openai_thread_id: $openai_thread_id
      openai_assistant_id: $openai_assistant_id
      assistant_metadata: $assistant_metadata
      thread_created_at: "now()"
      updated_at: "now()"
    }
  ) {
    records {
      id
      openai_thread_id
      openai_assistant_id
      updated_at
    }
  }
}
```

## Best Practices

1. **Always persist thread IDs**: Store OpenAI thread IDs in the database immediately after creation to ensure conversation continuity.

2. **Use assistant metadata**: Store assistant configuration (model, instructions, tools) in `assistant_metadata` for auditing and debugging.

3. **Handle errors gracefully**: The client won't throw errors if database persistence fails - the OpenAI thread/assistant is still created successfully.

4. **Check for existing threads**: Before creating a new thread, check if the conversation already has an `openai_thread_id` to avoid duplicate threads.

5. **Track thread lifecycle**: Use `thread_created_at` to monitor thread age and implement cleanup policies.

## Migration Applied

The following migration was applied to your database:

```sql
-- Add OpenAI Assistant tracking fields
ALTER TABLE agent_conversations 
ADD COLUMN IF NOT EXISTS openai_thread_id TEXT,
ADD COLUMN IF NOT EXISTS openai_assistant_id TEXT,
ADD COLUMN IF NOT EXISTS assistant_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS thread_created_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_conversations_openai_thread 
ON agent_conversations(openai_thread_id) WHERE openai_thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_conversations_openai_assistant 
ON agent_conversations(openai_assistant_id) WHERE openai_assistant_id IS NOT NULL;
```

## What Was Changed

1. **Database Schema** (`agent_conversations` table)
   - ✅ Added 4 new columns for OpenAI Assistant tracking
   - ✅ Added indexes for fast lookups

2. **TypeScript Types** (`src/types/supabase.ts`)
   - ✅ Updated Row, Insert, and Update types with new fields

3. **GraphQL Queries** (`src/lib/supabase/graphql.ts`)
   - ✅ Updated `getConversations` to return OpenAI fields
   - ✅ Updated `createConversation` to accept OpenAI parameters
   - ✅ Added new `updateConversationThread` mutation

4. **OpenAI Client** (`src/lib/openai-assistant.ts`)
   - ✅ Enhanced `createThread()` to persist to database
   - ✅ Enhanced `createAssistant()` to persist to database
   - ✅ Added automatic database updates when conversation ID is provided

5. **Utility Functions** (`src/lib/utils/chatHistory.ts`)
   - ✅ Updated `getChatHistory()` to include OpenAI status flags
   - ✅ Added `createConversationWithAssistant()` helper
   - ✅ Added `updateConversationThread()` helper

## Backwards Compatibility

All changes are **fully backwards compatible**:
- Existing conversations without OpenAI threads continue to work
- New columns are nullable and optional
- No breaking changes to existing APIs
- Old code continues to function normally

## Testing

To test the integration:

```typescript
// Example test
const assistantClient = getAssistantClient();

// Create assistant with conversation link
const assistant = await assistantClient.createAssistant({
  name: "Test Assistant",
  conversationId: "existing-conversation-id",
});

// Create thread with conversation link
const thread = await assistantClient.createThread({
  conversationId: "existing-conversation-id",
  assistantId: assistant.id,
});

// Verify in database
const conversations = await getChatHistory(userId);
const conv = conversations.find(c => c.openai_thread_id === thread.id);
console.assert(conv !== undefined, "Thread was persisted!");
```

## Support

For issues or questions about the OpenAI Assistant integration:
1. Check the console for error messages
2. Verify Supabase connection and permissions
3. Ensure OpenAI API key is configured
4. Review GraphQL query responses for detailed error info
