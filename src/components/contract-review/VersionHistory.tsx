'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Check } from 'lucide-react';
import { useContractReviewStore } from '@/store/contractReview';

export const VersionHistory: React.FC = () => {
  const { versions, currentVersion, switchToVersion } = useContractReviewStore();

  if (versions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4" />
          Versions ({versions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {versions
            .slice()
            .reverse()
            .map((version) => (
              <div
                key={version.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  version.version === currentVersion
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => switchToVersion(version.version)}
              >
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={version.version === currentVersion ? "default" : "outline"}
                    className="text-xs"
                  >
                    v{version.version}
                  </Badge>
                  <span className="text-sm text-gray-700 truncate">
                    {version.description}
                  </span>
                </div>
                {version.version === currentVersion && (
                  <Check className="h-3 w-3 text-blue-600 flex-shrink-0" />
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
