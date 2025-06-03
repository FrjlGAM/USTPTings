import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ustpLogo from '../../assets/ustp-things-logo.png';
import { formatCurrency, formatPercentage } from '../../utils/serviceFees';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);

  const { orderData, paymentMethod, paymentId } = location.state || {};

  useEffect(() => {
    if (!orderData) {
      navigate('/dashboard');
      return;
    }

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/dashboard/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, orderData]);

  if (!orderData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f6fd] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          {/* Logo */}
          <img src={ustpLogo} alt="USTP Things" className="w-20 h-12 mx-auto mb-6" />
          
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully and payment has been confirmed.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{orderData.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{orderData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(orderData.subtotal || orderData.totalAmount)}</span>
              </div>
              {orderData.serviceFeeAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Service Fee ({formatPercentage(orderData.serviceFeeRate)}):
                  </span>
                  <span className="font-medium">{formatCurrency(orderData.serviceFeeAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-600 font-semibold">Total Amount:</span>
                <span className="font-bold">{formatCurrency(orderData.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium text-xs">{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Pickup Location:</span>
                <span className="font-medium">{orderData.schoolLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pickup Date:</span>
                <span className="font-medium">{orderData.pickupDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pickup Time:</span>
                <span className="font-medium">{orderData.pickupTime}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <p className="text-green-800 text-sm">
              <span className="font-semibold">Status:</span> Your order is now being processed. 
              You'll be notified when it's ready for pickup.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/orders')}
              className="w-full bg-[#F88379] hover:bg-[#F88379]/90 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition"
            >
              Continue Shopping
            </button>
          </div>

          {/* Auto redirect notice */}
          <p className="text-xs text-gray-500 mt-4">
            Automatically redirecting to orders page in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
