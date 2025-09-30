"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuickFixPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
  }, []);

  const fixUserIssue = async () => {
    setIsFixing(true);
    try {
      console.log('🔧 Creating missing user...');
      
      const response = await fetch('/api/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
        }),
      });
      
      const result = await response.json();
      setResult(result);
      
      if (result.success) {
        console.log('✅ User created successfully!');
        setTimeout(() => {
          window.location.href = '/profile';
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Fix failed:', error);
      setResult({ success: false, error: 'Fix request failed' });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">🚨 Quick Fix User Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              User Not Found Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              User ID: <code className="bg-red-100 dark:bg-red-900 px-1 rounded">{currentUserId}</code>
            </p>
          </div>

          {!result && (
            <Button 
              onClick={fixUserIssue} 
              disabled={isFixing || !currentUserId}
              className="w-full"
              size="lg"
            >
              {isFixing ? '🔧 Creating User...' : '✨ Fix It Now!'}
            </Button>
          )}

          {result && result.success && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Fixed Successfully!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                User created in MongoDB Atlas. Redirecting to profile...
              </p>
              <Button 
                onClick={() => window.location.href = '/profile'}
                variant="outline"
                className="w-full"
              >
                Go to Profile Now
              </Button>
            </div>
          )}

          {result && !result.success && (
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                ❌ Fix Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {result.error}
              </p>
              <Button 
                onClick={fixUserIssue} 
                variant="outline"
                className="w-full mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p><strong>What this does:</strong></p>
            <p>Creates the missing user record in your MongoDB Atlas database</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
