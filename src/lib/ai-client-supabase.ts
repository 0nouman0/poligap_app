import Portkey from "portkey-ai";
import { createClient } from '@/lib/supabase/server';

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

// Portkey configuration from database
interface PortkeyConfig {
  virtual_keys: Record<string, string>;
  provider_configs: Record<string, {
    provider: string;
    models: string[];
    base_url: string;
  }>;
  routing_strategy: ProviderStrategy;
}

/**
 * Supabase-powered AI Client with Portkey Integration
 * 
 * Features:
 * - Configuration loaded from Supabase database
 * - Multi-provider routing via Portkey virtual keys
 * - Automatic failover on provider errors
 * - Cost and usage tracking
 * - Intelligent provider selection based on task type
 */
class SupabaseAIClient {
  private portkey: Portkey;
  private usageMetrics: UsageMetrics[] = [];
  private readonly apiKey: string;
  private config: PortkeyConfig | null = null;

  constructor() {
    this.apiKey = process.env.PORTKEY_API_KEY || "";
    
    if (!this.apiKey) {
      throw new Error(
        "PORTKEY_API_KEY is required but not set in environment variables. " +
        "Please set PORTKEY_API_KEY in your .env.local file."
      );
    }

    // Initialize Portkey client
    this.portkey = new Portkey({
      apiKey: this.apiKey,
      baseURL: "https://api.portkey.ai/v1",
    });
  }

