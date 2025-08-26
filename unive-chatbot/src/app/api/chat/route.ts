import { NextRequest } from "next/server";
import OpenAI from "openai";
import { streamText } from "ai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!, // set this in Vercel or .env.local
});

export const runtime = "edge"; // best for streaming

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const result = await streamText({
    model: client.chat.completions, // Vercel AI SDK wrapper
    messages,
  });

  return result.toAIStreamResponse();
}
