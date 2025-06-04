import React from "react";
import ustpLogo from "../../assets/ustp-things-logo.png";
import xIcon from "../../assets/ustp thingS/X button.png";
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

type Props = {
  open: boolean;
  onClose: () => void;
  onStartSelling: () => void;
};

// const StartSellingModal: React.FC<Props> = ({ open, onClose, onStartSelling }) => {
const StartSellingModal: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleStartSelling = async () => {
    try {
      // Update user as seller in Firestore
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      await setDoc(userRef, {
        isSeller: true,
        becameSellerAt: new Date()
      }, { merge: true });

      // Close modal and navigate
      onClose();
      navigate('/dashboard/seller');
    } catch (error) {
      console.error('Error updating seller status:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur transition-all duration-300" />
      {/* Modal content */}
      <div className="relative bg-white rounded-3xl shadow-2xl px-12 py-10 flex flex-col items-center min-w-[400px] min-h-[250px] border-4 border-[#ECB3A8] animate-fade-in-scale">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-2xl text-[#F88379] hover:text-red-400"
          onClick={onClose}
        >
          <img src={xIcon} alt="Close" className="w-8 h-8" />
        </button>
        <img src={ustpLogo} alt="USTP Things" className="w-32 mb-4" />
        <h2 className="text-2xl font-bold text-[#F88379] mb-2 text-center">
          Start Your Selling Journey
        </h2>
        <p className="text-center text-[#F88379] mb-8">
          Showcase your products, attract buyers, and boost your sales!
        </p>
        <button
          className="bg-[#F88379] text-white font-semibold px-8 py-2 rounded-full shadow hover:bg-[#f88379cc] transition"
          onClick={handleStartSelling}
        >
          Start Selling
        </button>
      </div>
    </div>
  );
};

export default StartSellingModal;
