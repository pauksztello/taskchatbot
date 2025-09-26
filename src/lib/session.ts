// src/lib/session.ts
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

if (!process.env.DATABASE_URL) console.error("DATABASE_URL is not set"); // NOTE: why is this check here? should be in the file where db is initialized

  export async function getOrCreateChat(cookieId: string): Promise<{
    chatId: string;
  }> {
    let chatId: string;
    
    const existingChat = await db // NOTE 1: if u expect to return a single value, use deconstructing const [value] = await db
    .select()
    .from(schema.chats)
    .where(eq(schema.chats.cookieId, cookieId))
    .limit(1); // NOTE: A seperate layer should be used for the database operations, to improve the readability and maintainability of the code
    // await getExistingChat(cookieId);
    

    

  if (existingChat.length === 0) { // NOTE 2: After deconstructing, use the value directly "if (value)"
    chatId = randomUUID();
    await db
      .insert(schema.chats)
      .values({ id: chatId, cookieId: cookieId });
      // NOTE Same here
    // await createNewChat(values);
  } else {
    chatId = existingChat[0].id; // NOTE 3: After deconstructing, use the value directly "value.id"
  }
    return { chatId }; // NOTE: Function name "getOrCreateChat" does not match the return value "chatId"
    // It should return chat or be something like getOrCreateChatId()
  }