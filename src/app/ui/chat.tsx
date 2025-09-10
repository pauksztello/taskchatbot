'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
  const [input, setInput] = useState('');
  const { sendMessage, messages } = useChat({
    id, // use the provided chat ID
    messages: initialMessages, // load initial messages
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  // simplified rendering code, extend as needed:
  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.parts
            .map(part => (part.type === 'text' ? part.text : ''))
            .join('')}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}