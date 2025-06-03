import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import Logo from '../../landing/components/Logo';
import userAvatar from '../../assets/ustp thingS/Person.png';
import { collection, getDocs, deleteDoc, doc, setDoc, query, orderBy, limit, getDoc } from 'firebase/firestore';

type Transaction = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  createdAt: any;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'dashboard' | 'account' | 'verified'>('dashboard');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [verifiedAccounts, setVerifiedAccounts] = useState<any[]>([]);
  const [loadingVerified, setLoadingVerified] = useState(false);

  // Dashboard real data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [earnings, setEarnings] = useState({
    total: 0,
    revenue: 0,
    week: 0,
    month: 0,
  });
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (tab === 'account') {
      fetchVerifications();
    }
    if (tab === 'verified') {
      fetchVerifiedAccounts();
    }
    if (tab === 'dashboard') {
      fetchDashboardData();
    }
    // eslint-disable-next-line
  }, [tab]);

  const fetchVerifications = async () => {
    setLoadingVerifications(true);
    try {
    const querySnapshot = await getDocs(collection(db, 'verifications'));
      const verificationPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const verificationData = docSnapshot.data();
        // Get the user document to ensure we have the latest name
        const userDoc = await getDoc(doc(db, 'users', verificationData.userId));
        const userData = userDoc.data();
        return {
          id: docSnapshot.id,
          ...verificationData,
          name: userData?.name || verificationData.name || 'Unknown'
        };
      });
      const data = await Promise.all(verificationPromises);
    setVerifications(data);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
    setLoadingVerifications(false);
  };

  const fetchVerifiedAccounts = async () => {
    setLoadingVerified(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'verifiedAccounts'));
      const accountPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const accountData = docSnapshot.data();
        // Get the user document to ensure we have the latest data
        const userDoc = await getDoc(doc(db, 'users', accountData.userId));
        const userData = userDoc.data();
        return {
          id: docSnapshot.id,
          ...accountData,
          name: userData?.name || accountData.name || 'Unknown',
          profileImage: userData?.profileImage || userAvatar // Get profile image from user document
        };
      });
      const data = await Promise.all(accountPromises);
      setVerifiedAccounts(data);
    } catch (error) {
      console.error('Error fetching verified accounts:', error);
    }
    setLoadingVerified(false);
  };

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    // Fetch transactions
    const txQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(10));
    const txSnapshot = await getDocs(txQuery);
    const txData = txSnapshot.docs
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
      .filter((tx): tx is Transaction =>
        typeof tx.name === 'string' &&
        typeof tx.price !== 'undefined' &&
        typeof tx.quantity !== 'undefined' &&
        typeof tx.createdAt !== 'undefined'
      );
    setTransactions(txData);

    // Calculate total sales and earnings
    let total = 0;
    let week = 0;
    let month = 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    txData.forEach(tx => {
      const price = Number(tx.price) || 0;
      const quantity = Number(tx.quantity) || 1;
      let createdAt = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
      const sale = price * quantity;
      total += sale;
      if (createdAt >= startOfWeek) week += sale;
      if (createdAt >= startOfMonth) month += sale;
    });
    setTotalSales(total);
    setEarnings({ total, revenue: total, week, month });

    // Fetch total users
    const usersSnapshot = await getDocs(collection(db, 'verifiedAccounts'));
    setTotalUsers(usersSnapshot.size);
    setLoadingDashboard(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleConfirm = async (id: string) => {
    // Find the verification data
    const verification = verifications.find(v => v.id === id);
    if (!verification) return;

    try {
      const now = new Date();
      // Add to verifiedAccounts using userId instead of verification id
      await setDoc(doc(db, 'verifiedAccounts', verification.userId), {
        ...verification,
        verifiedAt: now,
        status: 'verified',
        verificationId: id,
        updatedAt: now
      });

      // Update user document to reflect verified status
      await setDoc(doc(db, 'users', verification.userId), {
        isVerified: true,
        verifiedAt: now,
        updatedAt: now
      }, { merge: true });

      // Remove from verifications collection
      await deleteDoc(doc(db, 'verifications', id));
      
      setVerifications(v => v.filter(item => item.id !== id));
      if (tab === 'verified') fetchVerifiedAccounts();
      if (tab === 'dashboard') fetchDashboardData();
    } catch (error) {
      console.error('Error confirming verification:', error);
      alert('Failed to confirm verification. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    // Find the verification data to get the userId
    const verification = verifications.find(v => v.id === id);
    if (!verification) return;

    // Remove the verification document
    await deleteDoc(doc(db, 'verifications', id));

    // Update the user document to allow re-verification
    await setDoc(doc(db, 'users', verification.userId), {
      verificationRequested: false
    }, { merge: true });

    setVerifications(v => v.filter(item => item.id !== id));
  };

  const pendingVerifications = verifications.filter(v => v.status === 'pending');

  return (
    <div className="min-h-screen bg-[#F8F6FF] p-2">
      {/* Navigation Bar */}
      <nav className="bg-white rounded-xl shadow flex items-center px-8 py-3 mb-6 border border-pink-100">
        <Logo />
        <div className="flex-1 flex justify-center gap-12">
          <button className={`text-lg font-semibold pb-1 px-2 ${tab === 'dashboard' ? '' : 'hover:text-[#F88379]'}`} style={tab === 'dashboard' ? { color: '#F88379', borderBottom: '2px solid #F88379' } : { color: '#888' }} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={`text-lg font-semibold pb-1 px-2 ${tab === 'account' ? '' : 'hover:text-[#F88379]'}`} style={tab === 'account' ? { color: '#F88379', borderBottom: '2px solid #F88379' } : { color: '#888' }} onClick={() => setTab('account')}>Account Confirmation</button>
          <button className={`text-lg font-semibold pb-1 px-2 ${tab === 'verified' ? '' : 'hover:text-[#F88379]'}`} style={tab === 'verified' ? { color: '#F88379', borderBottom: '2px solid #F88379' } : { color: '#888' }} onClick={() => setTab('verified')}>Verified Accounts</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{color: '#F88379'}}><svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg></span>
          <button onClick={handleLogout} className="font-semibold hover:underline text-lg" style={{color: '#F88379'}}>Logout</button>
        </div>
      </nav>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border-2 border-pink-100 p-6 flex flex-col items-start">
              <span className="text-gray-500 font-medium mb-1">Total Sales</span>
              <span className="text-2xl font-bold text-gray-700">₱{totalSales.toLocaleString()}</span>
            </div>
            <div className="bg-white rounded-xl border-2 p-6 flex flex-col items-start" style={{borderColor: '#F88379'}}>
              <span className="text-gray-500 font-medium mb-1">Total Users</span>
              <span className="text-2xl font-bold text-gray-700">{totalUsers.toLocaleString()}</span>
            </div>
            <div className="bg-yellow-50 rounded-xl border-2 border-yellow-100 p-6 flex-1">
              <span className="text-gray-500 font-medium mb-1">Earnings</span>
              <div className="flex flex-wrap gap-6 mt-2">
                <div>
                  <div className="text-xs text-gray-500">Total Earnings</div>
                  <div className="font-bold text-lg text-gray-700">₱{earnings.total.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Revenue</div>
                  <div className="font-bold text-lg text-gray-700">₱{earnings.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">This Week</div>
                  <div className="font-bold text-lg text-gray-700">₱{earnings.week.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">This Month</div>
                  <div className="font-bold text-lg text-gray-700">₱{earnings.month.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-[#FDF3E7] rounded-2xl border-2 border-pink-100 p-6">
            <div className="text-lg font-semibold mb-4">Transactions</div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-base border-b border-pink-100">
                    <th className="py-2 px-2 font-medium">Name</th>
                    <th className="py-2 px-2 font-medium">Price</th>
                    <th className="py-2 px-2 font-medium">Quantity</th>
                    <th className="py-2 px-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDashboard ? (
                    <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No transactions found.</td></tr>
                  ) : (
                    transactions.map((tx) => {
                      const dateObj = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
                      return (
                        <tr key={tx.id} className="border-b border-pink-100 last:border-0">
                          <td className="flex items-center gap-3 py-3 px-2">
                            <img src={tx.image || userAvatar} alt="Product" className="w-10 h-10 rounded-full border border-pink-200" />
                            <span className="text-gray-700">{tx.name}</span>
                          </td>
                          <td className="py-3 px-2 font-semibold text-gray-700">₱{Number(tx.price).toLocaleString()}</td>
                          <td className="py-3 px-2 font-semibold text-gray-700">{tx.quantity}</td>
                          <td className="py-3 px-2 text-gray-500">{!isNaN(dateObj) ? dateObj.toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Account Confirmation Tab */}
      {tab === 'account' && (
        <div className="bg-white rounded-2xl border-2 border-pink-100 p-6">
          <div className="text-xl font-bold mb-4">Pending Accounts</div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-white bg-[#F88379]">
                  <th className="py-3 px-4 font-semibold rounded-tl-2xl">Name</th>
                  <th className="py-3 px-4 font-semibold">ID Number and Email</th>
                  <th className="py-3 px-4 font-semibold">Date Applied</th>
                  <th className="py-3 px-4 font-semibold rounded-tr-2xl">Confirm</th>
                </tr>
              </thead>
              <tbody>
                {loadingVerifications ? (
                  <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                ) : pendingVerifications.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No pending accounts.</td></tr>
                ) : (
                  pendingVerifications.map((v) => (
                    <tr key={v.id} className="bg-[#FDF3E7] border-b border-pink-100 last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                        <img src={userAvatar} alt="Avatar" className="w-10 h-10 rounded-full border border-pink-200" />
                        <span className="font-semibold text-gray-800">{v.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-700">{v.studentId || 'N/A'}</div>
                        <div className="text-gray-500 text-sm">{v.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        {(() => {
                          const dateObj = v.createdAt?.toDate ? v.createdAt.toDate() : new Date(v.createdAt);
                          return !isNaN(dateObj) ? (
                            <>
                              <div>{dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                              <div className="text-sm text-gray-500">{dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                            </>
                          ) : (
                            <div>N/A</div>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                        <button onClick={() => handleConfirm(v.id)} className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 py-1 rounded shadow">CONFIRM</button>
                        <button onClick={() => handleReject(v.id)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-1 rounded shadow">REJECT</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verified Accounts Tab */}
      {tab === 'verified' && (
        <div className="bg-white rounded-2xl border-2 border-pink-100 p-6">
          <div className="text-xl font-bold mb-4">All Users</div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-white bg-[#F88379]">
                  <th className="py-3 px-4 font-semibold rounded-tl-2xl">Name</th>
                  <th className="py-3 px-4 font-semibold">Student Details</th>
                  <th className="py-3 px-4 font-semibold">Verification Date</th>
                  <th className="py-3 px-4 font-semibold rounded-tr-2xl">Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingVerified || loadingVerifications ? (
                  <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                ) : verifiedAccounts.length === 0 && verifications.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">No users found.</td></tr>
                ) : (
                  <>
                    {/* Verified Users */}
                    {verifiedAccounts.map((v) => (
                      <tr key={v.id} className="bg-[#FDF3E7] border-b border-pink-100 last:border-0">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={v.profileImage || userAvatar} 
                              alt="Avatar" 
                              className="w-10 h-10 rounded-full border border-pink-200 object-cover"
                            />
                            <span className="font-semibold text-gray-800">{v.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-700">{v.studentId || 'N/A'}</div>
                          <div className="text-gray-500 text-sm">{v.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          {(() => {
                            const dateObj = v.verifiedAt?.toDate ? v.verifiedAt.toDate() : new Date(v.verifiedAt);
                            return !isNaN(dateObj) ? (
                              <>
                                <div>{dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                <div className="text-sm text-gray-500">{dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                              </>
                            ) : (
                              <div>N/A</div>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">VERIFIED</span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 