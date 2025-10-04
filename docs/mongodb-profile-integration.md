# MongoDB User Profile Integration

This document outlines the complete MongoDB user profile integration for the Poligap platform, enabling direct fetching and updating of user profile data from your MongoDB Atlas database.

## Overview

The profile integration connects your Next.js application directly to the MongoDB Atlas `users` collection in the `poligap_assets` database, providing real-time access to user profile information.

## Database Structure

Based on your MongoDB Atlas structure:
- **Database**: `poligap_assets`
- **Collection**: `users`
- **Connection**: Uses existing enterprise MongoDB connection

### User Document Schema

```typescript
interface IUser {
  _id: ObjectId;
  email: string;
  name: string;
  userId: ObjectId;
  uniqueId: string;
  country?: string;
  dob?: string;
  mobile?: string;
  profileImage?: string;
  profileCreatedOn?: string;
  banner?: {
    image?: string;
    color?: string;
    type?: string;
    yOffset?: number;
  };
  about?: string;
  status: "ACTIVE" | "INACTIVE";
  designation?: string;
  role?: string;
  memberStatus?: string;
  companyName?: string;
  reportingManager?: {
    name: string;
    email: string;
  };
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### GET /api/users/profile
Fetches user profile data from MongoDB Atlas.

**Query Parameters:**
- `userId` (string) - MongoDB user ID or ObjectId
- `companyId` (string, optional) - Company ID for enhanced profile data
- `email` (string, alternative) - User email as alternative lookup

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "676b6d8a6a6f1c2f1b7f1b7f",
    "userId": "676b6d8a6a6f1c2f1b7f1b7f",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "ACTIVE",
    "designation": "Software Engineer",
    "companyName": "Poligap Inc",
    // ... other profile fields
  }
}
```

### PUT /api/users/profile
Updates user profile data in MongoDB Atlas.

**Request Body:**
```json
{
  "userId": "676b6d8a6a6f1c2f1b7f1b7f",
  "name": "Updated Name",
  "designation": "Senior Engineer",
  "mobile": "+1234567890"
  // ... other fields to update
}
```

## React Hook Usage

### useUserProfile Hook

```typescript
import { useUserProfile } from '@/lib/hooks/useUserProfile';

function ProfileComponent() {
  const {
    profile,           // Current profile data
    isLoading,         // Loading state
    error,             // Error message
    fetchProfile,      // Fetch profile function
    updateProfile,     // Update profile function
    refreshProfile,    // Refresh current profile
    clearError         // Clear error state
  } = useUserProfile();

  // Auto-fetches profile on mount if user is authenticated
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {profile && (
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
          <button onClick={refreshProfile}>Refresh</button>
        </div>
      )}
    </div>
  );
}
```

### Manual Profile Operations

```typescript
// Fetch specific user profile
const profileData = await fetchProfile('676b6d8a6a6f1c2f1b7f1b7f');

// Update profile fields
const updatedProfile = await updateProfile({
  name: 'New Name',
  designation: 'New Title'
});

// Refresh current profile
await refreshProfile();
```

## Profile Page Integration

The profile page (`/app/(app)/profile/page.tsx`) has been enhanced with:

### Features
1. **Auto-fetch**: Automatically loads profile data from MongoDB on page load
2. **Real-time updates**: Changes are saved directly to MongoDB
3. **Refresh button**: Manual refresh to get latest data from database
4. **Error handling**: Clear error messages for connection issues
5. **Loading states**: Visual feedback during data operations

### Key Components

```typescript
// Profile page uses the hook for all operations
const { profile, isLoading, error, updateProfile, refreshProfile } = useUserProfile();

// Save field changes directly to MongoDB
const saveField = async (fieldName: string) => {
  const updatedProfile = await updateProfile({
    [fieldName]: newValue
  });
  // Success/error handling is built into the hook
};
```

## Testing & Debugging

### ProfileDataTest Component

