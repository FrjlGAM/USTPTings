import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import ProductDetail from './ProductDetail';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface RecentlyViewedProps {
  onProductClick?: (product: any) => void;
}

export default function RecentlyViewed({ onProductClick }: RecentlyViewedProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const recentlyViewedIds = userData.recentlyViewed || [];
            const likedProducts = userData.likedProducts || [];
            
            // Fetch product details for each recently viewed product
            const productsPromises = recentlyViewedIds.map(async (productId: string) => {
              const productRef = doc(db, 'products', productId);
              const productDoc = await getDoc(productRef);
              if (productDoc.exists()) {
                return {
                  id: productDoc.id,
                  ...productDoc.data(),
                  liked: likedProducts.includes(productId)
                };
              }
              return null;
            });
            
            const productsList = (await Promise.all(productsPromises)).filter(Boolean);
            setProducts(productsList);
          }
        } catch (error) {
          console.error('Error fetching recently viewed products:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRecentlyViewed();
  }, []);

  useEffect(() => {
    const checkVerification = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        setIsVerified(Boolean(userDoc.exists() && userDoc.data().isVerified));
      }
    };
    checkVerification();
  }, []);

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

  const handleLikeChange = async (product: any, liked: boolean) => {
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        if (liked) {
          await setDoc(userRef, {
            likedProducts: arrayUnion(product.id)
          }, { merge: true });
        } else {
          await setDoc(userRef, {
            likedProducts: arrayRemove(product.id)
          }, { merge: true });
        }
        
        // Update local state to reflect the change
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, liked } : p
        ));
      } catch (error) {
        console.error('Error updating like status:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Loading recently viewed products...
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
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        No recently viewed products. Click on products to view their details.
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
          onLikeChange={(liked) => handleLikeChange(product, liked)}
        />
      ))}
    </div>
  );
} 