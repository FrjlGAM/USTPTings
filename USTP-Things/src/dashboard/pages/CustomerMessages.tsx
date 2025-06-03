import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ustpLogo from '../../assets/ustp-things-logo.png';
import LeftArrow from '../../assets/ustp thingS/LeftArrow.png';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  sellerName: string;
  sellerAvatar: string;
  isTyping?: boolean;
  unreadCount?: number;
  customerId: string;
}

const CustomerMessages: React.FC = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Listen for chatRooms where the seller is a participant
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(chatRoomsRef, where('participants', 'array-contains', currentUser.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const rooms: ChatRoom[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Find the other participant (customer)
          const otherUserId = (data.participants || []).find((id: string) => id !== currentUser.uid);
          if (otherUserId) {
            rooms.push({
              id: doc.id,
              ...data,
              customerId: otherUserId,
              unreadCount: data.unreadCount || 0,
              isTyping: data.isTyping || false
            } as ChatRoom);
          }
        });
        setChatRooms(rooms);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching chat rooms:', error);
        setError('Failed to load conversations. Please try again.');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error in chat rooms listener:', err);
      setError('Failed to load conversations. Please try again.');
      setLoading(false);
    }
  }, []);

  const handleChatClick = async (room: ChatRoom) => {
    try {
      // Reset unread count when opening chat
      if (room.unreadCount && room.unreadCount > 0) {
        const chatRoomRef = doc(db, 'chatRooms', room.id);
        await setDoc(chatRoomRef, { unreadCount: 0 }, { merge: true });
      }
      navigate(`/dashboard/messages/${room.customerId}`);
    } catch (error) {
      console.error('Error resetting unread count:', error);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen w-full bg-[#FFF3F2] flex items-center justify-center">
        <div className="text-center text-gray-500">Please sign in to view customer messages.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FFF3F2]">
      {/* Top bar with back button and header */}
      <header className="flex items-center gap-4 px-8 pr-[47px] py-4 bg-[#FFF3F2] h-[70px] shadow-[0_4px_4px_0_rgba(0,0,0,0.1)] sticky top-0 z-30">
        <button onClick={() => navigate(-1)}>
          <img src={LeftArrow} alt="Back" className="h-10" />
        </button>
        <img src={ustpLogo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
        <span className="text-3xl font-bold text-[#F88379] pb-1">Customer Messages</span>
      </header>

      <div className="p-8 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500">Loading conversations...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : chatRooms.length === 0 ? (
          <div className="text-center text-gray-500">No customer messages yet.</div>
        ) : (
          chatRooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center bg-white rounded-2xl px-6 py-4 shadow cursor-pointer hover:shadow-md transition relative"
              style={{ minHeight: 80 }}
              onClick={() => handleChatClick(room)}
            >
              <img 
                src={room.sellerAvatar || 'https://static.wikia.nocookie.net/spongebob/images/7/7e/Nat_Peterson_29.png'} 
                alt={room.sellerName || 'Customer'} 
                className="w-14 h-14 rounded-full object-cover mr-6" 
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#F88379] text-lg">{room.sellerName || 'Customer'}</div>
                  <div className="flex items-center gap-2">
                    {room.isTyping && (
                      <span className="text-sm text-gray-500 italic">typing...</span>
                    )}
                    <span className="text-sm text-gray-500">
                      {room.lastMessageTime?.toDate()?.toLocaleString() || 'Just now'}
                    </span>
                  </div>
                </div>
                <div className="text-gray-800 text-base">
                  <span className="font-bold">Customer:</span> {room.lastMessage || 'No messages yet.'}
                </div>
              </div>
              {room.unreadCount && room.unreadCount > 0 && (
                <div className="absolute top-4 right-4 bg-[#F88379] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  {room.unreadCount}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerMessages; 