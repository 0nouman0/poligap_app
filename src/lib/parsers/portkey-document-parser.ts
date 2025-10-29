import { createPortkeyClient } from '../portkey/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Extract and parse document content using Portkey with GPT-4o
 * This provides reliable text extraction from various document types
 */
export async function parseDocumentWithPortkey(file: File): Promise<{
  success: boolean;
  content: string;
  summary: string;
  keyPoints: string[];
  documentType: string;
  error?: string;
}> {
  const fileName = file.name;
  console.log(`🤖 Starting Portkey-powered document parsing for: ${fileName}`);

  try {
    // Convert file to base64 for API transmission
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine MIME type
    const mimeType = file.type || 'application/octet-stream';
    
    console.log(`📄 File details: ${fileName}, Type: ${mimeType}, Size: ${file.size} bytes`);

    // Create the prompt for document analysis
    const prompt = `You are an expert document analyzer. Please analyze this document and extract its content in a clean, readable format.

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

    // For PDF, DOCX, and other document files, use Gemini via Portkey
    if (mimeType.includes('pdf') || 
        mimeType.includes('msword') || 
        mimeType.includes('wordprocessingml') ||
        mimeType.includes('spreadsheetml') ||
        mimeType.includes('presentationml')) {
      console.log('📄 Using Gemini for document processing (native SDK)...');
      
      // Use Gemini's native SDK for PDF support
      const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY required for PDF processing. Please add it to your .env file.');
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      // Try Gemini models with native PDF support
      const geminiModels = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
      let responseText = '';
      let lastError = null;
      
      for (const modelName of geminiModels) {
        try {
          console.log(`🔄 Trying ${modelName} with native PDF support...`);
          
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.1,
              topK: 32,
              topP: 1,
              maxOutputTokens: 16384,
            }
          });

          const response = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]);
          
          const result = await response.response;
          responseText = String(result.text());
          console.log(`✅ Successfully parsed document with ${modelName}`);
          console.log(`📄 Response preview: ${responseText.substring(0, 200)}...`);
          break; // Success, exit loop
        } catch (modelError: any) {
          console.log(`❌ ${modelName} failed:`, modelError?.message || modelError);
          lastError = modelError;
          continue; // Try next model
        }
      }
      
      if (!responseText && lastError) {
        throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
      }
      
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
    } else if (mimeType.includes('image')) {
      // For image files, use GPT-4o vision API
      console.log('🖼️ Using GPT-4o vision for image processing...');
      
      const portkey = createPortkeyClient('openai');
      if (!portkey) {
        throw new Error('Portkey client not available');
      }
      
      const response = await portkey.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.1,
      });

      const responseText = String(response.choices[0]?.message?.content || '');
      console.log(`✅ Successfully parsed document with Portkey`);
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
    } else {
      // For text-based files, try text extraction first
      let textContent = '';
      
      if (mimeType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        textContent = new TextDecoder().decode(arrayBuffer);
      }
      
      if (textContent) {
        // For text files, analyze the extracted content
        const textAnalysisPrompt = `${prompt}

Document Content:
${textContent.substring(0, 10000)} ${textContent.length > 10000 ? '...' : ''}`;

        const portkey = createPortkeyClient('openai');
        if (!portkey) {
          throw new Error('Portkey client not available');
        }

        const response = await portkey.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: textAnalysisPrompt }],
          max_tokens: 16000,
          temperature: 0.1,
        });

        const responseText = String(response.choices[0]?.message?.content || '');
        
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return {
              success: true,
              content: analysis.content || textContent,
              summary: analysis.summary,
              keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
              documentType: analysis.documentType
            };
          }
        } catch (parseError) {
          // Fallback to raw text content
          return {
            success: true,
            content: textContent,
            summary: `Text document "${fileName}"`,
            keyPoints: ['Text file successfully loaded'],
            documentType: 'Text Document'
          };
        }
      }
      
      throw new Error('Unsupported file type for text extraction');
    }

  } catch (error) {
    console.error('❌ Portkey document parsing failed:', error);
    
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
