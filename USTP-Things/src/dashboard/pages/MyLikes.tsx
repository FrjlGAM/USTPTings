import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import ProductDetail from './ProductDetail';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ustpLogo from '../../assets/ustp-things-logo.png';

interface MyLikesProps {
  onProductClick?: (product: any) => void;
  isStandalone?: boolean;
}

export default function MyLikes({ onProductClick, isStandalone = false }: MyLikesProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setIsVerified(Boolean(userDoc.data().isVerified));
        }
      }
    };
    checkVerification();
  }, []);

  // Set up real-time listener for liked products
  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    // Set up real-time listener for user document
    const unsubscribe = onSnapshot(userRef, async (userDoc) => {
      try {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const likedProductIds = userData.likedProducts || [];
          
          if (likedProductIds.length === 0) {
            setProducts([]);
            setIsLoading(false);
            return;
          }

          // Fetch all liked products using individual gets since we need to use document IDs
          const productsPromises = likedProductIds.map(async (productId: string) => {
            try {
              const productRef = doc(db, 'products', productId);
              const productDoc = await getDoc(productRef);
              if (productDoc.exists()) {
                return {
                  id: productDoc.id,
                  ...productDoc.data(),
                  liked: true // Since these are liked products
                };
              } else {
                console.warn(`Product ${productId} not found in database`);
                return null;
              }
            } catch (error) {
              console.error(`Error fetching product ${productId}:`, error);
              return null;
            }
          });

          const productsList = (await Promise.all(productsPromises))
            .filter(Boolean)
            .filter(product => (product.stock ?? 0) > 0); // Only show products with stock > 0
          
          // Sort products by when they were liked (most recent first)
          const sortedProducts = productsList.sort((a, b) => {
            const aLiked = a.liked ? 1 : 0;
            const bLiked = b.liked ? 1 : 0;
            return bLiked - aLiked;
          });

          console.log('Fetched liked products:', sortedProducts);
          setProducts(sortedProducts);
        } else {
          // If user document doesn't exist, initialize it
          await setDoc(userRef, {
            likedProducts: [],
            cartProducts: [],
            recentlyViewed: []
          });
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching liked products:', error);
        setError('Failed to load liked products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error in liked products listener:', error);
      setError('Failed to sync liked products. Please try again.');
      setIsLoading(false);
    });

    // Cleanup listener on unmount or when auth.currentUser changes
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleProductView = (product: any) => {
    setSelectedProduct(product);
  };

  const handleUnlike = async (product: any) => {
    // The actual unlike operation is handled by the HeartButton component
    // Here we just update the local state for immediate feedback
    setProducts(prev => prev.filter(p => p.id !== product.id));
  };

  // Sidebar navigation handler
  const handleSidebarNav = (view: 'home' | 'likes' | 'recently' | 'orders' | 'to-rate' | 'messages') => {
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
      case 'to-rate':
        navigate('/dashboard/to-rate');
        break;
      case 'messages':
        navigate('/dashboard/messages');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center text-gray-500 mt-8">
          <p className="text-center text-gray-500 mt-8">Loading liked products...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 mt-8">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-[#F88379] text-white rounded hover:bg-[#F88379]/80"
          >
            Retry
          </button>
        </div>
      );
    }

    if (selectedProduct) {
      return (
        <div className="flex flex-wrap gap-8">
          <ProductDetail 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            isVerified={isVerified}
            onVerifyClick={() => setShowModal(true)}
          />
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-8">
          No liked products yet. Click the heart icon on products to add them to your likes.
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => handleProductView(product)}
            onLikeChange={(liked) => {
              if (!liked) {
                handleUnlike(product);
              }
            }}
          />
        ))}
      </div>
    );
  };

  // When embedded in Dashboard, just return the content
  if (!isStandalone) {
    return renderContent();
  }

  // Standalone page with header and sidebar
  return (
    <div className="flex min-h-screen bg-[#f7f6fd]">
      {/* Sidebar */}
      <div className="w-[348px] flex-shrink-0">
        <Sidebar
          onVerifyClick={() => setShowModal(true)}
          onHomeClick={() => handleSidebarNav('home')}
          onLikesClick={() => handleSidebarNav('likes')}
          onRecentlyClick={() => handleSidebarNav('recently')}
          onOrdersClick={() => handleSidebarNav('orders')}
          onRateClick={() => handleSidebarNav('to-rate')}
          onMessageClick={() => handleSidebarNav('messages')}
          activeButton="likes"
        />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-8 pr-[47px] py-4 bg-white h-[70px] shadow-[0_4px_4px_0_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <img src={ustpLogo} alt="USTP Things Logo" className="w-[117px] h-[63px] object-contain" />
            <h1 className="text-3xl font-bold text-[#F88379] pb-1">My Likes</h1>
          </div>
        </header>
        <div className="p-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
} 