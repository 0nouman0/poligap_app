import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { createPortkeyClient } from "@/lib/portkey/client";
import { parseDocumentWithPortkey } from "@/lib/parsers/portkey-document-parser";

// File upload validation
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff'
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userQuery = formData.get('user_query') as string || 'Please analyze this file';
    const conversationId = formData.get('conversation_id') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `File type ${file.type} not supported` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔄 Processing file upload: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Step 1: Extract file content using Portkey
    console.log('📤 Extracting file content with Portkey...');
    const parseResult = await parseDocumentWithPortkey(file);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          error: `Failed to extract file content: ${parseResult.error}` 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`✅ File content extracted successfully`);

    // Step 2: Create streaming response with file content embedded in message
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get Portkey client
          const portkey = createPortkeyClient('openai'); // Use OpenAI for file support
          
          if (!portkey) {
            throw new Error('Portkey client not available');
          }

          console.log('📡 Sending chat request with file content to Portkey...');
          
          // Create a comprehensive message that combines the file content with the user query
          const combinedMessage = `I have uploaded a document titled "${file.name}". Here is the complete content of the document:

--- BEGIN DOCUMENT CONTENT ---
${parseResult.content}
--- END DOCUMENT CONTENT ---

Document Summary: ${parseResult.summary}

Document Type: ${parseResult.documentType}

Key Points:
${parseResult.keyPoints.map((point: string, i: number) => `${i + 1}. ${point}`).join('\n')}

Now, based on this document, please answer the following question:

${userQuery}`;

          // Create message with embedded file content
          const messages = [
            {
              role: "user" as const,
              content: combinedMessage
            }
          ];

          // Stream chat completion with file attachment
          const chatStream = await portkey.chat.completions.create({
            model: 'gpt-4o', // Use GPT-4o for best file handling
            messages: messages as any,
            max_tokens: 4000,
            temperature: 0.7,
            stream: true,
          });

          console.log('✅ Receiving streaming response from Portkey with file context...');

          let fullContent = "";

          // Stream the response
          for await (const chunk of chatStream) {
            try {
              const content = chunk.choices?.[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                
                // Send in RunResponse format expected by frontend
                const data = `data: ${JSON.stringify({ 
                  event: "RunResponseContent",
                  content: fullContent,
                  created_at: Date.now(),
                  file_name: file.name
                })}\n\n`;
                
                controller.enqueue(encoder.encode(data));
              }

              // Check for completion
              const finishReason = chunk.choices?.[0]?.finish_reason;
              if (finishReason) {
                console.log('✅ Portkey completed response with file analysis');
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  event: "RunResponseComplete",
                  content: fullContent,
                  created_at: Date.now(),
                  file_name: file.name
                })}\n\n`));
                controller.close();
                return;
              }
            } catch (chunkError) {
              console.warn('⚠️ Error processing chunk:', chunkError);
            }
          }

          controller.close();

        } catch (error) {
          console.error('❌ Portkey file chat failed:', error);
          
          const errorData = `data: ${JSON.stringify({
            event: "RunResponseError",
            error: `Failed to process file with Portkey: ${error instanceof Error ? error.message : 'Unknown error'}`,
            created_at: Date.now()
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ File upload API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'File upload failed' 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
