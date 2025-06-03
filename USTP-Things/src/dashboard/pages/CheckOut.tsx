import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import Sidebar from '../components/Sidebar';
import ConfirmOrder from '../components/ConfirmOrder';
import { calculateServiceFee, formatCurrency, formatPercentage } from '../../utils/serviceFees';
import type { ServiceFeeCalculation } from '../../utils/serviceFees';

interface CheckOutProps {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    sellerId: string;
    dateSlots: { date: string; times: string[] }[];
    paymentMethod?: string | string[];
    campusLocation?: string;
  };
}

export default function CheckOut({ product }: CheckOutProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [serviceFeeData, setServiceFeeData] = useState<ServiceFeeCalculation | null>(null);

  // Validate product data on mount
  useEffect(() => {
    if (!product || !product.id || !product.sellerId) {
      alert('Invalid product data. Returning to previous page.');
      navigate(-1);
    }
  }, [product, navigate]);

  // Calculate service fees when quantity changes
  useEffect(() => {
    const updateServiceFees = async () => {
      if (!auth.currentUser?.uid) return;
      
      try {
        const subtotal = calculateSubtotal();
        const feeData = await calculateServiceFee(subtotal, auth.currentUser.uid);
        setServiceFeeData(feeData);
      } catch (error) {
        console.error('Error calculating service fees:', error);
      }
    };

    updateServiceFees();
  }, [quantity, product.price]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, Math.min(value, 99))); // Limit between 1 and 99
  };

  const calculateSubtotal = () => {
    const basePrice = parseFloat(product.price.replace('₱', '').replace(',', ''));
    return basePrice * quantity;
  };

  // Get available date slots from product
  const dateSlots = Array.isArray(product.dateSlots) ? product.dateSlots : [];
  const availableTimes = dateSlots.find(ds => ds.date === selectedDate)?.times || [];

  // Payment method logic
  const paymentMethods = Array.isArray(product.paymentMethod)
    ? product.paymentMethod
    : product.paymentMethod
      ? [product.paymentMethod]
      : ['Cash', 'GCash']; // fallback if not set
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time slot.');
      return;
    }
    if (!selectedPaymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    if (loading) return; // Prevent multiple submissions
    
    setLoading(true);
    try {
      const orderData = {
        userId: auth.currentUser?.uid,
        sellerId: product.sellerId,
        productId: product.id,
        status: 'Processing',
        schoolLocation: product.campusLocation || '',
        pickupDate: selectedDate,
        pickupTime: selectedTime,
        paymentMethod: selectedPaymentMethod,
        quantity,
        subtotal: calculateSubtotal(),
        serviceFeeAmount: serviceFeeData?.serviceFeeAmount || 0,
        serviceFeeRate: serviceFeeData?.serviceFeeRate || 0,
        totalAmount: serviceFeeData?.totalAmount || calculateSubtotal(),
        userType: serviceFeeData?.userType || 'unverified',
        productName: product.name,
        productImage: product.image,
      };
      
      setShowConfirmModal(false);
      
      // Redirect to payment processing page
      navigate('/dashboard/payment/processing', { 
        state: { orderData } 
      });
    } catch (error) {
      alert('Failed to prepare order. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f6fd]">
      {/* Sidebar */}
      <div className="w-[348px] flex-shrink-0">
        <Sidebar
          onHomeClick={() => navigate('/dashboard')}
          onLikesClick={() => navigate('/dashboard/likes')}
          onRecentlyClick={() => navigate('/dashboard/recently-viewed')}
          onOrdersClick={() => navigate('/dashboard/orders')}
          onRateClick={() => navigate('/dashboard/rate')}
          onMessageClick={() => navigate('/dashboard/message')}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <form onSubmit={handleSubmit}>
          {/* Products Ordered Section */}
          <div className="bg-[#FF9B8B] text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h2 className="font-semibold text-lg">Products Ordered</h2>
            <span>{product.sellerId}</span>
          </div>
          
          <div className="bg-white p-6 border-x border-b rounded-b-2xl mb-6">
            <div className="flex items-center gap-4">
              <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">{product.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Quantity</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20 text-center border rounded-lg p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                {serviceFeeData && serviceFeeData.serviceFeeAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Service Fee ({formatPercentage(serviceFeeData.serviceFeeRate)})
                    </span>
                    <span className="font-semibold">{formatCurrency(serviceFeeData.serviceFeeAmount)}</span>
                  </div>
                )}
                {serviceFeeData && (
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-gray-900 font-semibold">Total</span>
                    <span className="font-bold text-lg">{formatCurrency(serviceFeeData.totalAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campus Location Section */}
          {product.campusLocation && (
            <div className="bg-white p-6 rounded-2xl mb-6">
              <h2 className="font-semibold text-lg mb-4">Campus Location</h2>
              <div className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700">
                {product.campusLocation}
              </div>
            </div>
          )}

          {/* Delivery Slot Section */}
          <div className="bg-white p-6 rounded-2xl mb-6">
            <div className="mb-4">
              <label className="block text-gray-600 mb-1 font-semibold">Select Delivery Date</label>
              <select
                className="w-full p-2 border rounded-lg bg-white"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                }}
                required
              >
                <option value="">Select a date</option>
                {dateSlots.map(ds => (
                  <option key={ds.date} value={ds.date}>{ds.date}</option>
                ))}
              </select>
            </div>
            {selectedDate && (
              <div className="mb-4">
                <label className="block text-gray-600 mb-1 font-semibold">Select Time Slot</label>
                <select
                  className="w-full p-2 border rounded-lg bg-white"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  required
                >
                  <option value="">Select a time slot</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          <div className="bg-white p-6 rounded-2xl mb-6">
            <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
            {paymentMethods.length > 1 ? (
              <select
                className="w-full p-2 border rounded-lg bg-white text-gray-700"
                value={selectedPaymentMethod}
                onChange={e => setSelectedPaymentMethod(e.target.value)}
                required
              >
                <option value="">Select payment method</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            ) : (
              <div className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed">
                {paymentMethods[0]}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3 rounded-xl border-2 border-[#F88379] text-[#F88379] font-bold text-lg hover:bg-[#F88379] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#F88379] hover:bg-[#F88379]/90 text-white font-bold py-3 px-8 rounded-xl shadow transition text-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </main>

      <ConfirmOrder 
        open={showConfirmModal}
        onConfirm={handleConfirmOrder}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
} 