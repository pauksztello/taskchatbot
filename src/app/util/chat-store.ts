import { db, schema } from '@/lib/db';
import { getOrCreateChat, getSessionByCookie } from '@/lib/session';
import { UIMessage } from 'ai';
import { eq, asc } from "drizzle-orm";

export async function createChat(cookieId: string): Promise<string> {
  const { sessionId } = await getSessionByCookie(cookieId);
  const { chatId } = await getOrCreateChat(sessionId);
  return chatId;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const rows = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.chatId, id))
    .orderBy(asc(schema.messages.createdAt));

  return rows.map((row) => row.message as UIMessage);
}

export async function saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }) {
  await db.delete(schema.messages).where(eq(schema.messages.chatId, chatId));

  if (messages.length === 0) return;

  await db.insert(schema.messages).values(
    messages.map((message) => ({
      chatId,
      message,
    }))
  );
}

