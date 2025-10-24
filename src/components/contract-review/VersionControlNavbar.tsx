"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Save,
  ChevronDown,
  GitBranch,
  RotateCcw,
  History,
  Clock,
  Undo2
} from 'lucide-react';
import { useContractReviewStore } from '@/store/contractReview';
import { formatGlobalDate } from '@/utils/date.util';

export const VersionControlNavbar: React.FC = () => {
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  
  const { 
    versions,
    currentVersion,
    hasUnsavedChanges,
    switchToVersion,
    revertAllChanges,
    undoLastFix,
    saveChanges,
    appliedFixes,
    suggestions,
    patchStates
  } = useContractReviewStore();

  const formatTimestamp = (date: Date) => {
    return formatGlobalDate(date, { showTime: true, timeFormat: "12h" });
  };

  const handleSave = () => {
    // Only save if there are actual changes
    if (hasUnsavedChanges) {
      saveChanges();
    }
  };

  const currentVersionData = versions.find(v => v.version === currentVersion);
  const hasChanges = hasUnsavedChanges || appliedFixes.length > 0;
  const pendingSuggestions = suggestions.filter(s => patchStates[s.id] === 'pending').length;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Version Selector */}
      <DropdownMenu open={isVersionDropdownOpen} onOpenChange={setIsVersionDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-8 px-3 text-sm font-medium flex items-center gap-2 min-w-[120px]"
          >
            <GitBranch className="h-3 w-3" />
            v{currentVersion}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            Version History ({versions.length} {versions.length === 1 ? 'version' : 'versions'})
          </div>
          
          {versions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No versions yet. Make changes and save to create versions.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {versions.slice().reverse().map((version) => (
                <DropdownMenuItem
                  key={version.id}
                  onClick={() => switchToVersion(version.version)}
                  className={`px-3 py-3 cursor-pointer ${
                    version.version === currentVersion
                      ? 'bg-blue-50 dark:bg-blue-950'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={version.version === currentVersion ? "default" : "secondary"} 
                          className="text-xs px-1.5 py-0.5"
                        >
                          v{version.version}
                        </Badge>
                        {version.version === currentVersion && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {version.description}
                      </p>
                      {version.appliedSuggestionTitle && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                          Applied: {version.appliedSuggestionTitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                      <Clock className="h-3 w-3" />
                      <span className="whitespace-nowrap">
                        {formatTimestamp(version.timestamp)}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Indicators */}
      <div className="flex items-center gap-2">
        {hasUnsavedChanges && (
          <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600">
            Unsaved Changes
          </Badge>
        )}
        
        {pendingSuggestions > 0 && (
          <Badge variant="secondary" className="text-xs">
            {pendingSuggestions} pending
          </Badge>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Undo Last */}
        <Button
          variant="ghost"
          size="sm"
          onClick={undoLastFix}
          disabled={appliedFixes.length === 0}
          className="h-8 px-3 text-sm"
        >
          <Undo2 className="h-3 w-3 mr-1" />
          Undo
        </Button>

        {/* Revert All */}
        <Button
          variant="ghost"
          size="sm"
          onClick={revertAllChanges}
          disabled={currentVersion === 0 && versions.length <= 1}
          className="h-8 px-3 text-sm"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Revert
        </Button>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`h-8 px-4 text-sm font-medium ${
            hasUnsavedChanges 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
          }`}
        >
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};
