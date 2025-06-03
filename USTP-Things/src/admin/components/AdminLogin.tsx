import logo from '../../assets/ustp-things-logo.png';
import adminBg from '../../assets/admin.png';
import emailIcon from '../../assets/ustp thingS/Email.png';
import eyeIcon from '../../assets/ustp thingS/Eye.png';
import eyeOffIcon from '../../assets/ustp thingS/Eye off.png';
import { useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if the user is an admin
      const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      if (!adminDoc.exists()) {
        // If user is not an admin, sign them out and show error
        await auth.signOut();
        setError('Access denied. Only admin accounts can login here.');
        return;
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${adminBg})` }}
    >
      <div className="bg-white bg-opacity-70 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 flex flex-col items-center border border-pink-200 backdrop-blur-md">
        <img src={logo} alt="USTP Things Logo" className="w-24 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-[#F88379] mb-6 mt-2">Admin Login</h2>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-left text-black font-medium mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-[#F88379]"
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
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-[#F88379] pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <span 
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
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
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button 
            type="submit" 
            className="w-full py-3 rounded-full bg-[#F88379] text-white font-bold text-lg hover:bg-[#F88379]/90 transition disabled:opacity-60" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
} 