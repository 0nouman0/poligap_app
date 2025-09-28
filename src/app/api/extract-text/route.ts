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
      // Enhanced PDF text extraction
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Try multiple approaches for PDF text extraction
      extractedText = await extractPDFText(uint8Array);
      
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
        error: "Could not extract readable text from the file. Please try uploading a text file (.txt) or a different PDF." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      text: extractedText,
      length: extractedText.length 
    });

  } catch (error) {
    console.error("Text extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Text extraction failed" },
      { status: 500 }
    );
  }
}

async function extractPDFText(uint8Array: Uint8Array): Promise<string> {
  try {
    // Convert to string for pattern matching
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    
    // Method 1: Look for text streams with proper decoding
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
    const textParts: string[] = [];
    let match;
    
    while ((match = streamPattern.exec(pdfString)) !== null) {
      const streamContent = match[1];
      
      // Look for text operators in the stream
      const textOperators = [
        /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g,
        /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*TJ/g,
        /\[([^\]]*)\]\s*TJ/g
      ];
      
      for (const regex of textOperators) {
        let textMatch;
        while ((textMatch = regex.exec(streamContent)) !== null) {
          let text = textMatch[1];
          
          // Handle escape sequences
          text = text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\b/g, '\b')
            .replace(/\\f/g, '\f')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          
          if (text.trim().length > 2) {
            textParts.push(text.trim());
          }
        }
      }
    }
    
    if (textParts.length > 0) {
      return textParts.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    // Method 2: Look for readable text patterns in the entire PDF
    const readableChunks: string[] = [];
    const chunks = pdfString.split(/[\x00-\x1F\x7F-\xFF]+/);
    
    for (const chunk of chunks) {
      // Look for sequences that look like readable text
      const words = chunk.match(/[A-Za-z]{3,}/g);
      if (words && words.length >= 3) {
        const sentence = words.join(' ');
        if (sentence.length > 20) {
          readableChunks.push(sentence);
        }
      }
    }
    
    if (readableChunks.length > 0) {
      return readableChunks.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    // Method 3: Fallback - extract any printable ASCII sequences
    const asciiText = pdfString
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const meaningfulWords = asciiText
      .split(' ')
      .filter(word => word.length > 2 && /^[A-Za-z]/.test(word))
      .slice(0, 500); // Limit to first 500 words to avoid noise
    
    if (meaningfulWords.length > 10) {
      return meaningfulWords.join(' ');
    }
    
    return '';
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}
