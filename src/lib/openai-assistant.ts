// @ts-nocheck - OpenAI streaming types are complex and vary by version
import OpenAI from "openai";
import type { AssistantStream } from "openai/lib/AssistantStream";
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

/**
 * OpenAI Assistants API Client
 * 
 * Provides streaming support compatible with SSE event format:
 * event: run.started
 * data: {...}
 * 
 * event: message.delta
 * data: {...}
 * 
 * event: run.completed
 * data: {...}
 */

// Event types matching OpenAI Assistant streaming events
export enum AssistantEvent {
  ThreadCreated = "thread.created",
  ThreadRunCreated = "thread.run.created",
  ThreadRunQueued = "thread.run.queued",
  ThreadRunInProgress = "thread.run.in_progress",
  ThreadRunRequiresAction = "thread.run.requires_action",
  ThreadRunCompleted = "thread.run.completed",
  ThreadRunFailed = "thread.run.failed",
  ThreadRunCancelling = "thread.run.cancelling",
  ThreadRunCancelled = "thread.run.cancelled",
  ThreadRunExpired = "thread.run.expired",
  ThreadMessageCreated = "thread.message.created",
  ThreadMessageInProgress = "thread.message.in_progress",
  ThreadMessageDelta = "thread.message.delta",
  ThreadMessageCompleted = "thread.message.completed",
  ThreadMessageIncomplete = "thread.message.incomplete",
  ErrorEvent = "error",
}

export interface OpenAIAssistantConfig {
  apiKey?: string;
  assistantId?: string;
  model?: string;
  instructions?: string;
  tools?: Array<{ type: string }>;
}

export interface StreamChunk {
  event: string;
  data: any;
}

class OpenAIAssistantClient {
  private client: OpenAI;
  private assistantId?: string;
  private defaultModel: string = "gpt-4o";
  private defaultInstructions: string = "You are a helpful AI assistant.";

