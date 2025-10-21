import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  let file: File | null = null;
  
  try {
    console.log("📄 Document extraction API called");
    
    const formData = await req.formData();
    file = formData.get('file') as File;
    
    if (!file) {
      console.error("❌ No file provided in request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file has required properties
    if (!file.name) {
      console.warn("⚠️ File has no name property");
    }
    
    const fileName = file?.name || 'unnamed_file';
    const fileType = file?.type || 'unknown';
    const fileSize = file?.size || 0;
    
    console.log(`📥 File received: ${fileName}, type: ${fileType}, size: ${fileSize} bytes`);

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
      console.error("❌ No Gemini API key found in environment variables");
      return NextResponse.json(
        { error: "Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    console.log(`✅ Gemini API key found, length: ${apiKey.length}`);
    
    if (apiKey) {
      console.log(`🤖 Attempting Gemini extraction for: ${fileName}`);
      try {
        extractedText = await extractWithGemini(file, apiKey);
        method = 'gemini';
        console.log(`✅ Gemini extraction successful, text length: ${extractedText.length} characters`);
      } catch (geminiError) {
        console.error("❌ Gemini extraction failed:", geminiError instanceof Error ? geminiError.message : geminiError);
      }
    }

    // Basic extraction only for non-PDF files
    const isPdfFile = fileType === 'application/pdf' || fileName.endsWith('.pdf');
    if (!extractedText && !isPdfFile) {
      console.log(`📝 Attempting basic extraction for non-PDF file: ${fileName}`);
      extractedText = await basicExtraction(file);
      method = 'basic-fallback';
      console.log(`Basic extraction result: ${extractedText.length} characters`);
    }
    
    // For PDFs, if Gemini failed, return error instead of gibberish
    const isPdf = file.type === 'application/pdf' || (file?.name && file.name.endsWith('.pdf'));
    if (!extractedText && isPdf) {
      console.log("PDF extraction failed - Gemini processing required");
      const fileName = file?.name || 'uploaded PDF';
      return NextResponse.json({ 
        error: `PDF processing failed for ${fileName}. This PDF may be:
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
      const originalLength = extractedText.length;
      extractedText = extractedText
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log(`🧹 Text cleaned: ${originalLength} → ${extractedText.length} characters`);
    }

    if (!extractedText || extractedText.length < 20) {
      const displayFileName = fileName || 'the uploaded file';
      console.error(`❌ Insufficient text extracted: ${extractedText?.length || 0} characters from ${displayFileName}`);
      return NextResponse.json({ 
        error: `Could not extract readable text from ${displayFileName}. The file may be encrypted, image-based, or corrupted. Please try:
1. Converting to a text file (.txt)
2. Using a different PDF
3. Using the manual text input option` 
      }, { status: 400 });
    }

    console.log(`✅ Successfully extracted text using: ${method}, final length: ${extractedText.length} characters`);
    
    return NextResponse.json({ 
      success: true, 
      text: extractedText,
      length: extractedText.length,
      fileName: fileName,
      method: method
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
  const fileName = file?.name || 'document';
  
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
  
  let lastError: Error | null = null;
  
  for (const modelName of models) {
    try {
      console.log(`Trying Gemini model: ${modelName} for file: ${fileName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // For text files, use direct text processing
      const isTextFile = file.type === 'text/plain' || (file?.name && file.name.endsWith('.txt'));
      if (isTextFile) {
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
        const extractedText = response.text().trim();
        console.log(`✅ Successfully extracted text using Gemini model: ${modelName}, length: ${extractedText.length}`);
        return extractedText;
      }
      
      // If no file type matched, skip to next model
      console.log(`No matching file type handler for: ${file.type}`);
      continue;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.error(`❌ Gemini model ${modelName} failed:`, lastError.message);
      continue;
    }
  }
  
  // If all models failed, throw the last error with more context
  const errorMsg = lastError?.message || 'Unknown error';
  throw new Error(`All Gemini models failed to extract text from ${fileName}. Last error: ${errorMsg}. Please check API key and model availability.`);
}

// TODO: Add OpenAI extraction when package is installed
// async function extractWithOpenAI(file: File, apiKey: string): Promise<string> {
//   // Implementation will be added when openai package is installed
//   throw new Error("OpenAI not implemented yet");
// }

async function basicExtraction(file: File): Promise<string> {
  if (!file) {
    console.log("No file provided to basicExtraction");
    return '';
  }
  
  const fileName = file?.name || '';
  const fileType = file?.type || '';
  
  // Handle text files only - reject PDFs at basic level
  const isTextFile = fileType === 'text/plain' || fileName.endsWith('.txt');
  if (isTextFile) {
    try {
      const text = await file.text();
      console.log(`Basic extraction successful for text file: ${fileName}`);
      return text;
    } catch (error) {
      console.error(`Failed to read text file: ${error}`);
      return '';
    }
  }
  
  // For PDFs, return empty string to force Gemini processing or failure
  const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
  if (isPdf) {
    console.log("PDF detected - basic extraction not supported, requires Gemini processing");
    return '';
  }
  
  // Handle other file types as text
  try {
    const text = await file.text();
    console.log(`Basic extraction attempted for: ${fileName}, type: ${fileType}`);
    return text;
  } catch (error) {
    console.error(`Failed to extract text from ${fileName}:`, error);
    return '';
  }
}
