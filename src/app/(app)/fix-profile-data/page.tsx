"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Database, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toastSuccess, toastError } from '@/components/toast-varients';

export default function FixProfileDataPage() {
  const [currentUserId, setCurrentUserId] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [realUsers, setRealUsers] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileTest, setProfileTest] = useState<any>(null);
  const [createUserData, setCreateUserData] = useState({
    name: '',
    email: '',
    designation: '',
    companyName: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Get current user ID from localStorage
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
      setNewUserId(storedUserId);
    }
  }, []);

  const loadRealUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/real-users');
      const result = await response.json();
      setRealUsers(result);
    } catch (err) {
      console.error('Failed to load real users:', err);
      toastError('Error', 'Failed to load real users');
    } finally {
      setIsLoading(false);
    }
  };

  const testCurrentProfile = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Testing current user ID:', currentUserId);
      const response = await fetch(`/api/users/profile?userId=${currentUserId}`);
      const result = await response.json();
      setProfileTest(result);
      
      console.log('📊 Profile test result:', result);
      
      if (result.success) {
        const isMockData = result.data.name === 'Poligap User' || 
                          result.data.name === 'Chat User' ||
                          result.data.email?.includes('poligap.com') ||
                          result.data.email?.includes('@poligap.com');
        
        console.log('🎭 Is mock data?', isMockData, {
          name: result.data.name,
          email: result.data.email
        });
        
        if (isMockData) {
          toastError('Mock Data Detected', `MongoDB record contains mock data: "${result.data.name}" - "${result.data.email}"`);
        } else {
          toastSuccess('Real Data Found', `Real user data: "${result.data.name}" - "${result.data.email}"`);
        }
      } else {
        toastError('Error', result.error || 'Failed to fetch profile');
      }
    } catch (err) {
      console.error('Failed to test profile:', err);
      toastError('Error', 'Failed to test current profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserId = () => {
    if (!newUserId.trim()) {
      toastError('Error', 'Please enter a valid user ID');
      return;
    }
    localStorage.setItem('user_id', newUserId.trim());
    setCurrentUserId(newUserId.trim());
    toastSuccess('Updated', 'User ID updated in localStorage. Refresh the profile page to see changes.');
  };

  const selectRealUser = (userId: string) => {
    setNewUserId(userId);
    localStorage.setItem('user_id', userId);
    setCurrentUserId(userId);
    toastSuccess('Updated', 'User ID updated in localStorage. Refresh the profile page to see changes.');
  };

  const createRealUser = async () => {
    if (!createUserData.name.trim() || !createUserData.email.trim()) {
      toastError('Error', 'Name and email are required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/debug/create-real-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createUserData),
      });

      const result = await response.json();

      if (result.success) {
        const userId = result.data.user._id || result.data.user.userId;
        
        // Automatically set this as the current user
        localStorage.setItem('user_id', userId);
        setCurrentUserId(userId);
        setNewUserId(userId);
        
        toastSuccess('Success!', `${result.data.action === 'created' ? 'Created' : 'Updated'} real user. Go to profile page to see your data!`);
        
        // Clear form
        setCreateUserData({ name: '', email: '', designation: '', companyName: '' });
        
        // Refresh real users list
        loadRealUsers();
      } else {
        toastError('Error', result.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      toastError('Error', 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Fix Profile Data - Use Real MongoDB Data</h1>
          <p className="text-muted-foreground">
            Replace mock "Poligap User" data with your real user information from MongoDB
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current Profile Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current User ID in localStorage:</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                  {currentUserId || 'Not set'}
                </code>
                <Button size="sm" variant="outline" onClick={testCurrentProfile} disabled={!currentUserId || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test Current'}
                </Button>
              </div>
            </div>

            {profileTest && (
              <div className="p-3 rounded-lg border">
                {profileTest.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {profileTest.data.name === 'Poligap User' || profileTest.data.email?.includes('poligap.com') ? (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <Badge variant="destructive">MOCK DATA DETECTED</Badge>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge variant="default" className="bg-green-600">REAL DATA</Badge>
                        </>
                      )}
                    </div>
                    <div className="text-sm">
                      <strong>Name:</strong> {profileTest.data.name}<br />
                      <strong>Email:</strong> {profileTest.data.email}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Error: {profileTest.error}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Find Real Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Find Real Users
            </CardTitle>
            <CardDescription>
              Find authentic users in your MongoDB database (not mock data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadRealUsers} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding Real Users...
                </>
              ) : (
                'Find Real Users in MongoDB'
              )}
            </Button>

            {realUsers && (
              <div className="mt-4 space-y-4">
                {realUsers.data?.realUsers?.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">✅ Real Users Found:</h4>
                    <div className="space-y-3">
                      {realUsers.data.realUsers.map((user: any, index: number) => (
                        <div key={index} className="border-2 border-green-200 rounded-lg p-3 bg-green-50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <strong className="text-green-800">{user.name}</strong>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                            <Badge variant="default" className="bg-green-600">REAL USER</Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            ID: {user._id}
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => selectRealUser(user._id)}
                          >
                            Use This Real User
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-yellow-50 rounded-lg">
                    <XCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-yellow-800 mb-2">No Real Users Found</h4>
                    <p className="text-yellow-700">All users in your database appear to be mock data</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Real User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Create Real User
            </CardTitle>
            <CardDescription>
              Create a new user with your real information in MongoDB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Your Real Name *</Label>
                <Input
                  id="name"
                  value={createUserData.name}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Your Real Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., john@company.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="designation">Job Title</Label>
                <Input
                  id="designation"
                  value={createUserData.designation}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={createUserData.companyName}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g., Your Company Inc"
                  className="mt-1"
                />
              </div>
            </div>
            <Button 
              onClick={createRealUser} 
              disabled={!createUserData.name.trim() || !createUserData.email.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Real User...
                </>
              ) : (
                'Create & Use Real User'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Manual User ID Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Manual User ID Update
            </CardTitle>
            <CardDescription>
              If you know a real user ID, enter it here to update your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newUserId">New User ID:</Label>
              <Input
                id="newUserId"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Enter real user ID from MongoDB"
                className="mt-1"
              />
            </div>
            <Button onClick={updateUserId} disabled={!newUserId.trim()}>
              Update User ID
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Fix Your Profile Data</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="font-semibold text-yellow-800 mb-2">🎭 Problem Identified:</p>
              <p className="text-yellow-700">Your MongoDB database contains mock data ("Poligap User"). The system is correctly fetching from MongoDB, but the actual record is mock data.</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-semibold text-green-800 mb-2">✅ Solution:</p>
              <ol className="text-green-700 space-y-1 list-decimal list-inside">
                <li><strong>Create Real User:</strong> Fill in your real name and email above</li>
                <li><strong>Click "Create & Use Real User":</strong> This creates a MongoDB record with your real data</li>
                <li><strong>Go to Profile Page:</strong> You'll now see your real name instead of "Poligap User"</li>
                <li><strong>Verify:</strong> Look for green "MongoDB Data" badges with your real information</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-semibold text-blue-800 mb-2">🔄 Alternative:</p>
              <p className="text-blue-700">If real users exist, click "Find Real Users" and use an existing authentic user.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
