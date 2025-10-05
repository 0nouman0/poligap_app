// Run this in browser console to get your ACTUAL logged-in user data

console.log('🔍 Getting your ACTUAL logged-in user data...');

// Step 1: Check current localStorage
console.log('Current localStorage data:');
console.log('- user_id:', localStorage.getItem('user_id'));
console.log('- accessToken:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
console.log('- __LOGIN_SESSION__:', localStorage.getItem('__LOGIN_SESSION__') ? 'EXISTS' : 'MISSING');

// Step 2: Get your real user data using the access token
const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('__LOGIN_SESSION__');

if (!accessToken) {
  console.log('❌ No access token found. Please log in again.');
} else {
  console.log('✅ Found access token, getting your real user data...');
  
  // Call the API to get current user
  fetch('/api/debug/get-current-user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('🎯 API Response:', data);
    
    if (data.success) {
      console.log('✅ YOUR ACTUAL USER DATA:');
      console.log('- Real User ID:', data.data.userId);
      console.log('- Real Email:', data.data.email);
      console.log('- Real Name:', data.data.name);
      
      // Update localStorage with your REAL user ID
      const oldUserId = localStorage.getItem('user_id');
      localStorage.setItem('user_id', data.data.userId);
      
      console.log('🔄 Updated localStorage:');
      console.log('- Old user_id:', oldUserId);
      console.log('- New user_id:', data.data.userId);
      
      console.log('🔄 Refreshing page to show your REAL profile...');
      window.location.reload();
      
    } else {
      console.log('❌ Failed to get user data:', data.error);
      console.log('💡 Try logging out and logging in again');
    }
  })
  .catch(error => {
    console.log('❌ Error:', error);
    console.log('💡 Try logging out and logging in again');
  });
}
