import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import profilePic from "../../assets/ustp thingS/Person.png";
import manageProductsIcon from "../../assets/ustp thingS/Product.png";
import productOrdersIcon from "../../assets/ustp thingS/Bag.png";
import customerMessagesIcon from "../../assets/ustp thingS/Chat Bubble.png";
import productCountIcon from "../../assets/ustp thingS/ProductCount.png";
import earningsIcon from "../../assets/ustp thingS/Earnings.png";
import visitedIcon from "../../assets/ustp thingS/Followers.png";
import transactionHistoryIcon from "../../assets/ustp thingS/TransactionHistory.png";
import ratingIcon from "../../assets/ustp thingS/Rating.png";
import dateIcon from "../../assets/ustp thingS/DateJoined.png";
import LeftArrow from "../../assets/ustp thingS/LeftArrow.png";
import addIcon from "../../assets/ustp thingS/Add.png";
import deleteIcon from "../../assets/ustp thingS/Delete.png";
import pencilIcon from "../../assets/ustp thingS/Pencil.png";
// @ts-ignore
import productUniform from "../../assets/ustp thingS/yummy 2.png"
import AddProductModal from "../components/AddProductModal";
import ProductCardSeller from '../components/ProductCardSeller';
import SellerProductDetail from './SellerProductDetail';
import SellerName from '../components/SellerName';
import { auth, db } from "../../lib/firebase";
// @ts-ignore
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, increment, arrayUnion, Timestamp, setDoc, addDoc, deleteDoc } from "firebase/firestore";

// @ts-ignore
interface Seller {
  businessName: string;
  profileImage: string | null;
  visitCount: number;
  rating: string;
  productCount: number;
  dateJoined: Timestamp;
  isVerified: boolean;
  visits: {
    visitorId: string;
    timestamp: Timestamp;
  }[];
}

const stats = [
  { icon: productCountIcon, label: "Product Count", value: "1,000" },
  { icon: earningsIcon, label: "Earnings" },
  { icon: visitedIcon, label: "Visits", value: "0" },
  { icon: transactionHistoryIcon, label: "Transaction History" },
  { icon: ratingIcon, label: "Rating", value: "5/5" },
  { icon: dateIcon, label: "Date Joined", value: "March 1, 2025" },
];

