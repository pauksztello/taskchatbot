import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

if (!process.env.DATABASE_URL) console.error("DATABASE_URL is not set");

// --- cookie + session ---
export async function getOrCreateSession(): Promise<{
    sessionId: string;
  }> {
    const store = cookies();
  
    let sid: string | null = store.get("sid")?.value ?? null;
    if (!sid) {
      sid = crypto.randomUUID();
       store.set("sid", sid);
    }
  
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
    return { sessionId };
  }
  
  // --- thread ---
  export async function getOrCreateChat(sessionId: string): Promise<{
    chatId: string;
  }> {
    const latestChat = await db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.sessionId, sessionId))
      .orderBy(desc(schema.chats.createdAt))
      .limit(1);
  
    let chatId: string;
    if (latestChat.length) {
      chatId = latestChat[0].id;
    } else {
      const inserted = await db
        .insert(schema.chats)
        .values({ sessionId })
        .returning({ id: schema.chats.id });
      chatId = inserted[0].id;
    }
    return { chatId };
  }