// app/api/chat/route.ts
import {
  convertToModelMessages,
  streamText,
  UIMessage,
  validateUIMessages,
  tool,
  createIdGenerator,
  generateId,
} from 'ai';
//import { z } from 'zod';
import { clearAllMessages, loadChat, saveChat } from '@/app/util/chat-store';
import { openai } from '@ai-sdk/openai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream'
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
  const { message, id }: { message: UIMessage | undefined; id: string; } = await req.json();

  
  const { messages: previousMessages } = await loadChat(id);

  const messages = [...previousMessages, message!];

  // Validate loaded messages against
  // tools, data parts schema, and metadata schema
  const validatedMessages = await validateUIMessages({
    messages,
    //tools, // Ensures tool calls in messages match current schemas
    //dataPartsSchema,
    //metadataSchema,
  });

  saveChat({ chatId: id, messages, activeStreamId: null });

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
     saveChat({ chatId: id, messages, activeStreamId: null });
    },
        async consumeSseStream({ stream }) {
      const streamId = generateId();

      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({ waitUntil: after });
      await streamContext.createNewResumableStream(streamId, () => stream);

      // Update the chat with the active stream ID
      saveChat({ chatId: id, messages: [], activeStreamId: streamId });
    },
  });
}
