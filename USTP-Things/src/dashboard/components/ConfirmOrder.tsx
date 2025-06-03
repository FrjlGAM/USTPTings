import React from 'react';

interface ConfirmOrderProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmOrder({ open, onConfirm, onCancel }: ConfirmOrderProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur transition-all duration-300" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl px-16 py-12 flex flex-col items-center min-w-[500px] border-4 border-[#ECB3A8] animate-fade-in-scale">
        <h2 className="text-4xl font-bold text-[#F88379] mb-12">Confirm Order</h2>
        
        <div className="flex gap-6 w-full px-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-white border-2 border-[#4CAF50] text-[#4CAF50] font-bold py-4 rounded-xl hover:bg-[#4CAF50] hover:text-white transition text-lg"
          >
            Place Order
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-[#FF4444] text-[#FF4444] font-bold py-4 rounded-xl hover:bg-[#FF4444] hover:text-white transition text-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 