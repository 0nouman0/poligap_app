"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { useContractReviewStore } from '@/store/contractReview';
import { extractTextFromPdf } from '@/lib/pdf';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export const PdfUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { 
    setStructuredDoc, 
    setExtractedDocument, 
    setIsLoading, 
    setError, 
    updateCurrentText,
    selectedTemplate 
  } = useContractReviewStore();

  const processFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    
    // Add file to upload list
    setUploadedFiles(prev => [...prev, {
      file,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      setIsLoading(true);
      setError(null);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadedFiles(prev => prev.map(f => 
          f.file.name === file.name ? { ...f, progress: i } : f
        ));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update status to processing
      setUploadedFiles(prev => prev.map(f => 
        f.file.name === file.name ? { ...f, status: 'processing' } : f
      ));

      // Extract text from PDF
      const extractedText = await extractTextFromPdf(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }

      // Create structured document
      const structuredDoc = {
        title: file.name.replace('.pdf', ''),
        sections: [
          {
            key: 'main',
            title: 'Document Content',
            paragraphs: extractedText.split('\n\n').filter(p => p.trim().length > 0)
          }
        ],
        meta: {
          documentType: selectedTemplate?.name || 'Unknown',
          extractedAt: new Date().toISOString()
        }
      };

      // Create extracted document
      const extractedDocument = {
        id: fileId,
        fileName: file.name,
        fullText: extractedText,
        sections: [
          {
            id: 'main-section',
            title: 'Document Content',
            content: extractedText,
            startIndex: 0,
            endIndex: extractedText.length,
            hasGaps: false,
            gapIds: []
          }
        ],
        gaps: [],
        overallScore: 0.8,
        templateId: selectedTemplate?.id || 'default',
        metadata: {
          pageCount: 1,
          extractedAt: new Date(),
          fileSize: file.size
        }
      };

      // Update store
      setStructuredDoc(structuredDoc);
      setExtractedDocument(extractedDocument);
      updateCurrentText(extractedText);

      // Mark as completed
      setUploadedFiles(prev => prev.map(f => 
        f.file.name === file.name ? { ...f, status: 'completed', progress: 100 } : f
      ));

    } catch (error) {
      console.error('Error processing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF';
      
      setError(errorMessage);
      setUploadedFiles(prev => prev.map(f => 
        f.file.name === file.name ? { 
          ...f, 
          status: 'error', 
          error: errorMessage 
        } : f
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type === 'application/pdf') {
        processFile(file);
      } else {
        setError('Please upload only PDF files');
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Extracting text...';
      case 'completed':
        return 'Ready for analysis';
      case 'error':
        return file.error || 'Error occurred';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the PDF here...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Drag & drop a PDF contract here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF files up to 10MB
                </p>
              </div>
            )}
            <Button variant="outline" className="mt-4">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Uploaded Files</h3>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(uploadedFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {getStatusText(uploadedFile)}
                    </p>
                    
                    {(uploadedFile.status === 'uploading' || uploadedFile.status === 'processing') && (
                      <Progress value={uploadedFile.progress} className="h-2" />
                    )}
                    
                    {uploadedFile.status === 'error' && uploadedFile.error && (
                      <Alert className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {uploadedFile.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.file.name)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Selection Hint */}
      {!selectedTemplate && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Select a template first to get more accurate analysis results.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
