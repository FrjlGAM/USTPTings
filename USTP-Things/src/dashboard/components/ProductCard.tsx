import React, { useState, useEffect } from 'react';
import HeartButton from './HeartButton';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ProductCardProps {
  product: {
    id: string | number;
    name: string;
    price: string;
    image: string;
    liked?: boolean;
  };
  onClick?: () => void;
  onLikeChange?: (liked: boolean) => void;
}

export default function ProductCard({ product, onClick, onLikeChange }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(product.liked || false);

  // Sync with Firestore
  useEffect(() => {
    if (!auth.currentUser || !product.id) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const likedProducts = userData?.likedProducts || [];
        const newLikedState = likedProducts.includes(product.id);
        if (newLikedState !== isLiked) {
          setIsLiked(newLikedState);
        }
      }
    });

    return () => unsubscribe();
  }, [product.id, auth.currentUser, isLiked]);

  // Update local state when product.liked changes
  useEffect(() => {
    setIsLiked(product.liked || false);
  }, [product.liked]);

  const handleLikeChange = (liked: boolean) => {
    setIsLiked(liked);
    onLikeChange?.(liked);
  };

  return (
    <div
      style={{
        width: 'calc((100% - 64px) / 3)', // (100% - 2 * gap) / 3 cards
        height: 380,
        position: 'relative',
        opacity: 0.8,
        overflow: 'hidden',
        borderRadius: 25,
        outline: '3px rgba(230,230,230,0.8) solid',
        outlineOffset: -3,
        background: 'white',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{
          width: 'calc(100% - 66px)', // Full width minus left and right margins
          height: 'calc(100% - 140px)', // Adjusted for new height
          left: 33,
          top: 27,
          position: 'absolute',
          borderRadius: 20,
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          width: 'calc(100% - 83px)', // Full width minus left margin and heart button area
          height: 31,
          left: 33,
          top: 310, // Adjusted for new height
          position: 'absolute',
          color: 'black',
          fontSize: 20,
          fontFamily: 'Inria Sans, sans-serif',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={product.name}
      >
        {product.name}
      </div>
      <div
        style={{
          width: 'calc(100% - 177px)', // Full width minus left margin, heart button area, and some padding
          height: 25,
          left: 33,
          top: 337, // Adjusted for new height
          position: 'absolute',
          color: '#F88379',
          fontSize: 20,
          fontFamily: 'Inria Sans, sans-serif',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {product.price}
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          right: 20,
          top: 324, // Adjusted for new height
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={e => { e.stopPropagation(); }}
      >
        <HeartButton
          initialLiked={isLiked}
          onLikeChange={handleLikeChange}
          productId={product.id}
        />
      </div>
    </div>
  );
} 