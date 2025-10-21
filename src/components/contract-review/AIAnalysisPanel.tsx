'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, RefreshCw } from 'lucide-react';
import { useContractReviewStore } from '@/store/contractReview';
import { geminiService } from '@/services/gemini';

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const AIAnalysisPanel: React.FC = () => {
  const {
    suggestions,
    patchStates,
    acceptSuggestion,
    rejectSuggestion,
    acceptAllSuggestions,
    revertAllChanges,
    isAnalyzing,
    currentText,
    selectedTemplate,
    setSuggestions,
    setIsAnalyzing,
    setIsLoading,
    setError
  } = useContractReviewStore();

  const runAnalysis = async () => {
    if (!currentText || !selectedTemplate) {
      setError('Please upload a contract and select a template first');
      return;
    }

    setIsAnalyzing(true);
    setIsLoading(true);
    setError(null);

    try {
      const result = await geminiService.analyzeContract(
        currentText,
        selectedTemplate.clauses,
        selectedTemplate.type
      );

      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Failed to analyze contract. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  };

  const pendingSuggestions = suggestions.filter(s => patchStates[s.id] === 'pending' || !patchStates[s.id]);
  const acceptedSuggestions = suggestions.filter(s => patchStates[s.id] === 'accepted');

  return (
    <div className="space-y-4">
      {/* Analysis Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4" />
              AI Analysis ({suggestions.length})
            </CardTitle>
            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing || !currentText || !selectedTemplate}
              size="sm"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Zap className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        {suggestions.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex gap-2 mb-3">
              {pendingSuggestions.length > 0 && (
                <Button
                  onClick={acceptAllSuggestions}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Accept All ({pendingSuggestions.length})
                </Button>
              )}
              {acceptedSuggestions.length > 0 && (
                <Button
                  onClick={revertAllChanges}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Revert All
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Suggestions List */}
      {pendingSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {pendingSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getRiskColor(suggestion.riskLevel)}>
                      {suggestion.riskLevel}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => acceptSuggestion(suggestion.id)}
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => rejectSuggestion(suggestion.id)}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-900 mb-1">
                    {suggestion.category} - {suggestion.clauseType}
                  </div>
                  <div className="text-xs text-gray-600">
                    {suggestion.suggestedText}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isAnalyzing && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {!currentText || !selectedTemplate 
                ? 'Upload a contract and select a template to analyze'
                : 'Click Analyze to get AI suggestions'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};