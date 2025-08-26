"use client";

import { useState } from "react";
import { useChat } from "ai/react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <main className="flex flex-col p-6 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "text-blue-600" : "text-green-600"}
          >
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
          type="submit"
        >
          Send
        </button>
      </form>
    </main>
  );
}
