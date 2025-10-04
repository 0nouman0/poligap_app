"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Database, CheckCircle, XCircle } from 'lucide-react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export function ProfileDataTest() {
  const [testUserId, setTestUserId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [debugUsers, setDebugUsers] = useState<any>(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const [realUsers, setRealUsers] = useState<any>(null);
  const [isLoadingReal, setIsLoadingReal] = useState(false);

  const { profile, isLoading, error, fetchProfile } = useUserProfile();

  const testDirectAPI = async () => {
    if (!testUserId && !testEmail) {
      alert('Please enter either a User ID or Email');
      return;
    }

    setIsTestingAPI(true);
    setTestResult(null);

    try {
      const params = new URLSearchParams();
      if (testUserId) params.append('userId', testUserId);
      if (testEmail) params.append('email', testEmail);

      const response = await fetch(`/api/users/profile?${params}`);
      const result = await response.json();

      setTestResult({
        success: response.ok,
        status: response.status,
        data: result,
        timestamp: new Date().toLocaleString()
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const testHook = async () => {
    if (!testUserId && !testEmail) {
      alert('Please enter a User ID');
      return;
    }

    await fetchProfile(testUserId);
  };

  const loadDebugUsers = async () => {
    setIsLoadingDebug(true);
    try {
      const response = await fetch('/api/debug/users');
      const result = await response.json();
      setDebugUsers(result);
    } catch (err) {
      console.error('Failed to load debug users:', err);
    } finally {
      setIsLoadingDebug(false);
    }
  };

  const loadRealUsers = async () => {
    setIsLoadingReal(true);
    try {
      const response = await fetch('/api/debug/real-users');
      const result = await response.json();
      setRealUsers(result);
    } catch (err) {
      console.error('Failed to load real users:', err);
    } finally {
      setIsLoadingReal(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            MongoDB Profile Data Test
          </CardTitle>
          <CardDescription>
            Test the MongoDB user profile integration by fetching user data directly from your Atlas database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId">User ID (from MongoDB)</Label>
              <Input
                id="userId"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="e.g., 676b6d8a6a6f1c2f1b7f1b7f"
              />
            </div>
            <div>
              <Label htmlFor="email">Email (alternative)</Label>
              <Input
                id="email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={testDirectAPI} disabled={isTestingAPI}>
              {isTestingAPI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing API...
                </>
              ) : (
                'Test Direct API'
              )}
            </Button>
            <Button variant="outline" onClick={testHook} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Hook...
                </>
              ) : (
                'Test Hook'
              )}
            </Button>
            <Button variant="secondary" onClick={loadDebugUsers} disabled={isLoadingDebug}>
              {isLoadingDebug ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Show All Users'
              )}
            </Button>
            <Button variant="default" onClick={loadRealUsers} disabled={isLoadingReal} className="bg-green-600 hover:bg-green-700">
              {isLoadingReal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding...
                </>
              ) : (
                'Find Real Users'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hook Results */}
      {(profile || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Hook Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>Error: {error}</span>
              </div>
            ) : profile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Profile loaded successfully</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Name:</strong> {profile.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {profile.email}
                  </div>
                  <div>
                    <strong>User ID:</strong> {profile.userId}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <Badge variant="outline" className="ml-2">
                      {profile.status}
                    </Badge>
                  </div>
                  <div>
                    <strong>Designation:</strong> {profile.designation || 'Not set'}
                  </div>
                  <div>
                    <strong>Company:</strong> {profile.companyName || 'Not set'}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* API Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Test Results
            </CardTitle>
            <CardDescription>
              Direct API call results - {testResult.timestamp}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  Status: {testResult.status || 'Error'}
                </Badge>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Users List */}
      {realUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Real Users Found (Non-Mock Data)
            </CardTitle>
            <CardDescription>
              Real users: {realUsers.data?.totalRealUsers || 0} | Mock users: {realUsers.data?.totalMockUsers || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {realUsers.success ? (
              <div className="space-y-6">
                {realUsers.data?.realUsers?.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">✅ REAL USERS (Use these for authentic data):</h4>
                    <div className="space-y-3">
                      {realUsers.data.realUsers.map((user: any, index: number) => (
                        <div key={index} className="border-2 border-green-200 rounded-lg p-3 space-y-2 bg-green-50">
                          <div className="flex items-center justify-between">
                            <strong className="text-green-800">{user.name}</strong>
                            <Badge variant="default" className="bg-green-600">REAL USER</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                            <div><strong>Email:</strong> {user.email}</div>
                            <div><strong>Designation:</strong> {user.designation || 'Not set'}</div>
                            <div><strong>Company:</strong> {user.companyName || 'Not set'}</div>
                            <div><strong>Status:</strong> {user.status}</div>
                            <div><strong>_id:</strong> {user._id}</div>
                            <div><strong>userId:</strong> {user.userId || 'Not set'}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => setTestUserId(user._id)}
                            >
                              Use This Real User
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setTestEmail(user.email)}
                            >
                              Use Email
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-yellow-50 rounded-lg">
                    <XCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-yellow-800 mb-2">No Real Users Found</h4>
                    <p className="text-yellow-700">All users in your database appear to be mock data (Poligap User, etc.)</p>
                  </div>
                )}

                {realUsers.data?.mockUsers?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3">❌ MOCK USERS (Avoid these):</h4>
                    <div className="space-y-2">
                      {realUsers.data.mockUsers.map((user: any, index: number) => (
                        <div key={index} className="border border-red-200 rounded-lg p-2 bg-red-50">
                          <div className="flex items-center justify-between">
                            <span className="text-red-800">{user.name} - {user.email}</span>
                            <Badge variant="destructive">MOCK DATA</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                Error loading real users: {realUsers.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Users List */}
      {debugUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Available Users in MongoDB
            </CardTitle>
            <CardDescription>
              Total users: {debugUsers.data?.totalCount || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {debugUsers.success ? (
              <div className="space-y-3">
                {debugUsers.data?.users?.map((user: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong>{user.name}</strong>
                      <Badge variant="outline">{user.status}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><strong>_id:</strong> {user._id}</div>
                      <div><strong>userId:</strong> {user.userId || 'Not set'}</div>
                      <div><strong>email:</strong> {user.email}</div>
                      <div><strong>uniqueId:</strong> {user.uniqueId || 'Not set'}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setTestUserId(user._id)}
                      >
                        Use _id
                      </Button>
                      {user.userId && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setTestUserId(user.userId)}
                        >
                          Use userId
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setTestEmail(user.email)}
                      >
                        Use Email
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-red-600">
                Error loading users: {debugUsers.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. <strong>Find Real Users:</strong> 🟢 Click to find authentic users (not "Poligap User" mock data)</p>
          <p>2. <strong>Use Real User:</strong> Click "Use This Real User" button for authentic profile data</p>
          <p>3. <strong>Test API:</strong> Tests the /api/users/profile endpoint with real user ID</p>
          <p>4. <strong>Test Hook:</strong> Tests the useUserProfile React hook with real data</p>
          <p>5. <strong>Verify Results:</strong> Look for real names/emails, not "Poligap User" or "user@poligap.com"</p>
          <p>6. <strong>Show All Users:</strong> See all users including mock data for comparison</p>
        </CardContent>
      </Card>
    </div>
  );
}
