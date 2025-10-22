import { Portkey } from "portkey-ai";

// Portkey Virtual Keys for multi-modal AI support
export const PORTKEY_VIRTUAL_KEYS = {
  OPENAI: "temp-openai-pro-f51bf0",
  AWS: "aws-prod-2095a3",
  GROQ: "groq-prod-cfefa4",
  OPENROUTER: "openrouter-prod-555c0a"
};

class PortkeyClient {
  client: Portkey;
  constructor() {
    this.client = new Portkey({
      apiKey: process.env.PORTKEY_API_KEY || "",
      baseURL: "https://api.portkey.ai/v1",
    });
  }
}

export default PortkeyClient;
