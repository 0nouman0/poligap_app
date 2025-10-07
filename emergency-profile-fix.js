// EMERGENCY PROFILE FIX - Run this in browser console
// This bypasses the broken MongoDB connection and uses a fallback API

console.log('🚨 EMERGENCY PROFILE FIX - Bypassing MongoDB issues');

async function emergencyProfileFix() {
  try {
    // Step 1: Clear all cached data
    console.log('🧹 Clearing cached data...');
    localStorage.removeItem('userProfile');
    sessionStorage.clear();

    // Step 2: Set your correct user ID
    const yourRealUserId = '68e234f5beac9a8683d1158e';
    localStorage.setItem('user_id', yourRealUserId);
    console.log('✅ Set correct user ID:', yourRealUserId);

    // Step 3: Try fallback API first
    console.log('🔄 Trying fallback profile API...');
    
    try {
      const fallbackResponse = await fetch(`/api/users/profile-fallback?userId=${yourRealUserId}`);
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.success) {
        console.log('✅ Fallback API worked! Profile data:', fallbackData.data);
        
        // Cache the working profile data
        localStorage.setItem('userProfile', JSON.stringify(fallbackData.data));
        
        console.log('🎉 SUCCESS! Your profile is now working:');
        console.log('- Name:', fallbackData.data.name);
        console.log('- Email:', fallbackData.data.email);
        console.log('- Source:', fallbackData.data.source);
        
        console.log('🔄 Refreshing page...');
        window.location.reload();
        return;
      }
    } catch (fallbackError) {
      console.log('⚠️ Fallback API failed:', fallbackError.message);
    }

    // Step 4: If fallback fails, create manual profile data
    console.log('🔧 Creating manual profile data...');
    
    const manualProfile = {
      _id: yourRealUserId,
      userId: yourRealUserId,
      name: 'Default User',
      email: 'user@example.com',
      designation: 'User',
      companyName: 'Company',
      source: 'Emergency Manual Fix - MongoDB Connection Failed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('userProfile', JSON.stringify(manualProfile));
    
    console.log('✅ Manual profile created successfully!');
    console.log('📧 Email:', manualProfile.email);
    console.log('👤 Name:', manualProfile.name);
    console.log('🆔 User ID:', manualProfile._id);
    
    console.log('🔄 Refreshing page to show your profile...');
    window.location.reload();

  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    console.log('💡 Manual steps:');
    console.log('1. Clear browser cache and cookies');
    console.log('2. Log out and log in again');
    console.log('3. Contact support if issue persists');
  }
}

// Run the emergency fix
emergencyProfileFix();
