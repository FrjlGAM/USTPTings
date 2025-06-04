import { Routes, Route } from 'react-router-dom';
import Landing from '../landing/pages/Landing';
import Dashboard from '../dashboard/pages/Dashboard';
import AdminLogin from '../admin/components/AdminLogin';
import AdminSignup from '../admin/components/AdminSignup';
import AdminDashboard from '../admin/components/AdminDashboard';
import SettingsContainer from "../dashboard/pages/SettingsContainer";
import Messages from '../dashboard/pages/Messages';
import ToRate from '../dashboard/pages/ToRate';
import Orders from '../dashboard/pages/Orders';
import CheckOut from '../dashboard/pages/CheckOut';
import { useLocation, Navigate } from 'react-router-dom';
import SellerPage from '../dashboard/pages/SellerPage';
import TransactionHistory from '../dashboard/pages/TransactionHistory';
import Earnings from '../dashboard/pages/Earnings';
import CustomerMessages from '../dashboard/pages/CustomerMessages';
import SellerOrders from '../dashboard/pages/SellerOrders';
import PaymentProcessing from '../dashboard/pages/PaymentProcessing';
import PaymentCallback from '../dashboard/pages/PaymentCallback';
import PaymentSuccess from '../dashboard/pages/PaymentSuccess';
import PaymentFailed from '../dashboard/pages/PaymentFailed';
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import BannedMessage from '../components/BannedMessage';

// Wrapper component to handle checkout route with product data
function CheckOutWrapper() {
  const location = useLocation();
  const product = location.state?.product;

  if (!product) {
    return <Navigate to="/dashboard" replace />;
  }

  return <CheckOut product={product} />;
}

// Wrapper component to check for banned status
function BannedCheck({ children }: { children: React.ReactNode }) {
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [bannedAt, setBannedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.isBanned) {
            setIsBanned(true);
            setBanReason(userData.bannedReason || null);
            setBannedAt(userData.bannedAt?.toDate() || null);
          } else {
            setIsBanned(false);
            setBanReason(null);
            setBannedAt(null);
          }
        } catch (error) {
          console.error('Error checking ban status:', error);
        }
      } else {
        setIsBanned(false);
        setBanReason(null);
        setBannedAt(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#F8F6FF] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F88379]"></div>
    </div>;
  }

  if (isBanned) {
    return <BannedMessage reason={banReason || undefined} bannedAt={bannedAt || undefined} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      
      {/* Protected routes with ban check */}
      <Route path="/dashboard" element={
        <BannedCheck>
          <Dashboard />
        </BannedCheck>
      } />
      <Route path="/dashboard/likes" element={
        <BannedCheck>
          <Dashboard />
        </BannedCheck>
      } />
      <Route path="/dashboard/recently-viewed" element={
        <BannedCheck>
          <Dashboard />
        </BannedCheck>
      } />
      <Route path="/dashboard/orders" element={
        <BannedCheck>
          <Orders />
        </BannedCheck>
      } />
      <Route path="/dashboard/to-rate" element={
        <BannedCheck>
          <ToRate />
        </BannedCheck>
      } />
      <Route path="/dashboard/messages" element={
        <BannedCheck>
          <Messages />
        </BannedCheck>
      } />
      <Route path="/dashboard/messages/:userId" element={
        <BannedCheck>
          <Messages />
        </BannedCheck>
      } />
      <Route path="/dashboard/settings" element={
        <BannedCheck>
          <SettingsContainer />
        </BannedCheck>
      } />
      <Route path="/dashboard/checkout" element={
        <BannedCheck>
          <CheckOutWrapper />
        </BannedCheck>
      } />
      <Route path="/dashboard/seller" element={
        <BannedCheck>
          <SellerPage />
        </BannedCheck>
      } />
      <Route path="/dashboard/seller/:sellerId" element={
        <BannedCheck>
          <SellerPage />
        </BannedCheck>
      } />
      <Route path="/dashboard/transaction-history" element={
        <BannedCheck>
          <TransactionHistory />
        </BannedCheck>
      } />
      <Route path="/dashboard/earnings" element={
        <BannedCheck>
          <Earnings />
        </BannedCheck>
      } />
      <Route path="/dashboard/customer-messages" element={
        <BannedCheck>
          <CustomerMessages />
        </BannedCheck>
      } />
      <Route path="/dashboard/seller-orders" element={
        <BannedCheck>
          <SellerOrders />
        </BannedCheck>
      } />
      <Route path="/dashboard/payment/processing" element={
        <BannedCheck>
          <PaymentProcessing />
        </BannedCheck>
      } />
      <Route path="/dashboard/payment/callback" element={
        <BannedCheck>
          <PaymentCallback />
        </BannedCheck>
      } />
      <Route path="/dashboard/payment/success" element={
        <BannedCheck>
          <PaymentSuccess />
        </BannedCheck>
      } />
      <Route path="/dashboard/payment/failed" element={
        <BannedCheck>
          <PaymentFailed />
        </BannedCheck>
      } />
    </Routes>
  );
}

export default App;
