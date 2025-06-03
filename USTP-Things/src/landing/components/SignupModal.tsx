import logo from '../../assets/ustp-things-logo.png';
import emailIcon from '../../assets/ustp thingS/Email.png';
import usernameIcon from '../../assets/ustp thingS/Username.png';
import eyeIcon from '../../assets/ustp thingS/Eye.png';
import eyeOffIcon from '../../assets/ustp thingS/Eye off.png';
import xButton from '../../assets/ustp thingS/X button.png';
import { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TermsModal from './TermsModal';
import { verifyEmail } from '../../lib/emailVerification';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Verify if the email actually exists
      const isEmailValid = await verifyEmail(email);
      if (!isEmailValid) {
        setError('This email address does not exist. Please use a valid email address.');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save username and email to Firestore 'users' collection
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email: email.toLowerCase(),
        createdAt: new Date(),
      });
      setSuccess('Account created successfully!');
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreeToTerms(false);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up.');
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
        <h2 className="text-2xl font-bold text-[#F88379] mb-6 mt-2">Sign Up</h2>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-left text-black font-medium mb-1">Username</label>
            <div className="relative">
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full px-4 py-2 rounded border border-[#878787] focus:outline-none focus:border-[#F88379]" 
                required 
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <img src={usernameIcon} alt="Username" className="w-5 h-5" />
              </span>
            </div>
          </div>
          <div>
            <label className="block text-left text-black font-medium mb-1">Email</label>
            <div className="relative">
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-4 py-2 rounded border border-[#878787] focus:outline-none focus:border-[#F88379]" 
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
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-2 rounded border border-[#878787] focus:outline-none focus:border-[#F88379]" 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
              >
                <img 
                  src={showPassword ? eyeIcon : eyeOffIcon} 
                  alt={showPassword ? "Hide password" : "Show password"} 
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-left text-black font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full px-4 py-2 rounded border border-[#878787] focus:outline-none focus:border-[#F88379]" 
                required 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
              >
                <img 
                  src={showConfirmPassword ? eyeIcon : eyeOffIcon} 
                  alt={showConfirmPassword ? "Hide password" : "Show password"} 
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="w-4 h-4 text-[#F88379] border-[#878787] rounded focus:ring-[#F88379]"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the{' '}
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="text-[#F88379] hover:underline focus:outline-none"
              >
                terms and conditions
              </button>
            </label>
          </div>
          <button type="submit" className="w-full py-3 rounded-full bg-[#F88379] text-white font-bold text-lg hover:bg-[#F88379]/80 transition disabled:opacity-60" disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
        </form>
      </div>
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
    </div>
  );
} 