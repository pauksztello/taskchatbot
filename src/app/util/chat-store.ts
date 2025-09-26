// src/app/util/chat-store.ts
import { db, schema } from '@/lib/db';
import { getOrCreateChat} from '@/lib/session';
import { UIMessage } from 'ai';
import { eq, sql } from "drizzle-orm";

// NOTE: Why do you have a seperate util folder? Why do not use exiting lib folder.



export async function createChat(cookieId: string): Promise<string> { // NOTE: whats the point of this additional wrapper?
  const { chatId } = await getOrCreateChat(cookieId);
  return chatId;
}

export async function loadChat(id: string): Promise<{messages: UIMessage[], streamId: string | null}> {
  const timestamp = Date.now();
  const randomLimit = 1000 + (timestamp % 1000); // NOTE: What is the purpose of random limit?
  
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
  
  return {messages: result.rows.map((row: any) => row.message as UIMessage),  // NOTE: Unreadable, also using "any" is a sin
          streamId: (streamResult.rows[0]?.stream_id as string) ?? null};
}

export async function saveChat({ chatId, messages, streamId }: 
  // NOTE: Is this vibe coded?
  { chatId: string; messages: UIMessage[]; streamId: string | null }) {
  const existingRows = await db.select().from(schema.messages).where(eq(schema.messages.chatId, chatId));
  
  const existingMessageIds = new Set(
    existingRows.map(row => (row.message as UIMessage).id).filter(Boolean)
  );

  const newMessages = messages.filter(message => 
    message.id && !existingMessageIds.has(message.id)
  );

  await db.update(schema.chats)
  .set({ streamId: streamId })
  .where(eq(schema.chats.id, chatId));

  if (newMessages.length === 0) return;

  await db.insert(schema.messages).values(
    newMessages.map((message) => ({
      chatId,
      message,
    }))
  );
}

export async function clearAllMessages() { // NOTE: Nice, an exaple of seperate layer for database operations
  await db.delete(schema.messages); // NOTE: Do not import whole db, better would be to just import messages or only the tables u need
}

export async function clearChatMessages(chatId: string) {
  await db.delete(schema.messages).where(eq(schema.messages.chatId, chatId));
}

export async function listChats(cookieId: string) {

  const result = await db.execute(sql`
    SELECT 
      c.id,
      c.title,
      c.created_at,
      c.updated_at,
      COUNT(m.chat_id) as message_count
    FROM chats c
    LEFT JOIN messages m ON c.id = m.chat_id
    WHERE c.cookie_id = ${cookieId}
    GROUP BY c.id, c.title, c.created_at, c.updated_at
    ORDER BY c.updated_at DESC
  `);   // NOTE: Drizzle ORM offers you to write queries programatically, instead of using raw sql, which is easier to read and maintain

  
  return result.rows.map((row: any) => ({ // NOTE: Any
    id: row.id,
    title: row.title || 'New Chat',
    createdAt: row.created_at,
    updatedAt: row.updated_at, // NOTE: No consistency, some values typed camel case and some snake case, in typescript camel case is the standard "createdAt"
    messageCount: parseInt(row.message_count) || 0,
  }));
}

export async function deleteChat(chatId: string) {
  await db.delete(schema.chats).where(eq(schema.chats.id, chatId));
}

export async function updateChatTitle(chatId: string, title: string) {
  await db.update(schema.chats)
    .set({ 
      title: title,
      updatedAt: new Date()
    })
    .where(eq(schema.chats.id, chatId));
}

export async function generateChatTitle(chatId: string) {
  const result = await db.execute(sql`
    SELECT message
    FROM messages
    WHERE chat_id = ${chatId}
    AND (message->>'role') = 'user'
    ORDER BY created_at ASC
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    return 'New Chat';
  }
  
  const firstMessage = result.rows[0].message as UIMessage;
  const textContent = firstMessage.parts
    .map(part => part.type === 'text' ? part.text : '')
    .join('')
    .trim();
  
  const words = textContent.split(/\s+/).filter(word => word.length > 0);
  const title = words.slice(0, 4).join(' ');
  
  const finalTitle = words.length > 4 ? `${title}...` : title;
  
  await updateChatTitle(chatId, finalTitle);
  
  return finalTitle;
}

