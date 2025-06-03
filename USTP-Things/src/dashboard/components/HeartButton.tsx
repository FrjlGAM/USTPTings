import React, { useState, useEffect } from 'react';
import heartIcon from '../../assets/ustp thingS/Heart.png';
import heartFilledIcon from '../../assets/ustp thingS/Heart filled.png';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

interface HeartButtonProps {
  initialLiked?: boolean;
  onLikeChange?: (liked: boolean) => void;
  className?: string;
  productId?: string | number;
}

export default function HeartButton({ initialLiked = false, onLikeChange, className = '', productId }: HeartButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);

  // Sync with Firestore
  useEffect(() => {
    if (!auth.currentUser || !productId) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    // Set up real-time listener for user document
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const likedProducts = userData?.likedProducts || [];
        const isProductLiked = likedProducts.includes(productId);
        setIsLiked(isProductLiked);
      }
    });

    return () => unsubscribe();
  }, [productId, auth.currentUser]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    
    if (!auth.currentUser || !productId) return;

    const newLikedState = !isLiked;
    
    // Update Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      // Get current liked products to ensure atomic update
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // Initialize user document if it doesn't exist
        await setDoc(userRef, {
          likedProducts: [],
          cartProducts: [],
          recentlyViewed: []
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : {};
      const currentLikedProducts = userData.likedProducts || [];
      
      // Perform atomic update
      if (newLikedState && !currentLikedProducts.includes(productId)) {
        await setDoc(userRef, {
          likedProducts: arrayUnion(productId)
        }, { merge: true });
        console.log('Added product to likes:', productId);
      } else if (!newLikedState && currentLikedProducts.includes(productId)) {
        await setDoc(userRef, {
          likedProducts: arrayRemove(productId)
        }, { merge: true });
        console.log('Removed product from likes:', productId);
      }
      
      // Update local state
      setIsLiked(newLikedState);
      
      // Call the parent's onLikeChange callback
      onLikeChange?.(newLikedState);
    } catch (error) {
      console.error('Error updating like status:', error);
      // Revert local state on error
      setIsLiked(!newLikedState);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`focus:outline-none transition-transform hover:scale-110 ${className}`}
    >
      <img 
        src={isLiked ? heartFilledIcon : heartIcon} 
        alt={isLiked ? "Unlike" : "Like"} 
        className="w-7 h-7"
      />
    </button>
  );
} 