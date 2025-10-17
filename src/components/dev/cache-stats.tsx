"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cacheManager } from '@/lib/cache-manager';
import { Database, Trash2, RefreshCw, TrendingUp, Clock } from 'lucide-react';

/**
 * Cache Statistics Component
 * 
 * Developer tool for monitoring cache performance
 * Only visible in development mode
 */
export function CacheStats() {
  const [stats, setStats] = useState(cacheManager.getStats());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClearAll = () => {
    cacheManager.clearAll();
    setStats(cacheManager.getStats());
    setRefreshKey(prev => prev + 1);
  };

  const handleCleanup = () => {
    cacheManager.cleanup();
    setStats(cacheManager.getStats());
    setRefreshKey(prev => prev + 1);
  };

  const hitRatePercentage = (stats.hitRate * 100).toFixed(1);
  const hitRateColor = stats.hitRate >= 0.7 ? 'text-green-600' : stats.hitRate >= 0.4 ? 'text-yellow-600' : 'text-red-600';

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-[#E6E6E6] z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[#2D2F34] flex items-center gap-2">
          <Database className="h-4 w-4 text-[#3B43D6]" />
          Cache Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hit Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#6A707C]">
            <TrendingUp className="h-3 w-3" />
            <span>Hit Rate</span>
          </div>
          <Badge className={`${hitRateColor} text-xs font-semibold`} variant="outline">
            {hitRatePercentage}%
          </Badge>
        </div>

        {/* Cache Hits */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6A707C]">Cache Hits</span>
          <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-800">
            {stats.hits}
          </Badge>
        </div>

        {/* Cache Misses */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6A707C]">Cache Misses</span>
          <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-800">
            {stats.misses}
          </Badge>
        </div>

        {/* Cache Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#6A707C]">
            <Clock className="h-3 w-3" />
            <span>Entries Cached</span>
          </div>
          <Badge variant="outline" className="text-xs border-[#E6E6E6] bg-[#EFF1F6] text-[#2D2F34]">
            {stats.size}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs bg-white border-[#E6E6E6] hover:bg-[#FAFAFB]"
            onClick={handleCleanup}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Cleanup
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs bg-white border-[#E6E6E6] hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            onClick={handleClearAll}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>

        {/* Info */}
        <div className="text-[10px] text-[#6A707C] pt-2 border-t border-[#E6E6E6]">
          Dev Mode Only • Auto-refresh every 2s
        </div>
      </CardContent>
    </Card>
  );
}
