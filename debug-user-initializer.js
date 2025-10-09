// Debug script for UserInitializer fetch issues
// Run this in browser console to test the API endpoints

console.log('🔍 Debugging UserInitializer fetch issues...');

// Step 1: Check localStorage
console.log('\n📋 Step 1: Checking localStorage...');
const userId = localStorage.getItem('user_id');
const accessToken = localStorage.getItem('accessToken');
console.log('- user_id:', userId || 'MISSING');
console.log('- accessToken:', accessToken ? 'EXISTS' : 'MISSING');

if (!userId) {
  console.log('❌ No user_id found. Please log in first.');
  console.log('💡 If you need a test user ID, try: localStorage.setItem("user_id", "test_user_123")');
} else {
  // Step 2: Test main profile API
  console.log('\n📡 Step 2: Testing main profile API...');
  
  fetch(`/api/users/profile?userId=${userId}`)
    .then(response => {
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      return response.json();
    })
    .then(data => {
      console.log('✅ Main API Response:', data);
      
      if (!data.success) {
        console.log('\n⚠️ Main API failed, testing fallback...');
        return testFallbackAPI(userId);
      }
    })
    .catch(error => {
      console.log('❌ Main API Error:', error);
      console.log('\n🔄 Testing fallback API...');
      return testFallbackAPI(userId);
    });
}

async function testFallbackAPI(userId) {
  try {
    console.log('\n📡 Step 3: Testing fallback profile API...');
    
    const response = await fetch(`/api/users/profile-fallback?userId=${userId}`);
    console.log('Fallback response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('✅ Fallback API Response:', data);
    
    if (data.success) {
      console.log('✅ Fallback API works! UserInitializer should use this.');
    } else {
      console.log('⚠️ Fallback API also failed. Will use client-side basic profile.');
    }
  } catch (error) {
    console.log('❌ Fallback API Error:', error);
    console.log('💡 UserInitializer will create a basic client-side profile.');
  }
}

// Step 4: Test environment variables
console.log('\n🔧 Step 4: Checking environment configuration...');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');

// Step 5: Test network connectivity
console.log('\n🌐 Step 5: Testing basic network connectivity...');
fetch('/api/health/mongodb')
  .then(response => response.json())
  .then(data => {
    console.log('MongoDB health check:', data);
  })
  .catch(error => {
    console.log('MongoDB health check failed:', error);
    console.log('💡 This suggests MongoDB connection issues.');
  });

console.log('\n📚 Next steps if issues persist:');
console.log('1. Check if .env file exists and has MONGODB_URI');
console.log('2. Verify MongoDB Atlas connection string is correct');
console.log('3. Check MongoDB Atlas network access (IP whitelist)');
console.log('4. Restart the development server: npm run dev');
console.log('5. Check browser network tab for detailed error messages');
