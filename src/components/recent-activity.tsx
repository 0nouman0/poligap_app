"use client";
import React, { useState, useEffect } from 'react';
import { useActivityStore, ActivityItem } from '@/stores/activity-store';
import { formatGlobalDate } from '@/utils/date.util';
import { 
  Shield, 
  FileText, 
  BookOpen, 
  NotebookPen, 
  MessageSquare, 
  Search, 
  Database, 
  History, 
  User, 
  Home,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case 'compliance-check':
      return <Shield {...iconProps} className="h-4 w-4 text-blue-600" />;
    case 'contract-review':
      return <FileText {...iconProps} className="h-4 w-4 text-green-600" />;
    case 'policy-generator':
      return <BookOpen {...iconProps} className="h-4 w-4 text-purple-600" />;
    case 'rules':
      return <NotebookPen {...iconProps} className="h-4 w-4 text-orange-600" />;
    case 'chat':
      return <MessageSquare {...iconProps} className="h-4 w-4 text-teal-600" />;
    case 'search':
      return <Search {...iconProps} className="h-4 w-4 text-gray-600" />;
    case 'knowledge-base':
      return <Database {...iconProps} className="h-4 w-4 text-indigo-600" />;
    case 'history':
      return <History {...iconProps} className="h-4 w-4 text-amber-600" />;
    case 'users':
      return <User {...iconProps} className="h-4 w-4 text-pink-600" />;
    default:
      return <Home {...iconProps} className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityTypeLabel = (type: ActivityItem['type']) => {
  const labels: Record<ActivityItem['type'], string> = {
    'compliance-check': 'Compliance',
    'contract-review': 'Contract',
    'policy-generator': 'Policy',
    'rules': 'Rules',
    'chat': 'Chat',
    'search': 'Search',
    'knowledge-base': 'Knowledge',
    'history': 'History',
    'profile': 'Profile',
    'users': 'Users'
  };
  return labels[type] || 'Activity';
};

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'compliant':
      return 'bg-green-100 text-green-800';
    case 'partial':
      return 'bg-yellow-100 text-yellow-800';
    case 'non-compliant':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface RecentActivityProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  limit = 10, 
  showHeader = true, 
  compact = false 
}) => {
  const { getRecentActivities, clearActivities, removeActivitiesByType } = useActivityStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only run on client side after hydration
    setIsHydrated(true);

    // Read from the activity store and filter to meaningful activities
    const raw = getRecentActivities(100); // get a larger slice then filter
    const allowedTypes: ActivityItem['type'][] = ['compliance-check', 'contract-review', 'policy-generator', 'rules', 'chat'];
    const filtered = raw
      .filter((a) => allowedTypes.includes(a.type))
      .filter((a) => {
        const action = a.action || '';
        // Exclude legacy "Visited ..." actions or profile visits
        if (action.startsWith('Visited ')) return false;
        if (a.type === 'profile') return false;
        return true;
      })
      .slice(0, limit);
    
    setActivities(filtered);
  }, [getRecentActivities, limit]);

  // Show loading state during hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? "p-4" : ""}>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading recent activity...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500 mt-1">
              Start by uploading documents for compliance analysis or contract review
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Only clear the visible high-signal types
              const allowedTypes: ActivityItem['type'][] = ['compliance-check', 'contract-review', 'policy-generator'];
              removeActivitiesByType(allowedTypes);
            }}
            className="text-xs"
          >
            Clear All
          </Button>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-4" : ""}>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${
                compact ? 'p-2' : ''
              }`}
            >
              {/* Activity Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {/* Activity Description */}
                    <p className={`font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>
                      {activity.action}
                    </p>

                    {/* Activity Details */}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${compact ? 'px-1 py-0' : ''}`}
                      >
                        {getActivityTypeLabel(activity.type)}
                      </Badge>

                      {activity.details.status && (
                        <Badge className={`text-xs ${getStatusColor(activity.details.status)}`}>
                          {activity.details.status}
                        </Badge>
                      )}

                      {activity.details.score !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {activity.details.score}%
                        </Badge>
                      )}
                    </div>

                    {/* Standards/Frameworks */}
                    {activity.details.standards && activity.details.standards.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {activity.details.standards.slice(0, 3).map((standard) => (
                          <span
                            key={standard}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {standard}
                          </span>
                        ))}
                        {activity.details.standards.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{activity.details.standards.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                      {formatGlobalDate(activity.timestamp, { showTime: true })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length >= limit && (
          <div className="text-center mt-4">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
