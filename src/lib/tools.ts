// src/lib/tools.ts
import { experimental_createMCPClient as createMCPClient } from 'ai'; 

export async function getMCPClient() {
    return await createMCPClient({
        transport: {
          type: 'sse',
          url: 'https://mcp.api.coingecko.com/sse',
        },
      });
}
