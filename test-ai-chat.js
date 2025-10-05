// TEST AI CHAT - Run this in browser console to test if AI chat works now

console.log('🤖 TESTING AI CHAT FUNCTIONALITY');

async function testAIChat() {
  try {
    console.log('🧪 Step 1: Testing create conversation API...');
    
    const createConversationData = {
      chatName: "Test Chat",
      companyId: "68e234f5beac9a8683d1158e", // Using your user ID as company ID for test
      enterpriseUserId: "68e234f5beac9a8683d1158e",
      agentId: "68e234f5beac9a8683d1158e", // Using your user ID as agent ID for test
      summary: "Test conversation",
      status: "active"
    };

    const createResponse = await fetch('/api/ai-chat/create-conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createConversationData)
    });

    console.log('Create conversation response status:', createResponse.status);

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Create conversation works:', createData);
      
      if (createData.success && createData.data) {
        const conversationId = createData.data._id;
        console.log('📝 Created conversation ID:', conversationId);
        
        // Test generate title
        console.log('\\n🧪 Step 2: Testing generate title API...');
        const titleResponse = await fetch('/api/ai-chat/generate-title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userPrompt: "Hello, how are you?",
            conversationId: conversationId
          })
        });
        
        console.log('Generate title response status:', titleResponse.status);
        
        if (titleResponse.ok) {
          const titleData = await titleResponse.json();
          console.log('✅ Generate title works:', titleData);
        } else {
          const titleError = await titleResponse.text();
          console.log('❌ Generate title failed:', titleResponse.status, titleError);
        }
      }
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Create conversation failed:', createResponse.status, errorText);
    }

    console.log('\\n📊 AI CHAT TEST COMPLETE');
    console.log('If create conversation works, the AgentConversation model is fixed!');
    console.log('If generate title fails with API key error, that\\'s expected (need valid Portkey API key)');

  } catch (error) {
    console.error('❌ AI Chat test failed:', error);
    console.log('💡 Make sure:');
    console.log('1. Server is running: npm run dev');
    console.log('2. MongoDB connection is working');
    console.log('3. AgentConversation model is properly fixed');
  }
}

// Run the test
testAIChat();
