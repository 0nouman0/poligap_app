import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let extractedText = '';
    
    // Handle different file types
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      extractedText = await file.text();
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For PDFs, use a more sophisticated approach
      const arrayBuffer = await file.arrayBuffer();
      extractedText = await extractPDFTextAdvanced(arrayBuffer);
    } else {
      // For other file types, try to extract as text
      try {
        extractedText = await file.text();
      } catch {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        extractedText = decoder.decode(arrayBuffer);
      }
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json({ 
        error: "Could not extract readable text from the file. Please try uploading a text file (.txt) or use the manual text input option." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      text: extractedText,
      length: extractedText.length 
    });

  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Text extraction failed" },
      { status: 500 }
    );
  }
}

async function extractPDFTextAdvanced(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    
    // Method 1: Look for text in PDF streams
    const textParts: string[] = [];
    
    // Find all stream objects
    const streamRegex = /(\d+\s+\d+\s+obj[\s\S]*?stream\s*\n)([\s\S]*?)(\nendstream)/g;
    let match;
    
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[2];
      
      // Look for text drawing operations
      const textOperations = [
        /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g,  // Simple text show
        /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*TJ/g,  // Text show with individual glyph positioning
        /\[([^\]]*)\]\s*TJ/g                   // Text show with array of strings and numbers
      ];
      
      for (const regex of textOperations) {
        let textMatch;
        while ((textMatch = regex.exec(streamContent)) !== null) {
          let text = textMatch[1];
          if (text && text.length > 1) {
            // Clean up escape sequences
            text = text
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\')
              .trim();
            
            if (text.length > 2 && /[a-zA-Z]/.test(text)) {
              textParts.push(text);
            }
          }
        }
      }
    }
    
    if (textParts.length > 0) {
      return textParts.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    // Method 2: Look for readable text patterns
    const readableChunks: string[] = [];
    
    // Split by non-printable characters and look for meaningful text
    const chunks = pdfString.split(/[\x00-\x1F\x7F-\xFF]+/);
    
    for (const chunk of chunks) {
      // Look for sequences that contain multiple words
      const words = chunk.match(/[A-Za-z]{2,}/g);
      if (words && words.length >= 2) {
        const text = words.join(' ');
        if (text.length > 10) {
          readableChunks.push(text);
        }
      }
    }
    
    if (readableChunks.length > 0) {
      return readableChunks.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    // Method 3: Extract any meaningful ASCII text
    const asciiText = pdfString
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const meaningfulWords = asciiText
      .split(' ')
      .filter(word => word.length > 2 && /^[A-Za-z]/.test(word))
      .slice(0, 1000); // Limit to avoid too much noise
    
    if (meaningfulWords.length > 5) {
      return meaningfulWords.join(' ');
    }
    
    return '';
    
  } catch (error) {
    console.error('Advanced PDF extraction error:', error);
    return '';
  }
}
