"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, BarChart3, TrendingUp } from 'lucide-react';

export default function SeedDashboardPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);

  const seedDashboardData = async () => {
    setIsSeeding(true);
    try {
      console.log('🌱 Starting dashboard data seeding...');
      
      const userId = localStorage.getItem('user_id') || "68da404605eeba8349fc9d10";
      const companyId = "60f1b2b3c4d5e6f7a8b9c0d1";
      
      const response = await fetch('/api/analytics/seed-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          companyId
        }),
      });
      
      const result = await response.json();
      setSeedResult(result);
      
      if (result.success) {
        console.log('✅ Dashboard data seeded successfully');
      } else {
        console.error('❌ Failed to seed dashboard data:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      setSeedResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Seeding request failed' 
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Dashboard Data Seeding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🎯 What This Will Create:
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 25 sample search records across different categories</li>
                <li>• 15 document compliance analyses (HIPAA, GDPR, etc.)</li>
                <li>• 30 audit log entries for activity tracking</li>
                <li>• 8 flagged issues with various statuses</li>
                <li>• Realistic data spread over the last 30 days</li>
              </ul>
            </div>

            <Button 
              onClick={seedDashboardData} 
              disabled={isSeeding} 
              className="w-full"
              size="lg"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding Dashboard Data...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Seed Dashboard with Sample Data
                </>
              )}
            </Button>

            {seedResult && (
              <div className="mt-6 space-y-4">
                {seedResult.success ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      ✅ Dashboard Data Seeded Successfully!
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {seedResult.data?.searches || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Searches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {seedResult.data?.analyses || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Analyses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {seedResult.data?.auditLogs || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Audit Logs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {seedResult.data?.flaggedIssues || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">Flagged Issues</div>
                      </div>
                    </div>
                    <Button onClick={goToDashboard} className="w-full">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Interactive Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      ❌ Seeding Failed
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {seedResult.error}
                    </p>
                    <Button 
                      onClick={seedDashboardData} 
                      variant="outline" 
                      className="w-full mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Dashboard Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>📊 Analytics Overview:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Real-time search metrics</li>
                  <li>Document analysis counts</li>
                  <li>Compliance scores</li>
                  <li>Flagged issues tracking</li>
                </ul>
              </div>
              
              <div>
                <strong>🔍 Search Analytics:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Top search terms</li>
                  <li>Search frequency trends</li>
                  <li>Category breakdowns</li>
                  <li>Performance metrics</li>
                </ul>
              </div>
              
              <div>
                <strong>🛡️ Compliance Tracking:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Standards compliance scores</li>
                  <li>Recent analysis results</li>
                  <li>Compliance trends</li>
                  <li>Risk assessments</li>
                </ul>
              </div>
              
              <div>
                <strong>⚡ Activity Monitoring:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Recent user activities</li>
                  <li>System audit logs</li>
                  <li>Issue resolution tracking</li>
                  <li>Usage patterns</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div>
                  <strong>Seed the Data:</strong> Click the button above to populate your dashboard with realistic sample data
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div>
                  <strong>View Dashboard:</strong> Navigate to the dashboard to see interactive charts and analytics
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div>
                  <strong>Explore Features:</strong> Use time range filters, view detailed breakdowns, and track compliance metrics
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
