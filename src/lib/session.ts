import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { generateId } from 'ai';

if (!process.env.DATABASE_URL) console.error("DATABASE_URL is not set");

export async function getSessionByCookie(cookieId: string): Promise<{
    sessionId: string;
  }> {
    const existingSession = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.cookieId, cookieId))
      .limit(1);
  
    let sessionId: string;
    if (existingSession.length) {
      sessionId = existingSession[0].id;
    } else {
      const inserted = await db
        .insert(schema.sessions)
        .values({ cookieId: cookieId })
        .returning({ id: schema.sessions.id });
      sessionId = inserted[0].id;
    }
    return { sessionId: sessionId };
  } 

  export async function getOrCreateChat(sessionId: string): Promise<{
    chatId: string;
  }> {
    let chatId: string;
    chatId = generateId();
    await db
      .insert(schema.chats)
      .values({ id: chatId, sessionId: sessionId });

    return { chatId };
  }