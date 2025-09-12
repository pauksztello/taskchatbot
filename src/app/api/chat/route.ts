// app/api/chat/route.ts
import {
  convertToModelMessages,
  streamText,
  UIMessage,
  validateUIMessages,
  tool,
  createIdGenerator,
} from 'ai';
//import { z } from 'zod';
import { clearAllMessages, loadChat, saveChat } from '@/app/util/chat-store';
import { openai } from '@ai-sdk/openai';
/*
// Define your tools
const tools = {
  weather: tool({
    description: 'Get weather information',
    parameters: z.object({
      location: z.string(),
      units: z.enum(['celsius', 'fahrenheit']),
    }),
    execute: async ({ location, units }) => {
      // tool implementation 
    },
  }),
  // other tools
};
*/

export async function POST(req: Request) {
  //await clearAllMessages();
  const { message, id } = await req.json();
  
  const previousMessages = await loadChat(id);

  const messages = [...previousMessages, message];

  // Validate loaded messages against
  // tools, data parts schema, and metadata schema
  const validatedMessages = await validateUIMessages({
    messages,
    //tools, // Ensures tool calls in messages match current schemas
    //dataPartsSchema,
    //metadataSchema,
  });

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: convertToModelMessages(validatedMessages),
    //tools,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 16,
    }),
    onFinish: ({ messages }) => {
     saveChat({ chatId: id, messages });
    },
  });
}
