import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import Logo from '../../landing/components/Logo';
import userAvatar from '../../assets/ustp thingS/Person.png';
import { collection, getDocs, deleteDoc, doc, setDoc, query, orderBy, getDoc, Timestamp } from 'firebase/firestore';
import { useSalesEarnings, useRecentTransactions } from '../../hooks/useSalesEarnings';

type Product = {
  id: string;
  name: string;
  price: string | number;
  image: string;
  description: string;
  sellerId: string;
  sellerName: string;
  stock: number;
  createdAt: Timestamp;
};

type Verification = {
  id: string;
  userId: string;
  name: string;
  status: string;
  createdAt: Timestamp;
  studentId?: string;
  email?: string;
};

type VerifiedAccount = {
  id: string;
  userId: string;
  name: string;
  profileImage: string;
  verifiedAt: Timestamp;
  status: string;
  studentId?: string;
  email?: string;
  isBanned?: boolean;
  bannedAt?: Timestamp;
  bannedReason?: string;
};

type UserData = {
  name?: string;
  profileImage?: string;
  isVerified?: boolean;
  verificationRequested?: boolean;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'dashboard' | 'account' | 'verified' | 'products'>('dashboard');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [verifiedAccounts, setVerifiedAccounts] = useState<VerifiedAccount[]>([]);
  const [loadingVerified, setLoadingVerified] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Use real-time sales and earnings data
  const salesEarningsData = useSalesEarnings();
  // Fetch all transactions by not passing a limit to useRecentTransactions
  const { transactions: recentTransactions, loading: loadingTransactions } = useRecentTransactions();

  // Legacy states for user count (still needed)
  const [totalUsers, setTotalUsers] = useState(0);

  // Helper function to safely format currency values
  const formatCurrency = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '₱0';
    }
    return `₱${value.toLocaleString()}`;
  };

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
      fetchTotalUsers();
    }
    if (tab === 'products') {
      fetchAllProducts();
    }
    // eslint-disable-next-line
  }, [tab]);

  const fetchAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsList = await Promise.all(productsSnapshot.docs.map(async (docSnapshot) => {
        const productData = docSnapshot.data();
        // Get seller information
        const sellerDoc = await getDoc(doc(db, 'users', productData.sellerId));
        const sellerData = sellerDoc.data() as UserData;
        return {
          id: docSnapshot.id,
          ...productData,
          sellerName: sellerData?.name || 'Unknown Seller'
        } as Product;
      }));
      setProducts(productsList);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const fetchVerifications = async () => {
    setLoadingVerifications(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'verifications'));
      const verificationPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const verificationData = docSnapshot.data();
        // Get the user document to ensure we have the latest name
        const userDoc = await getDoc(doc(db, 'users', verificationData.userId));
        const userData = userDoc.data() as UserData;
        return {
          id: docSnapshot.id,
          ...verificationData,
          name: userData?.name || verificationData.name || 'Unknown'
        } as Verification;
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
        const userData = userDoc.data() as UserData;
        return {
          id: docSnapshot.id,
          ...accountData,
          name: userData?.name || accountData.name || 'Unknown',
          profileImage: userData?.profileImage || userAvatar
        } as VerifiedAccount;
      });
      const data = await Promise.all(accountPromises);
      setVerifiedAccounts(data);
    } catch (error) {
      console.error('Error fetching verified accounts:', error);
    }
    setLoadingVerified(false);
  };

  // Fetch total users count for dashboard
  const fetchTotalUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'verifiedAccounts'));
      setTotalUsers(usersSnapshot.size);
    } catch (error) {
      console.error('Error fetching total users:', error);
    }
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
        verifiedAt: Timestamp.fromDate(now),
        status: 'verified',
        verificationId: id,
        updatedAt: Timestamp.fromDate(now)
      });

      // Update user document to reflect verified status
      await setDoc(doc(db, 'users', verification.userId), {
        isVerified: true,
        verifiedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      }, { merge: true });

      // Remove from verifications collection
      await deleteDoc(doc(db, 'verifications', id));
      
      setVerifications(v => v.filter(item => item.id !== id));
      if (tab === 'verified') fetchVerifiedAccounts();
      if (tab === 'dashboard') fetchTotalUsers();
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

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handleBanUser = async (userId: string, name: string) => {
    const reason = window.prompt('Please enter reason for banning this user:');
    if (!reason) return;

    try {
      const now = new Date();
      // Update verifiedAccounts document
      await setDoc(doc(db, 'verifiedAccounts', userId), {
        isBanned: true,
        bannedAt: Timestamp.fromDate(now),
        bannedReason: reason,
        status: 'banned'
      }, { merge: true });

      // Update user document
      await setDoc(doc(db, 'users', userId), {
        isBanned: true,
        bannedAt: Timestamp.fromDate(now),
        bannedReason: reason
      }, { merge: true });

      // Refresh the verified accounts list
      fetchVerifiedAccounts();
      alert(`Successfully banned ${name}`);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user. Please try again.');
    }
  };

  const handleUnbanUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to unban ${name}?`)) return;

    try {
      // Update verifiedAccounts document
      await setDoc(doc(db, 'verifiedAccounts', userId), {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
        status: 'verified'
      }, { merge: true });

      // Update user document
      await setDoc(doc(db, 'users', userId), {
        isBanned: false,
        bannedAt: null,
        bannedReason: null
      }, { merge: true });

      // Refresh the verified accounts list
      fetchVerifiedAccounts();
      alert(`Successfully unbanned ${name}`);
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6FF] p-2">
      {/* Navigation Bar */}
      <nav className="bg-white rounded-xl shadow flex items-center px-8 py-3 mb-6 border border-pink-100">
        <Logo />
        <div className="flex-1 flex justify-center gap-12">
          <button className={`text-lg font-semibold pb-1 px-2 ${tab === 'dashboard' ? '' : 'hover:text-[#F88379]'}`} style={tab === 'dashboard' ? { color: '#F88379', borderBottom: '2px solid #F88379' } : { color: '#888' }} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={`text-lg font-semibold pb-1 px-2 ${tab === 'account' ? '' : 'hover:text-[#F88379]'}`} style={tab === 'account' ? { color: '#F88379', borderBottom: '2px solid #F88379' } : { color: '#888' }} onClick={() => setTab('account')}>Account Confirmation</button>
          <button className={`text-lg font-semibold pb-1 px-2 ${tab === 'verified' ? '' : 'hover:text-[#F88379]'}`} style={tab === 'verified' ? { color: '#F88379', borderBottom: '2px solid #F88379' } : { color: '#888' }} onClick={() => setTab('verified')}>Verified Accounts</button>
          <button className={`text-lg font-semibold pb-1 px-2 ${tab === 'products' ? '' : 'hover:text-[#F88379]'}`} style={tab === 'products' ? { color: '#F88379', borderBottom: '2px solid #F88379' } : { color: '#888' }} onClick={() => setTab('products')}>Products</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{color: '#F88379'}}><svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg></span>
          <button onClick={handleLogout} className="font-semibold hover:underline text-lg" style={{color: '#F88379'}}>Logout</button>
        </div>
      </nav>

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="bg-white rounded-2xl border-2 border-pink-100 p-6">
          <div className="text-xl font-bold mb-4">All Products</div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-white bg-[#F88379]">
                  <th className="py-3 px-4 font-semibold rounded-tl-2xl">Product</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Stock</th>
                  <th className="py-3 px-4 font-semibold">Seller</th>
                  <th className="py-3 px-4 font-semibold rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingProducts ? (
                  <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                ) : currentProducts.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No products found.</td></tr>
                ) : (
                  currentProducts.map((product) => (
                    <tr key={product.id} className="bg-[#FDF3E7] border-b border-pink-100 last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-12 h-12 rounded-lg object-cover border border-pink-200"
                          />
                          <div>
                            <div className="font-semibold text-gray-800">{product.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-700">₱{typeof product.price === 'string' ? product.price : product.price.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-700">{product.stock}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-700">{product.sellerName}</div>
                        <div className="text-sm text-gray-500">ID: {product.sellerId}</div>
                      </td>
                      <td className="py-4 px-4">
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-1 rounded shadow"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {!loadingProducts && products.length > 0 && (
            <div className="flex justify-between items-center mt-4 px-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, products.length)} of {products.length} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#F88379] text-white hover:bg-[#f76d62]'
                  }`}
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#F88379] text-white hover:bg-[#f76d62]'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border-2 border-pink-100 p-6 flex flex-col items-start">
              <span className="text-gray-500 font-medium mb-1">Total Sales</span>
              <span className="text-2xl font-bold text-gray-700">
                {salesEarningsData.loading ? 'Loading...' : formatCurrency(salesEarningsData.totalSales)}
              </span>
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
                  <div className="font-bold text-lg text-gray-700">
                    {salesEarningsData.loading ? 'Loading...' : formatCurrency(salesEarningsData.totalEarnings)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Revenue</div>
                  <div className="font-bold text-lg text-gray-700">
                    {salesEarningsData.loading ? 'Loading...' : formatCurrency(salesEarningsData.totalSales)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">This Week</div>
                  <div className="font-bold text-lg text-gray-700">
                    {salesEarningsData.loading ? 'Loading...' : formatCurrency(salesEarningsData.weeklySales)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">This Month</div>
                  <div className="font-bold text-lg text-gray-700">
                    {salesEarningsData.loading ? 'Loading...' : formatCurrency(salesEarningsData.monthlySales)}
                  </div>
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
                  {loadingTransactions ? (
                    <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                  ) : recentTransactions.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No transactions found.</td></tr>
                  ) : (
                    recentTransactions.map((tx) => {
                      return (
                        <tr key={tx.id} className="border-b border-pink-100 last:border-0">
                          <td className="flex items-center gap-3 py-3 px-2">
                            <img src={tx.productImage || userAvatar} alt="Product" className="w-10 h-10 rounded-full border border-pink-200" />
                            <span className="text-gray-700">{tx.productName}</span>
                          </td>
                          <td className="py-3 px-2 font-semibold text-gray-700">{formatCurrency(Number(tx.totalAmount) || 0)}</td>
                          <td className="py-3 px-2 font-semibold text-gray-700">{tx.quantity}</td>
                          <td className="py-3 px-2 text-gray-500">
                            {tx.createdAt.toDate().toLocaleDateString()}
                          </td>
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
                          const dateObj = v.createdAt.toDate();
                          return dateObj instanceof Date && !isNaN(dateObj.getTime()) ? (
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
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingVerified || loadingVerifications ? (
                  <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                ) : verifiedAccounts.length === 0 && verifications.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No users found.</td></tr>
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
                            const dateObj = v.verifiedAt.toDate();
                            return dateObj instanceof Date && !isNaN(dateObj.getTime()) ? (
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
                          {v.isBanned ? (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">BANNED</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">VERIFIED</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {v.isBanned ? (
                            <button 
                              onClick={() => handleUnbanUser(v.userId, v.name)}
                              className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-1 rounded shadow"
                            >
                              Unban
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleBanUser(v.userId, v.name)}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-1 rounded shadow"
                            >
                              Ban
                            </button>
                          )}
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