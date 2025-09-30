"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugUserPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Get user ID from localStorage
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const runDebug = async () => {
    if (!userId) {
      alert('No user ID available');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/debug-user?userId=${userId}`);
      const result = await response.json();
      setDebugInfo(result.data);
    } catch (error) {
      console.error('Debug failed:', error);
      setDebugInfo({ error: 'Debug request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('__LOGIN_SESSION__');
    setUserId('');
    alert('LocalStorage cleared');
  };

  const refreshProfile = () => {
    window.location.href = '/profile';
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Current User ID from localStorage:</strong>
              <Badge variant="outline" className="ml-2">
                {userId || 'Not found'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button onClick={runDebug} disabled={isLoading || !userId}>
                {isLoading ? 'Running Debug...' : 'Debug User'}
              </Button>
              <Button onClick={refreshProfile} disabled={!userId} variant="default">
                Go to Profile
              </Button>
              <Button variant="outline" onClick={clearLocalStorage}>
                Clear LocalStorage
              </Button>
            </div>

            {debugInfo && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Debug Results:</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Check Database Connection:</strong>
                <p>Ensure MongoDB is running and accessible with the connection string in .env</p>
              </div>
              
              <div>
                <strong>2. Verify User Data:</strong>
                <p>The debug will show if the user exists and in what format</p>
              </div>
              
              <div>
                <strong>3. Check Authentication Flow:</strong>
                <p>Make sure your auth system is creating users in the correct format</p>
              </div>
              
              <div>
                <strong>4. Check Real Data:</strong>
                <p>Ensure your MongoDB Atlas database contains the actual user records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
