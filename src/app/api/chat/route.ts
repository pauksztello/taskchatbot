import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"), // or "gpt-3.5-turbo"
    messages,
  });

  return result.toTextStreamResponse();
}
