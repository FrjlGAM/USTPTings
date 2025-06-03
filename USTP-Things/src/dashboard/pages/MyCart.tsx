import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import ProductDetail from './ProductDetail';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc, arrayRemove, onSnapshot } from 'firebase/firestore';

interface MyCartProps {
  onProductClick?: (product: any) => void;
}

export default function MyCart({ onProductClick }: MyCartProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          const cartProductIds = userData.cartProducts || [];
          
          // Fetch product details for each cart product
          const productsPromises = cartProductIds.map(async (productId: string) => {
            const productRef = doc(db, 'products', productId);
            const productDoc = await getDoc(productRef);
            if (productDoc.exists()) {
              const productData = productDoc.data();
              // If product is out of stock, remove it from cart
              if ((productData.stock ?? 0) <= 0) {
                await setDoc(userRef, {
                  cartProducts: arrayRemove(productId)
                }, { merge: true });
                return null;
              }
              return {
                id: productDoc.id,
                ...productData
              };
            }
            return null;
          });
          
          const productsList = (await Promise.all(productsPromises)).filter(Boolean);
          setProducts(productsList);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching cart products:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

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

  const handleProductView = (product: any) => {
    setSelectedProduct(product);
  };

  const handleRemoveFromCart = async (product: any) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        cartProducts: arrayRemove(product.id)
      }, { merge: true });
    } catch (error) {
      console.error('Error removing product from cart:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Loading cart items...
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <div className="flex flex-wrap gap-8">
        <ProductDetail 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => {}} // Empty function since we're in cart view
          isVerified={isVerified}
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        Your cart is empty. Add products to your cart to see them here.
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
              handleRemoveFromCart(product);
            }
          }}
        />
      ))}
    </div>
  );
} 