// Complete Profile Fix Script - Run this in browser console

console.log('🔧 Starting complete profile fix...');

// Step 1: Check current state
console.log('📊 Current localStorage state:');
console.log('- user_id:', localStorage.getItem('user_id'));
console.log('- accessToken:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');

// Step 2: Test MongoDB connection
async function testMongoConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    const response = await fetch('/api/health/mongodb');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ MongoDB connection healthy');
      console.log('- Query time:', data.data.queryTime);
      console.log('- User count:', data.data.userCount);
      return true;
    } else {
      console.log('❌ MongoDB connection failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ MongoDB health check error:', error);
    return false;
  }
}

// Step 3: Fix user profile
async function fixUserProfile() {
  const userId = localStorage.getItem('user_id');
  
  if (!userId) {
    console.log('❌ No user_id found. Please log in again.');
    return false;
  }
  
  try {
    console.log('🔄 Attempting to fetch profile with retry...');
    
    // Try multiple times with delay
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📡 Profile fetch attempt ${attempt}/3...`);
        
        const response = await fetch(`/api/users/profile?userId=${userId}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Profile fetch successful:', data);
          
          if (data.success && data.data) {
            console.log('👤 Your profile data:');
            console.log('- Name:', data.data.name);
            console.log('- Email:', data.data.email);
            console.log('- User ID:', data.data._id);
            
            // Clear cache and refresh
            localStorage.removeItem('userProfile');
            sessionStorage.clear();
            
            console.log('🔄 Profile fixed! Refreshing page...');
            window.location.reload();
            return true;
          }
        }
        
        console.log(`❌ Attempt ${attempt} failed. Status:`, response.status);
        
        if (attempt < 3) {
          console.log('⏳ Waiting 2 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`❌ Attempt ${attempt} error:`, error.message);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.log('❌ All profile fetch attempts failed');
    return false;
    
  } catch (error) {
    console.log('❌ Profile fix error:', error);
    return false;
  }
}

// Step 4: Alternative - Create user if not found
async function createUserIfNeeded() {
  console.log('🔧 Attempting to create/fix user profile...');
  
  try {
    const response = await fetch('/api/debug/fix-signup-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: localStorage.getItem('user_id'),
        email: 'user@example.com', // Replace with your real email
        name: 'Default User'
      })
    });
    
    const data = await response.json();
    console.log('🔧 Fix user response:', data);
    
    if (data.success) {
      console.log('✅ User profile fixed/created successfully');
      return true;
    } else {
      console.log('❌ Failed to fix user profile:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Create user error:', error);
    return false;
  }
}

// Main execution
async function runCompleteFix() {
  console.log('🚀 Running complete profile fix...');
  
  // Test MongoDB first
  const mongoHealthy = await testMongoConnection();
  
  if (!mongoHealthy) {
    console.log('⚠️ MongoDB connection issues detected');
    console.log('💡 Solutions:');
    console.log('1. Check your .env file has MONGODB_URI or MONGODB_ENTERPRISE_SEARCH_URI');
    console.log('2. Restart the development server: npm run dev');
    console.log('3. Check MongoDB Atlas IP whitelist');
    return;
  }
  
  // Try to fix profile
  const profileFixed = await fixUserProfile();
  
  if (!profileFixed) {
    console.log('🔧 Profile fetch failed, trying to create/fix user...');
    const userCreated = await createUserIfNeeded();
    
    if (userCreated) {
      // Try profile fetch again
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fixUserProfile();
    } else {
      console.log('❌ Complete fix failed');
      console.log('💡 Please log out and log in again with your real email');
    }
  }
}

// Run the complete fix
runCompleteFix();
