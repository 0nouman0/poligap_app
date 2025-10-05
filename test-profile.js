// TEST PROFILE - Run this in browser console after server starts
// This will test if the simplified profile system works

console.log('🧪 TESTING SIMPLIFIED PROFILE SYSTEM');

async function testProfile() {
  try {
    console.log('🧹 Step 1: Clearing cached data...');
    localStorage.clear();
    sessionStorage.clear();

    console.log('🆔 Step 2: Setting user ID...');
    const userId = '68e234f5beac9a8683d1158e';
    localStorage.setItem('user_id', userId);

    console.log('📡 Step 3: Testing profile API...');
    
    const response = await fetch(`/api/users/profile?userId=${userId}`, {
      cache: 'no-cache'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Profile API Response:', data);
      
      if (data.success && data.data) {
        console.log('🎉 SUCCESS! Profile data received:');
        console.log('- Name:', data.data.name);
        console.log('- Email:', data.data.email);
        console.log('- User ID:', data.data._id);
        console.log('- Source:', data.data.source);
        
        // Cache the profile
        localStorage.setItem('userProfile', JSON.stringify(data.data));
        
        console.log('🔄 Refreshing page to show profile...');
        window.location.reload();
        return;
      } else {
        console.log('❌ API returned success=false:', data.error);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API request failed:', response.status, errorText);
    }

    console.log('💡 If API failed, check:');
    console.log('1. MongoDB URI is correct in .env file');
    console.log('2. Server is running: npm run dev');
    console.log('3. Database connection is working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('💡 Make sure:');
    console.log('1. Server is running on localhost:3000');
    console.log('2. MongoDB connection is working');
    console.log('3. .env file has correct MONGODB_URI');
  }
}

// Show current status
console.log('📊 Current Status:');
console.log('- URL:', window.location.href);
console.log('- User ID:', localStorage.getItem('user_id'));
console.log('- Has Profile:', localStorage.getItem('userProfile') ? 'YES' : 'NO');

// Run the test
testProfile();
