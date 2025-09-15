// src/lib/schema.ts
import {
  pgTable,
  uuid,
  timestamp,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { UIMessage } from 'ai';

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey(),
  streamId: uuid("stream_id").default(sql`null`),
  cookieId: uuid("cookie_id").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
