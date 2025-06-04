import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const Messaging: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<{
    recipientId: string;
    recipientName: string;
  } | null>(null);

  const handleSelectChat = (recipientId: string, recipientName: string) => {
    setSelectedChat({ recipientId, recipientName });
  };

  return (
    <div className="flex h-[600px] gap-4 p-4">
      <ChatList onSelectChat={handleSelectChat} />
      {selectedChat ? (
        <ChatWindow
          recipientId={selectedChat.recipientId}
          recipientName={selectedChat.recipientName}
        />
      ) : (
        <div className="flex-1 bg-white rounded-lg shadow-lg flex items-center justify-center">
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
};

export default Messaging; 