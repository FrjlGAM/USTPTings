import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { createPayment } from '../../lib/xenditPayment';
import { createTransactionRecord } from '../../lib/transactionService';
import type { PaymentRequest } from '../../lib/xenditPayment';
import ustpLogo from '../../assets/ustp-things-logo.png';

export default function PaymentProcessing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentCreated, setPaymentCreated] = useState(false);

  const orderData = location.state?.orderData;

  useEffect(() => {
    const processPayment = async () => {
      if (!orderData) {
        setError('No order data found');
        setLoading(false);
        return;
      }

      if (!auth.currentUser) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      if (orderData.paymentMethod !== 'GCash') {
        // For non-GCash payments, directly create the order
        try {
          const orderDoc = {
            ...orderData,
            createdAt: serverTimestamp(),
            paymentStatus: 'completed'
          };
          
          const orderDocRef = await addDoc(collection(db, 'orders'), orderDoc);

          // Create transaction record for admin dashboard
          try {
            await createTransactionRecord({
              orderId: orderDocRef.id,
              buyerId: orderData.userId,
              sellerId: orderData.sellerId,
              productId: orderData.productId,
              productName: orderData.productName,
              productImage: orderData.productImage,
              quantity: orderData.quantity,
              subtotal: orderData.subtotal || orderData.totalAmount,
              serviceFeeAmount: orderData.serviceFeeAmount || 0,
              serviceFeeRate: orderData.serviceFeeRate || 0,
              totalAmount: orderData.totalAmount,
              paymentMethod: orderData.paymentMethod
            });
          } catch (transactionError) {
            console.error('Error creating transaction record:', transactionError);
            // Don't fail the order creation if transaction record fails
          }

          navigate('/dashboard/payment/success', { 
            state: { 
              orderData,
              paymentMethod: orderData.paymentMethod 
            } 
          });
        } catch (err) {
          console.error('Error creating order:', err);
          setError('Failed to create order');
        }
        setLoading(false);
        return;
      }

      try {
        // Get user data for payment
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();

        if (!userData) {
          throw new Error('User data not found');
        }

        // Generate unique external ID
        const externalID = `order_${Date.now()}_${auth.currentUser.uid}`;

        // Create payment request
        const paymentRequest: PaymentRequest = {
          externalID,
          amount: orderData.totalAmount,
          payer: {
            email: userData.email || auth.currentUser.email || '',
            name: userData.name || 'USTP User',
            phone: userData.phoneNumber || undefined,
          },
          description: `Payment for ${orderData.productName} (Qty: ${orderData.quantity})`,
          paymentMethod: 'GCASH',
          redirectURL: `${window.location.origin}/dashboard/payment/callback?status=success`,
          cancelRedirectURL: `${window.location.origin}/dashboard/payment/callback?status=cancelled`,
          webhookURL: `${window.location.origin}/api/webhook/xendit`, // This would need server implementation
        };

        // Store order data temporarily in session storage for the callback
        sessionStorage.setItem('pendingOrderData', JSON.stringify({
          ...orderData,
          externalID,
          paymentRequestData: paymentRequest
        }));

        // Create payment with Xendit
        const paymentResponse = await createPayment(paymentRequest);
        
        setPaymentCreated(true);
        setLoading(false);

        // Redirect to Xendit payment page
        window.location.href = paymentResponse.paymentURL;

      } catch (err: any) {
        console.error('Payment creation error:', err);
        setError(err.message || 'Failed to create payment');
        setLoading(false);
      }
    };

    processPayment();
  }, [orderData, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f6fd] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <img src={ustpLogo} alt="USTP Things" className="w-20 h-12 mx-auto mb-4" />
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard/checkout', { state: { product: orderData } })}
                className="w-full bg-[#F88379] hover:bg-[#F88379]/90 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6fd] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <img src={ustpLogo} alt="USTP Things" className="w-20 h-12 mx-auto mb-6" />
          
          {loading && !paymentCreated && (
            <>
              <div className="w-16 h-16 border-4 border-[#F88379] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h2>
              <p className="text-gray-600">Please wait while we set up your payment...</p>
            </>
          )}

          {paymentCreated && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Redirecting to Payment</h2>
              <p className="text-gray-600">You will be redirected to complete your GCash payment...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
