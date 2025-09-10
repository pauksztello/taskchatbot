// lib/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("message_role", ["user", "assistant", "system"]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(), 
  cookieId: varchar("cookie_id", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }), 
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  preferences: jsonb("preferences"),
  personalInfo: jsonb("personal_info"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
export const sessionsRelations = relations(sessions, ({ many }) => ({
  chats: many(chats),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  session: one(sessions, {
    fields: [chats.sessionId],
    references: [sessions.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