  constructor(config: OpenAIAssistantConfig = {}) {
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    });
    this.assistantId = config.assistantId;
    
    if (config.model) this.defaultModel = config.model;
    if (config.instructions) this.defaultInstructions = config.instructions;
  }

  /**
   * Create a new assistant
   */
  async createAssistant(params: {
    name: string;
    instructions?: string;
    model?: string;
    tools?: Array<any>;
    conversationId?: string;
  }) {
    const assistant = await this.client.beta.assistants.create({
      name: params.name,
      instructions: params.instructions || this.defaultInstructions,
      model: params.model || this.defaultModel,
      tools: (params.tools || [{ type: "code_interpreter" }]) as any,
    });

    this.assistantId = assistant.id;
    
    // If conversation ID is provided, update the conversation with assistant info
    if (params.conversationId) {
      try {
        const supabase = createSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        
        if (accessToken) {
          const gql = createGraphQLClient(accessToken);
          await gql.request(queries.updateConversationThread, {
            id: params.conversationId,
            openai_assistant_id: assistant.id,
            assistant_metadata: {
              name: params.name,
              model: params.model || this.defaultModel,
              instructions: params.instructions || this.defaultInstructions,
            },
          });
        }
      } catch (error) {
        console.error('Failed to persist assistant to database:', error);
        // Don't throw - assistant was created successfully in OpenAI
      }
    }
    
    return assistant;
  }

  /**
   * Create a new thread and optionally persist to database
   */
  async createThread(options?: {
    conversationId?: string;
    assistantId?: string;
    userId?: string;
    metadata?: any;
  }) {
    const thread = await this.client.beta.threads.create();
    
    // If conversation ID is provided, update the conversation with thread info
    if (options?.conversationId) {
      try {
        const supabase = createSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        
        if (accessToken) {
          const gql = createGraphQLClient(accessToken);
          await gql.request(queries.updateConversationThread, {
            id: options.conversationId,
            openai_thread_id: thread.id,
            openai_assistant_id: options.assistantId || this.assistantId,
            assistant_metadata: options.metadata || {},
          });
        }
      } catch (error) {
        console.error('Failed to persist thread to database:', error);
        // Don't throw - thread was created successfully in OpenAI
      }
    }
    
    return thread;
  }

  /**
   * Add message to thread
   */
  async addMessage(threadId: string, content: string, fileIds?: string[]) {
    return await this.client.beta.threads.messages.create(threadId, {
      role: "user",
      content,
      attachments: fileIds?.map(id => ({
        file_id: id,
        tools: [{ type: "code_interpreter" as const }]
      })),
    });
  }

  /**
   * Create SSE-compatible streaming response
   * 
   * Returns a ReadableStream that emits:
   * event: thread.message.delta
   * data: {"content":"text chunk"}
   * 
   * event: thread.run.completed
   * data: {"status":"completed"}
   */
  async createStreamingRun(
    threadId: string,
    assistantId?: string,
    additionalInstructions?: string
  ): Promise<ReadableStream<Uint8Array>> {
    const finalAssistantId = assistantId || this.assistantId;
    
    if (!finalAssistantId) {
      throw new Error("Assistant ID is required. Create an assistant first.");
    }

    const encoder = new TextEncoder();
    let fullContent = "";

    const client = this.client; // Capture this reference
    
    return new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.beta.threads.runs.stream(threadId, {
            assistant_id: finalAssistantId,
            additional_instructions: additionalInstructions,
          });

          // Handle different event types
          stream
            .on("textCreated", () => {
              const chunk = `event: run.started\ndata: ${JSON.stringify({ 
                event: "run.started",
                content: "",
                created_at: Date.now() 
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            })
            .on("textDelta", (textDelta: any) => {
              const deltaText = textDelta.value;
              fullContent += deltaText;
              
              const chunk = `event: message.delta\ndata: ${JSON.stringify({
                event: "message.delta",
                content: deltaText,
                full_content: fullContent,
                created_at: Date.now()
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            })
            .on("toolCallCreated", (toolCall: any) => {
              const chunk = `event: tool.started\ndata: ${JSON.stringify({
                event: "tool.started",
                tool_call_id: toolCall.id,
                tool_name: toolCall.type,
                tool_args: {},
                created_at: Date.now()
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            })
            .on("toolCallDelta", (toolCallDelta: any) => {
              if (toolCallDelta.type === "code_interpreter") {
                if (toolCallDelta.code_interpreter?.input) {
                  const chunk = `event: tool.delta\ndata: ${JSON.stringify({
                    event: "tool.delta",
                    tool_call_id: toolCallDelta.id,
                    content: toolCallDelta.code_interpreter.input,
                    created_at: Date.now()
                  })}\n\n`;
                  controller.enqueue(encoder.encode(chunk));
                }
                
                if (toolCallDelta.code_interpreter?.outputs) {
                  toolCallDelta.code_interpreter.outputs.forEach((output: any) => {
                    if (output.type === "logs") {
                      const chunk = `event: tool.completed\ndata: ${JSON.stringify({
                        event: "tool.completed",
                        tool_call_id: toolCallDelta.id,
                        result: output.logs,
                        created_at: Date.now()
                      })}\n\n`;
                      controller.enqueue(encoder.encode(chunk));
                    }
                  });
                }
              }
            })
            .on("messageDone", (message: any) => {
              const chunk = `event: message.completed\ndata: ${JSON.stringify({
                event: "message.completed",
                content: fullContent,
                message_id: message.id,
                created_at: Date.now()
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            })
            .on("runCompleted", (run: any) => {
              const chunk = `event: run.completed\ndata: ${JSON.stringify({
                event: "run.completed",
                run_id: run.id,
                status: run.status,
                content: fullContent,
                metrics: {
                  prompt_tokens: run.usage?.prompt_tokens || 0,
                  completion_tokens: run.usage?.completion_tokens || 0,
                  total_tokens: run.usage?.total_tokens || 0,
                },
                created_at: Date.now()
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
              controller.close();
            })
            .on("error", (error: any) => {
              const chunk = `event: error\ndata: ${JSON.stringify({
                event: "error",
                error: error.message || "Stream error occurred",
                created_at: Date.now()
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
              controller.close();
            });

        } catch (error: any) {
          const chunk = `event: error\ndata: ${JSON.stringify({
            event: "error",
            error: error.message || "Failed to create run",
            created_at: Date.now()
          })}\n\n`;
          controller.enqueue(encoder.encode(chunk));
          controller.close();
        }
      },
    });
  }

  /**
   * Non-streaming run (for backward compatibility)
   */
  async createRun(
    threadId: string,
    assistantId?: string,
    additionalInstructions?: string
  ) {
    const finalAssistantId = assistantId || this.assistantId;
    
    if (!finalAssistantId) {
      throw new Error("Assistant ID is required");
    }

    const run = await this.client.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: finalAssistantId,
      additional_instructions: additionalInstructions,
    });

    if (run.status === "completed") {
      const messages = await this.client.beta.threads.messages.list(threadId);
      return {
        run,
        messages: messages.data,
      };
    }

    throw new Error(`Run failed with status: ${run.status}`);
  }

  /**
   * Validate if a thread exists and is accessible
   * Returns true if thread is valid, false otherwise
   */
  async validateThread(threadId: string): Promise<boolean> {
    if (!threadId) {
      return false;
    }

    try {
      // Try to retrieve the thread - if it exists, this will succeed
      await this.client.beta.threads.retrieve(threadId);
      console.log("[Thread Validation] Thread is valid:", threadId);
      return true;
    } catch (error: any) {
      console.error("[Thread Validation] Thread is invalid:", threadId, error.message);
      return false;
    }
  }

  /**
   * Get thread messages
   */
  async getMessages(threadId: string, limit: number = 20) {
    const messages = await this.client.beta.threads.messages.list(threadId, {
      limit,
      order: "desc",
    });
    return messages.data;
  }

  /**
   * Upload file for code interpreter
   */
  async uploadFile(file: File | Buffer, filename: string) {
    const uploadedFile = await this.client.files.create({
      file: file,
      purpose: "assistants",
    });
    return uploadedFile;
  }

  /**
   * Delete assistant
   */
  async deleteAssistant(assistantId?: string) {
    const finalAssistantId = assistantId || this.assistantId;
    if (!finalAssistantId) throw new Error("Assistant ID required");
    
    return await this.client.beta.assistants.del(finalAssistantId);
  }

  /**
   * Delete thread
   */
  async deleteThread(threadId: string) {
    return await this.client.beta.threads.del(threadId);
  }
}

// Singleton instance
let assistantClientInstance: OpenAIAssistantClient | null = null;

/**
 * Get the singleton OpenAI Assistant client
 */
export function getAssistantClient(config?: OpenAIAssistantConfig): OpenAIAssistantClient {
  if (!assistantClientInstance) {
    assistantClientInstance = new OpenAIAssistantClient(config);
  }
  return assistantClientInstance;
}

export default OpenAIAssistantClient;
