import { PlaygroundChatMessage } from '@/types/agent';
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

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

async function getAccessToken(): Promise<string | undefined> {
  try {
    const supabase = createSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
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
    const accessToken = await getAccessToken();
    const gql = createGraphQLClient(accessToken);

    await gql.request(queries.createMessage, {
      conversation_id: historyMessage.conversationId,
      message_id: historyMessage.messageId,
      user_query: historyMessage.userQuery,
      ai_response: historyMessage.aiResponse,
      message_type: historyMessage.messageType,
      tool_calls: historyMessage.toolCalls,
      extra_data: historyMessage.extraData,
      images: historyMessage.images,
      videos: historyMessage.videos,
    });

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
    const accessToken = await getAccessToken();
    const gql = createGraphQLClient(accessToken);
    let savedCount = 0;
    const errors: any[] = [];

    await Promise.all(
      messages.map(async (msg) => {
        try {
          const h = convertToHistoryMessage(msg, conversationId);
          await gql.request(queries.createMessage, {
            conversation_id: h.conversationId,
            message_id: h.messageId,
            user_query: h.userQuery,
            ai_response: h.aiResponse,
            message_type: h.messageType,
            tool_calls: h.toolCalls,
            extra_data: h.extraData,
            images: h.images,
            videos: h.videos,
          });
          savedCount += 1;
        } catch (e) {
          errors.push({ messageId: msg.id, error: e instanceof Error ? e.message : e });
        }
      })
    );

    return {
      success: errors.length === 0,
      savedCount,
      errorCount: errors.length,
      errors,
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
    const accessToken = await getAccessToken();
    const gql = createGraphQLClient(accessToken);
    const res: any = await gql.request(queries.getMessages, { conversationId });

    const edges = res?.chat_messagesCollection?.edges || [];
    const messages: PlaygroundChatMessage[] = edges.map((e: any) =>
      convertFromHistoryMessage({
        messageId: e.node.message_id,
        userQuery: e.node.user_query,
        conversationId,
        aiResponse: e.node.ai_response,
        messageType: e.node.message_type,
        toolCalls: e.node.tool_calls,
        extraData: e.node.extra_data,
        images: e.node.images,
        videos: e.node.videos,
        createdAt: e.node.created_at,
      })
    );

    return {
      success: true,
      messages,
      totalMessages: messages.length,
      hasMore: false,
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
    const accessToken = await getAccessToken();
    const gql = createGraphQLClient(accessToken);
    const res: any = await gql.request(queries.getConversations, { userId });
    const edges = res?.agent_conversationsCollection?.edges || [];
    const conversations = edges.map((e: any) => e.node);

    return {
      success: true,
      conversations,
      totalConversations: conversations.length,
      hasMore: false,
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
    const accessToken = await getAccessToken();
    const gql = createGraphQLClient(accessToken);
    await gql.request(queries.deleteConversation, { id: conversationId });
    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
