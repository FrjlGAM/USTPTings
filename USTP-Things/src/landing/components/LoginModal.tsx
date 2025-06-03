import logo from '../../assets/ustp-things-logo.png';
import eyeIcon from '../../assets/ustp thingS/Eye.png';
import eyeOffIcon from '../../assets/ustp thingS/Eye off.png';
import emailIcon from '../../assets/ustp thingS/Email.png';
import xButton from '../../assets/ustp thingS/X button.png';
import { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if the user is an admin
      const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      if (adminDoc.exists()) {
        // If user is an admin, sign them out and show error
        await auth.signOut();
        setError('Admin accounts must login through the admin portal.');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError('Invalid email or password.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          <h2 className="text-2xl font-bold text-[#F88379] mb-6 mt-2">Login</h2>
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
            <div>
              <label className="block text-left text-black font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2 rounded border border-[#878787] focus:outline-none focus:border-[#F88379] pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span 
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:opacity-80"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img 
                    src={showPassword ? eyeIcon : eyeOffIcon} 
                    alt={showPassword ? "Hide password" : "Show password"} 
                    className="w-5 h-5"
                  />
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#F88379]" /> Remember me
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[#F88379] hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button type="submit" className="w-full py-3 rounded-full bg-[#F88379] text-white font-bold text-lg hover:bg-[#F88379]/80 transition disabled:opacity-60" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
} 