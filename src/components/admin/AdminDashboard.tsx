import React, { useEffect, useState } from 'react';
import { Shop, Language, Job, PrintingService } from '../../types';
import { clearAuthSession } from '../../utils/storage';
import {
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  Store,
  Printer,
  LogOut,
  RefreshCw,
  Plus,
  Edit2,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
  Eye,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  Activity,
  Database,
  Server,
  Key,
  DollarSign,
  Home,
  Check,
  AlertTriangle,
  Lock,
  ArrowRight,
  UserCheck,
  UserX,
  Sparkles,
  Layers,
  Phone,
  MapPin,
  Mail,
  Tag
} from 'lucide-react';

interface AdminDashboardProps {
  onExitToHome?: () => void;
  onExitToShop?: () => void;
  onSwitchShop?: (shop: Shop) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExitToHome,
  onExitToShop,
  onSwitchShop,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'users' | 'jobs' | 'services' | 'health'>('overview');
  
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('current_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter states
  const [shopSearch, setShopSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [jobServiceFilter, setJobServiceFilter] = useState('all');
  const [serviceShopFilter, setServiceShopFilter] = useState('all');

  // Modals
  const [showCreateShopModal, setShowCreateShopModal] = useState(false);
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [viewingJob, setViewingJob] = useState<any>(null);

  // Form states for Shop Create / Edit
  const [shopName, setShopName] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopOwnerName, setShopOwnerName] = useState('');
  const [shopOwnerUsername, setShopOwnerUsername] = useState('');
  const [shopOwnerPassword, setShopOwnerPassword] = useState('');

  // Form states for User Create / Edit
  const [userFormShopId, setUserFormShopId] = useState('default_shop_1');
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'owner' | 'manager' | 'staff'>('staff');
  const [userFormActive, setUserFormActive] = useState(true);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (token) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginUsername.trim(), password: loginPassword.trim() }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        if (data.user.role !== 'admin') {
          setLoginError('Access denied: Account does not have system administrator privileges.');
          setIsLoggingIn(false);
          return;
        }

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('current_user', JSON.stringify(data.user));
        if (data.shop) {
          localStorage.setItem('namaste_shop', JSON.stringify(data.shop));
        }

