import Sidebar from '../components/Sidebar';
import ustpLogo from '../../assets/ustp-things-logo.png';
// import uniformImg from '../../assets/ustp thingS/Product.png';
import cartIcon from '../../assets/ustp thingS/Shopping cart.png';
import searchIcon from '../../assets/ustp thingS/search.png';
import { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
// @ts-ignore
import { collection, addDoc, getDocs, doc, setDoc, arrayUnion, arrayRemove, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import MyLikes from './MyLikes';
import RecentlyViewed from './RecentlyViewed';
import MyCart from './MyCart';
import StartSellingModal from '../components/StartSellingModal';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductDetail from './ProductDetail';
import { MessagesContent } from './Messages';
import { ToRateContent } from './ToRate';
import VerificationModal from '../components/VerificationModal';

const categories = [
  'For You',
  'Electronics',
  'Books',
  'Uniform',
  'Gel pens',
  'Graph paper',
];

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [mainView, setMainView] = useState<'home' | 'likes' | 'recently' | 'orders' | 'to-rate' | 'messages' | 'product' | 'cart' | 'verify' | 'seller' | 'settings'>();
  const [selectedCategory, setSelectedCategory] = useState('For You');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  // @ts-ignore
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [showStartSellingModal, setShowStartSellingModal] = useState(false);
  const location = useLocation();
  const [verificationRequested, setVerificationRequested] = useState(false);
  const navigate = useNavigate();

  // Check if user is verified
  useEffect(() => {
    const checkVerification = async () => {
      if (auth.currentUser) {
        try {
          // Check user document first
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isVerified === true) {
              setIsVerified(true);
              setVerificationRequested(false);
              return;
            }
            setVerificationRequested(!!data.verificationRequested);
          }

          // If not verified in user document, check verifiedAccounts
          const verifiedAccountRef = doc(db, 'verifiedAccounts', auth.currentUser.uid);
          const verifiedAccountDoc = await getDoc(verifiedAccountRef);
          
          if (verifiedAccountDoc.exists() && verifiedAccountDoc.data().status === 'verified') {
            console.log('User is verified from verifiedAccounts');
            setIsVerified(true);
            // Update user document to reflect verified status
            await setDoc(userRef, {
              isVerified: true,
              verifiedAt: verifiedAccountDoc.data().verifiedAt || new Date()
            }, { merge: true });
          } else {
            console.log('User is not verified');
            setIsVerified(false);
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
          setIsVerified(false);
        }
      }
    };
    checkVerification();
  }, []);

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
          const productsList = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
          if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const likedProducts = userData.likedProducts || [];
              const productsWithLikes = productsList.map(product => ({
                ...product,
                liked: likedProducts.includes(product.id)
              }));
              setProducts(productsWithLikes);
              return;
            }
          }
          setProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    // Check if user is trying to access restricted pages through URL
    if (!isVerified && (
      path === '/dashboard/cart' ||
      path === '/dashboard/orders' ||
      path === '/dashboard/to-rate' ||
      path === '/dashboard/messages'
    )) {
      setShowModal(true);
      setMainView('home');
      setSelectedProduct(null);
      return;
    }

    // Update mainView based on current path
    if (path === '/dashboard/likes') {
      setMainView('likes');
      setSelectedProduct(null);
    } else if (path === '/dashboard/recently-viewed') {
      setMainView('recently');
      setSelectedProduct(null);
    } else if (path === '/dashboard/orders') {
      setMainView('orders');
      setSelectedProduct(null);
    } else if (path === '/dashboard/to-rate') {
      setMainView('to-rate');
      setSelectedProduct(null);
    } else if (path === '/dashboard/messages') {
      setMainView('messages');
      setSelectedProduct(null);
    } else if (path.startsWith('/dashboard/product/')) {
      setMainView('product');
    } else if (path === '/dashboard/cart') {
      setMainView('cart');
      setSelectedProduct(null);
    } else if (path === '/dashboard') {
      setMainView('home');
      setSelectedProduct(null);
    }
  }, [location, isVerified]);

  // Sidebar navigation handler
  const handleSidebarNav = (view: NonNullable<typeof mainView>) => {
    // Check if user is trying to access restricted pages
    if (!isVerified && ['cart', 'orders', 'to-rate', 'messages'].includes(view)) {
      setShowModal(true);
      return;
    }
    setMainView(view);
    setSelectedProduct(null);
  };

  // Cart icon click handler
  const handleCartClick = () => {
    if (!isVerified) {
      setShowModal(true);
      return;
    }
    setMainView('cart');
  };

  // Filtered products
  const filteredProducts = products.filter(
    (p) =>
      (selectedCategory === 'For You' || p.name.toLowerCase().includes(selectedCategory.toLowerCase())) &&
      (search === '' || p.name.toLowerCase().includes(search.toLowerCase())) &&
      (p.stock ?? 0) > 0  // Only show products with stock > 0
  );

  const handleAddToCart = async (product: any) => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          cartProducts: [],
          likedProducts: [],
          recentlyViewed: []
        });
      }
      await setDoc(userRef, {
        cartProducts: arrayUnion(product.id)
      }, { merge: true });
      console.log('Added to cart:', product.id);
    }
  };

  // Add function to track product views
  const handleProductView = async (product: any) => {
    setSelectedProduct(product);
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        // Initialize user document if it doesn't exist
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            cartProducts: [],
            likedProducts: [],
            recentlyViewed: []
          });
        }

        // Add to recently viewed, removing old entry if it exists
        const userData = userDoc.exists() ? userDoc.data() : {};
        const recentlyViewed = userData.recentlyViewed || [];
        
        // Remove the product if it's already in the list
        const filteredViewed = recentlyViewed.filter((id: string) => id !== product.id);
        
        // Add the product to the beginning of the array (most recent)
        const updatedViewed = [product.id, ...filteredViewed].slice(0, 20); // Keep only last 20 items
        
        await setDoc(userRef, {
          recentlyViewed: updatedViewed
        }, { merge: true });
      } catch (error) {
        console.error('Error updating recently viewed:', error);
      }
    }
  };

  const handleLikeChange = async (item: any, liked: boolean) => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      if (liked) {
        await setDoc(userRef, {
          likedProducts: arrayUnion(item.id)
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          likedProducts: arrayRemove(item.id)
        }, { merge: true });
      }
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
          onRateClick={() => handleSidebarNav('to-rate')}
          onMessageClick={() => handleSidebarNav('messages')}
          onStartSellingClick={() => {
            if (isVerified) {
              setShowStartSellingModal(true);
            } else {
              setShowModal(true);
            }
          }}
          verificationRequested={verificationRequested}
          activeButton={mainView}
        />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        {!selectedProduct && (
          <header className="flex items-center justify-between px-8 pr-[47px] py-4 bg-white h-[70px] shadow-[0_4px_4px_0_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-4">
              <img src={ustpLogo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
              {mainView === 'likes' && <h1 className="text-3xl font-bold text-[#F88379] pb-1">My Likes</h1>}
              {mainView === 'recently' && <h1 className="text-3xl font-bold text-[#F88379] pb-1">Recently Viewed</h1>}
              {mainView === 'orders' && <h1 className="text-3xl font-bold text-[#F88379] pb-1">Orders</h1>}
              {mainView === 'to-rate' && <h1 className="text-3xl font-bold text-[#F88379] pb-1">Rate</h1>}
              {mainView === 'messages' && <h1 className="text-3xl font-bold text-[#F88379] pb-1">Messages</h1>}
              {mainView === 'product' && <h1 className="text-3xl font-bold text-[#F88379] pb-1">Product Details</h1>}
              {mainView === 'cart' && <h1 className="text-3xl font-bold text-[#F88379] pb-1">My Cart</h1>}
            </div>
            {/* Search bar and cart */}
            {mainView === 'home' && (
              <div className="flex items-center gap-[27px]">
                <div className="relative">
                  <input
                    className="w-[371px] h-[41px] pl-12 pr-4 py-2 rounded-full border-2 border-[rgba(230,230,230,0.80)] focus:outline-none text-[rgba(248,131,121,0.80)] placeholder-[rgba(248,131,121,0.80)]"
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <img 
                    src={searchIcon} 
                    alt="Search" 
                    className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" 
                  />
                </div>
                <button onClick={handleCartClick}>
                  <img src={cartIcon} alt="Shopping Cart" className="w-[30px] h-[30px]" />
                </button>
              </div>
            )}
          </header>
        )}
        {/* Category Chips (only on Home/Product Feed) */}
        {mainView === 'home' && !selectedProduct && (
          <div className="flex gap-2 px-10 py-2">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-1 rounded-full border text-sm font-semibold transition ${selectedCategory === cat ? 'bg-[#F88379] text-white border-[#F88379]' : 'bg-white text-gray-600 border-gray-300 hover:bg-pink-100'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {/* Main Content Switcher */}
        <div className={`flex-1 px-10 pt-4 pb-10`}>
          {mainView === 'home' ? (
            selectedProduct ? (
              <ProductDetail 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
                onAddToCart={() => {
                  if (!isVerified) {
                    setShowModal(true);
                    return;
                  }
                  handleAddToCart(selectedProduct);
                }}
                isVerified={isVerified}
                onVerifyClick={() => setShowModal(true)}
              />
            ) : (
              <>
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 border-4 border-[#F88379] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-8">
                    {filteredProducts.map((item) => (
                      <ProductCard
                        key={item.id}
                        product={item}
                        onClick={() => handleProductView(item)}
                        onLikeChange={(liked) => handleLikeChange(item, liked)}
                      />
                    ))}
                  </div>
                )}
              </>
            )
          ) : mainView === 'likes' ? (
            <MyLikes />
          ) : mainView === 'recently' ? (
            <RecentlyViewed />
          ) : mainView === 'orders' ? (
            // Implement orders view
            <div>Orders View</div>
          ) : mainView === 'to-rate' ? (
            <ToRateContent orders={[]} onRateNow={() => {}} loading={false} />
          ) : mainView === 'messages' ? (
            <MessagesContent />
          ) : mainView === 'cart' ? (
            <MyCart />
          ) : null}
        </div>
      </main>
      <VerificationModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
        setVerificationRequested={setVerificationRequested}
        verificationRequested={verificationRequested}
      />
      <StartSellingModal
        open={showStartSellingModal}
        onClose={() => setShowStartSellingModal(false)}
        onStartSelling={() => {
          setShowStartSellingModal(false);
          navigate('/dashboard/seller');
        }}
      />
    </div>
  );
}

