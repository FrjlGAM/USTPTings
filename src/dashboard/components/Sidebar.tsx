import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
// import ustpLogo from '../../assets/ustp-things-logo.png';
import userAvatar from '../../assets/ustp thingS/Person.png';
import homeIcon from '../../assets/ustp thingS/Home.png';
import heartIcon from '../../assets/ustp thingS/Heart.png';
import clockIcon from '../../assets/ustp thingS/Clock.png';
import purchasesIcon from '../../assets/ustp thingS/Purchases.png';
import rateIcon from '../../assets/ustp thingS/Rate.png';
import chatIcon from '../../assets/ustp thingS/Message circle.png';
import settingsIcon from '../../assets/ustp thingS/Settings.png';
import { useNavigate } from 'react-router-dom';

// Add prop type
type SidebarProps = {
  onVerifyClick?: () => void;
  onHomeClick?: () => void;
  onLikesClick?: () => void;
  onRecentlyClick?: () => void;
  onOrdersClick?: () => void;
  onRateClick?: () => void;
  onMessageClick?: () => void;
  onStartSellingClick?: () => void;
  verificationRequested?: boolean;
  activeButton?: 'home' | 'likes' | 'recently' | 'orders' | 'to-rate' | 'messages' | 'product' | 'cart' | 'verify' | 'seller' | 'settings';
};

