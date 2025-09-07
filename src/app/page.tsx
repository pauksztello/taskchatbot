// app/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Load persisted history on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error("Failed to load history");
        const data: { threadId: string; messages: Msg[] } = await res.json();
        setMessages(data.messages ?? []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const canSend = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  const send = useCallback(async () => {
    if (!canSend) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error("Message failed");
      const data: { threadId: string; messages: Msg[] } = await res.json();
      setMessages(data.messages ?? []);
      setInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [canSend, input]);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "text-blue-600" : "text-green-700"}
          >
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={send}
          disabled={!canSend}
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
    </main>
  );
}
