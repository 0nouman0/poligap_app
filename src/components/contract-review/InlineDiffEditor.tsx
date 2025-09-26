"use client";

import React, { useState, useEffect, useRef, JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Eye, 
  EyeOff, 
  FileText, 
  Clock, 
  Target,
  TrendingUp,
  Undo2,
  Info,
  Sparkles,
  RefreshCw,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { useContractReviewStore, AISuggestion } from '@/store/contractReview';
import { geminiService } from '@/services/gemini';

interface InlineDiffEditorProps {
  className?: string;
}


export const InlineDiffEditor: React.FC<InlineDiffEditorProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    currentText,
    suggestions,
    selectedTemplate,
    patchStates,
    acceptSuggestion,
    rejectSuggestion,
    revertSuggestion,
    setSuggestions,
    setIsAnalyzing,
    isAnalyzing,
    acceptAllSuggestions
  } = useContractReviewStore();

  // Debug logging
  console.log('🔍 InlineDiffEditor render:', {
    currentTextLength: currentText?.length || 0,
    suggestionsCount: suggestions?.length || 0,
    selectedTemplate: selectedTemplate?.name,
    isAnalyzing,
    hasText: !!currentText,
    textPreview: currentText?.substring(0, 100) + '...'
  });


  const analyzeDiffsWithAI = async () => {
    console.log('🚀 Starting AI analysis process...');
    
    if (!currentText) {
      console.log('❌ No currentText available for analysis');
      return;
    }
    
    if (!selectedTemplate) {
      console.log('❌ No selectedTemplate available for analysis');
      console.log('Available templates in store:', useContractReviewStore.getState().availableTemplates);
      // Use default template if none selected
      const defaultTemplate = useContractReviewStore.getState().availableTemplates[0];
      if (defaultTemplate) {
        console.log('🔄 Using default template:', defaultTemplate.name);
        useContractReviewStore.getState().setSelectedTemplate(defaultTemplate);
        return; // This will trigger useEffect again with the template
      } else {
        console.log('❌ No templates available at all');
        return;
      }
    }
    
    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('🔑 NEXT_PUBLIC_GEMINI_API_KEY not found in environment');
      alert('⚠️ Gemini API Key Missing\n\nPlease add your Gemini API key to the .env.local file:\nNEXT_PUBLIC_GEMINI_API_KEY=your_key_here');
      return;
    } else {
      console.log('✅ API key found, length:', apiKey.length);
    }
    
    setIsAnalyzing(true);
    try {
      console.log('🔍 Starting Gemini analysis for entire document...');
      console.log('Document length:', currentText.length);
      console.log('Template:', selectedTemplate.name);
      
      const analysisResult = await geminiService.analyzeContract(
        currentText, 
        selectedTemplate.clauses, 
        selectedTemplate.type
      );
      
      console.log('✅ Gemini analysis completed');
      console.log('Suggestions found:', analysisResult.suggestions.length);
      console.log('Suggestions distribution:', analysisResult.suggestions.map(s => ({
        id: s.id,
        section: s.section,
        startIndex: s.startIndex,
        endIndex: s.endIndex,
        type: s.type
      })));
      
      // Normalize suggestions to store's AISuggestion type
      const diffSuggestions: AISuggestion[] = analysisResult.suggestions.map(suggestion => ({
        id: suggestion.id,
        type: suggestion.type,
        severity: suggestion.severity,
        category: suggestion.category,
        confidence: suggestion.confidence,
        originalText: suggestion.originalText || '',
        suggestedText: suggestion.suggestedText,
        startIndex: suggestion.startIndex,
        endIndex: suggestion.endIndex,
        reasoning: suggestion.reasoning,
        legalImplications: suggestion.legalImplications,
        riskLevel: suggestion.riskLevel,
        section: suggestion.section || 'General',
        timestamp: suggestion.timestamp,
        status: suggestion.status,
        clauseType: suggestion.clauseType
      }));
      
      console.log('📊 Final suggestions for UI:', diffSuggestions.length);
      setSuggestions(diffSuggestions);
    } catch (error) {
      console.error('❌ Error analyzing contract with Gemini:', error);
      
      // Show error message instead of fallback suggestions
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('API key')) {
        console.error('🔑 Gemini API key not configured');
        alert('⚠️ Gemini API Key Required\n\nTo get real-time AI suggestions, please:\n1. Get a Gemini API key from Google AI Studio\n2. Add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file\n3. Restart the development server');
      } else {
        console.error('🚫 AI service error:', errorMessage);
        alert(`❌ AI Analysis Failed\n\n${errorMessage}\n\nPlease check your internet connection and API key.`);
      }
      
      // Clear any existing suggestions instead of showing mock data
      setSuggestions([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (currentText && currentText !== "Upload a PDF to see the contract analysis with AI-powered diff suggestions.") {
      console.log('🔄 Triggering analysis due to text/template change');
      console.log('Current text length:', currentText.length);
      console.log('Selected template:', selectedTemplate?.name);
      analyzeDiffsWithAI();
    }
  }, [currentText, selectedTemplate]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'legal_compliance': return <AlertTriangle className="h-3 w-3" />;
      case 'risk_mitigation': return <AlertTriangle className="h-3 w-3" />;
      case 'completeness': return <FileText className="h-3 w-3" />;
      case 'clarity': return <Eye className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const formatText = (text: string) => {
    if (!text) return text;
    
    // Enhanced text processing for contract documents
    const processTextContent = (content: string) => {
      return content
        // Bold important terms with more visible styling
        .replace(/\b(Service Level Agreements?|SLA|Agreement|Contract|Party|Parties|shall|will|must|required|obligation|liability|indemnification|termination|breach|default|local authorities?|public sector|organizations?|outsourcing|service level|vendor|customer|performance|quality|reliability|responsiveness|environmental standards?|cost|negotiation|agreement|establishing|quantifying|service levels?)\b/gi, '<strong class="bg-yellow-200 px-1 rounded font-bold text-gray-900">$1</strong>')
        // Italicize definitions and quoted terms
        .replace(/('([^']+)'|"([^"]+)")/g, '<em class="bg-blue-100 px-1 rounded text-blue-800 font-medium">$1</em>')
        // Highlight monetary amounts
        .replace(/\$[\d,]+(\.\d{2})?/g, '<span class="font-bold text-green-800 bg-green-100 px-2 py-1 rounded border">$&</span>')
        // Highlight dates
        .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi, '<span class="font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded">$&</span>')
        // Highlight percentages and numbers
        .replace(/\b\d+%|\b\d+\.\d+%/g, '<span class="font-semibold text-purple-700 bg-purple-100 px-1 rounded">$&</span>')
        // Highlight section markers
        .replace(/(###?\s*|##\s*)/g, '<span class="text-blue-600 font-bold">$1</span>');
    };
    
    // Split text into sentences for better processing
    const sentences = text.split(/(?<=[.!?])\s+/);
    const formattedContent = sentences.map((sentence, index) => {
      const trimmedSentence = sentence.trim();
      
      if (!trimmedSentence) return null;
      
      // Check if this looks like a title or header
      if (index < 3 && (
        trimmedSentence.startsWith('###') || 
        trimmedSentence.startsWith('##') ||
        trimmedSentence.startsWith('# ') ||
        /Service Level Agreements?/i.test(trimmedSentence) ||
        /Introduction/i.test(trimmedSentence) ||
        trimmedSentence.length < 100 && /^[A-Z][A-Za-z\s]{10,}/.test(trimmedSentence)
      )) {
        return (
          <h1 key={`title-${index}`} className="text-2xl font-bold text-blue-900 mb-4 mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm" dangerouslySetInnerHTML={{ __html: processTextContent(trimmedSentence) }} />
        );
      }
      
      // Check for section headers
      if (/^(What is a Service Level Agreement|Main Components of an SLA|Defining and Describing Service Level Agreements)/i.test(trimmedSentence)) {
        return (
          <h2 key={`section-${index}`} className="text-xl font-bold text-blue-800 mb-3 mt-5 bg-blue-50 p-3 rounded border-l-4 border-blue-400" dangerouslySetInnerHTML={{ __html: processTextContent(trimmedSentence) }} />
        );
      }
      
      // Regular sentences with enhanced formatting
      return (
        <div key={`sentence-${index}`} className="mb-3 text-gray-800 leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: processTextContent(trimmedSentence) }} />
      );
    }).filter(Boolean);
    
    return <div className="formatted-content space-y-3 p-4">{formattedContent}</div>;
  };

  const renderTextWithInlineDiffs = () => {
    if (!currentText) {
      return <div className="text-gray-500 italic">No document loaded</div>;
    }
    
    if (suggestions.length === 0) {
      return (
        <div className="prose prose-lg max-w-none">
          {formatText(currentText)}
        </div>
      );
    }

    const textElements: JSX.Element[] = [];
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
            className="relative inline-block group cursor-pointer"
          >
            {suggestion.type === 'deletion' && (
              <span className="bg-red-200 px-1 rounded line-through decoration-2 text-red-800 relative">
                {suggestion.originalText}
                <div className="absolute top-full left-0 mt-1 hidden group-hover:flex gap-1 z-10">
                  <Button
                    size="sm"
                    onClick={() => acceptSuggestion(suggestion.id)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6 rounded"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectSuggestion(suggestion.id)}
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
                      onClick={() => acceptSuggestion(suggestion.id)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6 rounded"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectSuggestion(suggestion.id)}
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
                    onClick={() => acceptSuggestion(suggestion.id)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-6 rounded"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectSuggestion(suggestion.id)}
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

  const pendingSuggestions = suggestions.filter(s => patchStates[s.id] === 'pending');
  const acceptedSuggestions = suggestions.filter(s => patchStates[s.id] === 'accepted');
  const rejectedSuggestions = suggestions.filter(s => patchStates[s.id] === 'rejected');

  return (
    <div className={`w-full min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              AI-Powered Contract Review
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Intelligent contract analysis • Real-time suggestions • Interactive editing
              {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? (
                <span className="ml-2 text-green-600 font-medium">✅ AI Ready</span>
              ) : (
                <span className="ml-2 text-red-600 font-medium">❌ API Key Missing</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={analyzeDiffsWithAI}
              disabled={isAnalyzing || !currentText}
              className="flex items-center gap-2"
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting Real AI Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  🤖 Real-Time AI Analysis ({suggestions.length} suggestions)
                </>
              )}
            </Button>
            
            <Button
              onClick={() => {
                console.log('🔍 Manual debug trigger');
                console.log('Current state:', {
                  currentText: !!currentText,
                  textLength: currentText?.length,
                  selectedTemplate: selectedTemplate?.name,
                  suggestionsCount: suggestions.length,
                  isAnalyzing
                });
                analyzeDiffsWithAI();
              }}
              variant="outline"
              size="sm"
            >
              Debug Analysis
            </Button>
            
            <Button
              onClick={() => {
                console.log('🤖 Triggering real-time AI analysis...');
                analyzeDiffsWithAI();
              }}
              variant="secondary"
              size="sm"
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              🤖 Get AI Suggestions
            </Button>
            
            <Button
              onClick={() => {
                // Force re-render to show formatting
                console.log('🎨 Forcing format refresh');
                const currentStore = useContractReviewStore.getState();
                currentStore.updateCurrentText(currentStore.currentText + ' ');
                setTimeout(() => {
                  currentStore.updateCurrentText(currentStore.currentText.trim());
                }, 100);
              }}
              variant="outline"
              size="sm"
              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            >
              🎨 Refresh Format
            </Button>
            {pendingSuggestions.length > 0 && (
              <Button
                onClick={acceptAllSuggestions}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Accept All ({pendingSuggestions.length})
              </Button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 bg-red-200 rounded-full"></span>
              <span>Deletions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 bg-green-200 rounded-full"></span>
              <span>Additions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-3 h-3 bg-yellow-200 rounded-full"></span>
              <span>Modifications</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {pendingSuggestions.length} pending
            </Badge>
            <Badge className="text-xs bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {acceptedSuggestions.length} accepted
            </Badge>
            <Badge className="text-xs bg-red-100 text-red-800">
              <X className="h-3 w-3 mr-1" />
              {rejectedSuggestions.length} rejected
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Contract Document</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div
              ref={containerRef}
              className="prose prose-lg max-w-none leading-relaxed text-gray-800 formatted-document"
              style={{ 
                lineHeight: '1.8',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Analyzing contract with AI...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  </div>
                </div>
              ) : (
                renderTextWithInlineDiffs()
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .formatted-document {
          counter-reset: section;
          font-family: 'Georgia', 'Times New Roman', serif;
          background: linear-gradient(to bottom, #ffffff, #f8fafc);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        
        .formatted-document h1 {
          color: #1e40af !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-family: 'Arial', sans-serif !important;
          letter-spacing: 0.5px;
          font-size: 1.75rem !important;
          font-weight: 800 !important;
          margin: 1.5rem 0 !important;
          padding: 1rem !important;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
          border-radius: 8px !important;
          border-left: 6px solid #3b82f6 !important;
        }
        
        .formatted-document h2 {
          color: #1e40af !important;
          font-family: 'Arial', sans-serif !important;
          position: relative;
          counter-increment: section;
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin: 1.25rem 0 !important;
          padding: 0.75rem !important;
          background: #f1f5f9 !important;
          border-radius: 6px !important;
          border-left: 4px solid #3b82f6 !important;
        }
        
        .formatted-document h2:before {
          content: "§ " counter(section) ". ";
          color: #3b82f6 !important;
          font-weight: bold !important;
          margin-right: 8px !important;
        }
        
        .formatted-document h3 {
          color: #374151 !important;
          font-family: 'Arial', sans-serif !important;
          border-bottom: 2px solid #e5e7eb !important;
          padding-bottom: 6px !important;
          font-weight: 600 !important;
          margin: 1rem 0 !important;
        }
        
        .formatted-document p {
          text-align: justify !important;
          margin-bottom: 1.25rem !important;
          line-height: 1.8 !important;
          text-indent: 1.5rem !important;
          hyphens: auto !important;
          font-size: 1rem !important;
        }
        
        .formatted-document li {
          margin-bottom: 0.75rem !important;
          line-height: 1.7 !important;
          text-align: justify !important;
        }
        
        .formatted-document ul, .formatted-document ol {
          margin-bottom: 1.5rem !important;
          padding-left: 2rem !important;
        }
        
        .formatted-content {
          font-size: 16px !important;
          line-height: 1.8 !important;
        }
        
        /* Enhanced styling for important terms - Make them VERY visible */
        .formatted-document strong {
          color: #1f2937 !important;
          font-weight: 800 !important;
          background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%) !important;
          padding: 3px 6px !important;
          border-radius: 4px !important;
          border: 1px solid #f59e0b !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
        }
        
        .formatted-document em {
          color: #059669 !important;
          font-style: italic !important;
          background: #ecfdf5 !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          border: 1px solid #10b981 !important;
        }
        
        /* Make all highlighted content more prominent */
        .formatted-document .bg-yellow-200 {
          background: #fef3c7 !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          border: 1px solid #f59e0b !important;
          font-weight: 700 !important;
        }
        
        .formatted-document .bg-blue-100 {
          background: #dbeafe !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          border: 1px solid #3b82f6 !important;
        }
        
        .formatted-document .bg-green-100 {
          background: #dcfce7 !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          border: 1px solid #10b981 !important;
        }
        
        .formatted-document .bg-purple-100 {
          background: #e9d5ff !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          border: 1px solid #8b5cf6 !important;
        }
        
        /* Professional document styling */
        .formatted-document {
          max-width: none !important;
          margin: 0 auto !important;
        }
        
        /* Print-friendly styles */
        @media print {
          .formatted-document {
            background: white !important;
            box-shadow: none !important;
            padding: 1rem !important;
          }
        }
        
        /* Responsive typography */
        @media (max-width: 768px) {
          .formatted-document {
            padding: 1rem !important;
            font-size: 14px !important;
          }
          
          .formatted-document h1 {
            font-size: 1.5rem !important;
          }
          
          .formatted-document h2 {
            font-size: 1.125rem !important;
          }
        }
      `}</style>
    </div>
  );
};