export default function Sidebar({ 
  onVerifyClick, 
  // onHomeClick, 
  // onLikesClick, 
  // onRecentlyClick, 
  // onOrdersClick, 
  onRateClick, 
  onMessageClick, 
  onStartSellingClick,
  verificationRequested,
  activeButton: propActiveButton,
}: SidebarProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('Username');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<SidebarProps['activeButton']>(propActiveButton);
  const [isSeller, setIsSeller] = useState(false);
  const user = auth.currentUser;
  const navigate = useNavigate();

  // Update activeButton when prop changes
  useEffect(() => {
    if (propActiveButton) {
      setActiveButton(propActiveButton);
    }
  }, [propActiveButton]);

  useEffect(() => {
    const checkVerified = async () => {
      if (!user) {
        setIsVerified(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setIsVerified(Boolean(userData?.isVerified));
        setIsSeller(Boolean(userData?.isSeller));
      } catch (error) {
        console.error('Error checking verification:', error);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerified();
  }, [user]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);

    // Listen for real-time updates
    const unsubscribe = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data.username || 'Username');
        setProfileImage(data.profileImage || null);
        setIsSeller(Boolean(data.isSeller));
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleRestrictedButtonClick = (buttonName: string, onClick?: () => void) => {
    if (!isVerified) {
      onVerifyClick?.();
      return;
    }
    if (activeButton !== buttonName) {
      setActiveButton(buttonName as SidebarProps['activeButton']);
    }
    onClick?.();
  };

  const handleSellerClick = () => {
    if (!isVerified) {
      onVerifyClick?.();
      return;
    }

    if (isSeller) {
      // If already a seller, just navigate to seller page
      navigate('/dashboard/seller');
    } else {
      // Show modal for first-time sellers
      onStartSellingClick?.();
    }
  };

  return (
    <aside className="fixed h-screen w-[348px] bg-[#FFF3F2] flex flex-col justify-between p-6 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={profileImage || userAvatar}
            alt="User avatar"
            className="w-14 h-14 rounded-full border-2 border-pink-200 object-cover"
          />
          <div>
            <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
              {username}
              {isVerified === true && (
                <span
                  title="Verified"
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-semibold ml-1"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">{user?.email || 'Email or Phone'}</div>
          </div>
        </div>
        {/* Verify Button - Only show if not verified and not loading */}
        {!loading && isVerified === false && !verificationRequested && (
          <button
            className={`w-full ${activeButton === 'verify' ? 'bg-white text-[#F88379]' : 'bg-[#F88379] text-white'} hover:bg-[#F88379]/90 font-semibold py-2 rounded-[23.08px] shadow mb-8 transition text-lg`}
            onClick={() => {
              setActiveButton('verify');
              onVerifyClick?.();
            }}
          >
            Verify Your Account
          </button>
        )}
        {!loading && isVerified === false && verificationRequested && (
          <div className="w-full bg-yellow-100 text-yellow-700 font-semibold py-2 rounded-[23.08px] shadow mb-8 text-center text-lg">
            Verification pending...
          </div>
        )}
        {/* Navigation */}
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => {
              navigate('/dashboard');
              setActiveButton('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className={`flex items-center gap-2 text-[#F88379] font-semibold text-lg text-left transition ${activeButton === 'home' ? 'bg-white rounded-[23.08px] px-2 py-1' : ''}`}
          >
            <img src={homeIcon} alt="Home" className="w-5 h-5" />Home
          </button>
          <button 
            onClick={() => {
              navigate('/dashboard/likes');
              setActiveButton('likes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className={`flex items-center gap-2 text-[#F88379] font-semibold text-lg text-left transition ${activeButton === 'likes' ? 'bg-white rounded-[23.08px] px-2 py-1' : ''}`}
          >
            <img src={heartIcon} alt="My Likes" className="w-5 h-5" />My Likes
          </button>
          <button 
            onClick={() => {
              navigate('/dashboard/recently-viewed');
              setActiveButton('recently');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className={`flex items-center gap-2 text-[#F88379] font-semibold text-lg text-left transition ${activeButton === 'recently' ? 'bg-white rounded-[23.08px] px-2 py-1' : ''}`}
          >
            <img src={clockIcon} alt="Recently Viewed" className="w-5 h-5" />Recently Viewed
          </button>
          <div className="mt-4 mb-2 font-bold text-[#F88379] text-xl flex justify-center">My Purchases</div>
          <button 
            onClick={() => {
              if (!isVerified) {
                onVerifyClick?.();
                return;
              }
              setActiveButton('orders');
              navigate('/dashboard/orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-2 text-[#F88379] font-semibold text-lg text-left transition ${activeButton === 'orders' ? 'bg-white rounded-[23.08px] px-2 py-1' : ''}`}
          >
            <img src={purchasesIcon} alt="Orders" className="w-5 h-5" />Orders
          </button>
          <button 
            onClick={() => handleRestrictedButtonClick('to-rate', onRateClick)}
            className={`flex items-center gap-2 text-[#F88379] font-semibold text-lg text-left transition ${activeButton === 'to-rate' ? 'bg-white rounded-[23.08px] px-2 py-1' : ''}`}
          >
            <img src={rateIcon} alt="To Rate" className="w-5 h-5" />To Rate
          </button>
          <button 
            onClick={() => handleRestrictedButtonClick('messages', onMessageClick)}
            className={`flex items-center gap-2 text-[#F88379] font-semibold text-lg text-left transition ${activeButton === 'messages' ? 'bg-white rounded-[23.08px] px-2 py-1' : ''}`}
          >
            <img src={chatIcon} alt="Messages" className="w-5 h-5" />Messages
          </button>
        </nav>
      </div>
      <div className="mt-auto">
        {/* Start Selling Button */}
        <button 
          onClick={handleSellerClick}
          className={`w-full ${activeButton === 'seller' ? 'bg-white text-[#F88379]' : 'bg-[#F88379] text-white'} hover:bg-[#F88379]/90 font-semibold py-2 rounded-[23.08px] shadow mb-10 transition text-lg`}
        >
          {isSeller ? "View Your Seller Page" : "Start selling now!"}
        </button>
        {/* Settings */}
        <button
          onClick={() => {
            setActiveButton('settings');
            navigate('/dashboard/settings');
          }}
          className={`flex items-center gap-2 ${activeButton === 'settings' ? 'text-[#F88379] bg-white rounded-[23.08px] px-2 py-1' : 'text-gray-400 hover:text-[#F88379]'} cursor-pointer transition`}
        >
          <img src={settingsIcon} alt="Settings" className="w-5 h-5" />
          <span className="font-semibold">Settings</span>
        </button>
      </div>
    </aside>
  );
} 