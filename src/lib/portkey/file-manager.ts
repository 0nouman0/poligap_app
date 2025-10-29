import { createPortkeyClient } from './client';

/**
 * Portkey File Manager
 * Handles file uploads to Portkey for batch inference and reusable file content
 */

export interface PortkeyFileUploadResult {
  success: boolean;
  fileId?: string;
  filename?: string;
  purpose?: string;
  bytes?: number;
  error?: string;
}

export interface PortkeyFileDetails {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

/**
 * Upload a file to Portkey for reuse in chat completions
 * @param file - The file to upload (File or Blob)
 * @param filename - Name of the file
 * @param purpose - Purpose of the file (default: 'assistants' for chat usage)
 */
export async function uploadFileToPortkey(
  file: File | Blob,
  filename: string,
  purpose: 'assistants' | 'batch' | 'fine-tune' = 'assistants'
): Promise<PortkeyFileUploadResult> {
  try {
    const apiKey = process.env.PORTKEY_API_KEY;
    
    if (!apiKey) {
      throw new Error('PORTKEY_API_KEY not configured');
    }

    console.log(`📤 Uploading file to Portkey: ${filename} (purpose: ${purpose})`);

    // Create form data using native FormData
    const formData = new FormData();
    
    // Create a new Blob with the file data
    const blob = file instanceof File ? file : new Blob([file]);
    formData.append('file', blob, filename);
    formData.append('purpose', purpose);

    // Upload to Portkey
    const response = await fetch('https://api.portkey.ai/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Portkey upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log(`✅ File uploaded to Portkey successfully: ${result.id}`);
    
    return {
      success: true,
      fileId: result.id,
      filename: result.filename,
      purpose: result.purpose,
      bytes: result.bytes,
    };

  } catch (error) {
    console.error('❌ Portkey file upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get file details from Portkey
 */
export async function getPortkeyFileDetails(fileId: string): Promise<PortkeyFileDetails | null> {
  try {
    const apiKey = process.env.PORTKEY_API_KEY;
    
    if (!apiKey) {
      throw new Error('PORTKEY_API_KEY not configured');
    }

    const response = await fetch(`https://api.portkey.ai/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file details: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('❌ Failed to get Portkey file details:', error);
    return null;
  }
}

/**
 * Get file content from Portkey
 */
export async function getPortkeyFileContent(fileId: string): Promise<string | null> {
  try {
    const apiKey = process.env.PORTKEY_API_KEY;
    
    if (!apiKey) {
      throw new Error('PORTKEY_API_KEY not configured');
    }

    const response = await fetch(`https://api.portkey.ai/v1/files/${fileId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file content: ${response.status}`);
    }

    return await response.text();

  } catch (error) {
    console.error('❌ Failed to get Portkey file content:', error);
    return null;
  }
}

/**
 * List all files in Portkey
 */
export async function listPortkeyFiles(): Promise<PortkeyFileDetails[]> {
  try {
    const apiKey = process.env.PORTKEY_API_KEY;
    
    if (!apiKey) {
      throw new Error('PORTKEY_API_KEY not configured');
    }

    const response = await fetch('https://api.portkey.ai/v1/files', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];

  } catch (error) {
    console.error('❌ Failed to list Portkey files:', error);
    return [];
  }
}

/**
 * Delete a file from Portkey
 */
export async function deletePortkeyFile(fileId: string): Promise<boolean> {
  try {
    const apiKey = process.env.PORTKEY_API_KEY;
    
    if (!apiKey) {
      throw new Error('PORTKEY_API_KEY not configured');
    }

    const response = await fetch(`https://api.portkey.ai/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.status}`);
    }

    console.log(`✅ File deleted from Portkey: ${fileId}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to delete Portkey file:', error);
    return false;
  }
}
