import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Extract and parse document content using Gemini AI
 * This provides clean, readable text extraction from various document types
 */
export async function parseDocumentWithGemini(file: File): Promise<{
  success: boolean;
  content: string;
  summary: string;
  keyPoints: string[];
  documentType: string;
  error?: string;
}> {
  const fileName = file.name;
  console.log(`🤖 Starting Gemini-powered document parsing for: ${fileName}`);

  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Convert file to base64 for Gemini API
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine MIME type
    const mimeType = file.type || getMimeTypeFromExtension(fileName);
    
    console.log(`📄 File details: ${fileName}, Type: ${mimeType}, Size: ${file.size} bytes`);

    // Try different Gemini models with proper API version
    const modelVersions = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-8b',
      'gemini-pro'
    ];

    let result = null;
    let lastError = null;

    for (const modelVersion of modelVersions) {
      try {
        console.log(`🔄 Trying Gemini model: ${modelVersion}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelVersion,
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          }
        });

        // Create the prompt for document analysis
        const prompt = `
You are an expert document analyzer. Please analyze this document and extract its content in a clean, readable format.

Document: ${fileName}
File Type: ${mimeType}

Please provide a JSON response with the following structure:
{
  "content": "Full extracted text content from the document - make this as complete as possible",
  "summary": "2-3 sentence summary of what this document is about",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "documentType": "Type of document (e.g., Contract, Policy, Report, Manual, etc.)"
}

IMPORTANT INSTRUCTIONS:
1. Extract ALL readable text from the document, not just a summary
2. The "content" field should contain the complete document text in a clean, readable format
3. Remove any formatting artifacts, gibberish, or binary data
4. Preserve the actual meaning and structure of the text
5. If you cannot extract text, explain why in the content field
6. Focus on making the text human-readable and useful for Q&A

Provide only the JSON response, no additional text.`;

        // For PDF and image files, include the file data
        if (mimeType.includes('pdf') || mimeType.includes('image')) {
          const response = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]);
          
          result = await response.response;
        } else {
          // For text-based files, try text extraction first
          let textContent = '';
          
          if (mimeType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            textContent = new TextDecoder().decode(arrayBuffer);
          } else {
            // For other file types, include the binary data
            const response = await model.generateContent([
              prompt,
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]);
            
            result = await response.response;
          }
          
          if (textContent) {
            // For text files, analyze the extracted content
            const textAnalysisPrompt = `${prompt}

Document Content:
${textContent.substring(0, 10000)} ${textContent.length > 10000 ? '...' : ''}`;

            const response = await model.generateContent(textAnalysisPrompt);
            result = await response.response;
          }
        }

        if (result) {
          const responseText = result.text();
          console.log(`✅ Successfully used Gemini model: ${modelVersion}`);
          console.log(`📄 Response preview: ${responseText.substring(0, 200)}...`);
          
          // Parse the JSON response
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const analysis = JSON.parse(jsonMatch[0]);
              
              // Validate the response structure
              if (analysis.content && analysis.summary && analysis.keyPoints && analysis.documentType) {
                return {
                  success: true,
                  content: analysis.content,
                  summary: analysis.summary,
                  keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
                  documentType: analysis.documentType
                };
              }
            }
            
            // If JSON parsing fails, use the raw response as content
            return {
              success: true,
              content: responseText,
              summary: `Document "${fileName}" has been processed and analyzed.`,
              keyPoints: ['Document successfully processed', 'Content extracted using AI', 'Ready for questions'],
              documentType: 'Document'
            };
          } catch (parseError) {
            console.warn('⚠️ JSON parsing failed, using raw response');
            return {
              success: true,
              content: responseText,
              summary: `Document "${fileName}" has been processed and analyzed.`,
              keyPoints: ['Document successfully processed', 'Content extracted using AI', 'Ready for questions'],
              documentType: 'Document'
            };
          }
        }
      } catch (modelError: any) {
        console.log(`❌ Model ${modelVersion} failed:`, modelError?.message || modelError);
        lastError = modelError;
        continue;
      }
    }

    // If all models failed
    throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);

  } catch (error) {
    console.error('❌ Gemini document parsing failed:', error);
    
    return {
      success: false,
      content: `Document parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      summary: `Failed to parse document "${fileName}"`,
      keyPoints: ['Document upload detected', 'Parsing failed', 'Manual content description may be needed'],
      documentType: 'Document',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'svg': 'image/svg+xml'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Enhanced document processor that uses Gemini AI as primary method
 */
export async function processDocumentWithGemini(file: File): Promise<{
  name: string;
  size: number;
  type: string;
  content: string;
  analysis?: {
    summary: string;
    keyPoints: string[];
    documentType: string;
    extractedText: string;
    metadata: {
      wordCount: number;
      language: string;
      pageCount?: number;
      processingMethod: string;
      aiAnalysis: boolean;
    };
  };
  isAnalyzed: boolean;
  error?: string;
}> {
  console.log(`🚀 Processing document with Gemini: ${file.name}`);
  
  try {
    const geminiResult = await parseDocumentWithGemini(file);
    
    if (geminiResult.success) {
      const wordCount = geminiResult.content.split(/\s+/).length;
      
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        content: geminiResult.content,
        analysis: {
          summary: geminiResult.summary,
          keyPoints: geminiResult.keyPoints,
          documentType: geminiResult.documentType,
          extractedText: geminiResult.content,
          metadata: {
            wordCount,
            language: 'en',
            pageCount: Math.ceil(wordCount / 250),
            processingMethod: 'gemini_ai',
            aiAnalysis: true
          }
        },
        isAnalyzed: true
      };
    } else {
      // Fallback processing
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        content: geminiResult.content,
        analysis: {
          summary: geminiResult.summary,
          keyPoints: geminiResult.keyPoints,
          documentType: geminiResult.documentType,
          extractedText: geminiResult.content,
          metadata: {
            wordCount: 0,
            language: 'en',
            processingMethod: 'fallback',
            aiAnalysis: false
          }
        },
        isAnalyzed: false,
        error: geminiResult.error
      };
    }
  } catch (error) {
    console.error('❌ Document processing failed:', error);
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      content: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isAnalyzed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
