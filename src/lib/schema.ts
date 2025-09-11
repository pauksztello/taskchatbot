// lib/schema.ts
import {
  pgTable,
  uuid,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { generateId, UIMessage } from 'ai';

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey(),
  cookieId: uuid("cookie_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  message: jsonb('message').$type<UIMessage>().notNull(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
