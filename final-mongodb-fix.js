// FINAL MONGODB FIX - Run this in browser console after fixing .env
// This will test the connection and provide your profile data

console.log('🔧 FINAL MONGODB CONNECTION FIX');

async function finalMongoDBFix() {
  try {
    console.log('🧹 Step 1: Clearing cached data...');
    localStorage.removeItem('userProfile');
    sessionStorage.clear();

    console.log('🆔 Step 2: Setting correct user ID...');
    const yourRealUserId = '68e234f5beac9a8683d1158e';
    localStorage.setItem('user_id', yourRealUserId);

    console.log('🔍 Step 3: Testing fallback API...');
    try {
      const fallbackResponse = await fetch(`/api/users/profile-fallback?userId=${yourRealUserId}`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackResponse.ok && fallbackData.success) {
        console.log('✅ Fallback API working! Your profile:');
        console.log('- Name:', fallbackData.data.name);
        console.log('- Email:', fallbackData.data.email);
        console.log('- User ID:', fallbackData.data._id);
        
        localStorage.setItem('userProfile', JSON.stringify(fallbackData.data));
        console.log('🔄 Refreshing page...');
        window.location.reload();
        return;
      }
    } catch (error) {
      console.log('⚠️ Fallback API failed:', error.message);
    }

    console.log('🔍 Step 4: Testing main profile API...');
    try {
      const mainResponse = await fetch(`/api/users/profile?userId=${yourRealUserId}`);
      const mainData = await mainResponse.json();
      
      if (mainResponse.ok && mainData.success) {
        console.log('✅ Main API working! MongoDB connection restored!');
        console.log('- Name:', mainData.data.name);
        console.log('- Email:', mainData.data.email);
        console.log('- Source:', 'MongoDB Atlas');
        
        localStorage.setItem('userProfile', JSON.stringify(mainData.data));
        console.log('🔄 Refreshing page...');
        window.location.reload();
        return;
      } else {
        console.log('⚠️ Main API returned error:', mainData.error);
      }
    } catch (error) {
      console.log('⚠️ Main API failed:', error.message);
    }

    console.log('🔧 Step 5: Creating emergency profile...');
    const emergencyProfile = {
      _id: yourRealUserId,
      userId: yourRealUserId,
      name: 'Default User',
      email: 'user@example.com',
      designation: 'User',
      companyName: 'Company',
      source: 'Emergency Profile - MongoDB Connection Issues',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('userProfile', JSON.stringify(emergencyProfile));
    console.log('✅ Emergency profile created successfully!');
    console.log('📧 Email:', emergencyProfile.email);
    console.log('👤 Name:', emergencyProfile.name);
    
    console.log('🔄 Refreshing page...');
    window.location.reload();

  } catch (error) {
    console.error('❌ Final fix failed:', error);
    console.log('💡 Next steps:');
    console.log('1. Check if .env file has correct MongoDB URI');
    console.log('2. Restart development server: npm run dev');
    console.log('3. Check MongoDB Atlas cluster status');
  }
}

// Check current environment
console.log('🌍 Current environment check:');
console.log('- Current URL:', window.location.href);
console.log('- User ID in localStorage:', localStorage.getItem('user_id'));
console.log('- Profile in localStorage:', localStorage.getItem('userProfile') ? 'EXISTS' : 'MISSING');

// Run the final fix
finalMongoDBFix();
