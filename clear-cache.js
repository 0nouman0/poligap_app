// Run this in browser console to clear all cached data and force fresh MongoDB fetch

console.log('🧹 Clearing all cached user data...');

// Clear localStorage
localStorage.removeItem('userProfile');
localStorage.removeItem('userData');
localStorage.removeItem('user_data');
localStorage.removeItem('profileCache');

// Clear sessionStorage
sessionStorage.clear();

// Clear any Zustand store data if it exists
if (window.useUserStore && window.useUserStore.getState) {
  const store = window.useUserStore.getState();
  if (store.clearUser) {
    store.clearUser();
  }
}

console.log('✅ Cache cleared! Refreshing page to fetch fresh MongoDB data...');

// Force page refresh
window.location.reload();
