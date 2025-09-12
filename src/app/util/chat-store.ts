import { db, schema } from '@/lib/db';
import { getOrCreateChat} from '@/lib/session';
import { UIMessage } from 'ai';
import { eq, asc, sql } from "drizzle-orm";

export async function createChat(cookieId: string): Promise<string> {
  const { chatId } = await getOrCreateChat(cookieId);
  return chatId;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const timestamp = Date.now();
  const randomLimit = 1000 + (timestamp % 1000);
  
  const result = await db.execute(sql`
    SELECT message, created_at 
    FROM messages 
    WHERE chat_id = ${id} 
    ORDER BY created_at ASC
    LIMIT ${randomLimit}
  `);
  
  return result.rows.map((row: any) => row.message as UIMessage);
}

export async function saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }) {
  const existingRows = await db.select().from(schema.messages).where(eq(schema.messages.chatId, chatId));
  
  const existingMessageIds = new Set(
    existingRows.map(row => (row.message as UIMessage).id).filter(Boolean)
  );

  const newMessages = messages.filter(message => 
    message.id && !existingMessageIds.has(message.id)
  );

  if (newMessages.length === 0) return;

  await db.insert(schema.messages).values(
    newMessages.map((message) => ({
      chatId,
      message,
    }))
  );
}

export async function clearAllMessages() {
  await db.delete(schema.messages);
}

export async function clearChatMessages(chatId: string) {
  await db.delete(schema.messages).where(eq(schema.messages.chatId, chatId));
}

