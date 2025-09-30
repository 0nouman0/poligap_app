"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FixUserPage() {
  const [userCheck, setUserCheck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    // Get the failing user ID from localStorage
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
  }, []);

  const checkUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/check-users?searchUserId=${currentUserId}`);
      const result = await response.json();
      setUserCheck(result);
    } catch (error) {
      console.error('Check failed:', error);
      setUserCheck({ success: false, error: 'Check request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const useExistingUser = (userId: string) => {
    localStorage.setItem('user_id', userId);
    setCurrentUserId(userId);
    alert(`Updated user_id to: ${userId}\nNow refresh the profile page to test.`);
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix User Profile Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Current User ID (causing 404):</strong>
              <Badge variant="destructive" className="ml-2">
                {currentUserId || 'Not found'}
              </Badge>
            </div>

            <Button onClick={checkUsers} disabled={isLoading}>
              {isLoading ? 'Checking Users...' : 'Check What Users Exist in Database'}
            </Button>

            {userCheck && userCheck.success && (
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    📊 Database Status: {userCheck.data.totalUsers} users found
                  </h3>
                </div>

                {userCheck.data.totalUsers > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">Available Users:</h4>
                    <div className="space-y-2">
                      {userCheck.data.users.map((user: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div><strong>Name:</strong> {user.name || 'No name'}</div>
                            <div><strong>Email:</strong> {user.email || 'No email'}</div>
                            <div><strong>ID:</strong> {user._id}</div>
                            <div><strong>UserID:</strong> {user.userId || 'No userId field'}</div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => useExistingUser(user._id)}
                            variant="outline"
                          >
                            Use This User
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                      ⚠️ No Users Found in Database
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Your MongoDB Atlas database doesn't contain any users. You need to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      <li>Import users from your authentication system</li>
                      <li>Run company import processes</li>
                      <li>Manually add user records to MongoDB Atlas</li>
                    </ul>
                  </div>
                )}

                {userCheck.data.searchResults && (
                  <div>
                    <h4 className="font-medium mb-2">Search Results for {currentUserId}:</h4>
                    <div className="space-y-1">
                      {userCheck.data.searchResults.map((search: any, index: number) => (
                        <div key={index} className="text-sm">
                          <Badge variant={search.found ? "default" : "secondary"}>
                            {search.method}: {search.found ? "FOUND" : "NOT FOUND"}
                          </Badge>
                          {search.data && (
                            <span className="ml-2 text-muted-foreground">
                              {search.data.email}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {userCheck && !userCheck.success && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 rounded">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  ❌ Error: {userCheck.error}
                </h3>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/profile'}
              className="w-full"
            >
              Test Profile Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/debug-user'}
              className="w-full"
            >
              Advanced Debug
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
