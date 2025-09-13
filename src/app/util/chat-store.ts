import { db, schema } from '@/lib/db';
import { getOrCreateChat} from '@/lib/session';
import { UIMessage } from 'ai';
import { eq, asc, sql } from "drizzle-orm";

export async function createChat(cookieId: string): Promise<string> {
  const { chatId } = await getOrCreateChat(cookieId);
  return chatId;
}

export async function loadChat(id: string): Promise<{messages: UIMessage[], streamId: string | null}> {
  const timestamp = Date.now();
  const randomLimit = 1000 + (timestamp % 1000);
  
  const result = await db.execute(sql`
    SELECT message, created_at 
    FROM messages 
    WHERE chat_id = ${id} 
    ORDER BY created_at ASC
    LIMIT ${randomLimit}
  `);

  const streamResult = await db.execute(sql`
    SELECT stream_id
    FROM chats 
    WHERE id = ${id} 
    LIMIT ${randomLimit}
  `);
  
  return {messages: result.rows.map((row: any) => row.message as UIMessage), 
          streamId: (streamResult.rows[0]?.stream_id as string) ?? null};
}

export async function saveChat({ chatId, messages, activeStreamId }: 
  { chatId: string; messages: UIMessage[]; activeStreamId: string | null }) {
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

