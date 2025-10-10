import Portkey from 'portkey-ai';

/**
 * Create a Portkey client instance with Google Generative AI (Gemini) provider
 * Portkey provides unified API access, caching, fallbacks, and analytics
 */
export function createPortkeyClient() {
  const apiKey = process.env.PORTKEY_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ PORTKEY_API_KEY not found, falling back to direct Gemini');
    return null;
  }

  if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return null;
  }

  try {
    const portkey = new Portkey({
      apiKey: apiKey,
      virtualKey: geminiApiKey, // Use Gemini API key as virtual key
    });

    console.log('✅ Portkey client initialized successfully');
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
