import Portkey from 'portkey-ai';

/**
 * Portkey Virtual Keys for multi-modal AI support
 * These keys enable routing to different AI providers through Portkey
 */
export const PORTKEY_VIRTUAL_KEYS = {
  OPENAI: "temp-openai-pro-f51bf0",
  AWS: "aws-prod-2095a3",
  GROQ: "groq-prod-cfefa4",
  OPENROUTER: "openrouter-prod-555c0a"
};

/**
 * Available AI models configuration
 */
export interface ModelConfig {
  provider: 'openai' | 'aws' | 'groq' | 'openrouter' | 'gemini';
  model: string;
  available: boolean;
}

/**
 * Detect available API keys and return model configurations
 * @returns Array of available model configurations
 */
export function getAvailableModels(): ModelConfig[] {
  const models: ModelConfig[] = [];

  // Check OpenAI
  if (process.env.PORTKEY_API_KEY && PORTKEY_VIRTUAL_KEYS.OPENAI) {
    models.push({
      provider: 'openai',
      model: 'gpt-4o',
      available: true
    });
  }

  // Check AWS
  if (process.env.PORTKEY_API_KEY && PORTKEY_VIRTUAL_KEYS.AWS) {
    models.push({
      provider: 'aws',
      model: 'claude-3-5-sonnet-20241022',
      available: true
    });
  }

  // Check Groq
  if (process.env.PORTKEY_API_KEY && PORTKEY_VIRTUAL_KEYS.GROQ) {
    models.push({
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      available: true
    });
  }

  // Check OpenRouter
  if (process.env.PORTKEY_API_KEY && PORTKEY_VIRTUAL_KEYS.OPENROUTER) {
    models.push({
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      available: true
    });
  }

  // Check Gemini (direct, not through Portkey)
  if (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    models.push({
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      available: true
    });
  }

  return models;
}

/**
 * Get the best available model for contract analysis
 * Priority: GPT-4o > Claude > Llama > Gemini
 */
export function getBestAvailableModel(): ModelConfig | null {
  const models = getAvailableModels();
  
  if (models.length === 0) {
    return null;
  }

  // Priority order
  const priorities: Array<'openai' | 'aws' | 'openrouter' | 'groq' | 'gemini'> = 
    ['openai', 'aws', 'openrouter', 'groq', 'gemini'];
  
  for (const priority of priorities) {
    const model = models.find(m => m.provider === priority);
    if (model) {
      return model;
    }
  }

  return models[0];
}

/**
 * Create a Portkey client instance with multi-provider support
 * Portkey provides unified API access, caching, fallbacks, and analytics
 * @param provider - Which virtual key to use (openai, aws, groq, openrouter)
 */
export function createPortkeyClient(provider: 'openai' | 'aws' | 'groq' | 'openrouter' | 'gemini' = 'openai') {
  const apiKey = process.env.PORTKEY_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ PORTKEY_API_KEY not found, AI features may not work');
    return null;
  }

  try {
    // Select virtual key based on provider
    let virtualKey: string | undefined;
    
    if (provider === 'gemini') {
      virtualKey = process.env.GEMINI_API_KEY;
    } else {
      const keyMap = {
        openai: PORTKEY_VIRTUAL_KEYS.OPENAI,
        aws: PORTKEY_VIRTUAL_KEYS.AWS,
        groq: PORTKEY_VIRTUAL_KEYS.GROQ,
        openrouter: PORTKEY_VIRTUAL_KEYS.OPENROUTER
      };
      virtualKey = keyMap[provider];
    }

    const portkey = new Portkey({
      apiKey: apiKey,
      virtualKey: virtualKey,
    });

    console.log(`✅ Portkey client initialized with ${provider} provider`);
    return portkey;
  } catch (error) {
    console.error('❌ Failed to initialize Portkey client:', error);
    return null;
  }
}

/**
 * Chat completion options for Portkey
 */
export interface PortkeyChatOptions {
  model?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * Send a chat request using Portkey with Google Generative AI
 */
export async function portkeyChat(options: PortkeyChatOptions) {
  const portkey = createPortkeyClient();
  
  if (!portkey) {
    throw new Error('Portkey client not available');
  }

  const {
    model = 'gemini-2.0-flash-exp',
    messages,
    maxTokens = 4000,
    temperature = 0.7,
    stream = false,
  } = options;

  try {
    const response = await portkey.chat.completions.create({
      messages,
      model,
      max_tokens: maxTokens,
      temperature,
      stream,
    });

    return response;
  } catch (error: any) {
    console.error('❌ Portkey chat error:', error);
    throw new Error(error.message || 'Portkey chat request failed');
  }
}

/**
 * Stream chat responses using Portkey
 */
export async function portkeyStreamChat(options: PortkeyChatOptions) {
  const portkey = createPortkeyClient();
  
  if (!portkey) {
    throw new Error('Portkey client not available');
  }

  const {
    model = 'gemini-2.0-flash-exp',
    messages,
    maxTokens = 4000,
    temperature = 0.7,
  } = options;

  try {
    const stream = await portkey.chat.completions.create({
      messages,
      model,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    return stream;
  } catch (error: any) {
    console.error('❌ Portkey stream error:', error);
    throw new Error(error.message || 'Portkey stream request failed');
  }
}
