import { useNavigate, useLocation } from 'react-router-dom';
import ustpLogo from '../../assets/ustp-things-logo.png';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const location = useLocation();

  const { error, orderData } = location.state || {};

  const handleRetry = () => {
    if (orderData) {
      // Navigate back to payment processing with the order data
      navigate('/dashboard/payment/processing', { 
        state: { orderData } 
      });
    } else {
      // Navigate back to dashboard if no order data
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6fd] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4">
        <div className="text-center">
          {/* Logo */}
          <img src={ustpLogo} alt="USTP Things" className="w-20 h-12 mx-auto mb-6" />
          
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Your payment could not be processed. Please try again.'}
          </p>

          {/* Order Details (if available) */}
          {orderData && (
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
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">₱{orderData.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{orderData.paymentMethod}</span>
                </div>
              </div>
            </div>
          )}

          {/* Common Issues */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-yellow-800 mb-2">Common Issues:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Insufficient balance in your GCash wallet</li>
              <li>• Network connection issues</li>
              <li>• Payment was cancelled or timed out</li>
              <li>• Incorrect GCash PIN or authentication</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {orderData && (
              <button
                onClick={handleRetry}
                className="w-full bg-[#F88379] hover:bg-[#F88379]/90 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Try Payment Again
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard/checkout', { 
                state: { product: orderData } 
              })}
              className="w-full border border-[#F88379] text-[#F88379] hover:bg-[#F88379] hover:text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Modify Order
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team or try using a different payment method.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
