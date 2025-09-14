// app/api/chat/route.ts
import {
  convertToModelMessages,
  streamText,
  UIMessage,
  validateUIMessages,
  createIdGenerator,
} from 'ai';
//import { z } from 'zod';
import { clearAllMessages, loadChat, saveChat } from '@/app/util/chat-store';
import { openai } from '@ai-sdk/openai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream'
import { getMCPClient } from '@/lib/tools';


export async function POST(req: Request) {
  //await clearAllMessages();
  const { message, id }: { message: UIMessage | undefined; id: string; } = await req.json();  

  const { messages: previousMessages } = await loadChat(id);
  
  const messages = [...previousMessages, message!];

  const mcpClient = await getMCPClient();
  const mcpTools = await mcpClient.tools();

  const validatedMessages = await validateUIMessages({
    messages,
  });

  saveChat({ chatId: id, messages, streamId: null });

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: convertToModelMessages(validatedMessages),
    tools: mcpTools,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 16,
    }),
    onFinish: ({ messages }) => {
     saveChat({ chatId: id, messages, streamId: null });
    },
    async consumeSseStream({ stream }) {
      const streamId = crypto.randomUUID();

      // Create a resumable stream from the SSE stream
      const streamContext = createResumableStreamContext({ waitUntil: after });
      await streamContext.createNewResumableStream(streamId, () => stream);

      // Update the chat with the active stream ID
      saveChat({ chatId: id, messages: [], streamId: streamId });
    },
  });
}
