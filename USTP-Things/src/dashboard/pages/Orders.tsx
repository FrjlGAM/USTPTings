import Sidebar from '../components/Sidebar';
import ustpLogo from '../../assets/ustp-things-logo.png';
import userAvatar from '../../assets/ustp thingS/Person.png';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import StarRatingButton from '../components/StarRatingButton';

interface SellerData {
  businessName: string;
  avatar?: string;
}

interface ProductData {
  name: string;
}

interface OrderData {
  userId: string;
  sellerId: string;
  productId: string;
  status: 'Processing' | 'Ready for pickup' | 'Completed' | 'Cancelled';
  schoolLocation: string;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: string;
  quantity: number;
  totalAmount: number;
  createdAt: { toDate: () => Date };
  productName: string;
  productImage: string;
}

interface Order {
  id: string;
  sellerId: string;
  productId: string;
  status: 'Processing' | 'Ready for pickup' | 'Completed' | 'Cancelled';
  schoolLocation: string;
  pickupDate: string;
  pickupTime: string;
  paymentMethod: string;
  quantity: number;
  totalAmount: number;
  createdAt: Date;
  productName: string;
  productImage: string;
  sellerName?: string;
  sellerAvatar?: string;
  rating?: number;
  isRated?: boolean;
}

export default function Orders() {
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [ratingLoading, setRatingLoading] = useState<{ [orderId: string]: boolean }>({});
  const [ratings, setRatings] = useState<{ [orderId: string]: number }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const isStandalone = location.pathname === '/dashboard/orders';

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', auth.currentUser?.uid)
        );
        const querySnapshot = await getDocs(q);
        const ordersList: Order[] = [];
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          ordersList.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          } as Order);
        });
        // Sort orders by createdAt in descending order (most recent first)
        ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOrders(ordersList);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handlePickupNow = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Completed',
        completedAt: new Date(),
        isRated: false
      });
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    setCancellingOrder(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Cancelled',
        cancelledAt: new Date()
      });
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleContactSeller = (sellerId: string) => {
    navigate(`/dashboard/messages/${sellerId}`);
  };

  const handleSidebarNav = (view: 'home' | 'likes' | 'recently' | 'orders' | 'rate' | 'message') => {
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
      case 'rate':
        navigate('/dashboard/to-rate');
        break;
      case 'message':
        navigate('/dashboard/messages');
        break;
    }
  };

  const isWithinCancellationWindow = (orderDate: Date) => {
    const now = new Date();
    const hourInMilliseconds = 60 * 60 * 1000; // 1 hour in milliseconds
    const timeDifference = now.getTime() - orderDate.getTime();
    return timeDifference <= hourInMilliseconds;
  };

  const handleRateOrder = async (orderId: string, rating: number) => {
    setRatingLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        rating,
        isRated: true
      });
      setRatings(prev => ({ ...prev, [orderId]: rating }));
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, rating, isRated: true } : order
        )
      );
    } catch (error) {
      alert('Failed to submit rating. Please try again.');
      console.error(error);
    } finally {
      setRatingLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const renderOrderCard = (order: Order) => {
    const canCancel = order.status === 'Processing' && isWithinCancellationWindow(order.createdAt);
    return (
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
                {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-gray-600">Quantity: {order.quantity}</p>
              <p className="text-gray-600">Total Amount: ₱{order.totalAmount.toLocaleString()}</p>
              <p className="text-gray-600">Pickup: {order.schoolLocation}</p>
              <p className="text-gray-600">Date & Time: {order.pickupDate} at {order.pickupTime}</p>
              <p className="text-gray-600">Payment: {order.paymentMethod}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  order.status === 'Ready for pickup' ? 'text-green-600' : 
                  order.status === 'Processing' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {order.status}
                </span>
                {order.status === 'Processing' && !canCancel && (
                  <span className="text-xs text-gray-500">(Cancellation window expired)</span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleContactSeller(order.sellerId)}
                  className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
                >
                  Contact Seller
                </button>
                {canCancel && (
                  <button 
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingOrder === order.id}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow transition disabled:opacity-50"
                  >
                    {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
                {order.status === 'Ready for pickup' && (
                  <button 
                    onClick={() => handlePickupNow(order.id)}
                    className="bg-[#F88379] hover:bg-[#F88379]/90 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
                  >
                    Pick Up Now
                  </button>
                )}
              </div>
            </div>
            {order.status === 'Completed' && !order.isRated && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-700 font-medium">Rate:</span>
                <StarRatingButton
                  value={ratings[order.id] || order.rating || 0}
                  onChange={val => handleRateOrder(order.id, val)}
                  size={32}
                />
                {ratingLoading[order.id] && <span className="text-xs text-gray-500 ml-2">Saving...</span>}
              </div>
            )}
            {order.status === 'Completed' && order.isRated && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-700 font-medium">Your Rating:</span>
                <StarRatingButton
                  value={order.rating || ratings[order.id] || 0}
                  onChange={() => {}}
                  size={32}
                />
                <span className="text-xs text-green-600 ml-2">Thank you for rating!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return isStandalone ? (
    <div className="flex min-h-screen bg-[#f7f6fd]">
      {/* Sidebar */}
      <div className="w-[348px] flex-shrink-0">
        <Sidebar
          onVerifyClick={() => setShowModal(true)}
          onHomeClick={() => handleSidebarNav('home')}
          onLikesClick={() => handleSidebarNav('likes')}
          onRecentlyClick={() => handleSidebarNav('recently')}
          onOrdersClick={() => handleSidebarNav('orders')}
          onRateClick={() => handleSidebarNav('rate')}
          onMessageClick={() => handleSidebarNav('message')}
          activeButton="orders"
        />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 pr-[47px] py-4 bg-white h-[70px] w-full shadow-[0_4px_4px_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <img src={ustpLogo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
            <h1 className="text-3xl font-bold text-[#F88379] pb-1">My Orders</h1>
          </div>
        </header>
        {/* Orders List */}
        <div className="flex-1 p-10">
          {loading ? (
            <div className="text-center text-gray-500 mt-8">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No orders found. Items you purchase will appear here.
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => renderOrderCard(order))}
            </div>
          )}
        </div>
      </main>
    </div>
  ) : (
    // Embedded version (when used inside Dashboard)
    <div className="space-y-6">
      {loading ? (
        <div className="text-center text-gray-500 mt-8">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          No orders found. Items you purchase will appear here.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => renderOrderCard(order))}
        </div>
      )}
    </div>
  );
} 