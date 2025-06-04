import React from 'react';
import Sidebar from '../components/Sidebar';
import ustpLogo from '../../assets/ustp-things-logo.png';
import userAvatar from '../../assets/ustp thingS/Person.png';
import sendIcon from '../../assets/ustp thingS/Send.png';
import imageIcon from '../../assets/ustp thingS/Image.png';
import cameraIcon from '../../assets/ustp thingS/Camera.png';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, doc, setDoc, increment, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { uploadToCloudinary } from '../../lib/cloudinaryUpload';

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
  profileImage?: string;
}

// Chat component for individual conversations
function ChatWindow({ userId }: { userId: string }) {
  //@ts-ignore
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string>(userAvatar);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Debugging logs
  React.useEffect(() => {
    console.log('[ChatWindow] Current user UID:', auth.currentUser?.uid);
    console.log('[ChatWindow] userId from URL:', userId);
  }, [userId]);

  // Fetch other user's username and profile picture
  React.useEffect(() => {
    if (!userId) return;
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOtherUserName(userData.username || userData.name || 'Unknown User');
          setOtherUserAvatar(userData.profileImage || userAvatar);
        } else {
          setOtherUserName('Unknown User');
          setOtherUserAvatar(userAvatar);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setOtherUserName('Unknown User');
        setOtherUserAvatar(userAvatar);
      }
    };
    fetchUserData();
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
      await updateChatRoom(newMessage);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const sendFileMessage = async (file: File, type: 'image' | 'file') => {
    if (!auth.currentUser) return;

    setUploading(true);
    setError(null); // Clear any previous errors
    
    try {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        setUploading(false);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Unsupported file type. Please upload images, videos, PDFs, or documents.');
        setUploading(false);
        return;
      }

      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

      // Upload file to Cloudinary
      const fileUrl = await uploadToCloudinary(file, 'profile_picture');
      
      const messageData = {
        text: type === 'image' ? 'Sent an image' : `Sent a file: ${file.name}`,
        senderId: auth.currentUser.uid,
        receiverId: userId,
        sender: auth.currentUser.email,
        timestamp: serverTimestamp(),
        participants: [auth.currentUser.uid, userId],
        status: 'sent',
        type: type,
        fileUrl: fileUrl,
        fileName: file.name
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Update message status to delivered
      setTimeout(() => {
        setDoc(doc(db, 'messages', messageRef.id), { status: 'delivered' }, { merge: true });
      }, 1000);

      // Update chat room
      await updateChatRoom(messageData.text);

    } catch (error) {
      console.error('Error sending file:', error);
      if (error instanceof Error) {
        setError(`Failed to send file: ${error.message}`);
      } else {
        setError('Failed to send file. Please check your internet connection and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const updateChatRoom = async (lastMessage: string) => {
    if (!auth.currentUser) return;

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
        lastMessage: lastMessage,
        lastMessageTime: serverTimestamp(),
        unreadCount: increment(1)
      }, { merge: true });
    } else {
      await addDoc(chatRoomRef, {
        participants: [auth.currentUser.uid, userId],
        lastMessage: lastMessage,
        lastMessageTime: serverTimestamp(),
        unreadCount: 1
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      sendFileMessage(file, isImage ? 'image' : 'file');
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendFileMessage(file, 'image');
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
    <div className="flex flex-col h-full bg-white">
      {/* Chat header with profile info */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-3">
          <img 
            src={otherUserAvatar} 
            alt="User Avatar" 
            className="w-12 h-12 rounded-full object-cover border-2 border-[#F88379]" 
          />
          <div>
            <h2 className="text-lg font-bold text-[#F88379]">{otherUserName || 'Galdo Boutique'}</h2>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-500">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ paddingBottom: '110px' }}>
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
                } mb-4`}
              >
                <div className="flex items-start gap-3 max-w-[80%]">
                  {message.senderId !== auth.currentUser?.uid && (
                    <img 
                      src={otherUserAvatar} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                    />
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-full ${
                      message.senderId === auth.currentUser?.uid
                        ? 'bg-[#F88379] text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm border'
                    }`}
                  >
                    {message.type === 'text' ? (
                      <p className="break-words text-sm leading-relaxed">{message.text}</p>
                    ) : message.type === 'image' ? (
                      <div>
                        <img 
                          src={message.fileUrl} 
                          alt="Shared image" 
                          className="max-w-full max-h-64 rounded-lg object-cover" 
                        />
                        {message.text && message.text !== 'Sent an image' && (
                          <p className="mt-2 text-sm">{message.text}</p>
                        )}
                      </div>
                    ) : (
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:underline text-sm"
                      >
                        <span>📎</span>
                        <span>{message.fileName}</span>
                      </a>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-75">
                        {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.senderId === auth.currentUser?.uid && (
                        <span className="text-xs">
                          {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="flex items-start gap-3">
                  <img 
                    src={otherUserAvatar} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover" 
                  />
                  <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input area - now fixed at the bottom */}
      <div className="fixed bottom-0 left-[348px] right-0 z-20 bg-white border-t p-4" style={{maxWidth: 'calc(100vw - 348px)'}}>
        {uploading && (
          <div className="mb-3 text-center">
            <span className="text-sm text-[#F88379]">Uploading file...</span>
          </div>
        )}
        {error && (
          <div className="mb-3 text-center">
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          style={{ display: 'none' }}
        />
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          {/* Media buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-10 h-10 rounded-full bg-[#F88379] hover:bg-[#f96d62] transition flex items-center justify-center disabled:opacity-50"
              title="Send Picture/File"
            >
              <img src={imageIcon} alt="Image" className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="w-10 h-10 rounded-full bg-[#F88379] hover:bg-[#f96d62] transition flex items-center justify-center disabled:opacity-50"
              title="Take Photo"
            >
              <img src={cameraIcon} alt="Camera" className="w-5 h-5" />
            </button>
          </div>

          {/* Message input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type message..."
              className="w-full py-3 px-4 pr-12 rounded-full border border-gray-300 focus:outline-none focus:border-[#F88379] text-sm"
              disabled={uploading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || uploading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F88379] hover:bg-[#f96d62] transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send Message"
            >
              <img src={sendIcon} alt="Send" className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
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
                (otherUserData?.profileImage || userAvatar),
              customerName: data.customerId === currentUser.uid ? 
                (currentUser.displayName || "You") : 
                (otherUserData?.displayName || otherUserData?.username || "Unknown User"),
              customerAvatar: data.customerId === currentUser.uid ? 
                (currentUser.photoURL || userAvatar) : 
                (otherUserData?.profileImage || userAvatar),
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
  const [otherUserName, setOtherUserName] = useState<string>('');

  // Fetch other user's name for the header
  useEffect(() => {
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

  return (
    <div className="flex min-h-screen bg-white">
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
        <header className="fixed top-0 right-0 left-[348px] z-10 flex items-center justify-between px-8 py-4 bg-white shadow-md border-b">
          <div className="flex items-center gap-4">
            <img src={ustpLogo} alt="USTP Things Logo" className="w-[80px] h-[63px] object-contain border-r-2 border-[#F88379]" />
            <h3 className="text-2xl font-bold text-[#F88379]">
             <span className='text-[#fb9e95] font-medium'> My Messages {`>`}</span> {otherUserName}
            </h3>
          </div>
        </header>
        <div className="pt-[95px] flex-1">
          {userId && <ChatWindow userId={userId} />}
        </div>
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
    <div className="flex min-h-screen bg-white">
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