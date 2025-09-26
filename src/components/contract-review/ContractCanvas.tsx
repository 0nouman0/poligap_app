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
  Undo2
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
    appliedFixes
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

  const renderTextWithInlineDiffs = () => {
    if (!currentText || suggestions.length === 0) {
      return <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{currentText}</div>;
    }

    const textElements: React.ReactElement[] = [];
    let lastIndex = 0;
    const sortedSuggestions = [...suggestions].sort((a, b) => a.startIndex - b.startIndex);

    sortedSuggestions.forEach((suggestion, index) => {
      const patchState = patchStates[suggestion.id];
      if (patchState === 'rejected') return;

      if (suggestion.startIndex > lastIndex) {
        textElements.push(
          <span key={`text-${index}`}>
            {currentText.slice(lastIndex, suggestion.startIndex)}
          </span>
        );
      }

      if (patchState === 'accepted') {
        textElements.push(
          <span key={suggestion.id} className="bg-green-50 px-1 rounded">
            {suggestion.suggestedText}
          </span>
        );
      } else {
        textElements.push(
          <span
            key={suggestion.id}
            className="relative inline-block group"
          >
            {suggestion.type === 'deletion' && (
              <span className="bg-red-200 px-1 rounded line-through decoration-2 text-red-800 relative">
                {suggestion.originalText}
                <div className="absolute top-full left-0 mt-1 hidden group-hover:flex gap-1 z-10">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptSuggestion(suggestion.id)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6 rounded"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    className="text-xs border border-red-600 text-red-600 hover:bg-red-50 px-2 py-1 h-6 rounded"
                  >
                    Reject
                  </Button>
                  {patchStates[suggestion.id] === 'accepted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revertSuggestion(suggestion.id)}
                      className="text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 px-2 py-1 h-6 rounded flex items-center gap-1"
                    >
                      <Undo2 className="h-3 w-3" />
                      Undo
                    </Button>
                  )}
                </div>
              </span>
            )}
            {suggestion.type === 'addition' && (
              <>
                <span>{suggestion.originalText}</span>
                <span className="bg-green-200 px-1 rounded text-green-800 ml-1 relative group">
                  {suggestion.suggestedText}
                  <div className="absolute top-full left-0 mt-1 hidden group-hover:flex gap-1 z-10">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptSuggestion(suggestion.id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6 rounded"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectSuggestion(suggestion.id)}
                      className="text-xs border border-red-600 text-red-600 hover:bg-red-50 px-2 py-1 h-6 rounded"
                    >
                      Reject
                    </Button>
                    {patchStates[suggestion.id] === 'accepted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revertSuggestion(suggestion.id)}
                        className="text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 px-2 py-1 h-6 rounded flex items-center gap-1"
                      >
                        <Undo2 className="h-3 w-3" />
                        Undo
                      </Button>
                    )}
                  </div>
                </span>
              </>
            )}
            {(suggestion.type === 'modification' || suggestion.type === 'replacement') && (
              <span className="relative group">
                <span className="bg-red-200 px-1 rounded line-through decoration-2 text-red-800">
                  {suggestion.originalText}
                </span>
                <span className="bg-green-200 px-1 rounded text-green-800 ml-1">
                  {suggestion.suggestedText}
                </span>
                <div className="absolute top-full left-0 mt-1 hidden group-hover:flex gap-1 z-10">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptSuggestion(suggestion.id)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6 rounded"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    className="text-xs border border-red-600 text-red-600 hover:bg-red-50 px-2 py-1 h-6 rounded"
                  >
                    Reject
                  </Button>
                  {patchStates[suggestion.id] === 'accepted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revertSuggestion(suggestion.id)}
                      className="text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 px-2 py-1 h-6 rounded flex items-center gap-1"
                    >
                      <Undo2 className="h-3 w-3" />
                      Undo
                    </Button>
                  )}
                </div>
              </span>
            )}
          </span>
        );
      }

      lastIndex = suggestion.endIndex;
    });

    if (lastIndex < currentText.length) {
      textElements.push(
        <span key="text-end">
          {currentText.slice(lastIndex)}
        </span>
      );
    }

    return textElements;
  };

  const handleAcceptSuggestion = (suggestionId: string) => {
    acceptSuggestion(suggestionId);
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    rejectSuggestion(suggestionId);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowHighlights(!showHighlights)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {showHighlights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showHighlights ? 'Hide' : 'Show'} Highlights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Container with Inline Diffs */}
      <Card>
        <CardContent className="p-6">
          <div
            ref={containerRef}
            className="prose prose-lg max-w-none leading-relaxed text-gray-800"
            style={{ lineHeight: '1.8' }}
          >
            {renderTextWithInlineDiffs()}
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
};
