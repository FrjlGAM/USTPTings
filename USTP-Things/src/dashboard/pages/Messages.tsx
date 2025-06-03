import React from 'react';
import Sidebar from '../components/Sidebar';
import ustpLogo from '../../assets/ustp-things-logo.png';
import userAvatar from '../../assets/ustp thingS/Person.png';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, doc, setDoc, increment, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Timestamp;
  sender: string;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  sellerName: string;
  sellerAvatar: string;
  isTyping?: boolean;
  unreadCount?: number;
  sellerId: string;
  customerId: string;
  customerName?: string;
  customerAvatar?: string;
}

interface UserData {
  displayName?: string;
  username?: string;
  photoURL?: string;
}

// Chat component for individual conversations
function ChatWindow({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Debugging logs
  React.useEffect(() => {
    console.log('[ChatWindow] Current user UID:', auth.currentUser?.uid);
    console.log('[ChatWindow] userId from URL:', userId);
  }, [userId]);

  // Fetch other user's username
  React.useEffect(() => {
    if (!userId) return;
    const fetchUsername = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setOtherUserName(userDoc.data().username || userDoc.data().name || 'Unknown User');
        } else {
          setOtherUserName('Unknown User');
        }
      } catch (error) {
        console.error('Error fetching username:', error);
        setOtherUserName('Unknown User');
      }
    };
    fetchUsername();
  }, [userId]);

  const scrollToBottom = (options: ScrollIntoViewOptions = { behavior: "smooth" }) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView(options);
    }
  };

  React.useEffect(() => {
    scrollToBottom({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!auth.currentUser) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing status
    setIsTyping(true);
    const chatRoomRef = doc(db, 'chatRooms', `${auth.currentUser.uid}_${userId}`);
    setDoc(chatRoomRef, { isTyping: true }, { merge: true });

    // Clear typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setDoc(chatRoomRef, { isTyping: false }, { merge: true });
    }, 3000);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);

    try {
      // Query messages for this specific chat
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('participants', 'array-contains', auth.currentUser.uid),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only include messages between the current user and this user
          if ((data.senderId === auth.currentUser?.uid && data.receiverId === userId) ||
              (data.senderId === userId && data.receiverId === auth.currentUser?.uid)) {
            fetchedMessages.push({
              id: doc.id,
              ...data,
              status: data.status || 'sent',
              type: data.type || 'text'
            } as Message);
          }
        });
        console.log('[ChatWindow] Fetched messages:', fetchedMessages);
        setMessages(fetchedMessages);
        setLoading(false);
        scrollToBottom({ behavior: "smooth" });

        // Mark messages as read
        const unreadMessages = fetchedMessages.filter(
          msg => msg.senderId === userId && msg.status !== 'read'
        );
        if (unreadMessages.length > 0) {
          unreadMessages.forEach(msg => {
            const messageRef = doc(db, 'messages', msg.id);
            setDoc(messageRef, { status: 'read' }, { merge: true });
          });
        }
      }, (error) => {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again.');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error in message listener:', err);
      setError('Failed to load messages. Please try again.');
      setLoading(false);
    }
  }, [userId]);

  // Warn if userId is not a UID (simple check: UIDs are usually 28 chars, not all lowercase)
  React.useEffect(() => {
    if (userId && userId.length < 20) {
      console.warn('[ChatWindow] WARNING: userId from URL does not look like a Firebase UID:', userId);
    }
  }, [userId]);

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      const messageData = {
        text: newMessage,
        senderId: auth.currentUser.uid,
        receiverId: userId,
        sender: auth.currentUser.email,
        timestamp: serverTimestamp(),
        participants: [auth.currentUser.uid, userId],
        status: 'sent',
        type: 'text'
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Update message status to delivered
      setTimeout(() => {
        setDoc(doc(db, 'messages', messageRef.id), { status: 'delivered' }, { merge: true });
      }, 1000);

      // Update or create chat room
      const chatRoomRef = collection(db, 'chatRooms');
      const q = query(
        chatRoomRef,
        where('participants', 'array-contains', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      let chatRoomId: string | null = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId)) {
          chatRoomId = doc.id;
        }
      });

      if (chatRoomId) {
        const docRef = doc(db, 'chatRooms', chatRoomId);
        await setDoc(docRef, {
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp(),
          unreadCount: increment(1)
        }, { merge: true });
      } else {
        await addDoc(chatRoomRef, {
          participants: [auth.currentUser.uid, userId],
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp(),
          unreadCount: 1
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        const formEvent = new Event('submit') as unknown as React.FormEvent<HTMLFormElement>;
        sendMessage(formEvent);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header with username */}
      <div className="flex items-center gap-4 px-8 py-4 bg-white shadow-md">
        <h2 className="text-xl font-bold text-[#F88379]">Chat with</h2>
        <span className="ml-2 text-lg text-gray-700 font-semibold">{otherUserName}</span>
      </div>
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.senderId === auth.currentUser?.uid
                      ? 'bg-[#F88379] text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.type === 'text' ? (
                    <p className="break-words">{message.text}</p>
                  ) : message.type === 'image' ? (
                    <img src={message.fileUrl} alt="Shared image" className="max-w-full rounded-lg" />
                  ) : (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:underline"
                    >
                      <span>📎</span>
                      <span>{message.fileName}</span>
                    </a>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs opacity-75">
                      {message.timestamp?.toDate().toLocaleTimeString()}
                    </span>
                    {message.senderId === auth.currentUser?.uid && (
                      <span className="text-xs">
                        {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-[#F88379]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`px-4 py-2 rounded-lg transition ${
              newMessage.trim()
                ? 'bg-[#F88379] text-white hover:bg-[#f96d62]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// Content component that can be used both standalone and embedded
export function MessagesContent() {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChatRooms() {
      setLoading(true);
      setError(null);

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No authenticated user found");
          setLoading(false);
          return;
        }

        console.log("Fetching chat rooms for user:", currentUser.uid);

        const chatRoomsRef = collection(db, 'chatRooms');
        const q = query(
          chatRoomsRef,
          where('participants', 'array-contains', currentUser.uid)
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const rooms: ChatRoom[] = [];
          
          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
            
            if (!otherUserId) continue;

            // Fetch the other user's information
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUserData = otherUserDoc.data() as UserData | undefined;

            const room = {
              id: docSnapshot.id,
              participants: data.participants || [],
              lastMessage: data.lastMessage || "",
              lastMessageTime: data.lastMessageTime,
              sellerId: data.sellerId,
              customerId: data.customerId,
              sellerName: data.sellerId === currentUser.uid ? 
                (currentUser.displayName || "You") : 
                (otherUserData?.displayName || otherUserData?.username || "Unknown User"),
              sellerAvatar: data.sellerId === currentUser.uid ? 
                (currentUser.photoURL || userAvatar) : 
                (otherUserData?.photoURL || userAvatar),
              customerName: data.customerId === currentUser.uid ? 
                (currentUser.displayName || "You") : 
                (otherUserData?.displayName || otherUserData?.username || "Unknown User"),
              customerAvatar: data.customerId === currentUser.uid ? 
                (currentUser.photoURL || userAvatar) : 
                (otherUserData?.photoURL || userAvatar),
              unreadCount: data.unreadCount || 0
            } as ChatRoom;

            rooms.push(room);
          }

          // Sort rooms by last message time
          rooms.sort((a, b) => {
            const timeA = a.lastMessageTime?.toDate()?.getTime() || 0;
            const timeB = b.lastMessageTime?.toDate()?.getTime() || 0;
            return timeB - timeA;
          });

          setChatRooms(rooms);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching chat rooms:", error);
          setError("Failed to load conversations. Please try again.");
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error in fetchChatRooms:", err);
        setError("Failed to load conversations. Please try again.");
        setLoading(false);
      }
    }

    fetchChatRooms();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4">
        <div className="text-red-500">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#F88379] text-white px-4 py-2 rounded-lg hover:bg-[#f96d62] transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-gray-500">Loading conversations...</div>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-4">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatRooms
              .filter(room => room.participants.every(id => typeof id === 'string' && id.length >= 20 && !id.includes(' ')))
              .map((room) => {
                const isSeller = room.sellerId === auth.currentUser?.uid;
                const otherUserName = isSeller ? room.customerName : room.sellerName;
                const otherUserAvatar = isSeller ? room.customerAvatar : room.sellerAvatar;
                const roleLabel = isSeller ? "Customer" : "Seller";

                return (
                  <div 
                    key={room.id} 
                    className="bg-white rounded-xl p-4 shadow cursor-pointer hover:shadow-md transition relative"
                    onClick={() => {
                      const otherUserId = room.participants.find((id) => id !== auth.currentUser?.uid);
                      if (otherUserId) navigate(`/dashboard/messages/${otherUserId}`);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={otherUserAvatar} 
                        alt={otherUserName} 
                        className="w-16 h-16 rounded-full object-cover" 
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{otherUserName}</h3>
                            <span className="text-sm text-[#F88379]">{roleLabel}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {room.lastMessageTime?.toDate()?.toLocaleString() || 'Just now'}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{room.lastMessage}</p>
                        {typeof room.unreadCount === 'number' && room.unreadCount > 0 && (
                          <div className="absolute top-4 right-4 bg-[#F88379] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {room.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual chat page component
function ChatPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-[#f7f6fd]">
      <div className="w-[348px] flex-shrink-0">
        <Sidebar
          onHomeClick={() => navigate('/dashboard')}
          onLikesClick={() => navigate('/dashboard/likes')}
          onRecentlyClick={() => navigate('/dashboard/recently')}
          onOrdersClick={() => navigate('/dashboard/orders')}
          onRateClick={() => navigate('/dashboard/to-rate')}
          onMessageClick={() => navigate('/dashboard/messages')}
          activeButton="messages"
        />
      </div>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 bg-white shadow-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/messages')}
              className="text-[#F88379] hover:text-[#f96d62]"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-[#F88379]">
              Chat
            </h1>
          </div>
        </header>
        {userId && <ChatWindow userId={userId} />}
      </main>
    </div>
  );
}

// Main Messages page component
export default function Messages() {
  const navigate = useNavigate();
  const { userId } = useParams();

  if (userId) {
    return <ChatPage />;
  }

  return (
    <div className="flex min-h-screen bg-[#f7f6fd]">
      <div className="w-[348px] flex-shrink-0">
        <Sidebar
          onHomeClick={() => navigate('/dashboard')}
          onLikesClick={() => navigate('/dashboard/likes')}
          onRecentlyClick={() => navigate('/dashboard/recently')}
          onOrdersClick={() => navigate('/dashboard/orders')}
          onRateClick={() => navigate('/dashboard/to-rate')}
          onMessageClick={() => navigate('/dashboard/messages')}
          activeButton="messages"
        />
      </div>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-8 pr-[47px] py-4 bg-white h-[70px] w-full shadow-[0_4px_4px_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <img src={ustpLogo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
            <h1 className="text-3xl font-bold text-[#F88379] pb-1">Messages</h1>
          </div>
        </header>
        <MessagesContent />
      </main>
    </div>
  );
} 