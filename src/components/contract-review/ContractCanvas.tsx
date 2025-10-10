"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye,
  EyeOff,
  CheckCircle,
  X,
  Undo2,
  History,
  RotateCcw,
  Clock,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Save
} from 'lucide-react';
import { useContractReviewStore } from '@/store/contractReview';

interface TooltipData {
  x: number;
  y: number;
  suggestion: any;
  visible: boolean;
}

export const ContractCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, suggestion: null, visible: false });
  const [showHighlights, setShowHighlights] = useState(true);
  
  const { 
    currentText, 
    suggestions, 
    patchStates,
    acceptSuggestion,
    rejectSuggestion,
    revertSuggestion,
    appliedFixes,
    // Version control
    versions,
    currentVersion,
    hasUnsavedChanges,
    switchToVersion,
    revertAllChanges,
    undoLastFix,
    saveChanges
  } = useContractReviewStore();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHighlightColor = (suggestion: any) => {
    switch (suggestion.type) {
      case 'addition': return 'bg-green-200 border-l-4 border-green-500 text-green-900';
      case 'deletion': return 'bg-red-200 border-l-4 border-red-500 text-red-900 line-through';
      case 'modification': return 'bg-yellow-200 border-l-4 border-yellow-500 text-yellow-900';
      case 'replacement': return 'bg-blue-200 border-l-4 border-blue-500 text-blue-900';
      default: return 'bg-gray-200 border-l-4 border-gray-500 text-gray-900';
    }
  };

  const handleAcceptSuggestion = (suggestionId: string) => {
    acceptSuggestion(suggestionId);
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    rejectSuggestion(suggestionId);
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderVersionHistory = () => {
    return (
      <Card className="mt-4 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <GitBranch className="h-4 w-4" />
              Version History ({versions.length} {versions.length === 1 ? 'version' : 'versions'})
            </h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={undoLastFix}
                disabled={appliedFixes.length === 0}
                className="text-xs"
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo Last
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={revertAllChanges}
                disabled={currentVersion === 0 && versions.length <= 1}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset All
              </Button>
            </div>
          </div>
          {versions.length === 0 ? (
            <div className="text-xs text-muted-foreground">No versions yet. Accept or reject a suggestion to create one.</div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    version.version === currentVersion
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                      : 'bg-muted border-border hover:bg-accent'
                  }`}
                  onClick={() => switchToVersion(version.version)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={version.version === currentVersion ? "default" : "secondary"} className="text-xs">
                        v{version.version}
                      </Badge>
                      {version.version === currentVersion && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(version.timestamp)}
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-foreground">{version.description}</p>
                    {version.appliedSuggestionTitle && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Applied: {version.appliedSuggestionTitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Version Details */}
          {versions.length > 0 && (
            <div className="mt-3 p-3 border border-border rounded bg-muted">
              {(() => {
                const current = versions.find(v => v.version === currentVersion) || versions[versions.length - 1];
                const prev = versions.find(v => v.version === (current.version - 1));
                const delta = prev ? Math.abs((current.content?.length || 0) - (prev.content?.length || 0)) : 0;
                return (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">v{current.version} Details</div>
                    <div className="text-xs text-muted-foreground">{current.description || 'Saved changes'}</div>
                    {current.appliedSuggestionTitle && (
                      <div className="text-xs text-foreground"><span className="font-medium">Applied change:</span> {current.appliedSuggestionTitle}</div>
                    )}
                    {prev && (
                      <div className="text-xs text-muted-foreground">Delta vs v{prev.version}: ~{delta} characters changed</div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTextWithInlineDiffs = () => {
    if (!currentText || suggestions.length === 0) {
      return <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{currentText}</div>;
    }

    const textElements: React.ReactElement[] = [];
    let lastIndex = 0;
    const sortedSuggestions = [...suggestions].sort((a, b) => a.startIndex - b.startIndex);

    sortedSuggestions.forEach((suggestion, index) => {
      const patchState = patchStates[suggestion.id];
      if (patchState === 'rejected') return;

      if (suggestion.startIndex > lastIndex) {
        textElements.push(
          <span key={`text-${index}`} className="text-gray-900 dark:text-gray-100">
            {currentText.slice(lastIndex, suggestion.startIndex)}
          </span>
        );
      }

      if (patchState === 'accepted') {
        textElements.push(
          <span key={suggestion.id} className="bg-green-50 dark:bg-green-900/50 text-foreground px-1 rounded">
            {suggestion.suggestedText}
          </span>
        );
      } else {
        textElements.push(
          <span
            key={suggestion.id}
            className="relative inline-block group"
          >
            {/* Deletion - Simple red highlight with inline buttons */}
            {suggestion.type === 'deletion' && (
              <span className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 dark:border-red-400 px-2 py-1 relative group">
                <span className="line-through text-red-900 dark:text-red-200">{suggestion.originalText}</span>
                <span className="ml-2 inline-flex gap-1">
                  <button
                    onClick={() => handleAcceptSuggestion(suggestion.id)}
                    className="text-xs bg-red-500 dark:bg-red-600 text-white px-2 py-1 rounded hover:bg-red-600 dark:hover:bg-red-700"
                    title={suggestion.reasoning}
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    className="text-xs bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                  >
                    Keep
                  </button>
                </span>
              </span>
            )}

            {/* Addition - Simple green highlight with inline buttons */}
            {suggestion.type === 'addition' && (
              <span className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 dark:border-green-400 px-2 py-1 relative">
                <span className="text-green-900 dark:text-green-200 font-medium">{suggestion.suggestedText}</span>
                <span className="ml-2 inline-flex gap-1">
                  <button
                    onClick={() => handleAcceptSuggestion(suggestion.id)}
                    className="text-xs bg-green-500 dark:bg-green-600 text-white px-2 py-1 rounded hover:bg-green-600 dark:hover:bg-green-700"
                    title={suggestion.reasoning}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    className="text-xs bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                  >
                    Skip
                  </button>
                </span>
              </span>
            )}

            {/* Modification - Simple yellow highlight with inline buttons */}
            {(suggestion.type === 'modification' || suggestion.type === 'replacement') && (
              <span className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 dark:border-yellow-400 px-2 py-1 relative">
                <span className="line-through text-red-800 dark:text-red-300">{suggestion.originalText}</span>
                <span className="mx-2 text-foreground">→</span>
                <span className="text-green-800 dark:text-green-200 font-medium">{suggestion.suggestedText}</span>
                <span className="ml-2 inline-flex gap-1">
                  <button
                    onClick={() => handleAcceptSuggestion(suggestion.id)}
                    className="text-xs bg-blue-500 dark:bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-600 dark:hover:bg-blue-700"
                    title={suggestion.reasoning}
                  >
                    Change
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    className="text-xs bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                  >
                    Keep
                  </button>
                </span>
              </span>
            )}
          </span>
        );
      }

      lastIndex = suggestion.endIndex;
    });

    if (lastIndex < currentText.length) {
      textElements.push(
        <span key="final-text" className="text-gray-900 dark:text-gray-100">
          {currentText.slice(lastIndex)}
        </span>
      );
    }

    return <div className="leading-relaxed whitespace-pre-wrap">{textElements}</div>;
  };

  return (
    <Card className="w-full bg-background">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">Contract Analysis</h3>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Review suggested changes by Kroolo AI</p>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button
                size="sm"
                onClick={saveChanges}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHighlights(!showHighlights)}
              className="flex items-center gap-2"
            >
              {showHighlights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showHighlights ? 'Hide' : 'Show'} Highlights
            </Button>
            
            {versions.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => switchToVersion(Math.max(0, currentVersion - 1))}
                  disabled={currentVersion === 0}
                  className="p-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Badge variant="default" className="text-xs px-2">
                  v{currentVersion}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => switchToVersion(Math.min(versions.length - 1, currentVersion + 1))}
                  disabled={currentVersion === versions.length - 1}
                  className="p-1"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Badge variant="secondary" className="text-xs">
              {suggestions.filter(s => patchStates[s.id] === 'pending').length} pending
            </Badge>
            <Badge variant="outline" className="text-xs">
              {suggestions.length} total suggestions
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: Canvas and stats */}
          <div className="lg:col-span-3">
            <div 
              ref={containerRef}
              className="border border-border rounded-lg p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[400px] max-h-[70vh] overflow-y-auto"
            >
              {showHighlights ? renderTextWithInlineDiffs() : (
                <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                  {currentText}
                </div>
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span>✅ {suggestions.filter(s => patchStates[s.id] === 'accepted').length} accepted</span>
                    <span>❌ {suggestions.filter(s => patchStates[s.id] === 'rejected').length} rejected</span>
                    <span>⏳ {suggestions.filter(s => patchStates[s.id] === 'pending').length} pending</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="inline-flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-200 dark:bg-green-800 border border-green-500 dark:border-green-400 rounded"></div>
                      Add ({suggestions.filter(s => s.type === 'addition').length})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-200 dark:bg-red-800 border border-red-500 dark:border-red-400 rounded"></div>
                      Remove ({suggestions.filter(s => s.type === 'deletion').length})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-800 border border-yellow-500 dark:border-yellow-400 rounded"></div>
                      Modify ({suggestions.filter(s => s.type === 'modification' || s.type === 'replacement').length})
                    </span>
                  </div>
                </div>
                
                {suggestions.filter(s => patchStates[s.id] === 'pending').length > 0 && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                    💡 Tip: Hover over buttons to see why each change is suggested. Click to accept or reject.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Version History sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-2">
              {renderVersionHistory()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
