"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye,
  EyeOff
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({ x: 0, y: 0, suggestion: null, visible: false });
  const [showHighlights, setShowHighlights] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  
  const { 
    currentText, 
    suggestions, 
    patchStates,
    acceptSuggestion,
    rejectSuggestion,
    updateCurrentText,
    hasUnsavedChanges,
    generateMockSuggestions
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

  // Initialize editable text when currentText changes
  React.useEffect(() => {
    if (currentText && !isEditing) {
      setEditableText(currentText);
    }
  }, [currentText, isEditing]);

  const handleAcceptSuggestion = (suggestionId: string) => {
    acceptSuggestion(suggestionId);
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    rejectSuggestion(suggestionId);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditableText(currentText);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleStopEditing = () => {
    setIsEditing(false);
    updateCurrentText(editableText);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditableText(currentText); // Reset to original
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleStopEditing();
    }
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
    <div className="w-full max-w-4xl mx-auto">
      {/* Canvas Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">Contract Analysis</h3>
            {isEditing && (
              <Badge variant="default" className="text-xs bg-blue-600 text-white">
                Editing Mode
              </Badge>
            )}
            {hasUnsavedChanges && !isEditing && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isEditing 
              ? "Click anywhere to edit • Ctrl+Enter to save • Esc to cancel" 
              : "Review AI suggestions or click to edit text directly"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              {suggestions.length === 0 && currentText && (
                <Button
                  variant="default"
                  onClick={generateMockSuggestions}
                  className="h-8 px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Generate AI Suggestions
                </Button>
              )}
              
              {suggestions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowHighlights(!showHighlights)}
                  className="h-8 px-3 text-sm flex items-center gap-2"
                >
                  {showHighlights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showHighlights ? 'Hide' : 'Show'} Highlights
                </Button>
              )}
              
              {suggestions.length > 0 && (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {suggestions.filter(s => patchStates[s.id] === 'pending').length} pending
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {suggestions.length} total suggestions
                  </Badge>
                </>
              )}
            </>
          )}
          
          {isEditing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Characters: {editableText.length}</span>
              <span>Words: {editableText.split(/\s+/).filter(w => w.length > 0).length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Content */}
      <div 
        ref={containerRef}
        className="border border-border rounded-lg bg-white dark:bg-gray-900 min-h-[600px] max-h-[80vh] relative overflow-hidden"
      >
        {isEditing ? (
          /* Editing Mode */
          <div className="h-full">
            <textarea
              ref={textareaRef}
              value={editableText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full p-6 bg-transparent text-gray-900 dark:text-gray-100 leading-relaxed resize-none border-none outline-none font-mono text-sm"
              placeholder="Start typing to edit the contract..."
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditableText(currentText);
                }}
                className="text-xs"
              >
                Cancel (Esc)
              </Button>
              <Button
                size="sm"
                onClick={handleStopEditing}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save (Ctrl+Enter)
              </Button>
            </div>
          </div>
        ) : (
          /* Display Mode */
          <div 
            className="p-6 h-full overflow-y-auto cursor-text"
            onClick={handleStartEditing}
          >
            {showHighlights && suggestions.length > 0 ? renderTextWithInlineDiffs() : (
              <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {currentText || (
                  <span className="text-gray-400 italic">
                    Click here to start editing the contract...
                  </span>
                )}
              </div>
            )}
            {!isEditing && (
              <div className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEditing();
                  }}
                  className="text-xs"
                >
                  Edit Text
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canvas Footer Stats */}
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
  );
};
