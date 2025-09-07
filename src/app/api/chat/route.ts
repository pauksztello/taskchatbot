// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, asc, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Msg, ChatRequestBody } from "@/lib/types";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
}

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set");
}

export const runtime = 'nodejs';

export const maxDuration = 30;

// --- cookie + session + thread helper ---
async function getOrCreateSessionAndThread(): Promise<{
  sessionId: string;
  threadId: string;
}> {
  const store = cookies();

  let sid: string | null = store.get("sid")?.value ?? null;
  if (!sid) {
    sid = crypto.randomUUID();
     store.set("sid", sid);
  }

  // session
  const existingSession = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.cookieId, sid))
    .limit(1);

  let sessionId: string;
  if (existingSession.length) {
    sessionId = existingSession[0].id;
  } else {
    const inserted = await db
      .insert(schema.sessions)
      .values({ cookieId: sid })
      .returning({ id: schema.sessions.id });
    sessionId = inserted[0].id;
  }

  // thread (latest or create)
  const latestThread = await db
    .select()
    .from(schema.threads)
    .where(eq(schema.threads.sessionId, sessionId))
    .orderBy(desc(schema.threads.createdAt))
    .limit(1);

  let threadId: string;
  if (latestThread.length) {
    threadId = latestThread[0].id;
  } else {
    const inserted = await db
      .insert(schema.threads)
      .values({ sessionId })
      .returning({ id: schema.threads.id });
    threadId = inserted[0].id;
  }

  return { sessionId, threadId };
}

// --- GET: return full history for the current thread ---
export async function GET() {
  const { threadId } = await getOrCreateSessionAndThread();

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
    .where(eq(schema.messages.threadId, threadId))
    .orderBy(asc(schema.messages.createdAt));

  const messages: Msg[] = rows.map((r) => ({
    id: r.id,
    role: (r.role as Msg["role"]) ?? "assistant",
    content: r.content,
    createdAt: (r.createdAt ?? new Date()).toISOString(),
  }));

  return NextResponse.json({ threadId, messages });
}

// --- POST: accept a user message, generate assistant reply, persist both, return updated thread ---
export async function POST(req: Request) {
  const { threadId } = await getOrCreateSessionAndThread();

  let body: ChatRequestBody | null = null;
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  let userInput = "";
  
  if (body) {
    if ("message" in body && typeof body.message === "string") {
      userInput = body.message;
    }
  }

  userInput = userInput.trim();
  if (!userInput) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  // 1) persist user message
  await db.insert(schema.messages).values({
    threadId,
    role: "user",
    content: userInput,
  });

  // 2) build full history from DB for context
  const historyRows: { role: string; content: string }[] = await db
    .select({
      role: schema.messages.role,
      content: schema.messages.content,
    })
    .from(schema.messages)
    .where(eq(schema.messages.threadId, threadId))
    .orderBy(asc(schema.messages.createdAt));

  // 3) call the model (non-streaming)
  const { text: assistantText } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful assistant.",
    messages: historyRows.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  });

  // 4) persist assistant reply
  await db.insert(schema.messages).values({
    threadId,
    role: "assistant",
    content: assistantText,
  });

  // 5) return full updated thread
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
    .where(eq(schema.messages.threadId, threadId))
    .orderBy(asc(schema.messages.createdAt));

  const messages: Msg[] = rows.map((r) => ({
    id: r.id,
    role: (r.role as Msg["role"]) ?? "assistant",
    content: r.content,
    createdAt: (r.createdAt ?? new Date()).toISOString(),
  }));

  return NextResponse.json({ threadId, messages });
}

