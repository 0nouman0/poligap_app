// Run this in browser console after signup to fix profile issues

console.log('🔧 Fixing profile after signup...');

// Get current user ID from localStorage
const userId = localStorage.getItem('user_id');
console.log('Current user_id:', userId);

if (!userId) {
  console.log('❌ No user_id found in localStorage');
  console.log('💡 Please log out and log in again');
} else {
  // Call the fix API
  fetch('/api/debug/fix-signup-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('🎯 Fix API Response:', data);
    
    if (data.success) {
      console.log('✅ User profile fixed successfully!');
      console.log('- Action:', data.data.action);
      console.log('- Message:', data.data.message);
      
      if (data.data.user) {
        console.log('- User Email:', data.data.user.email);
        console.log('- User Name:', data.data.user.name);
      }
      
      // Clear any cached profile data
      localStorage.removeItem('userProfile');
      sessionStorage.clear();
      
      console.log('🔄 Refreshing page to load your profile...');
      window.location.reload();
      
    } else {
      console.log('❌ Failed to fix profile:', data.error);
      console.log('💡 Try logging out and logging in again');
    }
  })
  .catch(error => {
    console.log('❌ Error calling fix API:', error);
    console.log('💡 Try logging out and logging in again');
  });
}
