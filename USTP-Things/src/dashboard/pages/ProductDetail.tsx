import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeartButton from '../components/HeartButton';
import cartIcon from '../../assets/ustp thingS/Shopping cart.png';
import greenCartIcon from '../../assets/ustp thingS/Shopping green.png';
import xIcon from '../../assets/ustp thingS/X button.png';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, onSnapshot, updateDoc, runTransaction, collection, addDoc } from 'firebase/firestore';
import React from 'react';

const productDetails = {
  description: [
    'White Blouse: With USTP logo (Size: Medium)',
    'Black Skirt: Waist - 28", Length - Knee-length',
    'USTP Necktie',
    'Barely used and in excellent condition',
    'No stains, tears, or damages',
    'Ideal for students looking for an affordable and well-maintained uniform',
  ],
  sold: 100,
  soldOut: 0,
  rating: 5.0,
};

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
    sellerId: string;
    sold?: number;
    stock?: number;
    rating?: number;
  };
  onClose: () => void;
  onAddToCart?: () => void;
  isVerified?: boolean;
  onVerifyClick?: () => void;
}

export default function ProductDetail({ 
  product, 
  onClose, 
  onAddToCart,
  isVerified = false,
  onVerifyClick
}: ProductDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [localRating, setLocalRating] = useState(product.rating ?? 0);
  const [hasRated, setHasRated] = useState(false);

  // Scroll to top when component mounts or when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  // Check if product is in cart
  useEffect(() => {
    const checkCartStatus = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const cartProducts = userDoc.data().cartProducts || [];
          setIsInCart(cartProducts.includes(product.id));
        }
      }
    };
    checkCartStatus();
  }, [product.id]);

  // Sync liked state with Firestore
  useEffect(() => {
    if (!auth.currentUser || !product.id) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    // Set up real-time listener for user document
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const likedProducts = userData?.likedProducts || [];
        setIsLiked(likedProducts.includes(product.id));
      }
    });

    return () => unsubscribe();
  }, [product.id, auth.currentUser]);

  // Check if user has already rated this product
  useEffect(() => {
    const checkUserRated = async () => {
      if (!auth.currentUser) return;
      const productRef = doc(db, 'products', product.id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const ratingsMap = productSnap.data().ratingsMap || {};
        setHasRated(!!ratingsMap[auth.currentUser.uid]);
      }
    };
    checkUserRated();
  }, [product.id]);

  const handleLikeChange = async (liked: boolean) => {
    if (!auth.currentUser) return;
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      if (liked) {
        await setDoc(userRef, {
          likedProducts: arrayUnion(product.id)
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          likedProducts: arrayRemove(product.id)
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  const handleBuyNow = async () => {
    if (!isVerified && onVerifyClick) {
      onVerifyClick();
      return;
    }
    if (!product.sellerId) {
      alert('Cannot proceed with purchase. Product seller information is missing.');
      return;
    }
    if (product.stock === 0) {
      return;
    }
    navigate('/dashboard/checkout', { state: { product } });
  };

  // Rating submission logic
  const handleSubmitRating = async () => {
    if (!userRating || userRating < 1 || userRating > 5) return;
    setSubmittingRating(true);
    try {
      const productRef = doc(db, 'products', product.id);
      // Fetch current ratings map
      const productSnap = await getDoc(productRef);
      let ratingsMap: Record<string, number> = {};
      if (productSnap.exists()) {
        ratingsMap = productSnap.data().ratingsMap || {};
      }
      // Prevent double rating
      if (auth.currentUser && ratingsMap[auth.currentUser.uid]) {
        setShowRatingModal(false);
        setSubmittingRating(false);
        return;
      }
      if (auth.currentUser) {
        ratingsMap[auth.currentUser.uid] = userRating;
      }
      const ratingsArr = Object.values(ratingsMap);
      const avgRating = ratingsArr.length > 0 ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length : 0;
      await updateDoc(productRef, {
        ratingsMap,
        rating: avgRating
      });
      setLocalRating(avgRating);
      setShowRatingModal(false);
      setUserRating(0);
      setHasRated(true);
    } catch (err) {
      alert('Failed to submit rating.');
      console.error(err);
    }
    setSubmittingRating(false);
  };

  const handleAddToCart = async () => {
    if (!auth.currentUser) return;
    
    if (!isVerified && onVerifyClick) {
      onVerifyClick();
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    if (isInCart) {
      // Remove from cart
      await setDoc(userRef, {
        cartProducts: arrayRemove(product.id)
      }, { merge: true });
      setIsInCart(false);
    } else {
      // Add to cart
      await setDoc(userRef, {
        cartProducts: arrayUnion(product.id)
      }, { merge: true });
      setIsInCart(true);
    }
  };

  const handleViewShop = () => {
    if (!product.sellerId) {
      alert('Cannot view shop. Seller information is missing.');
      return;
    }
    navigate(`/dashboard/seller/${product.sellerId}`);
  };

  return (
    <div className="w-full bg-white p-4 md:pl-10 md:pr-16 md:py-10 relative rounded-xl">
      {/* X Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-0 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <img src={xIcon} alt="Close" className="w-8 h-8" />
        </button>
      )}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Image Section */}
        <div className="flex flex-col items-center md:w-[420px]">
          <div className="bg-[#f7f6fd] rounded-2xl p-4 flex items-center justify-center w-full mb-4">
            <img src={product.image} alt={product.name} className="w-[320px] h-[320px] object-cover rounded-xl" />
          </div>
          <button 
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl shadow transition text-lg mt-2 ${
              !isVerified
              ? 'bg-gray-100 text-gray-500 cursor-help border border-gray-300'
              : isInCart 
                ? 'bg-white text-green-500 border border-green-500 shadow-md hover:shadow-lg' 
                : 'bg-white text-[#F88379] border border-[#F88379] hover:shadow-lg'
            }`}
            title={!isVerified ? "Account verification required to add items to cart" : ""}
          >
            <img 
              src={!isVerified ? cartIcon : (isInCart ? greenCartIcon : cartIcon)} 
              alt="Add to Cart" 
              className={isInCart ? "w-8 h-7" : "w-6 h-6"}
              style={!isVerified ? { opacity: 0.5 } : undefined}
            />
            {!isVerified 
              ? 'Verify Account to Add to Cart'
              : isInCart 
                ? 'Added to Cart' 
                : 'Add to Cart'
            }
          </button>
        </div>
        {/* Product Details Section */}
        <div className="flex-1 flex flex-col justify-between pr-0 md:pr-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight pt-[10px]">{product.name.replace('...', '– Blouse, Skirt, and Necktie')}</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl md:text-4xl font-bold text-[#F88379]">{product.price}</span>
              <button 
                onClick={handleViewShop}
                className="ml-3 text-sm border border-gray-300 rounded px-3 py-1 w-fit hover:bg-gray-50 transition"
              >
                View Shop
              </button>
            </div>
            <div className="mb-2 text-lg text-gray-600 font-semibold">
              Stocks left: {product.stock ?? 0}
            </div>
            {(product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5 && (
              <div className="mb-2 text-md font-semibold text-orange-500 animate-pulse">
                Hurry! Only {product.stock ?? 0} left in stock!
              </div>
            )}
            <div className="flex flex-col mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl text-blue-400 font-bold">{product.sold ?? 0}</span> <span className="text-xl text-gray-500">Sold</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <HeartButton initialLiked={isLiked} onLikeChange={handleLikeChange} productId={product.id} />
              <span className="text-xl text-gray-500">Add to Favorites</span>
            </div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    className={`text-2xl ${star <= Math.floor(localRating) ? 'text-[#F88379]' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xl text-gray-600 font-semibold">{(localRating).toFixed(1)}/5.0</span>
            </div>
          </div>
          {/* Buy Now button */}
          <div className="flex mt-2">
            <button 
              onClick={handleBuyNow}
              className={`flex-1 font-bold py-3 rounded-xl shadow transition text-lg ${
                isVerified 
                ? (product.stock === 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[#F88379] hover:bg-[#F88379]/90 text-white')
                : 'bg-gray-100 text-gray-500 cursor-help'
              }`}
              title={!isVerified ? "Account verification required to purchase" : (product.stock === 0 ? 'Out of Stock' : '')}
              disabled={!isVerified || product.stock === 0}
            >
              {isVerified ? (product.stock === 0 ? 'Out of Stock' : 'Buy Now') : 'Verify Account to Buy'}
            </button>
          </div>
        </div>
      </div>
      {/* Product Description Full Width */}
      <div className="mt-8">
        <div className="text-md font-semibold mb-2">Product Description:</div>
        <div className="bg-blue-50 rounded-xl p-6 text-gray-700 text-sm">
          {Array.isArray(product.description) ? (
            <ul className="list-disc pl-5 space-y-1">
              {product.description.map((line: string, idx: number) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          ) : product.description && typeof product.description === 'string' ? (
            <span>{product.description}</span>
          ) : (
            <span className="italic text-gray-400">No description provided.</span>
          )}
        </div>
      </div>
      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xs flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-[#F88379]">Rate this Product</h2>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  className={`text-3xl ${userRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setUserRating(star)}
                  disabled={submittingRating}
                >★</button>
              ))}
            </div>
            <button
              className="bg-[#F88379] text-white px-6 py-2 rounded-full font-bold text-lg hover:bg-[#F88379]/90 transition disabled:opacity-60"
              onClick={handleSubmitRating}
              disabled={submittingRating || !userRating}
            >
              {submittingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 