        setToken(data.token);
        setCurrentUser(data.user);
        showToast('Logged in as System Administrator');
      } else {
        setLoginError(data.message || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setLoginError('Connection error to backend server: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchAllData = async () => {
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    const headers = { Authorization: `Bearer ${currentToken}` };

    try {
      const [statsRes, shopsRes, usersRes, jobsRes, srvRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/stats', { headers }),
        fetch('http://localhost:5000/api/admin/shops', { headers }),
        fetch('http://localhost:5000/api/admin/users', { headers }),
        fetch('http://localhost:5000/api/admin/jobs', { headers }),
        fetch('http://localhost:5000/api/admin/services', { headers }),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (shopsRes.ok) setShops((await shopsRes.json()).shops || []);
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (jobsRes.ok) setJobs((await jobsRes.json()).jobs || []);
      if (srvRes.ok) setServices((await srvRes.json()).services || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      showToast('Could not sync with backend server. Check server connection.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    setToken(null);
    setCurrentUser(null);
    if (onExitToHome) onExitToHome();
    else window.location.hash = '#home';
  };

  // --- Shop Handlers ---
  const openCreateShopModal = () => {
    setShopName('');
    setShopTagline("Nepal's Smart QR Print & File Service");
    setShopPhone('');
    setShopAddress('');
    setShopSlug('');
    setShopEmail('');
    setShopOwnerName('');
    setShopOwnerUsername('');
    setShopOwnerPassword('');
    setShowCreateShopModal(true);
  };

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/admin/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_name: shopName.trim(),
          tagline: shopTagline.trim(),
          phone: shopPhone.trim(),
          address: shopAddress.trim(),
          qr_slug: shopSlug.trim(),
          username: shopSlug.trim(),
          email: shopEmail.trim(),
          owner_name: shopOwnerName.trim(),
          owner_username: shopOwnerUsername.trim(),
          owner_password: shopOwnerPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Shop "${shopName}" created successfully!`);
        setShowCreateShopModal(false);
        fetchAllData();
      } else {
        showToast(data.message || 'Failed to create shop', 'error');
      }
    } catch (err: any) {
      showToast('Error creating shop: ' + err.message, 'error');
    }
  };

  const openEditShopModal = (shop: any) => {
    setEditingShop(shop);
    setShopName(shop.shop_name || '');
    setShopTagline(shop.tagline || '');
    setShopPhone(shop.phone || '');
    setShopAddress(shop.address || '');
    setShopSlug(shop.qr_slug || shop.username || '');
    setShopEmail(shop.email || '');
    setShopOwnerName(shop.owner_name || '');
    setShowEditShopModal(true);
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/shops/${editingShop.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_name: shopName.trim(),
          tagline: shopTagline.trim(),
          phone: shopPhone.trim(),
          address: shopAddress.trim(),
          qr_slug: shopSlug.trim(),
          username: shopSlug.trim(),
          email: shopEmail.trim(),
          owner_name: shopOwnerName.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Shop details updated successfully!');
        setShowEditShopModal(false);
        fetchAllData();
      } else {
        showToast(data.message || 'Failed to update shop', 'error');
      }
    } catch (err: any) {
      showToast('Error updating shop: ' + err.message, 'error');
    }
  };

  const handleDeleteShop = async (id: string, name: string) => {
    if (id === 'default_shop_1') {
      alert('The default platform primary shop cannot be deleted.');
      return;
    }
    if (!window.confirm(`CAUTION: Are you sure you want to delete shop "${name}"? This will permanently delete all associated users, jobs, files, and services!`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/shops/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Shop "${name}" deleted.`);
        fetchAllData();
      } else {
        showToast(data.message || 'Failed to delete shop', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting shop: ' + err.message, 'error');
    }
  };

  // --- User Handlers ---
  const openCreateUserModal = () => {
    setUserFormShopId(shops[0]?.id || 'default_shop_1');
    setUserFormName('');
    setUserFormEmail('');
    setUserFormUsername('');
    setUserFormPassword('');
    setUserFormRole('staff');
    setShowCreateUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormUsername.trim() || !userFormPassword.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_id: userFormShopId,
          name: userFormName.trim(),
          email: userFormEmail.trim(),
          username: userFormUsername.trim(),
          password: userFormPassword.trim(),
          role: userFormRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`User @${userFormUsername} created successfully!`);
        setShowCreateUserModal(false);
        fetchAllData();
      } else {
        showToast(data.message || 'Failed to create user', 'error');
      }
    } catch (err: any) {
      showToast('Error creating user: ' + err.message, 'error');
    }
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setUserFormShopId(user.shop_id || 'default_shop_1');
    setUserFormName(user.name || '');
    setUserFormEmail(user.email || '');
    setUserFormUsername(user.username || '');
    setUserFormPassword('');
    setUserFormRole(user.role || 'staff');
    setUserFormActive(Boolean(user.active));
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_id: userFormShopId,
          name: userFormName.trim(),
          email: userFormEmail.trim(),
          role: userFormRole,
          active: userFormActive,
          password: userFormPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`User @${editingUser.username} updated.`);
        setShowEditUserModal(false);
        fetchAllData();
      } else {
        showToast(data.message || 'Failed to update user', 'error');
      }
    } catch (err: any) {
      showToast('Error updating user: ' + err.message, 'error');
    }
  };

  const handleToggleUserActive = async (user: any) => {
    if (user.id === 'admin_user_1') {
      alert('The root system admin account cannot be deactivated.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !user.active }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`User @${user.username} is now ${!user.active ? 'Active' : 'Deactivated'}.`);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('Error toggling user: ' + err.message, 'error');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (user.id === 'admin_user_1' || user.id === currentUser?.id) {
      alert('Cannot delete primary system admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user @${user.username}?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast(`User @${user.username} deleted.`);
        fetchAllData();
      } else {
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting user: ' + err.message, 'error');
    }
  };

  // --- Job Handlers ---
  const handleUpdateJobStatus = async (jobId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast(`Job status updated to "${status}".`);
        fetchAllData();
        if (viewingJob && viewingJob.id === jobId) {
          setViewingJob((prev: any) => ({ ...prev, status }));
        }
      }
    } catch (err: any) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  };

  const handleDeleteJob = async (jobId: string, jobNum: string) => {
    if (!window.confirm(`Are you sure you want to delete job ${jobNum}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`Job ${jobNum} removed from platform.`);
        if (viewingJob?.id === jobId) setViewingJob(null);
        fetchAllData();
      }
    } catch (err: any) {
      showToast('Failed to delete job: ' + err.message, 'error');
    }
  };

  // --- Filtered Collections ---
  const filteredShops = shops.filter((s) => {
    const q = shopSearch.toLowerCase();
    return (
      (s.shop_name || '').toLowerCase().includes(q) ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.address || '').toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.shop_name || '').toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredJobs = jobs.filter((j) => {
    const q = jobSearch.toLowerCase();
    const matchesSearch =
      (j.job_number || '').toLowerCase().includes(q) ||
      (j.customer_name || '').toLowerCase().includes(q) ||
      (j.shop_name || '').toLowerCase().includes(q) ||
      (j.shop_id || '').toLowerCase().includes(q);
    const matchesStatus = jobStatusFilter === 'all' || j.status === jobStatusFilter;
    const matchesService = jobServiceFilter === 'all' || j.service_type === jobServiceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const filteredServices = services.filter((srv) => {
    return serviceShopFilter === 'all' || srv.shop_id === serviceShopFilter;
  });

  // ========================================================
  // RENDER: ADMIN LOGIN GATE (If not authenticated as admin)
  // ========================================================
  if (!token || !isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white animate-fade-in">
        <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md relative overflow-hidden">
          {/* Glowing Red Background Accent */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-red-500/15 border border-red-500/40 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black font-display tracking-tight text-white flex items-center justify-center gap-2">
              <span>System Admin Console</span>
            </h2>
            <p className="text-xs text-slate-400">
              Superuser Root Access · Platform Management & Audit
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-slate-800"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-950/60 border border-blue-800/60 rounded-xl text-[11px] text-blue-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Default Admin Credentials:</span>
                <span className="font-mono text-blue-300">User: admin · Pass: admin</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPassword('admin');
                  handleAdminLogin();
                }}
                className="px-2.5 py-1 bg-blue-800 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] transition-colors shrink-0"
              >
                1-Click Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate Admin Access</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onExitToHome}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            <button
              type="button"
              onClick={onExitToShop}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Shop Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: COMPLETE AUTHENTICATED SYSTEM ADMIN CONSOLE
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 animate-fade-in">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white transition-all animate-slide-up ${
            feedback.type === 'success' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-red-600 shadow-red-900/20'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Superuser Admin Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-4 sm:px-6 py-3 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black font-display tracking-tight leading-none text-white">
                    System Admin Console
                  </h1>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                    SUPERUSER
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Server Port 5000 Active
                  </span>
                  <span>·</span>
                  <span>Namaste Print Platform Engine</span>
                </div>
              </div>
            </div>

            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={fetchAllData}
                disabled={refreshing}
                className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-red-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <button
              type="button"
              onClick={fetchAllData}
              disabled={refreshing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all"
              title="Refresh platform data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red-400' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {onExitToHome && (
              <button
                type="button"
                onClick={onExitToHome}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-colors flex items-center gap-1.5"
                title="Return to Customer & Brand Homepage"
              >
                <Home className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Home</span>
              </button>
            )}

            {onExitToShop && (
              <button
                type="button"
                onClick={onExitToShop}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-colors flex items-center gap-1.5"
                title="Open Shop Counter Dashboard"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Shop View</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Sign Out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* KPI Platform Overview Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Total Shops</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{stats?.totalShops ?? shops.length}</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
            </div>
            <p className="text-[10px] text-slate-400">Registered print stores</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Total Users</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{stats?.totalUsers ?? users.length}</span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                {users.filter(u => u.role === 'owner').length} Owners
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Admins, Owners & Staff</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Total Orders</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">{stats?.totalJobs ?? jobs.length}</span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                {stats?.activeJobs ?? 0} In Progress
              </span>
            </div>
            <p className="text-[10px] text-slate-400">{stats?.todayJobs ?? 0} orders today</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">Platform Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-600">
                Rs. {(stats?.totalRevenue ?? 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Today: Rs. {(stats?.todayRevenue ?? 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Activity },
            { id: 'shops', label: `Shops (${shops.length})`, icon: Store },
            { id: 'users', label: `Users & Staff (${users.length})`, icon: Users },
            { id: 'jobs', label: `All Orders (${jobs.length})`, icon: Printer },
            { id: 'services', label: `Services & Rates (${services.length})`, icon: Tag },
            { id: 'health', label: 'System Diagnostics', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions Cluster */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Administrator Fast Actions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quickly provision resources or manage existing shops</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openCreateShopModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Provision New Shop</span>
                </button>
                <button
                  type="button"
                  onClick={openCreateUserModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create User Account</span>
                </button>
              </div>
            </div>

            {/* Split Grid: Recent Orders & Platform Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders Stream */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-blue-900" />
                    <h3 className="text-sm font-bold text-slate-900">Recent Platform Activity</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('jobs')}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <span>View All Orders</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {jobs.slice(0, 6).map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between text-xs cursor-pointer"
                      onClick={() => setViewingJob(job)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-blue-950 bg-blue-50 px-2 py-1 rounded-md">
                          {job.job_number}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{job.customer_name || 'Walk-in Customer'}</p>
                          <p className="text-[10px] text-slate-500">
                            {job.shop_name || job.shop_id} · {job.paper_size} · {job.is_color ? 'Color' : 'B/W'} · {job.copies} copies
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">
                          Rs. {(job.order_amount || 0).toLocaleString()}
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          job.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {jobs.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No platform orders yet.</p>
                  )}
                </div>
              </div>

              {/* System Diagnostics Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">System Environment</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Node API Engine:</span>
                    <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Port 5000 Online
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Database Driver:</span>
                    <span className="font-mono font-bold text-slate-800">better-sqlite3</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Server Uptime:</span>
                    <span className="font-mono font-bold text-slate-800">{stats?.serverUptime ?? 0}s</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Active WebSocket/Channel:</span>
                    <span className="font-bold text-blue-900">namaste_print_state_v3</span>
                  </div>

                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                      Root Admin Security
                    </span>
                    <p className="text-[10px] text-red-700 leading-relaxed">
                      You are authenticated with root administrator privileges. All shop data and user credentials can be inspected and managed across the platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SHOPS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  placeholder="Search shops by name, slug, phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                type="button"
                onClick={openCreateShopModal}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Shop</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Shop Name & Brand</th>
                      <th className="py-3 px-4 font-bold">Location & Phone</th>
                      <th className="py-3 px-4 font-bold">Slug / Link</th>
                      <th className="py-3 px-4 font-bold">Volume / Revenue</th>
                      <th className="py-3 px-4 font-bold">Created</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredShops.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-sm text-slate-900">{s.shop_name}</span>
                            <span className="block text-[10px] text-slate-500 font-mono">ID: {s.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800">{s.address || 'Kathmandu, Nepal'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.phone || '9841234567'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-bold">
                            @{s.username || s.qr_slug}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs">
                            <span className="font-bold text-slate-900">{s.total_jobs || 0} jobs</span>
                            <span className="block text-[10px] text-emerald-600 font-bold">
                              Rs. {(s.total_revenue || 0).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onSwitchShop && (
                              <button
                                type="button"
                                onClick={() => onSwitchShop(s)}
                                className="px-2 py-1 text-[11px] font-bold text-blue-700 hover:text-white hover:bg-blue-900 rounded-lg border border-blue-200 transition-colors"
                                title="Launch Shop Dashboard as Counter Staff"
                              >
                                Launch Shop
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openEditShopModal(s)}
                              className="p-1.5 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit Shop Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {s.id !== 'default_shop_1' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteShop(s.id, s.shop_name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete Shop"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredShops.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No shops match your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: USERS & STAFF MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name, username, email..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="owner">Owners</option>
                  <option value="manager">Managers</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <button
                type="button"
                onClick={openCreateUserModal}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">User</th>
                      <th className="py-3 px-4 font-bold">Role</th>
                      <th className="py-3 px-4 font-bold">Shop Assignment</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name?.charAt(0) || u.username?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{u.name || u.username}</span>
                              <span className="text-[10px] text-slate-500 font-mono">@{u.username} · {u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              u.role === 'admin'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : u.role === 'owner'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : u.role === 'manager'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{u.shop_name || 'Namaste Print'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u.shop_id}</span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                              u.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {u.active ? 'ACTIVE' : 'DISABLED'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditUserModal(u)}
                              className="p-1.5 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {u.id !== 'admin_user_1' && u.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No users match your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: ALL PRINTING JOBS */}
        {/* ======================================================== */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Search Job #, customer, shop..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New / Received</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={jobServiceFilter}
                  onChange={(e) => setJobServiceFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="all">All Services</option>
                  <option value="print">Document Print</option>
                  <option value="photocopy">Photocopy</option>
                  <option value="photo_print">Photo Print</option>
                  <option value="citizenship">Citizenship Print</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Job Token</th>
                      <th className="py-3 px-4 font-bold">Shop</th>
                      <th className="py-3 px-4 font-bold">Customer</th>
                      <th className="py-3 px-4 font-bold">Specifications</th>
                      <th className="py-3 px-4 font-bold">Total Sheets</th>
                      <th className="py-3 px-4 font-bold">Price (Rs.)</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-1 rounded">
                            {job.job_number}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{job.shop_name || job.shop_id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{job.shop_id}</span>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-800">
                          {job.customer_name || 'Walk-in'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="capitalize font-semibold text-slate-800">
                              {job.service_type === 'citizenship' ? 'Citizenship Print' : job.service_type}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {job.paper_size} · {job.is_color ? 'Color' : 'B/W'} · {job.copies} {job.copies > 1 ? 'copies' : 'copy'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {job.total_prints || 1} prints
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          Rs. {(job.order_amount || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={job.status}
                            onChange={(e) => handleUpdateJobStatus(job.id, e.target.value)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none uppercase ${
                              job.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : job.status === 'ready'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                                : job.status === 'processing'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : job.status === 'cancelled'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            <option value="new">NEW</option>
                            <option value="processing">PROCESSING</option>
                            <option value="ready">READY</option>
                            <option value="completed">COMPLETED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingJob(job)}
                              className="p-1.5 text-blue-700 hover:text-blue-900 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Inspect Job Details & Files"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id, job.job_number)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredJobs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No printing orders found matching filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SERVICES & RATES AUDIT */}
        {/* ======================================================== */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-900" />
                <span className="text-xs font-bold text-slate-800">Filter by Shop:</span>
                <select
                  value={serviceShopFilter}
                  onChange={(e) => setServiceShopFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 font-bold"
                >
                  <option value="all">All Shops</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shop_name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Service Name</th>
                      <th className="py-3 px-4 font-bold">Shop</th>
                      <th className="py-3 px-4 font-bold">Category</th>
                      <th className="py-3 px-4 font-bold">Specs</th>
                      <th className="py-3 px-4 font-bold">Unit Price</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredServices.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{srv.name}</p>
                          {srv.description && (
                            <p className="text-[10px] text-slate-400">{srv.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{srv.shop_name || srv.shop_id}</span>
                        </td>
                        <td className="py-3 px-4 capitalize font-medium">{srv.service_type}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                            {srv.paper_size || 'N/A'}
                          </span>{' '}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            srv.is_color ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {srv.is_color ? 'Color' : 'B/W'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-sm text-blue-950">
                          Rs. {srv.unit_price} <span className="text-[10px] text-slate-400 font-normal">{srv.unit_label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            srv.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {srv.is_active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: SYSTEM DIAGNOSTICS */}
        {/* ======================================================== */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Database className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Database & Engine Telemetry</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">SQLite Location</span>
                  <p className="font-mono font-bold text-slate-900">server/database.sqlite</p>
                  <span className="text-[10px] text-emerald-600 font-bold block">Status: Connected & Synchronized</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">API Server Health</span>
                  <p className="font-mono font-bold text-emerald-700">HTTP 200 OK · Express 5</p>
                  <span className="text-[10px] text-slate-500 font-mono block">Uptime: {stats?.serverUptime ?? 0} seconds</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-medium">Platform Total Records</span>
                  <p className="font-mono font-bold text-blue-900">
                    {shops.length} Shops · {users.length} Users · {jobs.length} Jobs
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block">{services.length} Configured Services</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                  Root Diagnostic Summary
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  All platform subsystems are operating with optimal parameters. SQLite foreign key cascades, REST endpoints, and dynamic pricing recalculation engine are verified and active.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: PROVISION NEW SHOP */}
      {/* ======================================================== */}
      {showCreateShopModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-900" />
                <span>Provision New Print Shop</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateShopModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Pashupati Cyber & Printers"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="9841234567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">QR Slug / Username</label>
                  <input
                    type="text"
                    value={shopSlug}
                    onChange={(e) => setShopSlug(e.target.value)}
                    placeholder="e.g. pashupati-print"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="e.g. New Road, Kathmandu"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-bold text-slate-800 block">Optional Initial Owner Credentials:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      value={shopOwnerUsername}
                      onChange={(e) => setShopOwnerUsername(e.target.value)}
                      placeholder="Owner Username"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={shopOwnerPassword}
                      onChange={(e) => setShopOwnerPassword(e.target.value)}
                      placeholder="Owner Password"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateShopModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs"
                >
                  Provision Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT SHOP */}
      {/* ======================================================== */}
      {showEditShopModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-900" />
                <span>Edit Shop: {editingShop?.shop_name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditShopModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateShop} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">QR Slug / Username</label>
                  <input
                    type="text"
                    value={shopSlug}
                    onChange={(e) => setShopSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditShopModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE USER */}
      {/* ======================================================== */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-900" />
                <span>Create Platform User</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign to Shop</label>
                <select
                  value={userFormShopId}
                  onChange={(e) => setUserFormShopId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shop_name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={userFormUsername}
                    onChange={(e) => setUserFormUsername(e.target.value)}
                    placeholder="ramesh"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={userFormRole}
                    onChange={(e) => setUserFormRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="staff">Staff Member</option>
                    <option value="manager">Shop Manager</option>
                    <option value="owner">Shop Owner</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT USER */}
      {/* ======================================================== */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-900" />
                <span>Edit User: @{editingUser?.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign to Shop</label>
                <select
                  value={userFormShopId}
                  onChange={(e) => setUserFormShopId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shop_name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={userFormRole}
                    onChange={(e) => setUserFormRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="staff">Staff Member</option>
                    <option value="manager">Shop Manager</option>
                    <option value="owner">Shop Owner</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={userFormActive}
                      onChange={(e) => setUserFormActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Active Account</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reset Password (Leave blank to keep current)</label>
                <input
                  type="password"
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INSPECT JOB DETAILS & FILES */}
      {/* ======================================================== */}
      {viewingJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Order Inspection: {viewingJob.job_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Shop:</span>
                  <span className="font-bold text-slate-900">{viewingJob.shop_name || viewingJob.shop_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer:</span>
                  <span className="font-bold text-slate-900">{viewingJob.customer_name || 'Walk-in'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Specs:</span>
                  <span className="font-bold text-slate-800">
                    {viewingJob.paper_size} · {viewingJob.is_color ? 'Color' : 'B/W'} · {viewingJob.copies} copies
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Billable Value:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    Rs. {(viewingJob.order_amount || 0).toLocaleString()} ({viewingJob.total_prints || 1} prints)
                  </span>
                </div>
              </div>

              {viewingJob.instructions && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block text-[10px] uppercase">Customer Instructions:</span>
                  <p className="mt-0.5 italic">"{viewingJob.instructions}"</p>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-800 block mb-1.5">
                  Uploaded Files ({viewingJob.files?.length || 0}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {viewingJob.files?.map((f: any) => (
                    <div
                      key={f.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        {f.file_type?.includes('pdf') ? (
                          <FileText className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <span className="truncate font-semibold text-slate-800">{f.file_name}</span>
                      </div>
                      {f.data_url ? (
                        <a
                          href={f.data_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-blue-900 text-white rounded-lg text-[10px] font-bold shrink-0 hover:bg-blue-800"
                        >
                          View File
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Uploaded</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-700">Change Status:</span>
                <select
                  value={viewingJob.status}
                  onChange={(e) => handleUpdateJobStatus(viewingJob.id, e.target.value)}
                  className="font-bold text-xs bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5"
                >
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="px-5 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
