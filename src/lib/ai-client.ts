import Portkey from "portkey-ai";

// Virtual keys from your Portkey configuration
export const PORTKEY_VIRTUAL_KEYS = {
  OPENAI: "temp-openai-pro-f51bf0",
  AWS: "aws-prod-2095a3",
  GROQ: "groq-prod-cfefa4",
  OPENROUTER: "openrouter-prod-555c0a",
} as const;

// Task types for intelligent routing
export type AITaskType = "chat" | "agent" | "analysis" | "generation";

// Provider selection strategy
export type ProviderStrategy = "cost-optimized" | "performance" | "balanced";

// Configuration for AI requests
export interface AIClientConfig {
  taskType: AITaskType;
  strategy?: ProviderStrategy;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Usage tracking interface
export interface UsageMetrics {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
  latency?: number;
  timestamp: number;
}

/**
 * Unified AI Client with Portkey Integration
 * 
 * Features:
 * - Multi-provider routing via Portkey virtual keys
 * - Automatic failover on provider errors
 * - Cost and usage tracking
 * - Intelligent provider selection based on task type
 */
class AIClient {
  private portkey: Portkey;
  private usageMetrics: UsageMetrics[] = [];
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.PORTKEY_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("⚠️ PORTKEY_API_KEY not found. AI features may not work.");
    }

