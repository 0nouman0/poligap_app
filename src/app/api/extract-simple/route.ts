import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  let file: File | null = null;
  
  try {
    console.log("Simple extraction API called");
    
    const formData = await req.formData();
    file = formData.get('file') as File;
    
    if (!file) {
      console.log("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File received:", file.name, file.type, file.size);

    let extractedText = '';
    
    // Handle text files first (most reliable)
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      console.log("Processing text file...");
      extractedText = await file.text();
    } 
    // Handle PDFs with basic extraction
    else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      console.log("Processing PDF file...");
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert to string and look for readable text
        const pdfString = new TextDecoder('latin1').decode(uint8Array);
        console.log("PDF converted to string, length:", pdfString.length);
        
        const textParts: string[] = [];
        
        // Method 1: Look for text in parentheses (PDF text objects)
        const parenthesesMatches = pdfString.match(/\(([^)]{5,})\)/g);
        if (parenthesesMatches) {
          console.log("Found parentheses matches:", parenthesesMatches.length);
          parenthesesMatches.forEach(match => {
            const text = match.slice(1, -1);
            if (text.length > 4 && /[a-zA-Z]{2,}/.test(text)) {
              textParts.push(text);
            }
          });
        }
        
        // Method 2: Look for readable ASCII sequences
        const words = pdfString.match(/[A-Za-z]{3,}(?:\s+[A-Za-z]{3,})*/g);
        if (words) {
          console.log("Found word sequences:", words.length);
          words.forEach(word => {
            if (word.length > 10) {
              textParts.push(word);
            }
          });
        }
        
        if (textParts.length > 0) {
          extractedText = textParts.join(' ');
          console.log("Extracted text parts:", textParts.length);
        } else {
          console.log("No readable text found in PDF");
          extractedText = '';
        }
      } catch (pdfError) {
        console.error("PDF processing error:", pdfError);
        extractedText = '';
      }
    } 
    // Handle other file types
    else {
      console.log("Processing other file type...");
      try {
        extractedText = await file.text();
      } catch {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const decoder = new TextDecoder('utf-8', { fatal: false });
          extractedText = decoder.decode(arrayBuffer);
        } catch (decodeError) {
          console.error("Decode error:", decodeError);
          extractedText = '';
        }
      }
    }

    // Clean up the extracted text
    if (extractedText) {
      extractedText = extractedText
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      console.log("Cleaned text length:", extractedText.length);
    }

    // Check if we got meaningful text
    if (!extractedText || extractedText.length < 20) {
      console.log("No meaningful text extracted");
      return NextResponse.json({ 
        error: "Could not extract readable text from this file. Please try uploading a text file (.txt) or use the manual text input option." 
      }, { status: 400 });
    }

    console.log("Successfully extracted text, length:", extractedText.length);
    
    return NextResponse.json({ 
      success: true, 
      text: extractedText,
      length: extractedText.length,
      fileName: file.name,
      method: "basic-extraction"
    });

  } catch (error) {
    console.error("Extraction error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      fileName: file?.name || 'No file'
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Text extraction failed",
        details: "Check server logs for more information"
      },
      { status: 500 }
    );
  }
}
