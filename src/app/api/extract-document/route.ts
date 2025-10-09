import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  let file: File | null = null;
  
  try {
    console.log("Document extraction API called");
    
    const formData = await req.formData();
    file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File received:", file.name, file.type, file.size);

    // Check file size limit (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Please upload a file smaller than 20MB." },
        { status: 400 }
      );
    }

    let extractedText = '';
    let method = '';

    // Try Gemini first (primary)
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No Gemini API key found in environment variables");
      return NextResponse.json(
        { error: "Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    console.log("Gemini API key found, length:", apiKey.length);
    
    if (apiKey) {
      console.log("Trying Gemini for document parsing...");
      try {
        extractedText = await extractWithGemini(file, apiKey);
        method = 'gemini';
        console.log("Gemini extraction successful, text length:", extractedText.length);
      } catch (geminiError) {
        console.error("Gemini extraction failed:", geminiError);
      }
    }

    // Basic extraction only for non-PDF files
    if (!extractedText && (file.type !== 'application/pdf' && !(file.name && file.name.endsWith('.pdf')))) {
      console.log("Using basic extraction for non-PDF files...");
      extractedText = await basicExtraction(file);
      method = 'basic-fallback';
    }
    
    // For PDFs, if Gemini failed, return error instead of gibberish
    if (!extractedText && (file.type === 'application/pdf' || (file.name && file.name.endsWith('.pdf')))) {
      console.log("PDF extraction failed - Gemini processing required");
      return NextResponse.json({ 
        error: `PDF processing failed for ${file.name || 'uploaded file'}. This PDF may be:
1. Encrypted or password-protected
2. Image-based (scanned document)
3. Corrupted or malformed
4. Too complex for current processing

Please try:
- Converting to a text file (.txt)
- Using a different PDF
- Using the manual text input option` 
      }, { status: 400 });
    }

    // Clean up the extracted text
    if (extractedText) {
      extractedText = extractedText
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json({ 
        error: `Could not extract readable text from ${file.name}. The file may be encrypted, image-based, or corrupted. Please try:
1. Converting to a text file (.txt)
2. Using a different PDF
3. Using the manual text input option` 
      }, { status: 400 });
    }

    console.log("Successfully extracted text using:", method);
    
    return NextResponse.json({ 
      success: true, 
      text: extractedText,
      length: extractedText.length,
      fileName: file.name,
    });

  } catch (error) {
    console.error("Document extraction error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to extract text from document";
    
    if (error instanceof Error) {
      if (error.message.includes('endsWith')) {
        errorMessage = "File processing error: Invalid file properties. Please try uploading the file again.";
      } else if (error.message.includes('API key')) {
        errorMessage = "AI service configuration error. Please contact support.";
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = "Service temporarily unavailable due to usage limits. Please try again later.";
      } else {
        errorMessage = `Document processing failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        fileName: file?.name || 'unknown',
        fileType: file?.type || 'unknown'
      },
      { status: 500 }
    );
  }
}

async function extractWithGemini(file: File, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use latest Gemini Flash 2.0/2.5 models for advanced document parsing
  const models = [
    "gemini-2.0-flash-exp",
    "gemini-exp-1206", 
    "gemini-2.0-flash-thinking-exp-1219",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];
  
  for (const modelName of models) {
    try {
      console.log(`Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // For text files, use direct text processing
      if (file.type === 'text/plain' || (file.name && file.name.endsWith('.txt'))) {
        const fileText = await file.text();
        
        const prompt = `You are an expert document parser and legal text analyst. Clean, structure, and organize this document text with the following requirements:

1. Remove all formatting artifacts, encoding errors, and non-readable characters
2. Maintain the original document structure (headings, sections, clauses)
3. If this is a contract or legal document, preserve clause numbering and hierarchy
4. Fix any broken sentences or paragraphs
5. Ensure proper spacing and line breaks
6. Return only the clean, readable document text

Document text to process:
${fileText}`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        });
        const response = await result.response;
        return response.text().trim();
      }
      
      // For PDFs, use Gemini's advanced document understanding
      if (file.type === 'application/pdf' || (file.name && file.name.endsWith('.pdf'))) {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        const prompt = `You are an expert legal document parser with advanced PDF analysis capabilities. I'm providing you with a PDF document that needs to be extracted and cleaned for contract analysis.

Please extract and structure this document with the following requirements:

1. **Extract all readable text** - Pull out all text content from the PDF
2. **Maintain document structure** - Preserve headings, sections, clause numbering, and hierarchy
3. **Clean formatting artifacts** - Remove PDF encoding errors and formatting issues
4. **Organize legal content** - If this is a contract, maintain proper clause structure
5. **Ensure readability** - Fix broken sentences and proper spacing
6. **Return structured text** - Provide clean, analysis-ready document text

Please process this PDF and return only the clean, structured text content:`;

        const result = await model.generateContent({
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        });
        
        const response = await result.response;
        return response.text().trim();
      }
      
      // For other files, try basic extraction first then clean with Gemini
      const basicText = await basicExtraction(file);
      if (basicText && basicText.length > 50) {
        const prompt = `Clean and structure this extracted document text. Remove gibberish, fix formatting, and organize it properly. If it's a contract, maintain clause structure:

${basicText.substring(0, 8000)}`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        });
        const response = await result.response;
        return response.text().trim();
      }
      
      console.log(`Successfully used Gemini model: ${modelName}`);
      break;
    } catch (e) {
      console.error(`Gemini model ${modelName} failed:`, e);
      console.error('Error details:', e instanceof Error ? e.message : 'Unknown error');
      continue;
    }
  }
  
  throw new Error("All Gemini models failed - check API key and model availability");
}

// TODO: Add OpenAI extraction when package is installed
// async function extractWithOpenAI(file: File, apiKey: string): Promise<string> {
//   // Implementation will be added when openai package is installed
//   throw new Error("OpenAI not implemented yet");
// }

async function basicExtraction(file: File): Promise<string> {
  // Handle text files only - reject PDFs at basic level
  if (file.type === 'text/plain' || (file.name && file.name.endsWith('.txt'))) {
    return await file.text();
  }
  
  // For PDFs, return empty string to force Gemini processing or failure
  if (file.type === 'application/pdf' || (file.name && file.name.endsWith('.pdf'))) {
    console.log("PDF detected - basic extraction not supported, requires Gemini processing");
    return '';
  }
  
  // Handle other file types as text
  try {
    return await file.text();
  } catch {
    return '';
  }
}
