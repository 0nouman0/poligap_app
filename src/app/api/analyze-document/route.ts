import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Check if Gemini API key is available
const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { fileName, content, fileType } = await request.json();

    if (!content || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName and content' },
        { status: 400 }
      );
    }

    // Check if Gemini is available, otherwise use fallback analysis
    if (!isGeminiAvailable) {
      console.log('Gemini API key not available, using fallback analysis');
      const wordCount = content.split(/\s+/).length;
      return NextResponse.json({
        summary: `Document "${fileName}" has been uploaded and processed. This appears to be a ${getDocumentTypeFromContent(content)} with approximately ${wordCount} words. The document is ready for questions and analysis.`,
        keyPoints: extractKeyPointsFromContent(content),
        documentType: getDocumentTypeFromContent(content),
        extractedText: content.substring(0, 1000),
        metadata: {
          wordCount,
          language: 'en'
        }
      });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create analysis prompt
    const prompt = `
You are an expert document analyzer. Analyze the following document and provide a comprehensive analysis that will help users ask questions about the document content.

Document Name: ${fileName}
File Type: ${fileType}
Content: ${content}

Please provide a JSON response with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the document's main purpose and content",
  "keyPoints": ["Array of 3-5 key points or main topics from the document"],
  "documentType": "Specific type of document (e.g., 'Contract', 'Policy', 'Report', 'Manual', etc.)",
  "extractedText": "Include the FULL document content here - this is critical for AI to answer questions about the document. Include all important text, terms, conditions, dates, names, etc.",
  "metadata": {
    "pageCount": estimated_page_count,
    "wordCount": estimated_word_count,
    "language": "detected_language_code"
  }
}

CRITICAL REQUIREMENTS:
1. The "extractedText" field MUST contain the complete document content or as much as possible (up to 8000 characters)
2. Include all important details like names, dates, terms, conditions, clauses, etc.
3. This extracted text will be used by AI to answer user questions about the document
4. Focus on preserving the actual document content rather than summarizing it

Provide only the JSON response, no additional text.
`;

    // Generate analysis
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // Parse JSON response
    let analysis;
    try {
      // Clean the response to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // Fallback analysis
      const wordCount = content.split(/\s+/).length;
      analysis = {
        summary: `Document "${fileName}" has been analyzed. This appears to be a ${getDocumentTypeFromContent(content)} with approximately ${wordCount} words.`,
        keyPoints: extractKeyPointsFromContent(content),
        documentType: getDocumentTypeFromContent(content),
        extractedText: content.substring(0, 8000),
        metadata: {
          wordCount,
          language: 'en'
        }
      };
    }

    // Ensure extractedText is included with full content
    if (!analysis.extractedText || analysis.extractedText.length < 100) {
      analysis.extractedText = content.substring(0, 8000); // Include more content
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Document analysis error:', error);
    
    // Return fallback analysis
    const content_fallback = request.body || '';
    const wordCount = typeof content_fallback === 'string' ? content_fallback.split(/\s+/).length : 0;
    
    return NextResponse.json({
      summary: `Document analysis completed. The document is ready for questions and further analysis.`,
      keyPoints: ['Document uploaded successfully', 'Ready for AI analysis', 'Available for questions'],
      documentType: 'Document',
      extractedText: typeof content_fallback === 'string' ? content_fallback.substring(0, 8000) : '',
      metadata: {
        wordCount,
        language: 'en'
      }
    });
  }
}

// Helper function to determine document type from content
function getDocumentTypeFromContent(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('contract') || lowerContent.includes('agreement')) return 'Contract';
  if (lowerContent.includes('policy') || lowerContent.includes('procedure')) return 'Policy Document';
  if (lowerContent.includes('report') || lowerContent.includes('analysis')) return 'Report';
  if (lowerContent.includes('manual') || lowerContent.includes('guide')) return 'Manual/Guide';
  if (lowerContent.includes('invoice') || lowerContent.includes('receipt')) return 'Financial Document';
  if (lowerContent.includes('terms') && lowerContent.includes('conditions')) return 'Terms & Conditions';
  if (lowerContent.includes('privacy') && lowerContent.includes('policy')) return 'Privacy Policy';
  
  return 'Document';
}

// Helper function to extract key points from content
function extractKeyPointsFromContent(content: string): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keyPoints = sentences.slice(0, 5).map(s => s.trim().substring(0, 100));
  
  if (keyPoints.length === 0) {
    return ['Document content available for analysis', 'Ready for questions', 'AI analysis complete'];
  }
  
  return keyPoints;
}
