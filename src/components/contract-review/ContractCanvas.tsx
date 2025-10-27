"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
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
  const [canvasSize, setCanvasSize] = useState<'small' | 'medium' | 'large' | 'fullscreen'>('medium');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  const { 
    currentText, 
    suggestions, 
    patchStates,
    acceptSuggestion,
    rejectSuggestion
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

  const getCanvasClasses = () => {
    const baseClasses = "border border-border rounded-lg p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto transition-all duration-300";
    
    switch (canvasSize) {
      case 'small':
        return `${baseClasses} min-h-[300px] max-h-[40vh] max-w-4xl mx-auto`;
      case 'medium':
        return `${baseClasses} min-h-[500px] max-h-[60vh] max-w-6xl mx-auto`;
      case 'large':
        return `${baseClasses} min-h-[600px] max-h-[70vh] max-w-7xl mx-auto`;
      case 'fullscreen':
        return `${baseClasses} min-h-[75vh] max-h-[75vh] w-full`;
      default:
        return `${baseClasses} min-h-[500px] max-h-[60vh] max-w-6xl mx-auto`;
    }
  };

  const getFontClasses = () => {
    switch (fontSize) {
      case 'small':
        return 'text-sm leading-relaxed';
      case 'medium':
        return 'text-base leading-relaxed';
      case 'large':
        return 'text-lg leading-relaxed';
      default:
        return 'text-base leading-relaxed';
    }
  };

  const toggleCanvasSize = () => {
    const sizes: Array<'small' | 'medium' | 'large' | 'fullscreen'> = ['small', 'medium', 'large', 'fullscreen'];
    const currentIndex = sizes.indexOf(canvasSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setCanvasSize(sizes[nextIndex]);
  };

  const adjustFontSize = (direction: 'up' | 'down') => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(fontSize);
    
    if (direction === 'up' && currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    } else if (direction === 'down' && currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  const renderTextWithInlineDiffs = () => {
    if (!currentText || suggestions.length === 0) {
      return currentText;
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
    <div className="w-full">
      {/* Canvas Controls */}
      <div className="flex flex-wrap items-center justify-end mb-4 gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHighlights(!showHighlights)}
            className="h-8 px-3 text-sm flex items-center gap-2"
          >
            {showHighlights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showHighlights ? 'Hide' : 'Show'} Highlights
          </Button>

          {/* Canvas Size Controls */}
          <div className="flex items-center gap-1 border border-border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCanvasSize}
              className="h-8 px-2 text-xs flex items-center gap-1"
              title={`Canvas: ${canvasSize} (click to cycle)`}
            >
              {canvasSize === 'fullscreen' ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              {canvasSize}
            </Button>
          </div>

          {/* Font Size Controls */}
          <div className="flex items-center gap-1 border border-border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustFontSize('down')}
              className="h-8 px-2"
              disabled={fontSize === 'small'}
              title="Decrease font size"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs px-2 text-muted-foreground border-x border-border">
              {fontSize}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adjustFontSize('up')}
              className="h-8 px-2"
              disabled={fontSize === 'large'}
              title="Increase font size"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            {suggestions.filter(s => patchStates[s.id] === 'pending').length} pending
          </Badge>
          <Badge variant="outline" className="text-xs">
            {suggestions.length} total suggestions
          </Badge>
      </div>

      {/* Canvas Content Container */}
      <div className="w-full">
        <div 
          ref={containerRef}
          className={getCanvasClasses()}
        >
        {showHighlights ? (
          <div className={`${getFontClasses()} whitespace-pre-wrap`}>
            {renderTextWithInlineDiffs()}
          </div>
        ) : (
          <div className={`${getFontClasses()} whitespace-pre-wrap`}>
            {currentText}
          </div>
        )}
        </div>
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
