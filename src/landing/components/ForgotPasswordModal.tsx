import logo from '../../assets/ustp-things-logo.png';
import emailIcon from '../../assets/ustp thingS/Email.png';
import xButton from '../../assets/ustp thingS/X button.png';
import { useState } from 'react';
import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Please check your inbox.');
      setEmail('');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('Failed to send password reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="relative bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 flex flex-col items-center border border-[#F88379] pointer-events-auto">
        <button
          className="absolute top-4 right-4 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <img src={xButton} alt="Close" className="w-8 h-8" />
        </button>
        <img src={logo} alt="USTP Things Logo" className="w-24 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-[#F88379] mb-6 mt-2">Reset Password</h2>
        <p className="text-gray-600 text-center mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-left text-black font-medium mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                className="w-full px-4 py-2 rounded border border-[#878787] focus:outline-none focus:border-[#F88379]"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <img src={emailIcon} alt="Email" className="w-5 h-5" />
              </span>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#F88379] text-white font-bold text-lg hover:bg-[#F88379]/80 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
} 