const SellerPage: React.FC = () => {
  const navigate = useNavigate();
  const { sellerId } = useParams();
  const [showOverlay, setShowOverlay] = useState(false);
  const manageBtnRef = useRef<HTMLDivElement>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("Galdo Boutique");
  const [showSellerNameModal, setShowSellerNameModal] = useState(false);
  const [isBuyerView, setIsBuyerView] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    let unsubscribeProducts: (() => void) | null = null;
    // If sellerId is provided in URL, we're in buyer's view
    if (sellerId && sellerId !== auth.currentUser?.uid) {
      setIsBuyerView(true);
      // Fetch seller's data
      const fetchSellerData = async () => {
        try {
          // Get basic user data
          const userRef = doc(db, "users", sellerId);
          const userDoc = await getDoc(userRef);

          // Get or create seller profile
          const sellerRef = doc(db, "sellers", sellerId);
          const sellerDoc = await getDoc(sellerRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // If seller doc doesn't exist, create it
            if (!sellerDoc.exists() && userData.role === 'seller') {
              await setDoc(sellerRef, {
                businessName: userData.businessName || "Galdo Boutique",
                profileImage: userData.profileImage || null,
                visitCount: userData.visitCount || 0,
                rating: "5/5",
                productCount: 0,
                dateJoined: userData.createdAt || Timestamp.now(),
                isVerified: userData.isVerified || false
              });
            }
            const sellerData = sellerDoc.exists() ? sellerDoc.data() : userData;
            setProfileImage(sellerData.profileImage || null);
            setBusinessName(sellerData.businessName || "Galdo Boutique");
            setVisitCount(sellerData.visitCount || 0);
            // Record visit if authenticated user
            if (auth.currentUser && auth.currentUser.uid !== sellerId) {
              // Update visit count in sellers collection
              await updateDoc(sellerRef, {
                visitCount: increment(1)
              });
              // Record visit details in visits subcollection
              const visitsCollectionRef = collection(sellerRef, "visits");
              await addDoc(visitsCollectionRef, {
                visitorId: auth.currentUser.uid,
                timestamp: Timestamp.now()
              });
              // Update local visit count
              setVisitCount(prev => prev + 1);
            }
          }
        } catch (error) {
          console.error('Error fetching seller data:', error);
        }
      };
      fetchSellerData();
      // Real-time products for this seller
      const productsQuery = query(
        collection(db, "products"),
        where("sellerId", "==", sellerId)
      );
      unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
        const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
      });
    } else {
      // We're in seller's own view
      if (!auth.currentUser) return;
      const userRef = doc(db, "users", auth.currentUser.uid);
      const sellerRef = doc(db, "sellers", auth.currentUser.uid);
      // Listen for real-time updates from both collections
      const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Create or update seller document if user is a seller
          if (userData.role === 'seller') {
            const sellerDoc = await getDoc(sellerRef);
            if (!sellerDoc.exists()) {
              await setDoc(sellerRef, {
                businessName: userData.businessName || "Galdo Boutique",
                profileImage: userData.profileImage || null,
                visitCount: userData.visitCount || 0,
                rating: "5/5",
                productCount: 0,
                dateJoined: userData.createdAt || Timestamp.now(),
                isVerified: userData.isVerified || false
              });
            }
          }
        }
      });
      const unsubscribeSeller = onSnapshot(sellerRef, (sellerDoc) => {
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          setProfileImage(sellerData.profileImage || null);
          setBusinessName(sellerData.businessName || "Galdo Boutique");
          setVisitCount(sellerData.visitCount || 0);
        }
      });
      // Real-time products for this seller
      const productsQuery = query(
        collection(db, "products"),
        where("sellerId", "==", auth.currentUser.uid)
      );
      unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
        const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
      });
      return () => {
        unsubscribeUser();
        unsubscribeSeller();
        if (unsubscribeProducts) unsubscribeProducts();
      };
    }
    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, [sellerId, auth.currentUser]);

  // Close overlay if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (manageBtnRef.current && !manageBtnRef.current.contains(event.target as Node)) {
        setShowOverlay(false);
      }
    }
    if (showOverlay) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOverlay]);

  // Helper: filter valid products
  const isValidProduct = (product: any) => {
    return (
      typeof product.name === 'string' &&
      product.name.trim() !== '' &&
      (typeof product.price === 'string' || typeof product.price === 'number') &&
      typeof product.image === 'string' && product.image.trim() !== '' &&
      typeof product.sellerId === 'string' && product.sellerId.trim() !== '' &&
      (typeof product.stock === 'number' || !isNaN(Number(product.stock)))
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF3F2]">
      {/* Top bar with back button, flush with card, no white gap above */}
      <div className="flex items-center px-8 pr-[47px] py-4 bg-white h-[70px] shadow-[0_4px_4px_0_rgba(0,0,0,0.1)] sticky top-0 z-30">
        <button onClick={() => navigate('/dashboard')} className="mt-0">
          <img src={LeftArrow} alt="Back" className="h-10" />
        </button>
      </div>
      {/* Profile and stats card, clean two-column layout, no overlaps */}
      <div className="w-full bg-[#FFF3F2] px-8 pt-6 pb-4 flex flex-col md:flex-row gap-4">
        {/* Left: Profile card */}
        <div className="relative bg-white rounded-2xl shadow p-4 flex flex-col items-center flex-[2] min-w-[260px] max-w-[600px]">
          <img src={profileImage || profilePic} alt="Profile" className="w-20 h-20 rounded-full border-4 border-[#F88379] object-cover mb-2" />
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-[#F88379] text-center">{businessName}</div>
            {!isBuyerView && (
              <img
                src={pencilIcon}
                alt="Edit"
                className="w-5 h-5 cursor-pointer hover:opacity-80 transition-opacity mt-[2px]"
                onClick={() => setShowSellerNameModal(true)}
              />
            )}
          </div>
          {/* Main Action Buttons */}
          {!isBuyerView ? (
            <div className="flex flex-row gap-3 w-full justify-center mt-4">
              {/* Only this div is relative, for overlaying above Manage Products */}
              <div className="relative flex flex-col items-center">
                {/* Overlay Buttons */}
                {showOverlay && (
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-row gap-8 z-20 items-end">
                    <div className="flex flex-col items-center">
                      <button
                        className="w-10 h-10 rounded-full bg-[#F88379] flex items-center justify-center shadow-md hover:scale-110 transition hover:bg-white hover:border hover:border-[#F88379] active:bg-white active:border active:border-[#F88379]"
                        onClick={() => setShowAddProductModal(true)}
                      >
                        <img src={addIcon} alt="Add Product" className="w-5 h-5" />
                      </button>
                      <span className="text-xs text-[#F88379] font-semibold mt-1 text-center block">
                        Add<br />Product
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <button
                        className="w-10 h-10 rounded-full bg-[#F88379] flex items-center justify-center shadow-md hover:scale-110 transition hover:bg-white hover:border hover:border-[#F88379] active:bg-white active:border active:border-[#F88379]"
                        onClick={() => {
                          setShowOverlay(false);
                          setDeleteMode(true);
                        }}
                      >
                        <img src={deleteIcon} alt="Delete Product" className="w-5 h-5" />
                      </button>
                      <span className="text-xs text-[#F88379] font-semibold mt-1 text-center block">
                        Delete<br />Product
                      </span>
                    </div>
                  </div>
                )}
                {/* Manage Products Button */}
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow hover:scale-105 transition
                    ${selectedAction === 'manage'
                      ? 'bg-white text-[#F88379] border border-[#F88379]'
                      : 'bg-[#F88379] text-white'}
                    hover:bg-white hover:text-[#F88379] hover:border hover:border-[#F88379]'
                  `}
                  onClick={() => {
                    setShowOverlay((prev) => !prev);
                    setSelectedAction('manage');
                  }}
                  type="button"
                >
                  <img src={manageProductsIcon} alt="Manage Products" className="w-5 h-5" />
                  Manage Products
                </button>
              </div>
              {/* Other buttons */}
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow hover:scale-105 transition
                  ${selectedAction === 'orders'
                    ? 'bg-white text-[#F88379] border border-[#F88379]'
                    : 'bg-[#F88379] text-white'}
                  hover:bg-white hover:text-[#F88379] hover:border hover:border-[#F88379]'
                `}
                onClick={() => {
                  navigate('/dashboard/seller-orders');
                  setSelectedAction('orders');
                }}
              >
                <img src={productOrdersIcon} alt="Product Orders" className="w-5 h-5" />
                Product Orders
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow hover:scale-105 transition
                  ${selectedAction === 'messages'
                    ? 'bg-white text-[#F88379] border border-[#F88379]'
                    : 'bg-[#F88379] text-white'}
                  hover:bg-white hover:text-[#F88379] hover:border hover:border-[#F88379]'
                `}
                onClick={() => {
                  navigate('/dashboard/customer-messages');
                  setSelectedAction('messages');
                }}
              >
                <img src={customerMessagesIcon} alt="Customer Messages" className="w-5 h-5" />
                Customer Messages
              </button>
            </div>
          ) : (
            <button
              className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm shadow hover:scale-105 transition bg-[#F88379] text-white hover:bg-[#F88379]/90 mt-4"
              onClick={() => navigate(`/dashboard/messages/${sellerId}`)}
            >
              <img src={customerMessagesIcon} alt="Contact Seller" className="w-5 h-5" />
              Contact Seller
            </button>
          )}
        </div>
        {/* Right: Stats card */}
        <div className="flex-1 bg-white rounded-2xl shadow p-8 grid grid-cols-2 gap-y-1 gap-x-1 items-center min-w-[340px]">
          {stats.map((stat, idx) => {
            if (!isBuyerView && stat.label === 'Earnings') {
              return (
                <button
                  key={idx}
                  className="flex items-center gap-4 group relative bg-transparent border-none outline-none cursor-pointer"
                  onClick={() => navigate('/dashboard/earnings')}
                  style={{ boxShadow: 'none', background: 'none', padding: 0 }}
                >
                  <img src={stat.icon} alt={stat.label} className="w-9 h-9" />
                  <span className="text-[#F88379] font-semibold text-lg">{stat.label}</span>
                </button>
              );
            }
            if (!isBuyerView && stat.label === 'Transaction History') {
              return (
                <button
                  key={idx}
                  className="flex items-center gap-4 group relative bg-transparent border-none outline-none cursor-pointer"
                  onClick={() => navigate('/dashboard/transaction-history')}
                  style={{ boxShadow: 'none', background: 'none', padding: 0 }}
                >
                  <img src={stat.icon} alt={stat.label} className="w-9 h-9" />
                  <span className="text-[#F88379] font-semibold text-lg">{stat.label}</span>
                </button>
              );
            }
            if (isBuyerView && (stat.label === 'Earnings' || stat.label === 'Transaction History')) {
              return null;
            }
            if (stat.label === 'Product Count' || stat.label === 'Visits' || stat.label === 'Rating' || stat.label === 'Date Joined') {
              return (
                <div key={idx} className="flex items-center gap-4 group relative w-full">
                  <img src={stat.icon} alt={stat.label} className="w-9 h-9" />
                  <div className="relative flex items-center w-full">
                    <span
                      className="text-[#F88379] font-semibold text-lg transition-opacity duration-200 group-hover:opacity-0"
                      style={{ position: 'relative', zIndex: 10 }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full px-4 py-1 text-white font-bold text-base shadow-lg bg-[#F88379] transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none${stat.label === 'Date Joined' ? ' whitespace-nowrap' : ''}`}
                      style={{
                        fontStyle: stat.label === 'Date Joined' ? 'italic' : 'normal',
                        minWidth: stat.label === 'Date Joined' ? 100 : 60,
                        display: 'inline-block',
                        textAlign: 'center',
                        zIndex: 20,
                      }}
                    >
                      {stat.label === 'Visits' ? visitCount : stat.value}
                    </span>
                  </div>
                </div>
              );
            }
            // Transaction History and other stats
            return (
              <div key={idx} className="flex items-center gap-4">
                <img src={stat.icon} alt={stat.label} className="w-9 h-9" />
                <span className="text-[#F88379] font-semibold text-lg">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Show all products immediately */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 px-8 pb-8 pt-2 relative">
        {products.filter(isValidProduct).map((product, idx) => (
          <div key={product.id || idx} className="relative group">
            <ProductCardSeller product={product} onClick={() => setSelectedProduct(product)} />
            {/* Delete button only in seller view */}
            {!isBuyerView && (
              <button
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Delete Product"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this product?')) {
                    try {
                      await deleteDoc(doc(db, 'products', product.id));
                    } catch (err) {
                      alert('Failed to delete product.');
                      console.error(err);
                    }
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {/* Delete/Cancel Buttons */}
        {deleteMode && (
          <div className="fixed bottom-8 right-8 flex gap-4 z-30">
            <button
              className="flex items-center gap-2 px-8 py-2 rounded-full bg-[#F88379]/20 text-[#F88379] font-bold text-lg border border-[#F88379] hover:bg-[#F88379]/40 transition"
              onClick={() => {
                setProducts((prev) => prev.filter((_, idx) => !selectedProducts.includes(idx)));
                setDeleteMode(false);
                setSelectedProducts([]);
              }}
            >
              <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
              Delete
            </button>
            <button
              className="flex items-center gap-2 px-8 py-2 rounded-full bg-[#F88379]/20 text-[#F88379] font-bold text-lg border border-[#F88379] hover:bg-[#F88379]/40 transition"
              onClick={() => {
                setDeleteMode(false);
                setSelectedProducts([]);
              }}
            >
              <span className="text-xl">×</span>
              Cancel
            </button>
          </div>
        )}
      </div>
      <AddProductModal open={showAddProductModal} onClose={() => setShowAddProductModal(false)} />
      <SellerProductDetail product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      {showSellerNameModal && (
        <SellerName
          onClose={() => setShowSellerNameModal(false)}
          onSave={(newName) => setBusinessName(newName)}
          initialName={businessName}
        />
      )}
    </div>
  );
};

export default SellerPage;