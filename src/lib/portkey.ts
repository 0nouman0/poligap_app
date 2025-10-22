/**
 * Portkey Configuration
 * 
 * ⚠️ DEPRECATED: This file is kept for backwards compatibility.
 * Please use the unified AI client from @/lib/ai-client instead.
 * 
 * The new AI client provides:
 * - Automatic provider routing and failover
 * - Cost tracking and optimization  
 * - Streaming support
 * - Better error handling
 * 
 * Virtual keys are now defined in @/lib/ai-client.ts
 */

import { Portkey } from "portkey-ai";
import { PORTKEY_VIRTUAL_KEYS } from "@/lib/ai-client";

// Re-export virtual keys for backwards compatibility
export { PORTKEY_VIRTUAL_KEYS };

/**
 * @deprecated Use getAIClient() from @/lib/ai-client instead
 */
class PortkeyClient {
  client: Portkey;
  
  constructor() {
    console.warn(
      "⚠️ PortkeyClient is deprecated. Use getAIClient() from @/lib/ai-client for better features."
    );
    
    this.client = new Portkey({
      apiKey: process.env.PORTKEY_API_KEY || "",
      baseURL: "https://api.portkey.ai/v1",
    });
  }
}

export default PortkeyClient;
