/**
 * Clear old MongoDB-based cache data from localStorage
 * This should be called once to migrate from old MongoDB IDs to new Supabase UUIDs
 */
export function clearOldCache() {
  if (typeof window === 'undefined') return;

  let cleared = false;

  try {
    // Clear user-store if it has MongoDB ObjectId
    const userStoreKey = 'user-store';
    const storedData = localStorage.getItem(userStoreKey);
    
    if (storedData) {
      const parsed = JSON.parse(storedData);
      const userId = parsed?.state?.userData?.userId;
      
      // Check if it's a MongoDB ObjectId (24 hex characters)
      if (userId && typeof userId === 'string' && /^[0-9a-f]{24}$/i.test(userId)) {
        console.log('🧹 Clearing old MongoDB user-store cache...');
        localStorage.removeItem(userStoreKey);
        cleared = true;
        console.log('✅ Old user-store cache cleared');
      }
    }

    // Clear standalone user_id if it's MongoDB ObjectId
    const oldUserId = localStorage.getItem('user_id');
    if (oldUserId && /^[0-9a-f]{24}$/i.test(oldUserId)) {
      console.log('🧹 Clearing old MongoDB user_id from localStorage...');
      localStorage.removeItem('user_id');
      cleared = true;
      console.log('✅ Old user_id cleared');
    }

    // Clear auth-store if it exists and has old data
    const authStoreKey = 'auth-store';
    const authData = localStorage.getItem(authStoreKey);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const authUserId = parsed?.state?.user?.id || parsed?.state?.user?._id;
        if (authUserId && /^[0-9a-f]{24}$/i.test(authUserId)) {
          console.log('🧹 Clearing old MongoDB auth-store cache...');
          localStorage.removeItem(authStoreKey);
          cleared = true;
          console.log('✅ Old auth-store cache cleared');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (cleared) {
      console.log('✅ All old MongoDB cache cleared. Please refresh the page.');
    }
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
  
  return cleared;
}
