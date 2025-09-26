// PDF text extraction utility
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // For now, we'll use a simple text extraction method
    // In a production environment, you'd want to use a proper PDF parsing library
    
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Try to extract text using basic methods
    // This is a simplified approach - for production use pdf-parse or similar
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(uint8Array);
    
    // Basic PDF text extraction (very limited)
    // Look for text between parentheses which often contains readable content in PDFs
    const textMatches = text.match(/\([^)]{10,}\)/g);
    if (textMatches) {
      const extractedText = textMatches
        .map(match => match.replace(/^\(|\)$/g, ''))
        .filter(t => t.length > 5 && /[a-zA-Z]/.test(t))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (extractedText.length > 100) {
        return extractedText;
      }
    }
    
    // Fallback: try to find readable text sequences
    const readableText = text.match(/[a-zA-Z\s.,!?;:'"()-]{50,}/g);
    if (readableText) {
      const cleanText = readableText
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanText.length > 100) {
        return cleanText;
      }
    }
    
    // If no text found, fail explicitly to avoid pseudo data
    throw new Error('No readable text could be extracted from the PDF. Please upload a text-based PDF or provide a DOCX/TXT.');
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to extract text from PDF. Please ensure the file is a valid PDF document.');
  }
}

// Helper function to validate extracted text quality
export function validateExtractedText(text: string): boolean {
  if (!text || text.length < 50) return false;
  
  const wordCount = (text.match(/\b\w+\b/g) || []).length;
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  const letterRatio = letterCount / text.length;
  
  return wordCount >= 10 && letterRatio >= 0.5;
}
