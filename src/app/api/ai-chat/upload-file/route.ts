import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { getSupabaseAIClient } from "@/lib/ai-client-supabase";
import { parseDocumentWithGemini } from "@/lib/parsers/gemini-document-parser";

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

    // Get AI client
    const aiClient = await getSupabaseAIClient();
    
    // Convert file to base64 for API transmission
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    console.log('🚀 Attempting to send file directly to Portkey API...');

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Try Portkey API first - attempt with file data in message
          console.log('📡 Attempting to send file directly to Portkey API...');
          
          // First try: Include file info in the message text
          const portkeyMessages = [
            {
              role: "user",
              content: `${userQuery}

File uploaded: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)

Please analyze this file. If you can process files directly, please do so. If not, I will provide the extracted content separately.`
            }
          ];

          const portkeyResponse = await aiClient.createStreamingCompletion(portkeyMessages, {
            taskType: "chat",
            strategy: "balanced",
            temperature: 0.7,
            maxTokens: 4000,
          });

          console.log('✅ Portkey streaming response...');

          let fullContent = "";
          let hasContent = false;

          // Stream the response using the same format as stream-chat
          for await (const chunk of portkeyResponse as any) {
            try {
              const content = chunk.choices?.[0]?.delta?.content || 
                             chunk.choices?.[0]?.text || 
                             chunk.content || 
                             '';
              
              if (content) {
                hasContent = true;
                fullContent += content;
                
                // Send in RunResponse format expected by frontend
                const data = `data: ${JSON.stringify({ 
                  event: "RunResponseContent",
                  content: fullContent,
                  created_at: Date.now()
                })}\n\n`;
                
                controller.enqueue(encoder.encode(data));
              }

              // Check for completion
              const finishReason = chunk.choices?.[0]?.finish_reason;
              if (finishReason) {
                console.log('✅ Portkey completed response');
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  event: "RunResponseComplete",
                  content: fullContent,
                  created_at: Date.now()
                })}\n\n`));
                controller.close();
                return;
              }
            } catch (chunkError) {
              console.warn('⚠️ Error processing chunk:', chunkError);
            }
          }

          // If we get here without content, Portkey might not support files
          if (!hasContent) {
            throw new Error('Portkey did not provide file analysis - falling back to Gemini');
          }

          controller.close();

        } catch (portkeyError) {
          console.warn('⚠️ Portkey failed to process file:', portkeyError);
          console.log('🔄 Falling back to Gemini API for file processing...');

          try {
            // Fallback to Gemini API
            console.log('🔄 Using Gemini to extract file content...');

            // Use Gemini to process the file
            const geminiResult = await parseDocumentWithGemini(file);

            if (geminiResult.success) {
              // Send extracted content to Portkey for chat processing
              const fallbackMessages = [
                {
                  role: "user",
                  content: `${userQuery}

File: ${file.name}
Document Type: ${geminiResult.documentType}
Summary: ${geminiResult.summary}

Content extracted from document:

${geminiResult.content}

Please provide a comprehensive response based on this document content.`
                }
              ];

              const fallbackResponse = await aiClient.createStreamingCompletion(fallbackMessages, {
                taskType: "chat",
                strategy: "balanced",
                temperature: 0.7,
                maxTokens: 4000,
              });

              console.log('✅ Gemini processed file, Portkey streaming response...');

              let fallbackContent = "";

              // Stream the fallback response in the same format
              for await (const chunk of fallbackResponse as any) {
                try {
                  const content = chunk.choices?.[0]?.delta?.content || 
                                 chunk.choices?.[0]?.text || 
                                 chunk.content || 
                                 '';
                  
                  if (content) {
                    fallbackContent += content;
                    
                    const data = `data: ${JSON.stringify({ 
                      event: "RunResponseContent",
                      content: fallbackContent,
                      created_at: Date.now()
                    })}\n\n`;
                    
                    controller.enqueue(encoder.encode(data));
                  }

                  // Check for completion
                  const finishReason = chunk.choices?.[0]?.finish_reason;
                  if (finishReason) {
                    console.log('✅ Gemini+Portkey completed response');
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      event: "RunResponseComplete",
                      content: fallbackContent,
                      created_at: Date.now()
                    })}\n\n`));
                    controller.close();
                    return;
                  }
                } catch (chunkError) {
                  console.warn('⚠️ Error processing fallback chunk:', chunkError);
                }
              }

              controller.close();

            } else {
              throw new Error(geminiResult.error || 'Gemini processing failed');
            }

          } catch (geminiError) {
            console.error('❌ Both Portkey and Gemini failed:', geminiError);
            
            const errorData = `data: ${JSON.stringify({
              event: "RunResponseError",
              error: `Failed to process file: ${geminiError instanceof Error ? geminiError.message : 'Unknown error'}`,
              created_at: Date.now()
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
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
