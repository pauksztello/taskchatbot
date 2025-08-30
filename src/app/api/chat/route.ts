import { groq } from "@ai-sdk/groq";
import { convertToModelMessages, streamText, UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // ✅ Convert Vercel AI messages → OpenAI-compatible messages (no `id`)
  const converted = convertToModelMessages(messages);

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    system: "You are a helpful assistant.",
    messages: converted,
  });

  return result.toUIMessageStreamResponse();
}
