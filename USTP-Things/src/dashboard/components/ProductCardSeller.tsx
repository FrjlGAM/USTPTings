import React from 'react';

interface ProductCardProps {
  product: {
    id: string | number;
    name: string;
    price: string;
    image: string;
  };
  onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <div
      className="bg-white rounded-2xl shadow p-4 flex flex-col items-center cursor-pointer hover:scale-105 transition"
      style={{
        height: 320,
        opacity: 0.95,
      }}
      onClick={onClick}
    >
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover rounded-xl mb-4"
      />
      <div className="w-full text-center font-bold text-lg truncate" title={product.name}>
        {product.name}
      </div>
      <div className="w-full text-center text-[#F88379] font-bold text-lg mt-2">
        {product.price}
      </div>
    </div>
  );
} 