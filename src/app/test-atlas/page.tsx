"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAtlasPage() {
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const result = await response.json();
      setDbInfo(result);
    } catch (error) {
      console.error('Test failed:', error);
      setDbInfo({ success: false, error: 'Connection test failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>MongoDB Atlas Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test connection to your MongoDB Atlas database and view available data.
            </p>

            <Button onClick={testConnection} disabled={isLoading}>
              {isLoading ? 'Testing Connection...' : 'Test MongoDB Atlas Connection'}
            </Button>

            {dbInfo && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {dbInfo.success ? '✅ Connection Results:' : '❌ Connection Failed:'}
                </h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-sm max-h-96">
                  {JSON.stringify(dbInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Verify Connection:</strong>
                <p>The test above should show your MongoDB Atlas database connection status</p>
              </div>
              
              <div>
                <strong>2. Check User Data:</strong>
                <p>Look for users in the results to see what data is available</p>
              </div>
              
              <div>
                <strong>3. Match User ID:</strong>
                <p>Compare the user IDs in the database with your localStorage user_id</p>
              </div>
              
              <div>
                <strong>4. Test Profile:</strong>
                <p>Once you confirm data exists, test the profile page</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
