import { useEffect } from 'react';
import xIcon from '../../assets/ustp thingS/X button.png';

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

interface SellerProductDetailProps {
  product: any;
  open: boolean;
  onClose: () => void;
}

export default function SellerProductDetail({ product, open, onClose }: SellerProductDetailProps) {
  useEffect(() => {
    if (!open) return;
    // Optionally, focus or scroll logic
  }, [open]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-lg p-8 w-full max-w-4xl mx-auto">
        {/* X Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <img src={xIcon} alt="Close" className="w-8 h-8" />
        </button>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Image Section */}
          <div className="flex flex-col items-center md:w-[420px]">
            <div className="bg-[#f7f6fd] rounded-2xl p-4 flex items-center justify-center w-full mb-4">
              <img src={product.image} alt={product.name} className="w-[320px] h-[320px] object-cover rounded-xl" />
            </div>
          </div>
          {/* Product Details Section */}
          <div className="flex-1 flex flex-col justify-between pr-0 md:pr-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight pt-[10px]">{product.name.replace('...', '– Blouse, Skirt, and Necktie')}</h2>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl md:text-4xl font-bold text-[#F88379]">{product.price}</span>
              </div>
              <div className="flex flex-col mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl text-blue-400 font-bold">{productDetails.sold}</span> <span className="text-xl text-gray-500">Sold</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xl text-blue-400 font-bold">{productDetails.soldOut}</span> <span className="text-xl text-gray-500">Sold Out</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xl text-yellow-500 font-bold">★ {productDetails.rating}/5.0</span>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">Product Description:</h3>
                <div className="bg-[#f7f6fd] rounded-xl p-4">
                  {Array.isArray(product.description) ? (
                    <ul className="list-disc pl-6 text-gray-700">
                      {product.description.map((desc: string, i: number) => (
                        <li key={i}>{desc}</li>
                      ))}
                    </ul>
                  ) : product.description && typeof product.description === 'string' ? (
                    <span className="text-gray-700">{product.description}</span>
                  ) : (
                    <span className="italic text-gray-400">No description provided.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 