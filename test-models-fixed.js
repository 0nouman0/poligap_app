// TEST MODELS FIXED - Run this in browser console to test if model overwrite errors are fixed

console.log('🔧 TESTING MODEL OVERWRITE FIXES');

async function testModelsFixed() {
  try {
    console.log('🧪 Step 1: Testing User Profile API...');
    
    const userId = '68e23565beac9a8683d115a3'; // The user ID from your logs
    const profileResponse = await fetch(`/api/users/profile?userId=${userId}`, {
      cache: 'no-cache'
    });
    
    console.log('Profile API response status:', profileResponse.status);
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Profile API works! User found:', {
        name: profileData.data?.name,
        email: profileData.data?.email,
        userId: profileData.data?._id
      });
    } else {
      const errorText = await profileResponse.text();
      console.log('❌ Profile API failed:', profileResponse.status, errorText);
    }

    console.log('\\n🧪 Step 2: Testing AI Chat Create Conversation...');
    
    const createConversationData = {
      chatName: "Test Chat - Model Fix",
      companyId: "60f1b2b3c4d5e6f7a8b9c0d1",
      enterpriseUserId: userId,
      agentId: "60f1b2b3c4d5e6f7a8b9c0d2",
      summary: "Testing model overwrite fix",
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
      console.log('✅ Create conversation works! Conversation created:', {
        id: createData.data?._id,
        chatName: createData.data?.chatName
      });
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Create conversation failed:', createResponse.status, errorText);
    }

    console.log('\\n🧪 Step 3: Testing Get Conversation List...');
    
    const listResponse = await fetch(`/api/ai-chat/get-conversation-list?companyId=60f1b2b3c4d5e6f7a8b9c0d1&userId=${userId}`);
    
    console.log('Get conversation list response status:', listResponse.status);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Get conversation list works! Found conversations:', listData.data?.length || 0);
    } else {
      const errorText = await listResponse.text();
      console.log('❌ Get conversation list failed:', listResponse.status, errorText);
    }

    console.log('\\n📊 MODEL FIX TEST COMPLETE');
    console.log('Results:');
    console.log('- If Profile API works: User model fixed ✅');
    console.log('- If Create conversation works: AgentConversation model fixed ✅');
    console.log('- If Get conversation list works: All models working ✅');
    console.log('- If any fail with model overwrite errors: Still need fixing ❌');

  } catch (error) {
    console.error('❌ Model test failed:', error);
    console.log('💡 Make sure server is running: npm run dev');
  }
}

// Show current status
console.log('📊 Current Status:');
console.log('- URL:', window.location.href);
console.log('- Testing model overwrite fixes...');

// Run the test
testModelsFixed();
