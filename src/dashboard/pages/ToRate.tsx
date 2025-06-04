import Sidebar from '../components/Sidebar';
import ustpLogo from '../../assets/ustp-things-logo.png';
// @ts-ignore
import userAvatar from '../../assets/ustp thingS/Person.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
// @ts-ignore
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

// @ts-ignore
interface SellerData {
  businessName: string;
  avatar?: string;
}

// @ts-ignore
interface OrderData {
  userId: string;
  sellerId: string;
  productId: string;
  status: 'Completed';
  schoolLocation: string;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: string;
  quantity: number;
  totalAmount: number;
  createdAt: { toDate: () => Date };
  completedAt: { toDate: () => Date };
  productName: string;
  productImage: string;
  isRated?: boolean;
}

interface Order {
  id: string;
  sellerId: string;
  productId: string;
  status: 'Completed';
  schoolLocation: string;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: string;
  quantity: number;
  totalAmount: number;
  createdAt: Date;
  completedAt: Date;
  productName: string;
  productImage: string;
  sellerName?: string;
  sellerAvatar?: string;
  isRated?: boolean;
}

interface ToRateContentProps {
  orders: Order[];
  onRateNow: (order: Order) => void;
  loading: boolean;
}

// Content component without header and sidebar
export function ToRateContent({ orders, onRateNow, loading }: ToRateContentProps) {
  const renderOrderCard = (order: Order) => (
    <div key={order.id} className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center gap-4">
        <img src={order.productImage} alt={order.productName} className="w-16 h-16 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{order.productName}</h3>
              <p className="text-sm text-gray-600">Seller: {order.sellerName}</p>
            </div>
            <span className="text-sm text-gray-500">
              Completed on: {order.completedAt.toLocaleDateString()} {order.completedAt.toLocaleTimeString()}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-gray-600">Quantity: {order.quantity}</p>
            <p className="text-gray-600">Total Amount: ₱{order.totalAmount.toLocaleString()}</p>
            <p className="text-gray-600">Pickup: {order.schoolLocation}</p>
            <p className="text-gray-600">Date & Time: {order.pickupDate} at {order.pickupTime}</p>
            <p className="text-gray-600">Payment: {order.paymentMethod}</p>
          </div>
          <div className="flex justify-end mt-4">
            <button 
              onClick={() => onRateNow(order)}
              className="bg-[#F88379] hover:bg-[#F88379]/90 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
            >
              Rate Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center text-gray-500 mt-8">Loading orders to rate...</div>;
  }

  if (orders.length === 0) {
    return <div className="text-center text-gray-500 mt-8">No orders to rate at the moment.</div>;
  }

  return (
    <div className="space-y-6">
      {orders.map(renderOrderCard)}
    </div>
  );
}

// Full page component with header and sidebar
export default function ToRate() {
  // @ts-ignore
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToRateOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', auth.currentUser?.uid),
          where('status', '==', 'Completed'),
          where('isRated', '==', false)
        );
        const querySnapshot = await getDocs(q);
        const ordersList: Order[] = [];
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          // Optionally fetch seller info
          let sellerName = '';
          let sellerAvatar = '';
          try {
            const sellerDoc = await getDoc(doc(db, 'users', data.sellerId));
            if (sellerDoc.exists()) {
              const sellerData = sellerDoc.data();
              sellerName = sellerData?.name || '';
              sellerAvatar = sellerData?.avatar || '';
            }
          } catch {}
          ordersList.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : new Date(),
            sellerName,
            sellerAvatar,
          } as Order);
        }
        
        // Sort orders by createdAt in descending order (most recent first)
        ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setOrders(ordersList);
      } catch (error) {
        console.error('Error fetching to-rate orders:', error);
      }
      setLoading(false);
    };
    fetchToRateOrders();
  }, []);

  const handleRateNow = async (order: Order) => {
    // Navigate to rating page with order details
    navigate(`/dashboard/rate/${order.id}`, { state: { order } });
  };

  // Sidebar navigation handler
  const handleSidebarNav = (view: 'home' | 'likes' | 'recently' | 'orders' | 'to-rate' | 'messages') => {
    switch (view) {
      case 'home':
        navigate('/dashboard');
        break;
      case 'likes':
        navigate('/dashboard/likes');
        break;
      case 'recently':
        navigate('/dashboard/recently-viewed');
        break;
      case 'orders':
        navigate('/dashboard/orders');
        break;
      case 'to-rate':
        navigate('/dashboard/to-rate');
        break;
      case 'messages':
        navigate('/dashboard/messages');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f6fd]">
      {/* Sidebar */}
      <div className="w-[348px] flex-shrink-0">
        <Sidebar
          onVerifyClick={() => setShowModal(true)}
          onHomeClick={() => handleSidebarNav('home')}
          onLikesClick={() => handleSidebarNav('likes')}
          onRecentlyClick={() => handleSidebarNav('recently')}
          onOrdersClick={() => handleSidebarNav('orders')}
          onRateClick={() => handleSidebarNav('to-rate')}
          onMessageClick={() => handleSidebarNav('messages')}
          activeButton="to-rate"
        />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 pr-[47px] py-4 bg-white h-[70px] w-full shadow-[0_4px_4px_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <img src={ustpLogo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
            <h1 className="text-3xl font-bold text-[#F88379] pb-1">To Rate</h1>
          </div>
        </header>
        <div className="p-10">
          <ToRateContent 
            orders={orders}
            onRateNow={handleRateNow}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
} 