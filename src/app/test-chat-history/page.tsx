"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestChatHistoryPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testChatHistoryFunctionality = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing chat history functionality...');
      
      const userId = localStorage.getItem('user_id') || "68da404605eeba8349fc9d10";
      const companyId = "60f1b2b3c4d5e6f7a8b9c0d1";
      
      // Test 1: Create a conversation
      const createResponse = await fetch('/api/ai-chat/create-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          companyId: companyId
        }),
      });
      
      const createResult = await createResponse.json();
      console.log('Create conversation result:', createResult);
      
      if (!createResult.success) {
        throw new Error('Failed to create conversation');
      }
      
      const conversationId = createResult.data._id;
      
      // Test 2: Save a test message
      const testMessage = {
        conversationId: conversationId,
        messageId: `test-msg-${Date.now()}`,
        user_query: "Hello, this is a test message",
        content: "Hello! This is a test response from the AI assistant.",
        messageType: "ai",
        tool_calls: [],
        extra_data: {},
        images: [],
        videos: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000)
      };
      
      const saveResponse = await fetch('/api/ai-chat/save-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });
      
      const saveResult = await saveResponse.json();
      console.log('Save message result:', saveResult);
      
      // Test 3: Retrieve chat history
      const historyResponse = await fetch(`/api/ai-chat/get-messages?conversationId=${conversationId}`);
      const historyResult = await historyResponse.json();
      console.log('Get history result:', historyResult);
      
      setTestResult({
        createConversation: createResult,
        saveMessage: saveResult,
        getHistory: historyResult,
        conversationId: conversationId,
        overall: createResult.success && saveResult.success && historyResult.success ? 'SUCCESS' : 'PARTIAL'
      });
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult({ 
        error: error instanceof Error ? error.message : 'Test request failed',
        overall: 'FAILED'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToChat = () => {
    window.location.href = '/chat';
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>💾 Chat History MongoDB Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Features Implemented:
              </h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Chat message model for MongoDB storage</li>
                <li>• Save message API endpoint</li>
                <li>• Get chat history API endpoint</li>
                <li>• Auto-save messages during chat</li>
                <li>• Load history when conversation selected</li>
                <li>• Message deduplication and updates</li>
              </ul>
            </div>

            <Button onClick={testChatHistoryFunctionality} disabled={isLoading} className="w-full">
              {isLoading ? '🧪 Testing Chat History...' : '🧪 Test Chat History Functionality'}
            </Button>

            {testResult && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Test Results:</h3>
                  <Badge variant={testResult.overall === 'SUCCESS' ? 'default' : testResult.overall === 'PARTIAL' ? 'secondary' : 'destructive'}>
                    {testResult.overall}
                  </Badge>
                </div>

                {testResult.conversationId && (
                  <div className="p-3 border rounded bg-blue-50 dark:bg-blue-950">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Test Conversation ID:</h4>
                    <code className="text-sm text-blue-700 dark:text-blue-300">{testResult.conversationId}</code>
                  </div>
                )}

                {testResult.createConversation && (
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Create Conversation:</h4>
                    <Badge variant={testResult.createConversation.success ? 'default' : 'destructive'}>
                      {testResult.createConversation.success ? 'SUCCESS' : 'FAILED'}
                    </Badge>
                  </div>
                )}

                {testResult.saveMessage && (
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Save Message to MongoDB:</h4>
                    <Badge variant={testResult.saveMessage.success ? 'default' : 'destructive'}>
                      {testResult.saveMessage.success ? 'SUCCESS' : 'FAILED'}
                    </Badge>
                  </div>
                )}

                {testResult.getHistory && (
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Get Chat History:</h4>
                    <Badge variant={testResult.getHistory.success ? 'default' : 'destructive'}>
                      {testResult.getHistory.success ? 'SUCCESS' : 'FAILED'}
                    </Badge>
                    {testResult.getHistory.data && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Retrieved {testResult.getHistory.data.length} messages from MongoDB
                      </p>
                    )}
                  </div>
                )}

                {testResult.overall === 'SUCCESS' && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      🎉 Chat History is Working!
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      Your chat messages are now being saved to MongoDB and can be retrieved successfully.
                    </p>
                    <Button onClick={goToChat} className="w-full">
                      Go to Chat and Test Live
                    </Button>
                  </div>
                )}

                {testResult.error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      ❌ Test Failed
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {testResult.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 How Chat History Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <strong>1. Message Storage:</strong>
                <p>Every chat message is automatically saved to MongoDB with conversation ID, user query, AI response, and metadata</p>
              </div>
              
              <div>
                <strong>2. History Loading:</strong>
                <p>When you select a conversation, the system loads all previous messages from MongoDB</p>
              </div>
              
              <div>
                <strong>3. Real-time Updates:</strong>
                <p>New messages are saved immediately during chat streaming</p>
              </div>
              
              <div>
                <strong>4. Data Structure:</strong>
                <p>Messages include user queries, AI responses, tool calls, references, and media attachments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
