import { createClient } from '@/lib/supabase/server';

/**
 * Portkey Configuration Management
 * 
 * Utilities for managing Portkey AI configuration stored in Supabase
 */

export interface PortkeyVirtualKeys {
  OPENAI: string;
  AWS: string;
  GROQ: string;
  OPENROUTER: string;
}

export interface ProviderConfig {
  provider: string;
  models: string[];
  base_url: string;
}

export interface PortkeyConfigData {
  virtual_keys: PortkeyVirtualKeys;
  provider_configs: Record<string, ProviderConfig>;
  routing_strategy: 'balanced' | 'cost-optimized' | 'performance';
}

/**
 * Get the current Portkey configuration from Supabase
 */
export async function getPortkeyConfig(): Promise<PortkeyConfigData> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('portkey_config')
    .select('virtual_keys, provider_configs, routing_strategy')
    .eq('config_name', 'default')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Failed to load Portkey config:', error);
    throw new Error(`Failed to load Portkey configuration: ${error.message}`);
  }

  return {
    virtual_keys: data.virtual_keys,
    provider_configs: data.provider_configs,
    routing_strategy: data.routing_strategy
  };
}

/**
 * Update the Portkey configuration in Supabase
 */
export async function updatePortkeyConfig(config: Partial<PortkeyConfigData>): Promise<void> {
  const supabase = await createClient();
  
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (config.virtual_keys) {
    updateData.virtual_keys = config.virtual_keys;
  }

  if (config.provider_configs) {
    updateData.provider_configs = config.provider_configs;
  }

  if (config.routing_strategy) {
    updateData.routing_strategy = config.routing_strategy;
  }

  const { error } = await supabase
    .from('portkey_config')
    .update(updateData)
    .eq('config_name', 'default');

  if (error) {
    console.error('Failed to update Portkey config:', error);
    throw new Error(`Failed to update Portkey configuration: ${error.message}`);
  }

  console.log('✅ Portkey configuration updated successfully');
}

/**
 * Get virtual key for a specific provider
 */
export async function getVirtualKey(provider: keyof PortkeyVirtualKeys): Promise<string> {
  const config = await getPortkeyConfig();
  return config.virtual_keys[provider];
}

/**
 * Test Portkey configuration by checking if all virtual keys are present
 */
export async function testPortkeyConfig(): Promise<{
  isValid: boolean;
  missingKeys: string[];
  config: PortkeyConfigData | null;
}> {
  try {
    const config = await getPortkeyConfig();
    const requiredKeys = ['OPENAI', 'AWS', 'GROQ', 'OPENROUTER'];
    const missingKeys = requiredKeys.filter(key => !config.virtual_keys[key as keyof PortkeyVirtualKeys]);

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
      config
    };
  } catch (error) {
    console.error('Error testing Portkey config:', error);
    return {
      isValid: false,
      missingKeys: [],
      config: null
    };
  }
}

/**
 * Initialize default Portkey configuration if it doesn't exist
 */
export async function initializePortkeyConfig(): Promise<void> {
  const supabase = await createClient();
  
  // Check if config already exists
  const { data: existing } = await supabase
    .from('portkey_config')
    .select('id')
    .eq('config_name', 'default')
    .single();

  if (existing) {
    console.log('✅ Portkey configuration already exists');
    return;
  }

  // Create default configuration
  const defaultConfig = {
    config_name: 'default',
    virtual_keys: {
      OPENAI: "temp-openai-pro-f51bf0",
      AWS: "aws-prod-2095a3", 
      GROQ: "groq-prod-cfefa4",
      OPENROUTER: "openrouter-prod-555c0a"
    },
    provider_configs: {
      "temp-openai-pro-f51bf0": {
        provider: "openai",
        models: ["gpt-4o", "gpt-4o-mini"],
        base_url: "https://api.openai.com/v1"
      },
      "aws-prod-2095a3": {
        provider: "aws",
        models: ["anthropic.claude-3-5-sonnet-20241022-v2:0"],
        base_url: "https://bedrock-runtime.us-east-1.amazonaws.com"
      },
      "groq-prod-cfefa4": {
        provider: "groq", 
        models: ["llama-3.3-70b-versatile"],
        base_url: "https://api.groq.com/openai/v1"
      },
      "openrouter-prod-555c0a": {
        provider: "openrouter",
        models: ["anthropic/claude-3.5-sonnet"],
        base_url: "https://openrouter.ai/api/v1"
      }
    },
    routing_strategy: 'balanced' as const,
    is_active: true
  };

  const { error } = await supabase
    .from('portkey_config')
    .insert(defaultConfig);

  if (error) {
    console.error('Failed to initialize Portkey config:', error);
    throw new Error(`Failed to initialize Portkey configuration: ${error.message}`);
  }

  console.log('✅ Portkey configuration initialized successfully');
}
