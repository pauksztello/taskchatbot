// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { db, schema } from "@/lib/db";
import { getOrCreateSession, getOrCreateChat } from "@/lib/session";

if (!process.env.DATABASE_URL) console.error("DATABASE_URL is not set");
if (!process.env.OPENAI_API_KEY) console.error("OPENAI_API_KEY is not set");

export async function GET() {
  const { sessionId } = await getOrCreateSession();
  const { chatId } = await getOrCreateChat(sessionId);

  const rows: {
    id: string;
    role: string;
    content: string;
    createdAt: Date | null;
  }[] = await db
    .select({
      id: schema.messages.id,
      role: schema.messages.role,
      content: schema.messages.content,
      createdAt: schema.messages.createdAt,
    })
    .from(schema.messages)
    .where(eq(schema.messages.chatId, chatId))
    .orderBy(asc(schema.messages.createdAt));

  return NextResponse.json({ chatId });
}

export async function POST(req: Request) {
  const { sessionId } = await getOrCreateSession();
  const { chatId } = await getOrCreateChat(sessionId);

    const { messages }: { messages: UIMessage[] } = await req.json();
  
    const result = streamText({
      model: openai('gpt-4.1'),
      system: 'You are a helpful assistant.',
      messages: convertToModelMessages(messages),
    });
  
    return result.toUIMessageStreamResponse();
  }

