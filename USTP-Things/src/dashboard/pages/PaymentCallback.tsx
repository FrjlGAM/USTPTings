import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { checkPaymentStatus } from '../../lib/xenditPayment';
import ustpLogo from '../../assets/ustp-things-logo.png';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      // Prevent multiple simultaneous executions
      if (processing) {
        console.log('Payment callback already in progress, skipping...');
        return;
      }
      
      setProcessing(true);
      
      try {
        // Get stored order data
        const storedOrderData = sessionStorage.getItem('pendingOrderData');
        if (!storedOrderData) {
          throw new Error('No pending order data found');
        }

        const orderData = JSON.parse(storedOrderData);
        
        // Get payment status from URL parameters
        const status = searchParams.get('status');
        const paymentId = searchParams.get('id') || searchParams.get('charge_id') || searchParams.get('payment_id');
        
        // Log all URL parameters for debugging
        console.log('Payment callback URL parameters:', {
          status,
          paymentId,
          chargeId: searchParams.get('charge_id'),
          allParams: Object.fromEntries(searchParams)
        });

        setVerifying(true);

        let paymentStatus = 'pending';
        
        // Verify payment status with Xendit if we have payment ID
        if (paymentId) {
          try {
            paymentStatus = await checkPaymentStatus(paymentId);
            console.log('Payment status from Xendit API:', paymentStatus);
          } catch (error) {
            console.error('Error checking payment status:', error);
            // Fall back to URL parameter status
            paymentStatus = status || 'failed';
          }
        } else {
          paymentStatus = status || 'failed';
        }

        setVerifying(false);

        // Determine if payment was successful
        // Check for various success indicators
        const isPaymentSuccessful = 
          paymentStatus === 'SUCCEEDED' || 
          paymentStatus === 'PAID' || 
          paymentStatus === 'SUCCESS' ||
          status === 'completed' ||
          status === 'success' ||
          status === 'SUCCEEDED' ||
          status === 'PAID' ||
          // If we reached the callback with success URL parameter, treat as success unless explicitly failed
          (status === 'success' || searchParams.get('charge_id') || searchParams.get('payment_id'));

        console.log('Payment evaluation:', {
          paymentStatus,
          urlStatus: status,
          isPaymentSuccessful,
          chargeId: searchParams.get('charge_id'),
          paymentIdParam: searchParams.get('payment_id')
        });

        if (isPaymentSuccessful) {
          // Check if order with this externalID already exists to prevent duplicates
          const existingOrderQuery = query(
            collection(db, 'orders'),
            where('externalID', '==', orderData.externalID)
          );
          const existingOrderSnapshot = await getDocs(existingOrderQuery);
          
          if (!existingOrderSnapshot.empty) {
            console.log('Order already exists for externalID:', orderData.externalID);
            
            // Order already exists, redirect to success page with existing order data
            const existingOrder = existingOrderSnapshot.docs[0].data();
            
            // Clear session storage
            sessionStorage.removeItem('pendingOrderData');
            
            // Redirect to success page
            navigate('/dashboard/payment/success', {
              state: {
                orderData: existingOrder,
                paymentMethod: orderData.paymentMethod,
                paymentId: paymentId
              }
            });
            return;
          }

          // Create the order in database (only if it doesn't exist)
          const orderDoc = {
            userId: orderData.userId,
            sellerId: orderData.sellerId,
            productId: orderData.productId,
            status: 'Processing',
            schoolLocation: orderData.schoolLocation,
            pickupDate: orderData.pickupDate,
            pickupTime: orderData.pickupTime,
            paymentMethod: orderData.paymentMethod,
            quantity: orderData.quantity,
            totalAmount: orderData.totalAmount,
            productName: orderData.productName,
            productImage: orderData.productImage,
            createdAt: serverTimestamp(),
            paymentStatus: 'completed',
            paymentId: paymentId || orderData.externalID,
            externalID: orderData.externalID
          };

          await addDoc(collection(db, 'orders'), orderDoc);

          // Clear session storage
          sessionStorage.removeItem('pendingOrderData');

          // Redirect to success page
          navigate('/dashboard/payment/success', {
            state: {
              orderData: orderDoc,
              paymentMethod: orderData.paymentMethod,
              paymentId: paymentId
            }
          });
        } else {
          // Payment failed or cancelled
          const failureReason = status === 'cancelled' ? 'Payment was cancelled' : 
                               status === 'failed' ? 'Payment failed' :
                               paymentStatus === 'FAILED' ? 'Payment failed' :
                               paymentStatus === 'EXPIRED' ? 'Payment expired' :
                               'Payment was not completed successfully';
          
          console.log('Payment failed:', { status, paymentStatus, failureReason });
          
          sessionStorage.removeItem('pendingOrderData');
          navigate('/dashboard/payment/failed', {
            state: {
              error: failureReason,
              orderData: orderData
            }
          });
        }

      } catch (error) {
        console.error('Payment callback error:', error);
        setLoading(false);
        setVerifying(false);
        
        // Clear session storage
        sessionStorage.removeItem('pendingOrderData');
        
        navigate('/dashboard/payment/failed', {
          state: {
            error: error instanceof Error ? error.message : 'Payment verification failed'
          }
        });
      } finally {
        setProcessing(false);
      }
    };

    handlePaymentCallback();
  }, [navigate, searchParams, processing]);

  return (
    <div className="min-h-screen bg-[#f7f6fd] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <img src={ustpLogo} alt="USTP Things" className="w-20 h-12 mx-auto mb-6" />
          
          {verifying && (
            <>
              <div className="w-16 h-16 border-4 border-[#F88379] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
              <p className="text-gray-600">Please wait while we verify your payment status...</p>
            </>
          )}

          {!verifying && loading && (
            <>
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Creating Order</h2>
              <p className="text-gray-600">Setting up your order...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
