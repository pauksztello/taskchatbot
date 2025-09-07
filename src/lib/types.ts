// src/lib/types.ts
// Shared types accross the application

export type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ChatRequestBody = {
  message: string;
};
