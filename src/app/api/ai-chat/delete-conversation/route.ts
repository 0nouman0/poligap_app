import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiResponse } from '@/lib/apiResponse';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return createApiResponse({
        success: false,
        error: 'Unauthorized',
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    console.log('🗑️ Deleting conversation:', conversationId);

    if (!conversationId) {
      return createApiResponse({
        success: false,
        error: 'Conversation ID is required',
        status: 400,
      });
    }

    // First, delete all messages in the conversation
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return createApiResponse({
        success: false,
        error: `Failed to delete messages: ${messagesError.message}`,
        status: 500,
      });
    }

    // Then delete the conversation itself
    const { error: conversationError } = await supabase
      .from('agent_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id); // Ensure user owns the conversation

    if (conversationError) {
      console.error('Error deleting conversation:', conversationError);
      return createApiResponse({
        success: false,
        error: `Failed to delete conversation: ${conversationError.message}`,
        status: 500,
      });
    }

    console.log('✅ Conversation deleted successfully:', conversationId);

    return createApiResponse({
      success: true,
      data: { conversationId },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    return createApiResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete conversation',
      status: 500,
    });
  }
}
