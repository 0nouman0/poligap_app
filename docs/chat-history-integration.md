# Chat History MongoDB Integration

This document outlines the complete chat history system implementation for the Poligap platform, including MongoDB schema, API endpoints, and usage examples.

## Overview

The chat history system automatically saves all chat conversations and messages to MongoDB, providing persistent storage and retrieval capabilities for user conversations.

## Database Schema

### AgentConversation Model (Existing)
```typescript
interface IAgentConversation {
  chatName: string;
  companyId: mongoose.Types.ObjectId;
  enterpriseUserId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  summary: string;
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatMessage Model (Enhanced)
```typescript
interface IChatMessage {
  conversationId: mongoose.Types.ObjectId;
  messageId: string;
  userQuery: string;
  aiResponse?: string;
  messageType: "user" | "ai";
  toolCalls?: any[];
  extraData?: {
    reasoning_steps?: any[];
    references?: any[];
  };
  images?: string[];
  videos?: string[];
  audio?: any;
  responseAudio?: any;
  streamingError?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### 1. Save Single Message
**POST** `/api/chat-history/save-message`

```json
{
  "conversationId": "string",
  "messageId": "string",
  "userQuery": "string",
  "aiResponse": "string (optional)",
  "messageType": "user | ai",
  "toolCalls": "array (optional)",
  "extraData": "object (optional)",
  "images": "array (optional)",
  "videos": "array (optional)",
  "audio": "object (optional)",
  "responseAudio": "object (optional)",
  "streamingError": "boolean (optional)"
}
```

### 2. Save Multiple Messages (Batch)
**POST** `/api/chat-history/save-batch`

```json
{
  "conversationId": "string",
  "messages": [
    {
      "messageId": "string",
      "userQuery": "string",
      "messageType": "user | ai",
      // ... other message fields
    }
  ]
}
```

### 3. Retrieve Messages
**GET** `/api/chat-history/get-messages`

Query Parameters:
- `conversationId` - Get messages for specific conversation
- `userId` - Get conversations for user (when no conversationId)
- `companyId` - Filter by company (optional)
- `limit` - Number of items to return (default: 50)
- `offset` - Pagination offset (default: 0)

### 4. Delete Conversation/Message
**DELETE** `/api/chat-history/get-messages`

Query Parameters:
- `conversationId` - Delete entire conversation
- `messageId` - Delete specific message
- `userId` - Required for authorization

## Usage Examples

### 1. Using the React Hook

```typescript
import { useChatHistory } from '@/lib/hooks/useChatHistory';

function ChatComponent() {
  const {
    isLoading,
    error,
    saveMessage,
    saveMessagesBatch,
    loadMessages,
    loadChatHistory,
    deleteConversation,
    clearError
  } = useChatHistory();

  // Save a single message
  const handleSaveMessage = async (message: PlaygroundChatMessage) => {
    const success = await saveMessage(message, conversationId);
    if (success) {
      console.log('Message saved successfully');
    }
  };

  // Load conversation history
  const handleLoadHistory = async () => {
    const result = await loadChatHistory(userId, companyId);
    if (result) {
      console.log('Loaded conversations:', result.conversations);
    }
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {/* Your chat UI */}
    </div>
  );
}
```

### 2. Using Utility Functions

```typescript
import {
  saveChatMessage,
  saveChatMessagesBatch,
  getChatMessages,
  getChatHistory
} from '@/lib/utils/chatHistory';

// Save single message
const result = await saveChatMessage(message, conversationId);

// Save multiple messages
const batchResult = await saveChatMessagesBatch(messages, conversationId);

// Get messages for conversation
const messagesResult = await getChatMessages(conversationId);

// Get user's chat history
const historyResult = await getChatHistory(userId, companyId);
```

### 3. Using Enhanced Chat Store

```typescript
import useGlobalChatStore from '@/app/(app)/chat/store/global-chat-store';

function ChatPage() {
  const {
    messages,
    setMessagesWithAutoSave,
    saveAllMessagesToHistory,
    selectedConversation
  } = useGlobalChatStore();

  // Auto-save when adding new message
  const addMessage = (newMessage: PlaygroundChatMessage) => {
    setMessagesWithAutoSave(
      [...messages, newMessage],
      selectedConversation._id
    );
  };

  // Batch save all messages
  const saveAllMessages = async () => {
    const result = await saveAllMessagesToHistory(selectedConversation._id);
    console.log(`Saved ${result.savedCount} messages`);
  };
}
```

## Features

### 1. Automatic Message Saving
- Messages are automatically saved when using `setMessagesWithAutoSave`
- Prevents data loss during conversations
- Handles both user queries and AI responses

### 2. Batch Operations
- Efficient bulk saving of multiple messages
- Partial success handling (some messages saved, others failed)
- Detailed error reporting for failed operations

### 3. Conversation Management
- Soft delete for conversations (status: 'deleted')
- Automatic conversation timestamp updates
- User and company-based access control

### 4. Error Handling
- Graceful degradation when MongoDB is unavailable
- Detailed error messages and logging
- Non-blocking auto-save (UI continues working)

### 5. Performance Optimizations
- Database indexing on conversationId and createdAt
- Pagination support for large conversation histories
- Efficient querying with proper MongoDB aggregations

## Security & Access Control

### 1. User Authorization
- All operations require valid userId
- Users can only access their own conversations
- Company-based filtering for multi-tenant support

### 2. Data Validation
- Required field validation on all API endpoints
- Message type validation (user/ai)
- Conversation existence checks before saving messages

### 3. Error Handling
- Sensitive information not exposed in error messages
- Proper HTTP status codes for different scenarios
- Comprehensive logging for debugging

## Migration & Deployment

### 1. Database Setup
The ChatMessage model will be automatically created when first accessed. Ensure your MongoDB connection is properly configured in `/src/lib/db.ts`.

### 2. Existing Data
If you have existing chat data, you can migrate it using the batch save API:

```typescript
// Migration script example
const migrateExistingChats = async () => {
  const existingChats = await getExistingChatData();
  
  for (const chat of existingChats) {
    const messages = convertToNewFormat(chat.messages);
    await saveChatMessagesBatch(messages, chat.conversationId);
  }
};
```

### 3. Environment Configuration
No additional environment variables are required. The system uses the existing MongoDB connection configured for the enterprise database.

## Monitoring & Maintenance

### 1. Performance Monitoring
- Monitor API response times for chat history endpoints
- Track MongoDB query performance
- Monitor storage usage for chat messages

### 2. Data Retention
Consider implementing data retention policies:
- Archive old conversations after a certain period
- Compress or summarize very old message data
- Implement cleanup jobs for deleted conversations

### 3. Backup Strategy
- Include chat messages in regular MongoDB backups
- Consider separate backup strategy for high-volume chat data
- Test restoration procedures regularly

## Troubleshooting

### Common Issues

1. **Messages not saving**
   - Check MongoDB connection
   - Verify conversationId exists
   - Check browser console for errors

2. **Performance issues**
   - Review database indexes
   - Consider pagination limits
   - Monitor query performance

3. **Access denied errors**
   - Verify userId is correct
   - Check conversation ownership
   - Ensure proper authentication

### Debug Mode
Enable detailed logging by setting `DEBUG=true` in your environment or adding console logs to the API endpoints.

## Future Enhancements

1. **Real-time Sync**: WebSocket integration for real-time message synchronization
2. **Search**: Full-text search across chat history
3. **Analytics**: Conversation analytics and insights
4. **Export**: Export conversations to various formats
5. **Encryption**: End-to-end encryption for sensitive conversations
