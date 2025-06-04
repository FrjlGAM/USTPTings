import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

interface BannedMessageProps {
  reason?: string;
  bannedAt?: Date;
}

const BannedMessage: React.FC<BannedMessageProps> = ({ reason, bannedAt }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border-2 border-red-200 p-8 max-w-2xl w-full text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Account Banned</h1>
        <p className="text-gray-600 mb-6">
          Your account has been banned from the platform. This means you can no longer buy or sell products.
        </p>
        {reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium mb-2">Reason for ban:</p>
            <p className="text-red-700">{reason}</p>
          </div>
        )}
        {bannedAt && (
          <p className="text-gray-500 mb-6">
            Banned on: {bannedAt.toLocaleDateString()} at {bannedAt.toLocaleTimeString()}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-lg shadow transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default BannedMessage; 