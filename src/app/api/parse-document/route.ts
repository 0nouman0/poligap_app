import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    console.log("Document parsing API called");
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File received:", file.name, file.type, file.size);

    // Check file size limit (20MB for Gemini)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Please upload a file smaller than 20MB." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No API key found");
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    console.log("File converted to base64, length:", base64Data.length);
    
    console.log("Initializing Gemini for document parsing...");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini Flash for document parsing
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a document parsing expert. Extract all readable text from this document and return it as clean, structured text.

Instructions:
1. Extract ALL text content from the document
2. Maintain the original structure and formatting where possible
3. Remove any gibberish, encoding artifacts, or non-readable content
4. Organize the text in a logical flow
5. Preserve section headings, paragraphs, and important formatting
6. If it's a contract, maintain clause numbering and structure
7. Return ONLY the clean extracted text, no additional commentary

Document to parse:`;

    console.log("Sending document to Gemini for parsing...");
    
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type || "application/pdf",
              data: base64Data
            }
          }
        ]
      }]
    });

    const response = await result.response;
    const extractedText = response.text();
    
    console.log("Gemini parsing completed, text length:", extractedText.length);

    // Clean up the extracted text
    const cleanText = extractedText
      .replace(/^[^\w\s]*/, '') // Remove leading non-word characters
      .replace(/[^\w\s]*$/, '') // Remove trailing non-word characters
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
      .trim();

    if (!cleanText || cleanText.length < 20) {
      return NextResponse.json({ 
        error: "Could not extract meaningful text from the document. Please ensure the document contains readable text or try uploading a different format." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      text: cleanText,
      length: cleanText.length,
      fileName: file.name,
      method: "gemini-vision"
    });

  } catch (error) {
    console.error("Document parsing error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Document parsing failed";
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = "Invalid or missing Gemini API key";
      } else if (error.message.includes('quota')) {
        errorMessage = "Gemini API quota exceeded. Please try again later.";
      } else if (error.message.includes('file')) {
        errorMessage = "Unsupported file format. Please try a PDF, image, or text file.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
