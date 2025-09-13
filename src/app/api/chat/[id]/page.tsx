import { loadChat } from '@/app/util/chat-store';
import Chat from '@/app/ui/chat';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  
  try {
    const messages = await loadChat(id);
    console.log(`Page load - successfully loaded ${messages.messages.length} messages`);
    return <Chat key={`${id}-${messages.messages.length}`} id={id} initialMessages={messages.messages} />;
  } catch (error) {
    console.error('Page load - failed to load messages:', error);
    return <Chat key={`${id}-0`} id={id} initialMessages={[]} />;
  }
}