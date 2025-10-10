import { PlaygroundChatMessage } from '@/types/agent';

export interface ChatHistoryMessage {
  conversationId: string;
  messageId: string;
  userQuery: string;
  aiResponse?: string;
  messageType: 'user' | 'ai';
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
}

/**
 * Convert PlaygroundChatMessage to ChatHistoryMessage format for MongoDB storage
 */
export function convertToHistoryMessage(
  message: PlaygroundChatMessage,
  conversationId: string
): ChatHistoryMessage {
  return {
    conversationId,
    messageId: message.id,
    userQuery: message.user_query,
    aiResponse: message.content,
    messageType: message.content ? 'ai' : 'user', // If has content, it's AI response
    toolCalls: message.tool_calls || [],
    extraData: message.extra_data || {},
    images: message.images?.map(img => (img as any).url || (img as any).base64 || '') || [],
    videos: message.videos?.map(vid => vid.url || '') || [],
    audio: message.audio,
    responseAudio: message.response_audio,
    streamingError: message.streamingError || false,
  };
}

/**
 * Convert ChatHistoryMessage back to PlaygroundChatMessage format
 */
export function convertFromHistoryMessage(historyMessage: any): PlaygroundChatMessage {
  return {
    id: historyMessage.messageId,
    user_query: historyMessage.userQuery,
    conversation_id: historyMessage.conversationId,
    content: historyMessage.aiResponse,
    created_at: new Date(historyMessage.createdAt).getTime(),
    tool_calls: historyMessage.toolCalls || [],
    extra_data: historyMessage.extraData || {},
    images: historyMessage.images?.map((url: string) => ({ url })) || [],
    videos: historyMessage.videos?.map((url: string) => ({ url })) || [],
    audio: historyMessage.audio,
    response_audio: historyMessage.responseAudio,
    streamingError: historyMessage.streamingError || false,
  };
}

/**
 * Save a single chat message to Supabase
 */
export async function saveChatMessage(
  message: PlaygroundChatMessage,
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const historyMessage = convertToHistoryMessage(message, conversationId);
    
    const response = await fetch('/api/ai-chat/save-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: historyMessage.conversationId,
        messageId: historyMessage.messageId,
        user_query: historyMessage.userQuery,
        content: historyMessage.aiResponse,
        messageType: historyMessage.messageType,
        tool_calls: historyMessage.toolCalls,
        extra_data: historyMessage.extraData,
        images: historyMessage.images,
        videos: historyMessage.videos,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to save message');
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Save multiple chat messages to MongoDB in batch
 */
export async function saveChatMessagesBatch(
  messages: PlaygroundChatMessage[],
  conversationId: string
): Promise<{ success: boolean; savedCount: number; errorCount: number; errors?: any[] }> {
  try {
    const historyMessages = messages.map(msg => 
      convertToHistoryMessage(msg, conversationId)
    );
    
    const response = await fetch('/api/chat-history/save-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        messages: historyMessages,
      }),
    });

    const result = await response.json();
    
    if (!response.ok && response.status !== 207) { // 207 = Multi-Status (partial success)
      throw new Error(result.error || 'Failed to save messages');
    }

    return {
      success: result.success,
      savedCount: result.data?.savedCount || 0,
      errorCount: result.data?.errorCount || 0,
      errors: result.data?.errors || [],
    };
  } catch (error) {
    console.error('Error saving chat messages batch:', error);
    return { 
      success: false, 
      savedCount: 0,
      errorCount: messages.length,
      errors: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
    };
  }
}

/**
 * Retrieve chat messages for a conversation
 */
export async function getChatMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ 
  success: boolean; 
  messages?: PlaygroundChatMessage[]; 
  totalMessages?: number;
  hasMore?: boolean;
  error?: string;
}> {
  try {
    const params = new URLSearchParams({
      conversationId,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`/api/ai-chat/get-messages?${params}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to retrieve messages');
    }

    const messages = result.data.messages.map(convertFromHistoryMessage);

    return {
      success: true,
      messages,
      totalMessages: result.data.totalMessages,
      hasMore: result.data.hasMore,
    };
  } catch (error) {
    console.error('Error retrieving chat messages:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get chat history (conversations) for a user
 */
export async function getChatHistory(
  userId: string,
  companyId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ 
  success: boolean; 
  conversations?: any[]; 
  totalConversations?: number;
  hasMore?: boolean;
  error?: string;
}> {
  try {
    const params = new URLSearchParams({
      userId,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (companyId) {
      params.append('companyId', companyId);
    }

    const response = await fetch(`/api/ai-chat/get-conversation-list?${params}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to retrieve chat history');
    }

    return {
      success: true,
      conversations: result.data.conversations,
      totalConversations: result.data.totalConversations,
      hasMore: result.data.hasMore,
    };
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteChatConversation(
  conversationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const params = new URLSearchParams({
      conversationId,
      userId,
    });

    const response = await fetch(`/api/ai-chat/edit-conversation?${params}`, {
      method: 'DELETE',
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete conversation');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
