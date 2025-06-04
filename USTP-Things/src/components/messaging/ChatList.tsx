import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';

interface ChatPreview {
  id: string;
  lastMessage: string;
  lastMessageTime: Date;
  recipientId: string;
  recipientName: string;
  unreadCount: number;
}

interface ChatListProps {
  onSelectChat: (recipientId: string, recipientName: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat }) => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatPreviews = snapshot.docs.map(doc => {
        const data = doc.data();
        const recipientId = data.participants.find((id: string) => id !== user.uid);
        return {
          id: doc.id,
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          recipientId,
          recipientName: data.participantNames?.[recipientId] || 'Unknown User',
          unreadCount: data.unreadCounts?.[user.uid] || 0
        };
      });
      chatPreviews.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      setChats(chatPreviews);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.recipientId, chat.recipientName)}
            className="w-full p-4 border-b hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-800">{chat.recipientName}</h3>
                <p className="text-sm text-gray-600 truncate max-w-[200px]">
                  {chat.lastMessage}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {chat.lastMessageTime.toLocaleTimeString()}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
        {chats.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList; 