// src/lib/session.ts
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

if (!process.env.DATABASE_URL) console.error("DATABASE_URL is not set");

  export async function getOrCreateChat(cookieId: string): Promise<{
    chatId: string;
  }> {
    let chatId: string;
    
    const existingChat = await db
    .select()
    .from(schema.chats)
    .where(eq(schema.chats.cookieId, cookieId))
    .limit(1);
  
  if (existingChat.length === 0) {
    chatId = randomUUID();
    await db
      .insert(schema.chats)
      .values({ id: chatId, cookieId: cookieId });
  } else {
    chatId = existingChat[0].id;
  }
    return { chatId };
  }