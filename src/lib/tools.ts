// src/lib/tools.ts
import { experimental_createMCPClient as createMCPClient } from 'ai'; 

// NOTE: Why is this in seperate file? Why not use the tools directly in the route?
export async function getMCPClient() {
    return await createMCPClient({
        transport: {
          type: 'sse',
          url: 'https://mcp.api.coingecko.com/sse',
        },
      });
}
