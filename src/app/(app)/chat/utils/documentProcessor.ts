"use client";

import { ProcessedFile, FileProcessingResult } from './fileProcessor';

export interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  documentType: string;
  extractedText: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
  };
}

export interface EnhancedProcessedFile extends ProcessedFile {
  analysis?: DocumentAnalysis;
  isAnalyzed?: boolean;
}

/**
 * Extracts text content from PDF using browser APIs
 */
const extractPdfTextClient = async (file: File): Promise<string> => {
  try {
    // For client-side PDF parsing, we'll use a simple approach
    // In production, you might want to use PDF.js or send to server
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to string and look for text patterns
    const text = new TextDecoder('latin1').decode(uint8Array);
    
    // Extract text between common PDF text markers
    const textMatches = text.match(/\(([^)]+)\)/g) || [];
    const extractedTexts = textMatches
      .map(match => match.slice(1, -1)) // Remove parentheses
      .filter(text => text.length > 2 && /[a-zA-Z]/.test(text)) // Filter meaningful text
      .join(' ');
    
    // Also try to extract text using stream patterns
    const streamMatches = text.match(/stream\s*(.*?)\s*endstream/g) || [];
    const streamTexts = streamMatches
      .map(match => match.replace(/stream|endstream/g, '').trim())
      .filter(text => text.length > 10)
      .join(' ');
    
    // Combine both extraction methods
    let combinedText = (extractedTexts + ' ' + streamTexts).trim();
    
    // Clean up the text
    combinedText = combinedText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (combinedText.length < 50) {
      // Fallback: try to extract any readable ASCII text
      const asciiText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .filter(word => word.length > 2 && /[a-zA-Z]/.test(word))
        .join(' ')
        .trim();
      
      if (asciiText.length > 50) {
        combinedText = asciiText.substring(0, 5000);
      } else {
        return `[PDF Document] ${file.name} - PDF file uploaded. This PDF contains ${(file.size / 1024).toFixed(1)}KB of data. The document structure suggests it may contain images, forms, or complex formatting. While text extraction is limited, you can still ask questions about common document elements like terms, conditions, dates, parties, etc.`;
      }
    }
    
    return combinedText.substring(0, 10000); // Limit to first 10k characters
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `[PDF Document] ${file.name} - PDF file uploaded (${(file.size / 1024).toFixed(1)}KB). Content extraction encountered an error, but the document is available for analysis. You can ask questions about typical document content.`;
  }
};

/**
 * Analyzes document content using Gemini AI
 */
const analyzeDocumentWithGemini = async (
  fileName: string,
  content: string,
  fileType: string
): Promise<DocumentAnalysis> => {
  try {
    const response = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        content,
        fileType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const analysis = await response.json();
    return analysis;
  } catch (error) {
    console.error('Document analysis error:', error);
    
    // Fallback analysis
    const wordCount = content.split(/\s+/).length;
    return {
      summary: `Document "${fileName}" has been uploaded and is ready for analysis. The document contains ${wordCount} words.`,
      keyPoints: [
        'Document uploaded successfully',
        `File type: ${fileType}`,
        `Word count: approximately ${wordCount} words`
      ],
      documentType: getDocumentType(fileType),
      extractedText: content,
      metadata: {
        wordCount,
        language: 'en'
      }
    };
  }
};

/**
 * Determines document type from file type
 */
const getDocumentType = (fileType: string): string => {
  if (fileType.includes('pdf')) return 'PDF Document';
  if (fileType.includes('word') || fileType.includes('document')) return 'Word Document';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Spreadsheet';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'Presentation';
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType.startsWith('text/')) return 'Text Document';
  return 'Document';
};

/**
 * Processes and analyzes documents with Gemini AI
 */
export const processDocumentsWithAI = async (files: File[]): Promise<FileProcessingResult> => {
  const processedFiles: EnhancedProcessedFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const processedFile: EnhancedProcessedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        isAnalyzed: false,
      };

      let extractedContent = '';

      // Extract content based on file type
      if (file.type.startsWith('image/')) {
        // Handle images
        try {
          const reader = new FileReader();
          const preview = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          processedFile.preview = preview;
          extractedContent = `[Image] ${file.name} - Image file ready for visual analysis.`;
        } catch (error) {
          processedFile.error = 'Failed to process image';
        }
      } else if (file.type.startsWith('text/') || 
                 file.type === 'application/json' ||
                 file.type === 'text/csv' ||
                 file.type === 'text/markdown') {
        // Handle text files
        try {
          const reader = new FileReader();
          extractedContent = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        } catch (error) {
          processedFile.error = 'Failed to read text file';
        }
      } else if (file.type === 'application/pdf') {
        // Handle PDF files
        extractedContent = await extractPdfTextClient(file);
      } else if (file.type.includes('document') || 
                 file.type.includes('wordprocessingml') ||
                 file.type.includes('spreadsheet') ||
                 file.type.includes('presentation')) {
        // Handle Office documents
        extractedContent = `[${getDocumentType(file.type)}] ${file.name} - Office document uploaded. Content will be analyzed by AI.`;
      } else {
        // Handle other file types
        extractedContent = `[${getDocumentType(file.type)}] ${file.name} - File uploaded for analysis.`;
      }

      // Analyze content with Gemini AI if we have extractable content
      if (extractedContent && extractedContent.length > 50) {
        try {
          const analysis = await analyzeDocumentWithGemini(
            file.name,
            extractedContent,
            file.type
          );
          
          processedFile.analysis = analysis;
          processedFile.content = analysis.summary;
          processedFile.isAnalyzed = true;
        } catch (error) {
          console.error('AI analysis failed:', error);
          processedFile.content = extractedContent;
        }
      } else {
        processedFile.content = extractedContent;
      }

      processedFiles.push(processedFile);
    } catch (error) {
      errors.push(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    files: processedFiles,
    errors
  };
};

/**
 * Formats analyzed files for chat context with rich information and full content
 */
export const formatAnalyzedFilesForChat = (files: EnhancedProcessedFile[]): string => {
  if (files.length === 0) return '';

  const fileDescriptions = files.map(file => {
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    let description = `**📄 ${file.name}** (${sizeInMB}MB)`;
    
    if (file.analysis) {
      description += `\n**Document Type:** ${file.analysis.documentType}`;
      description += `\n**Summary:** ${file.analysis.summary}`;
      
      if (file.analysis.keyPoints.length > 0) {
        description += `\n**Key Points:**`;
        file.analysis.keyPoints.slice(0, 3).forEach(point => {
          description += `\n• ${point}`;
        });
      }
      
      if (file.analysis.metadata.wordCount) {
        description += `\n**Word Count:** ${file.analysis.metadata.wordCount}`;
      }

      // Include the full extracted text for AI analysis
      if (file.analysis.extractedText) {
        description += `\n\n**DOCUMENT CONTENT FOR AI ANALYSIS:**\n${file.analysis.extractedText}`;
      }
    } else if (file.content) {
      description += `\n${file.content}`;
    }
    
    if (file.error) {
      description += `\n*⚠️ ${file.error}*`;
    }
    
    return description;
  }).join('\n\n---\n\n');

  return `📎 **Uploaded Documents:**\n\n${fileDescriptions}\n\n---\n\n**IMPORTANT: The above documents contain the full content that you can analyze and answer questions about. Please read through the document content carefully and provide detailed answers based on the actual content provided.**\n\n`;
};
