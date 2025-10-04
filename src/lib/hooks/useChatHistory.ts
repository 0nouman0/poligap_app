import { useState, useCallback } from 'react';
import { PlaygroundChatMessage } from '@/types/agent';
import {
  saveChatMessage,
  saveChatMessagesBatch,
  getChatMessages,
  getChatHistory,
  deleteChatConversation,
} from '@/lib/utils/chatHistory';

export interface UseChatHistoryReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Single message operations
  saveMessage: (message: PlaygroundChatMessage, conversationId: string) => Promise<boolean>;
  
  // Batch operations
  saveMessagesBatch: (messages: PlaygroundChatMessage[], conversationId: string) => Promise<{
    success: boolean;
    savedCount: number;
    errorCount: number;
  }>;
  
  // Retrieval operations
  loadMessages: (conversationId: string, limit?: number, offset?: number) => Promise<{
    messages: PlaygroundChatMessage[];
    totalMessages: number;
    hasMore: boolean;
  } | null>;
  
  loadChatHistory: (userId: string, companyId?: string, limit?: number, offset?: number) => Promise<{
    conversations: any[];
    totalConversations: number;
    hasMore: boolean;
  } | null>;
  
  // Delete operations
  deleteConversation: (conversationId: string, userId: string) => Promise<boolean>;
  
  // Utility functions
  clearError: () => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const saveMessage = useCallback(async (
    message: PlaygroundChatMessage, 
    conversationId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await saveChatMessage(message, conversationId);
      
      if (!result.success) {
        setError(result.error || 'Failed to save message');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveMessagesBatch = useCallback(async (
    messages: PlaygroundChatMessage[], 
    conversationId: string
  ): Promise<{ success: boolean; savedCount: number; errorCount: number }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await saveChatMessagesBatch(messages, conversationId);
      
      if (result.errorCount > 0 && result.savedCount === 0) {
        setError(`Failed to save all ${messages.length} messages`);
      } else if (result.errorCount > 0) {
        setError(`Saved ${result.savedCount} messages, failed to save ${result.errorCount}`);
      }
      
      return {
        success: result.success,
        savedCount: result.savedCount,
        errorCount: result.errorCount,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        savedCount: 0,
        errorCount: messages.length,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    messages: PlaygroundChatMessage[];
    totalMessages: number;
    hasMore: boolean;
  } | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getChatMessages(conversationId, limit, offset);
      
      if (!result.success) {
        setError(result.error || 'Failed to load messages');
        return null;
      }
      
      return {
        messages: result.messages || [],
        totalMessages: result.totalMessages || 0,
        hasMore: result.hasMore || false,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChatHistory = useCallback(async (
    userId: string,
    companyId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    conversations: any[];
    totalConversations: number;
    hasMore: boolean;
  } | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getChatHistory(userId, companyId, limit, offset);
      
      if (!result.success) {
        setError(result.error || 'Failed to load chat history');
        return null;
      }
      
      return {
        conversations: result.conversations || [],
        totalConversations: result.totalConversations || 0,
        hasMore: result.hasMore || false,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (
    conversationId: string,
    userId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await deleteChatConversation(conversationId, userId);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete conversation');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    saveMessage,
    saveMessagesBatch,
    loadMessages,
    loadChatHistory,
    deleteConversation,
    clearError,
  };
}