    // Initialize Portkey client
    this.portkey = new Portkey({
      apiKey: this.apiKey,
      baseURL: "https://api.portkey.ai/v1",
    });
  }

  /**
   * Select the best virtual key based on task type and strategy
   */
  private selectVirtualKey(config: AIClientConfig): string {
    const { taskType, strategy = "balanced" } = config;

    // Strategy-based routing
    switch (strategy) {
      case "cost-optimized":
        // Use Groq for speed and cost efficiency
        return PORTKEY_VIRTUAL_KEYS.GROQ;

      case "performance":
        // Use OpenAI for best quality
        return PORTKEY_VIRTUAL_KEYS.OPENAI;

      case "balanced":
      default:
        // Route based on task type
        switch (taskType) {
          case "chat":
            // Use Groq for fast chat responses
            return PORTKEY_VIRTUAL_KEYS.GROQ;
          
          case "agent":
            // Use OpenAI for complex reasoning
            return PORTKEY_VIRTUAL_KEYS.OPENAI;
          
          case "analysis":
            // Use AWS Bedrock for enterprise workloads
            return PORTKEY_VIRTUAL_KEYS.AWS;
          
          case "generation":
            // Use OpenRouter for diverse model access
            return PORTKEY_VIRTUAL_KEYS.OPENROUTER;
          
          default:
            return PORTKEY_VIRTUAL_KEYS.OPENAI;
        }
    }
  }

  /**
   * Get the appropriate model name for the virtual key
   */
  private getModelForProvider(virtualKey: string, config: AIClientConfig): string {
    // Map virtual keys to model names
    switch (virtualKey) {
      case PORTKEY_VIRTUAL_KEYS.OPENAI:
        return config.taskType === "agent" ? "gpt-4o" : "gpt-4o-mini";
      
      case PORTKEY_VIRTUAL_KEYS.GROQ:
        return "llama-3.3-70b-versatile";
      
      case PORTKEY_VIRTUAL_KEYS.AWS:
        return "anthropic.claude-3-5-sonnet-20241022-v2:0";
      
      case PORTKEY_VIRTUAL_KEYS.OPENROUTER:
        return "anthropic/claude-3.5-sonnet";
      
      default:
        return "gpt-4o-mini";
    }
  }

  /**
   * Create chat completion with automatic failover
   */
  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    config: AIClientConfig
  ): Promise<any> {
    const virtualKey = this.selectVirtualKey(config);
    const model = this.getModelForProvider(virtualKey, config);
    
    const providers = [
      virtualKey,
      PORTKEY_VIRTUAL_KEYS.OPENAI, // Fallback 1
      PORTKEY_VIRTUAL_KEYS.GROQ,   // Fallback 2
    ].filter((key, index, self) => self.indexOf(key) === index); // Remove duplicates

    let lastError: Error | null = null;
    const startTime = Date.now();

    // Try each provider with automatic failover
    for (const providerKey of providers) {
      try {
        console.log(`🔄 Attempting AI request with provider: ${providerKey}`);
        
        const response = await this.portkey.chat.completions.create({
          model: this.getModelForProvider(providerKey, config),
          messages: messages as any,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 4000,
          stream: config.stream ?? false,
        }, {
          headers: {
            "x-portkey-virtual-key": providerKey,
          }
        });

        // Track usage
        const latency = Date.now() - startTime;
        if ((response as any).usage) {
          this.trackUsage({
            provider: providerKey,
            model: this.getModelForProvider(providerKey, config),
            promptTokens: (response as any).usage.prompt_tokens || 0,
            completionTokens: (response as any).usage.completion_tokens || 0,
            totalTokens: (response as any).usage.total_tokens || 0,
            latency,
            timestamp: Date.now(),
          });
        }

        console.log(`✅ AI request successful with ${providerKey} (${latency}ms)`);
        return response;

      } catch (error: any) {
        console.error(`❌ Provider ${providerKey} failed:`, error.message);
        lastError = error;
        
        // If it's the last provider, throw the error
        if (providerKey === providers[providers.length - 1]) {
          throw new Error(
            `All AI providers failed. Last error: ${error.message}`
          );
        }
        
        // Otherwise, continue to next provider
        console.log(`🔄 Failing over to next provider...`);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error("All providers failed");
  }

  /**
   * Create streaming chat completion
   */
  async createStreamingCompletion(
    messages: Array<{ role: string; content: string }>,
    config: AIClientConfig
  ): Promise<ReadableStream> {
    const virtualKey = this.selectVirtualKey(config);
    const model = this.getModelForProvider(virtualKey, config);

    console.log(`🔄 Starting stream with provider: ${virtualKey}, model: ${model}`);

    try {
      const stream = await this.portkey.chat.completions.create({
        model,
        messages: messages as any,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4000,
        stream: true,
      }, {
        headers: {
          "x-portkey-virtual-key": virtualKey,
        }
      });

      return stream as any;

    } catch (error: any) {
      console.error(`❌ Streaming failed with ${virtualKey}:`, error.message);
      
      // Fallback to OpenAI if primary fails
      if (virtualKey !== PORTKEY_VIRTUAL_KEYS.OPENAI) {
        console.log(`🔄 Failing over to OpenAI for streaming...`);
        
        const fallbackStream = await this.portkey.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages as any,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 4000,
          stream: true,
        }, {
          headers: {
            "x-portkey-virtual-key": PORTKEY_VIRTUAL_KEYS.OPENAI,
          }
        });

        return fallbackStream as any;
      }

      throw error;
    }
  }

  /**
   * Track usage metrics
   */
  private trackUsage(metrics: UsageMetrics): void {
    this.usageMetrics.push(metrics);
    
    // Keep only last 100 entries to prevent memory leak
    if (this.usageMetrics.length > 100) {
      this.usageMetrics = this.usageMetrics.slice(-100);
    }

    // Log for monitoring
    console.log(`📊 Usage: ${metrics.provider} | ${metrics.totalTokens} tokens | ${metrics.latency}ms`);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalRequests: number;
    totalTokens: number;
    avgLatency: number;
    providerBreakdown: Record<string, number>;
  } {
    const totalRequests = this.usageMetrics.length;
    const totalTokens = this.usageMetrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const avgLatency = this.usageMetrics.reduce((sum, m) => sum + (m.latency || 0), 0) / totalRequests;
    
    const providerBreakdown: Record<string, number> = {};
    this.usageMetrics.forEach(m => {
      providerBreakdown[m.provider] = (providerBreakdown[m.provider] || 0) + 1;
    });

    return {
      totalRequests,
      totalTokens,
      avgLatency: Math.round(avgLatency),
      providerBreakdown,
    };
  }
}

// Singleton instance
let aiClientInstance: AIClient | null = null;

/**
 * Get the singleton AI client instance
 */
export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    aiClientInstance = new AIClient();
  }
  return aiClientInstance;
}

export default AIClient;
