import { Portkey } from "portkey-ai";

class PortkeyClient {
  client: Portkey;
  constructor() {
    this.client = new Portkey({
      apiKey: process.env.PORTKEY_API_KEY,
      baseURL: "https://api.portkey.ai/v1",
    });
  }
}

export default PortkeyClient;
