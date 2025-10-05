// DEBUG 500 ERROR - Run this in browser console to diagnose the issue

console.log('🔍 DEBUGGING 500 ERROR IN PROFILE API');

async function debug500Error() {
  try {
    const userId = '68e23565beac9a8683d115a3'; // The failing user ID

    console.log('🧪 Step 1: Testing database debug endpoint...');
    try {
      const debugResponse = await fetch('/api/debug-db');
      const debugData = await debugResponse.json();
      console.log('Database debug response:', debugData);
      
      if (debugData.success) {
        console.log('✅ Database debug info:');
        console.log('- Mongoose state:', debugData.data.defaultMongooseState);
        console.log('- Connection test:', debugData.data.connectionTest);
        console.log('- MongoDB URI:', debugData.data.mongoUri);
      } else {
        console.log('❌ Database debug failed:', debugData.error);
      }
    } catch (error) {
      console.log('❌ Database debug endpoint error:', error.message);
    }

    console.log('\\n🧪 Step 2: Testing simple profile API...');
    try {
      const simpleResponse = await fetch(`/api/users/profile-simple?userId=${userId}`);
      console.log('Simple profile response status:', simpleResponse.status);
      
      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        console.log('✅ Simple profile API works:', simpleData);
      } else {
        const errorText = await simpleResponse.text();
        console.log('❌ Simple profile API failed:', simpleResponse.status, errorText);
      }
    } catch (error) {
      console.log('❌ Simple profile API error:', error.message);
    }

    console.log('\\n🧪 Step 3: Testing original profile API...');
    try {
      const originalResponse = await fetch(`/api/users/profile?userId=${userId}`);
      console.log('Original profile response status:', originalResponse.status);
      
      if (originalResponse.ok) {
        const originalData = await originalResponse.json();
        console.log('✅ Original profile API works:', originalData);
      } else {
        const errorText = await originalResponse.text();
        console.log('❌ Original profile API failed:', originalResponse.status, errorText);
      }
    } catch (error) {
      console.log('❌ Original profile API error:', error.message);
    }

    console.log('\\n🧪 Step 4: Testing with your correct user ID...');
    const correctUserId = '68e234f5beac9a8683d1158e';
    try {
      const correctResponse = await fetch(`/api/users/profile-simple?userId=${correctUserId}`);
      console.log('Correct user ID response status:', correctResponse.status);
      
      if (correctResponse.ok) {
        const correctData = await correctResponse.json();
        console.log('✅ Correct user ID works:', correctData);
      } else {
        const errorText = await correctResponse.text();
        console.log('❌ Correct user ID failed:', correctResponse.status, errorText);
      }
    } catch (error) {
      console.log('❌ Correct user ID error:', error.message);
    }

    console.log('\\n📊 DIAGNOSIS COMPLETE');
    console.log('Check the results above to identify the issue:');
    console.log('1. If database debug fails → MongoDB connection issue');
    console.log('2. If simple API works but original fails → User model issue');
    console.log('3. If both fail → Database connection or query issue');
    console.log('4. If correct user ID works → Wrong user ID in request');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debug500Error();
