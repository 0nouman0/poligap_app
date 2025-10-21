"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Eye,
  Copy,
  Share2
} from 'lucide-react';
import { useContractReviewStore } from '@/store/contractReview';

type ExportFormat = 'txt' | 'docx' | 'pdf' | 'html';

export const ExportPanel: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { 
    structuredDoc,
    suggestions,
    patchStates,
    exportRevisedDocument,
    currentText
  } = useContractReviewStore();

  const acceptedSuggestions = suggestions.filter(s => patchStates[s.id] === 'accepted');
  const rejectedSuggestions = suggestions.filter(s => patchStates[s.id] === 'rejected');
  const pendingSuggestions = suggestions.filter(s => 
    patchStates[s.id] !== 'accepted' && patchStates[s.id] !== 'rejected'
  );

  const handleExport = async () => {
    if (!currentText) return;

    setIsExporting(true);
    
    try {
      const revisedText = exportRevisedDocument();
      const fileName = `${structuredDoc?.title || 'contract'}_revised`;
      
      switch (exportFormat) {
        case 'txt':
          downloadTextFile(revisedText, `${fileName}.txt`);
          break;
        case 'html':
          downloadHtmlFile(revisedText, `${fileName}.html`);
          break;
        case 'docx':
          // For now, export as text with instructions to convert
          downloadTextFile(revisedText, `${fileName}.txt`);
          alert('DOCX export: Please copy the text and paste into Microsoft Word to save as DOCX');
          break;
        case 'pdf':
          // For now, export as text with instructions to convert
          downloadTextFile(revisedText, `${fileName}.txt`);
          alert('PDF export: Please copy the text and use a PDF converter or print to PDF');
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHtmlFile = (content: string, filename: string) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${structuredDoc?.title || 'Contract'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .content { white-space: pre-wrap; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${structuredDoc?.title || 'Contract'}</h1>
        <p>Revised on ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="content">${content.replace(/\n/g, '<br>')}</div>
    <div class="footer">
        <p>This document was processed with AI-powered contract review.</p>
        <p>Changes applied: ${acceptedSuggestions.length} accepted, ${rejectedSuggestions.length} rejected, ${pendingSuggestions.length} pending</p>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!currentText) return;
    
    try {
      const revisedText = exportRevisedDocument();
      await navigator.clipboard.writeText(revisedText);
      alert('Contract text copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const getPreviewText = () => {
    if (!currentText) return '';
    const revisedText = exportRevisedDocument();
    return revisedText.length > 500 ? revisedText.substring(0, 500) + '...' : revisedText;
  };

  if (!structuredDoc) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No document to export</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{acceptedSuggestions.length}</div>
              <div className="text-sm text-gray-600">Changes Applied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedSuggestions.length}</div>
              <div className="text-sm text-gray-600">Changes Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingSuggestions.length}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
          </div>

          {pendingSuggestions.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {pendingSuggestions.length} pending suggestions. 
                Consider reviewing them before exporting.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                  <SelectItem value="html">HTML Document (.html)</SelectItem>
                  <SelectItem value="docx">Word Document (.docx)</SelectItem>
                  <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Document'}
              </Button>
              
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Text
              </Button>
              
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide' : 'Preview'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Document Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">
                {getPreviewText()}
              </pre>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Showing preview of revised document with {acceptedSuggestions.length} changes applied.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Change Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {acceptedSuggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Applied Changes ({acceptedSuggestions.length})
                </h4>
                <div className="space-y-2">
                  {acceptedSuggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <span className="text-gray-600 truncate">
                        {suggestion.category}: {suggestion.reasoning.substring(0, 60)}...
                      </span>
                    </div>
                  ))}
                  {acceptedSuggestions.length > 5 && (
                    <div className="text-sm text-gray-500">
                      +{acceptedSuggestions.length - 5} more changes
                    </div>
                  )}
                </div>
              </div>
            )}

            {rejectedSuggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Rejected Changes ({rejectedSuggestions.length})
                </h4>
                <div className="space-y-2">
                  {rejectedSuggestions.slice(0, 3).map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <span className="text-gray-600 truncate">
                        {suggestion.category}: {suggestion.reasoning.substring(0, 60)}...
                      </span>
                    </div>
                  ))}
                  {rejectedSuggestions.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{rejectedSuggestions.length - 3} more rejected
                    </div>
                  )}
                </div>
              </div>
            )}

            {pendingSuggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Review ({pendingSuggestions.length})
                </h4>
                <div className="text-sm text-gray-600">
                  These suggestions have not been reviewed yet and won't be included in the export.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
