export interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  preview?: string;
  error?: string;
}

export interface FileProcessingResult {
  success: boolean;
  files: ProcessedFile[];
  errors: string[];
}

/**
 * Reads text content from a file
 */
const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Creates a data URL for image files
 */
const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to create image preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts text content from PDF files (basic implementation)
 * Note: For production, consider using a library like pdf-parse or PDF.js
 */
const extractPdfText = async (file: File): Promise<string> => {
  // This is a placeholder implementation
  // In a real application, you would use a PDF parsing library
  return `[PDF Content] ${file.name} - ${(file.size / 1024 / 1024).toFixed(2)}MB PDF file uploaded. Content extraction requires server-side processing.`;
};

/**
 * Processes different file types and extracts relevant content
 */
export const processFiles = async (files: File[]): Promise<FileProcessingResult> => {
  const processedFiles: ProcessedFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const processedFile: ProcessedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
      };

      // Process based on file type
      if (file.type.startsWith('image/')) {
        // Handle images
        try {
          processedFile.preview = await createImagePreview(file);
          processedFile.content = `[Image] ${file.name} - Image file uploaded for analysis.`;
        } catch (error) {
          processedFile.error = 'Failed to process image';
        }
      } else if (file.type.startsWith('text/') || 
                 file.type === 'application/json' ||
                 file.type === 'text/csv' ||
                 file.type === 'text/markdown') {
        // Handle text files
        try {
          processedFile.content = await readTextFile(file);
        } catch (error) {
          processedFile.error = 'Failed to read text file';
        }
      } else if (file.type === 'application/pdf') {
        // Handle PDF files
        try {
          processedFile.content = await extractPdfText(file);
        } catch (error) {
          processedFile.error = 'Failed to process PDF';
        }
      } else if (file.type.includes('document') || 
                 file.type.includes('wordprocessingml') ||
                 file.type.includes('spreadsheet') ||
                 file.type.includes('presentation')) {
        // Handle Office documents
        processedFile.content = `[Document] ${file.name} - Office document uploaded. Content extraction requires server-side processing.`;
      } else if (file.type.startsWith('audio/')) {
        // Handle audio files
        processedFile.content = `[Audio] ${file.name} - Audio file uploaded for transcription and analysis.`;
      } else if (file.type.startsWith('video/')) {
        // Handle video files
        processedFile.content = `[Video] ${file.name} - Video file uploaded for analysis.`;
      } else {
        // Handle other file types
        processedFile.content = `[File] ${file.name} - File uploaded for analysis.`;
      }

      processedFiles.push(processedFile);
    } catch (error) {
      errors.push(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    files: processedFiles,
    errors
  };
};

/**
 * Formats file information for chat context
 */
export const formatFilesForChat = (files: ProcessedFile[]): string => {
  if (files.length === 0) return '';

  const fileDescriptions = files.map(file => {
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    let description = `**${file.name}** (${sizeInMB}MB)`;
    
    if (file.content) {
      description += `\n${file.content}`;
    }
    
    if (file.error) {
      description += `\n*Error: ${file.error}*`;
    }
    
    return description;
  }).join('\n\n');

  return `📎 **Uploaded Files:**\n\n${fileDescriptions}\n\n---\n\n`;
};

/**
 * Validates file type and size
 */
export const validateFile = (
  file: File,
  maxSize: number = 50, // MB
  allowedTypes: string[] = [
    'image/*',
    'text/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/*',
    'video/*'
  ]
): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize * 1024 * 1024) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${maxSize}MB.`
    };
  }

  // Check file type
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === type;
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported.`
    };
  }

  return { valid: true };
};

/**
 * Gets appropriate icon for file type
 */
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('document') || mimeType.includes('wordprocessingml')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.startsWith('text/')) return '📃';
  return '📎';
};
