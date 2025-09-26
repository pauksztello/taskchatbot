// src/app/page.tsx
import { redirect } from "next/navigation";
import { createChat } from "@/app/util/chat-store";
import { cookies } from "next/headers";

// NOTE: This page shouldnt exist, just put an empty chat page here

export default async function Page() {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("sid")?.value;

  if (!cookieId) {
    throw new Error("No session cookie found"); // Fails only if middleware is not working
  }

  const chatId = await createChat(cookieId); // NOTE: Chat should not be created in the RSC component, but in api route
  redirect(`/api/chat/${chatId}`);
}
