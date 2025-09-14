'use client';

import { UIMessage } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ChatSidebar from '@/app/ui/chat-sidebar';

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Extract chatId from pathname
  const chatId = pathname.includes('/api/chat/') ? pathname.split('/api/chat/')[1] : null;
  
  // Only show chat layout for chat routes
  const isChatRoute = pathname.startsWith('/api/chat/');

  useEffect(() => {
    loadChats();
  }, []);

  // Refresh chat list when pathname changes (for title updates)
  useEffect(() => {
    if (isChatRoute) {
      loadChats();
    }
  }, [pathname]);

  useEffect(() => {
    const handleFocus = () => {
      loadChats();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chat-manager');
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chat-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      
      if (response.ok) {
        const newChat = await response.json();
        await loadChats(); // Reload sidebar with new chat
        router.push(`/api/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleChatSelect = (selectedChatId: string) => {
    router.push(`/api/chat/${selectedChatId}`);
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    try {
      const response = await fetch(`/api/chat-manager?id=${chatIdToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadChats(); // Reload sidebar after deletion
        if (chatIdToDelete === chatId) {
          const remainingChats = chats.filter(chat => chat.id !== chatIdToDelete);
          if (remainingChats.length > 0) {
            router.push(`/api/chat/${remainingChats[0].id}`);
          } else {
            handleNewChat();
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // If not a chat route, just render children without layout
  if (!isChatRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 bg-white border-r border-gray-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        chats={chats}
        currentChatId={chatId || ''}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
