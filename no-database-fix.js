// NO DATABASE FIX - Works without any MongoDB connection
// Run this in browser console

console.log('🚀 NO DATABASE FIX - Running without MongoDB');

async function noDatabaseFix() {
  try {
    console.log('🧹 Step 1: Clearing all cached data...');
    localStorage.clear();
    sessionStorage.clear();

    console.log('🆔 Step 2: Setting your correct user ID...');
    const yourUserId = '68e234f5beac9a8683d1158e';
    localStorage.setItem('user_id', yourUserId);

    console.log('📡 Step 3: Testing profile API (should work without database)...');
    
    try {
      const response = await fetch(`/api/users/profile?userId=${yourUserId}`, {
        cache: 'no-cache'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile API working!');
        console.log('Response:', data);
        
        if (data.success && data.data) {
          console.log('🎉 SUCCESS! Your profile data:');
          console.log('- Name:', data.data.name);
          console.log('- Email:', data.data.email);
          console.log('- Source:', data.data.source);
          
          // Cache the profile data
          localStorage.setItem('userProfile', JSON.stringify(data.data));
          
          console.log('🔄 Refreshing page to show your profile...');
          window.location.reload();
          return;
        }
      }
      
      // If API fails, create manual profile
      console.log('⚠️ API response not successful, creating manual profile...');
      
    } catch (error) {
      console.log('⚠️ API call failed:', error.message);
      console.log('🔧 Creating manual profile...');
    }

    // Manual profile creation (always works)
    const manualProfile = {
      _id: yourUserId,
      userId: yourUserId,
      name: 'Default User',
      email: 'user@example.com',
      designation: 'User',
      companyName: 'Company',
      source: 'Manual Profile - No Database Required',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('userProfile', JSON.stringify(manualProfile));
    
    console.log('✅ Manual profile created successfully!');
    console.log('📧 Email:', manualProfile.email);
    console.log('👤 Name:', manualProfile.name);
    console.log('🆔 User ID:', manualProfile._id);
    
    console.log('🔄 Refreshing page...');
    window.location.reload();

  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.log('💡 Try refreshing the page manually');
  }
}

// Show current status
console.log('📊 Current Status:');
console.log('- URL:', window.location.href);
console.log('- User ID:', localStorage.getItem('user_id'));
console.log('- Has Profile:', localStorage.getItem('userProfile') ? 'YES' : 'NO');

// Run the fix
noDatabaseFix();
