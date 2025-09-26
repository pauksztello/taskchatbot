// src/app/api/chat/[id]/page.tsx
import { loadChat } from "@/app/util/chat-store";
import Chat from "@/app/ui/chat";

// NOTE: Do not create pages in the api folder, create them in the app folder

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  try {
    // NOTE: instead of using try catch, better would be to return messages or null without throwing and catching the error
    const messages = await loadChat(id);
    console.log(
      `Page load - successfully loaded ${messages.messages.length} messages`
    );
    return <Chat id={id} initialMessages={messages.messages} />;
  } catch (error) {
    console.error("Page load - failed to load messages:", error);
    return <Chat id={id} initialMessages={[]} />;
  }
}
