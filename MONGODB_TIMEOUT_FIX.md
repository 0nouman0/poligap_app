# MongoDB Timeout Fix

## Issue
MongoDB operations are timing out with error: `Operation 'users.findOne()' buffering timed out after 10000ms`

## Root Cause
1. **Missing/Incorrect Environment Variables**: The app expects `MONGODB_ENTERPRISE_SEARCH_URI` but might be missing
2. **Connection Timeout**: Default MongoDB connection settings are too restrictive
3. **Buffering Issues**: Mongoose buffering is causing queries to queue up

## Solution Applied

### 1. Updated MongoDB Connection Settings
- ✅ Disabled mongoose buffering (`bufferCommands: false`)
- ✅ Added proper timeouts (30s connection, 45s socket)
- ✅ Added connection pooling (5-10 connections)
- ✅ Added retry logic with exponential backoff

### 2. Added Retry Mechanism
- ✅ Database operations now retry 3 times with exponential backoff
- ✅ Each query has a 10-second timeout (`maxTimeMS`)

### 3. Environment Variables Needed
Add these to your `.env` file:

```env
# MongoDB Connection (use your actual MongoDB Atlas URI)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poligap?retryWrites=true&w=majority
MONGODB_ENTERPRISE_SEARCH_URI=mongodb+srv://username:password@cluster.mongodb.net/poligap?retryWrites=true&w=majority
```

## Quick Fix Steps

### Step 1: Check Environment Variables
```bash
# Check if MongoDB URI is set
echo $MONGODB_ENTERPRISE_SEARCH_URI
```

### Step 2: Test MongoDB Connection
```bash
# Test the health endpoint
curl http://localhost:3000/api/health/mongodb
```

### Step 3: If Still Failing
1. **Restart the development server**: `npm run dev`
2. **Check MongoDB Atlas**: Ensure your IP is whitelisted
3. **Verify credentials**: Check username/password in connection string

## Browser Console Fix (Temporary)
If profile still doesn't load, run this in browser console:

```javascript
// Force refresh profile with retry
async function forceRefreshProfile() {
  const userId = localStorage.getItem('user_id');
  console.log('Forcing profile refresh for userId:', userId);
  
  if (!userId) {
    console.log('No user_id found');
    return;
  }
  
  try {
    const response = await fetch(`/api/users/profile?userId=${userId}`, {
      cache: 'no-cache'
    });
    const data = await response.json();
    console.log('Profile data:', data);
    
    if (data.success) {
      localStorage.removeItem('userProfile');
      sessionStorage.clear();
      window.location.reload();
    }
  } catch (error) {
    console.error('Profile refresh failed:', error);
  }
}

forceRefreshProfile();
```

## Files Modified
- ✅ `/src/lib/db/index.ts` - Updated connection options and retry logic
- ✅ `/src/app/api/users/profile/route.ts` - Added retry wrapper for queries
- ✅ `/src/app/api/health/mongodb/route.ts` - Added health check endpoint

## Expected Result
After applying these fixes:
- ✅ MongoDB connections should be stable
- ✅ Profile API should load without timeouts
- ✅ User profile should display real data from MongoDB
- ✅ No more "buffering timed out" errors
