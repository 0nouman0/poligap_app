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