  /**
   * Load configuration from Supabase
   */
  private async loadConfig(): Promise<PortkeyConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('portkey_config')
        .select('virtual_keys, provider_configs, routing_strategy')
        .eq('config_name', 'default')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Failed to load Portkey config from Supabase:', error);
        throw new Error(`Failed to load Portkey configuration: ${error.message}`);
      }

      this.config = {
        virtual_keys: data.virtual_keys,
        provider_configs: data.provider_configs,
        routing_strategy: data.routing_strategy
      };

      console.log('✅ Loaded Portkey configuration from Supabase');
      return this.config;
    } catch (error) {
      console.error('Error loading Portkey config:', error);
      throw error;
    }
  }

  /**
   * Select the best virtual key based on task type and strategy
   */
  private async selectVirtualKey(config: AIClientConfig): Promise<string> {
    const portkeyConfig = await this.loadConfig();
    const { taskType, strategy = portkeyConfig.routing_strategy } = config;

    // Strategy-based routing
    switch (strategy) {
      case "cost-optimized":
        // Use Groq for speed and cost efficiency
        return portkeyConfig.virtual_keys.GROQ;

      case "performance":
        // Use OpenAI for best quality
        return portkeyConfig.virtual_keys.OPENAI;

      case "balanced":
      default:
        // Route based on task type
        switch (taskType) {
          case "chat":
            // Use Groq for fast chat responses
            return portkeyConfig.virtual_keys.GROQ;
          
          case "agent":
            // Use OpenAI for complex reasoning
            return portkeyConfig.virtual_keys.OPENAI;
          
          case "analysis":
            // Use AWS Bedrock for enterprise workloads
            return portkeyConfig.virtual_keys.AWS;
          
          case "generation":
            // Use OpenRouter for diverse model access
            return portkeyConfig.virtual_keys.OPENROUTER;
          
          default:
            return portkeyConfig.virtual_keys.OPENAI;
        }
    }
  }

  /**
   * Get the appropriate model name for the virtual key
   */
  private async getModelForProvider(virtualKey: string, config: AIClientConfig): Promise<string> {
    const portkeyConfig = await this.loadConfig();
    const providerConfig = portkeyConfig.provider_configs[virtualKey];
    
    if (!providerConfig) {
      console.warn(`No provider config found for virtual key: ${virtualKey}`);
      return "gpt-4o-mini"; // Default fallback
    }

    // Select model based on task type and available models
    const availableModels = providerConfig.models;
    
    switch (providerConfig.provider) {
      case "openai":
        return config.taskType === "agent" ? "gpt-4o" : "gpt-4o-mini";
      
      case "groq":
        return availableModels[0] || "llama-3.3-70b-versatile";
      
      case "aws":
        return availableModels[0] || "anthropic.claude-3-5-sonnet-20241022-v2:0";
      
      case "openrouter":
        return availableModels[0] || "anthropic/claude-3.5-sonnet";
      
      default:
        return availableModels[0] || "gpt-4o-mini";
    }
  }

  /**
   * Create streaming chat completion
   */
  async createStreamingCompletion(
    messages: Array<{ role: string; content: string }>,
    config: AIClientConfig
  ): Promise<ReadableStream> {
    const virtualKey = await this.selectVirtualKey(config);
    const model = await this.getModelForProvider(virtualKey, config);

    console.log(`🔄 Starting stream with provider: ${virtualKey}, model: ${model}`);

    try {
      // Create a new Portkey client with the virtual key
      const portkeyClient = new Portkey({
        apiKey: this.apiKey,
        baseURL: "https://api.portkey.ai/v1",
        virtualKey: virtualKey,
      });

      const stream = await portkeyClient.chat.completions.create({
        model,
        messages: messages as any,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 8000,
        stream: true,
      });

      return stream as any;

    } catch (error: any) {
      console.error(`❌ Streaming failed with ${virtualKey}:`, error.message);
      
      // Fallback to OpenAI if primary fails
      const portkeyDbConfig = await this.loadConfig();
      const openaiKey = portkeyDbConfig.virtual_keys.OPENAI;
      
      if (virtualKey !== openaiKey) {
        console.log(`🔄 Failing over to OpenAI for streaming...`);
        
        const fallbackClient = new Portkey({
          apiKey: this.apiKey,
          baseURL: "https://api.portkey.ai/v1",
          virtualKey: openaiKey,
        });
        
        const fallbackStream = await fallbackClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages as any,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 8000,
          stream: true,
        });

        return fallbackStream as any;
      }

      throw error;
    }
  }

  /**
   * Create chat completion with automatic failover
   */
  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    config: AIClientConfig
  ): Promise<any> {
    const portkeyDbConfig = await this.loadConfig();
    const virtualKey = await this.selectVirtualKey(config);
    const model = await this.getModelForProvider(virtualKey, config);
    
    const providers = [
      virtualKey,
      portkeyDbConfig.virtual_keys.OPENAI, // Fallback 1
      portkeyDbConfig.virtual_keys.GROQ,   // Fallback 2
    ].filter((key, index, self) => self.indexOf(key) === index); // Remove duplicates

    let lastError: Error | null = null;
    const startTime = Date.now();

    // Try each provider with automatic failover
    for (const providerKey of providers) {
      try {
        console.log(`🔄 Attempting AI request with provider: ${providerKey}`);
        
        // Create a new Portkey client with the virtual key
        const portkeyClient = new Portkey({
          apiKey: this.apiKey,
          baseURL: "https://api.portkey.ai/v1",
          virtualKey: providerKey,
        });
        
        const response = await portkeyClient.chat.completions.create({
          model: await this.getModelForProvider(providerKey, config),
          messages: messages as any,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 8000,
          stream: config.stream ?? false,
        });

        // Track usage
        const latency = Date.now() - startTime;
        if ((response as any).usage) {
          this.trackUsage({
            provider: providerKey,
            model: await this.getModelForProvider(providerKey, config),
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
let supabaseAIClientInstance: SupabaseAIClient | null = null;

/**
 * Get the singleton Supabase AI client instance
 */
export function getSupabaseAIClient(): SupabaseAIClient {
  if (!supabaseAIClientInstance) {
    supabaseAIClientInstance = new SupabaseAIClient();
  }
  return supabaseAIClientInstance;
}

export default SupabaseAIClient;
