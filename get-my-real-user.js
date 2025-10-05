// Run this in browser console to get YOUR REAL user ID for mohammednouman604@gmail.com

console.log('🔍 Finding your REAL user ID for mohammednouman604@gmail.com...');

// Step 1: Check what's currently in localStorage
console.log('Current localStorage:');
console.log('- user_id:', localStorage.getItem('user_id'));
console.log('- accessToken:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');

// Step 2: Search for your real user by email
fetch('/api/users/profile?email=mohammednouman604@gmail.com')
  .then(response => response.json())
  .then(data => {
    console.log('🎯 Search by email response:', data);
    
    if (data.success && data.data) {
      console.log('✅ FOUND YOUR REAL USER:');
      console.log('- Real User ID:', data.data._id);
      console.log('- Email:', data.data.email);
      console.log('- Name:', data.data.name);
      
      // Update localStorage with YOUR real user ID
      const oldUserId = localStorage.getItem('user_id');
      localStorage.setItem('user_id', data.data._id);
      
      console.log('🔄 Updated localStorage:');
      console.log('- Old user_id (WRONG):', oldUserId);
      console.log('- New user_id (CORRECT):', data.data._id);
      
      // Clear cached data
      localStorage.removeItem('userProfile');
      sessionStorage.clear();
      
      console.log('🔄 Refreshing page to show YOUR real profile...');
      window.location.reload();
      
    } else {
      console.log('❌ User not found by email. Checking if user exists in basic collection...');
      
      // Try to find and fix the user
      fetch('/api/debug/fix-signup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('user_id'),
          email: 'mohammednouman604@gmail.com',
          name: 'Mohammed Nouman'
        })
      })
      .then(response => response.json())
      .then(fixData => {
        console.log('🔧 Fix user response:', fixData);
        if (fixData.success) {
          console.log('✅ User fixed! Refreshing...');
          window.location.reload();
        } else {
          console.log('❌ Could not fix user. Please log out and log in again.');
        }
      });
    }
  })
  .catch(error => {
    console.log('❌ Error searching for user:', error);
    console.log('💡 Please log out and log in again with mohammednouman604@gmail.com');
  });