A dedicated test component (`/src/components/ProfileDataTest.tsx`) provides:

1. **Direct API Testing**: Test the `/api/users/profile` endpoint directly
2. **Hook Testing**: Test the `useUserProfile` React hook
3. **Visual Results**: Clear display of success/error states and returned data
4. **Debug Information**: Detailed API responses and error messages

### Usage
```typescript
import { ProfileDataTest } from '@/components/ProfileDataTest';

// Add to any page for testing
<ProfileDataTest />
```

### Testing Steps
1. Get your user ID from MongoDB Atlas users collection
2. Enter the user ID in the test component
3. Click "Test Direct API" to test the endpoint
4. Click "Test Hook" to test the React hook
5. Review results and debug any issues

## Error Handling

### Common Issues & Solutions

1. **User Not Found (404)**
   - Verify user ID exists in MongoDB Atlas
   - Check if using correct database/collection
   - Ensure user ID format is correct (ObjectId vs string)

2. **Connection Errors (500)**
   - Verify MongoDB connection string
   - Check database permissions
   - Ensure enterprise connection is configured

3. **Authentication Issues**
   - Verify user is logged in
   - Check localStorage for user_id
   - Ensure user store is populated

### Debug Logging

Enable debug logging by checking browser console:
```javascript
// The hook and API provide detailed console logs
console.log('Fetching profile with params:', params);
console.log('User found:', user ? 'YES' : 'NO');
```

## Security Considerations

### Data Protection
- User can only access their own profile data
- Company-based filtering for multi-tenant support
- Input validation on all API endpoints
- Sanitized error messages (no sensitive data exposed)

### Access Control
- Authentication required for all operations
- User ID validation against session data
- Company ID verification for enhanced data access

## Performance Optimization

### Caching Strategy
- Profile data cached in React state
- Automatic cache invalidation on updates
- Manual refresh capability for latest data

### Database Queries
- Efficient MongoDB queries with field selection
- Proper indexing on userId and email fields
- Lean queries to minimize data transfer

## Deployment Considerations

### Environment Setup
- Ensure MongoDB connection is configured for production
- Verify database permissions in Atlas
- Test connection with production credentials

### Monitoring
- Monitor API response times
- Track failed profile fetch attempts
- Log authentication failures

## Future Enhancements

### Planned Features
1. **Profile Picture Upload**: Direct S3 integration for profile images
2. **Audit Logging**: Track profile changes for compliance
3. **Bulk Operations**: Update multiple users simultaneously
4. **Advanced Search**: Search users by various criteria
5. **Profile Validation**: Enhanced data validation rules

### Integration Opportunities
1. **Real-time Updates**: WebSocket integration for live profile updates
2. **Notification System**: Notify users of profile changes
3. **Analytics**: Track profile completion rates and usage patterns
4. **Export/Import**: Bulk profile data management tools

## Troubleshooting Guide

### Step-by-Step Debugging

1. **Check MongoDB Connection**
   ```bash
   # Verify connection string in /src/lib/db.ts
   # Test connection to poligap_assets.users collection
   ```

2. **Verify User Data**
   ```javascript
   // Check if user exists in MongoDB Atlas
   db.users.findOne({ email: "user@example.com" })
   ```

3. **Test API Endpoint**
   ```bash
   # Direct API call
   curl "http://localhost:3000/api/users/profile?userId=USER_ID"
   ```

4. **Check Browser Console**
   - Look for network errors
   - Check authentication status
   - Verify API responses

5. **Use Test Component**
   - Add ProfileDataTest to any page
   - Test with known user IDs
   - Review detailed error messages

### Common Solutions

- **Clear browser cache** if seeing stale data
- **Restart development server** after environment changes
- **Check MongoDB Atlas network access** settings
- **Verify user permissions** in database

This integration provides a robust, scalable solution for managing user profiles directly from your MongoDB Atlas database while maintaining security and performance best practices.
