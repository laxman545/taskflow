import React, { useState, useEffect } from 'react';
import {
  Shop,
  Language,
  Job,
  JobStatus,
  StaffMember,
  ShopNotification,
  CalendarMode,
  ShopTab
} from '../../types';
import { translations } from '../../utils/translations';
import { getShop, updateShop, getStaffMembers, getJobs, getJobsForUser, getNotifications, getRevenueVisibility, getCalendarMode, isRevenueVisible, setCalendarMode, setRevenueVisibility, updateJobStatus, setJobs, addJob, getStaffPerformanceStats, subscribeToStateChanges } from '../../utils/storage';
import {
  computePeriodStats,
  getTodayStats,
  getMonthStats,
  getYearStats,
  getDailySeries
} from '../../utils/analytics';
import {
  formatDateWithCalendar,
  formatDateTimeWithCalendar,
  getDateRangeFromPreset,
  adToBs
} from '../../utils/nepaliCalendar';
import { JobDetailModal } from './JobDetailModal';
import { SendToCustomerModal } from './SendToCustomerModal';
import { QrPosterModal } from './QrPosterModal';
import { ShopSettings } from './ShopSettings';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { OrderHistoryView } from './OrderHistoryView';
import { StaffManagement } from './StaffManagement';
import { ServicesPricingView } from './ServicesPricingView';
import { ActivityLogView } from './ActivityLogView';
import { NotificationCenter } from './NotificationCenter';
import { CalendarToggle } from './CalendarToggle';
import {
  Store,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
  Bell,
  Monitor,
  Users,
  Activity,
  History,
  SlidersHorizontal,
  BarChart3,
  Tag,
  Send,
  QrCode,
  Sparkles,
  Volume2,
  VolumeX,
  Search,
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  DollarSign,
  UserCheck,
  User
} from 'lucide-react';

interface OwnerDashboardProps {
  shop: Shop;
  ownerUser: StaffMember;
  lang: Language;
  onShopUpdated: (updatedShop: Shop) => void;
  onOpenAuthModal: () => void;
  onViewCustomerFlow?: () => void;
  initialTab?: ShopTab;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  shop,
  ownerUser,
  lang,
  onShopUpdated,
  onOpenAuthModal,
  onViewCustomerFlow,
  initialTab,
}) => {
  const t = translations[lang];
  const staffList = getStaffMembers(shop.id);


  const [isRevenueVisible, setIsRevenueVisibleState] = useState<boolean>(() => false);
  const [calendarMode, setCalendarModeState] = useState<CalendarMode>(() => getCalendarMode());
  const [activeTab, setActiveTab] = useState<ShopTab>(initialTab || 'overview');
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/jobs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error('Error fetching jobs', err);
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    const unsub = subscribeToStateChanges(() => {
      fetchJobs();
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Date range filter state (Requirements 17 & 18)
  const [datePreset, setDatePreset] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [notifications, setNotifications] = useState<ShopNotification[]>(() =>
    getNotifications(shop.id, ownerUser.id)
  );

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // Audio fallback
    }
  };

  useEffect(() => {
    const unsub = subscribeToStateChanges((msg: any) => {
      setJobs(getJobs());
      setNotifications([]);
      if (msg.action === 'NEW_JOB_RECEIVED' || msg.action === 'NOTIFICATION_RECEIVED') {
        playChime();
      }
    });
    return unsub;
  }, [soundEnabled, ownerUser.id, shop.id]);

  const handleToggleRevenue = () => {
    const next = !isRevenueVisible;
    setIsRevenueVisibleState(next);
    setRevenueVisibility(false);
  };

  const handlePcChange = (newPc: string) => {
    // setCurrentPcState(newPc);
    
  };

  const handleModeChange = (mode: CalendarMode) => {
    setCalendarModeState(mode);
    setCalendarMode(false);
  };

  const handleUpdateStatus = async (jobId: string, newStatus: JobStatus) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
        if (selectedJob?.id === jobId) {
          setSelectedJob({ ...selectedJob, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateNewOrder = () => {
    const sampleNames = ['Rohan Gurung', 'Pooja Shrestha', 'Bikash Adhikari', 'Sarita Rai', 'Niraj Maharjan', 'Dipendra Khatri'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const services: ('print' | 'photocopy' | 'photo_print')[] = ['print', 'photocopy', 'photo_print'];
    const randomService = services[Math.floor(Math.random() * services.length)];
    const isA3 = Math.random() > 0.65;
    const copies = Math.floor(1 + Math.random() * 4);
    const pages = Math.floor(1 + Math.random() * 5);

    addJob({
      shop_id: shop.id,
      customer_name: randomName,
      service_type: randomService,
      copies,
      is_color: Math.random() > 0.4,
      paper_size: isA3 ? 'A3' : 'A4',
      is_double_sided: Math.random() > 0.5,
      page_count: pages,
      instructions: 'Urgent customer request, waiting at front counter.',
      files: [
        {
          id: `sim_file_${Date.now()}`,
          job_id: '',
          file_name: `Customer_Upload_${Math.floor(100 + Math.random() * 900)}.pdf`,
          file_path: '/uploads/sim_doc.pdf',
          file_size: 1550000,
          file_type: 'application/pdf',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    });

    playChime();
    setJobs(getJobs());
  };

  // Filter jobs by selected date range
  const dateRangeInfo = getDateRangeFromPreset(datePreset);
  const filteredJobsByDate = jobs.filter((j) => {
    const d = new Date(j.created_at);
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return d >= dateRangeInfo.start && d <= dateRangeInfo.end;
  });

  const periodStats = computePeriodStats(filteredJobsByDate);
  const staffStats = getStaffPerformanceStats();

  const formatRev = (amount: number) => {
    return isRevenueVisible ? `Rs. ${amount.toLocaleString()}` : 'Rs. ••••••';
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read_status).length;
  const unassignedJobsCount = jobs.filter(
    (j) => j.status === 'unassigned' || (j.status === 'new' && !j.assigned_to)
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Station & Profile Control Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl"
        style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-navy)', color: '#fff' }}
          >
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-display">
                {shop.shop_name}
              </h1>
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                style={{ backgroundColor: 'var(--color-navy-light)', color: 'var(--color-navy)' }}
              >
                Owner Dashboard
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              {shop.owner_name || ownerUser.name} · {shop.address} · {shop.phone}
            </p>
          </div>
        </div>

        {/* Action & Station Tools */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Calendar Format Switcher (A.D. / B.S. / Both) */}
          <CalendarToggle
            currentMode={calendarMode}
            onModeChange={handleModeChange}
            lang={lang}
            showTodayBadge={true}
          />

          {/* PC Terminal Selector (Requirement 23) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <Monitor className="w-3.5 h-3.5 text-blue-700 ml-1.5" />
            <select
              value={""}
              onChange={(e) => handlePcChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 pr-2 py-1 focus:outline-none cursor-pointer"
              title="Current Active Station PC"
            >
              {[].map((pc) => (
                <option key={pc} value={pc}>
                  {pc}
                </option>
              ))}
            </select>
          </div>

          {/* Revenue Hide / Show Toggle (Requirement 2) */}
          <button
            type="button"
            onClick={handleToggleRevenue}
            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isRevenueVisible
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle Revenue Visibility"
          >
            {isRevenueVisible ? <Eye className="w-3.5 h-3.5 text-emerald-700" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{isRevenueVisible ? 'Hide Revenue' : 'Show Revenue'}</span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 relative transition-colors"
              title="Shop Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationCenter
                notifications={notifications}
                currentUser={ownerUser}
                shop={shop}
                onOpenOrder={(num) => {
                  const targetJob = jobs.find((j) => j.job_number === num);
                  if (targetJob) setSelectedJob(targetJob);
                }}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* Switch User Modal */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            title="Switch User / Station Profile"
          >
            <User className="w-3.5 h-3.5" />
            <span>Switch User</span>
          </button>

          {/* Quick Mock Order Simulator */}
          <button
            type="button"
            onClick={handleSimulateNewOrder}
            className="px-3 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            title="Simulate customer order"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Simulate Order</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar for Business Overview (Requirements 17 & 18) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-900" />
          <span className="font-bold text-slate-800">Date Range Filter:</span>
          <span className="text-slate-500 font-mono text-[11px]">
            [{formatDateWithCalendar(dateRangeInfo.start, calendarMode, lang)} to {formatDateWithCalendar(dateRangeInfo.end, calendarMode, lang)}]
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_year', label: 'This Year' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setDatePreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                datePreset === preset.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {datePreset === 'custom' && (
          <div className="w-full flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-slate-400 font-medium">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-medium"
            />
            <span className="text-slate-400 font-medium">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-medium"
            />
          </div>
        )}
      </div>

      {/* Main KPI Summary Dashboard */}
      <div
        className="text-white p-5 sm:p-6 rounded-2xl space-y-4"
        style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, #1e3a8a 60%, #1e2d6b 100%)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-200">
              Business Performance Overview ({dateRangeInfo.label})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Active Station: <b className="text-blue-200">{""}</b>
          </span>
        </div>

        {/* Primary Line: Orders | Prints | Revenue */}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {periodStats.ordersCount}
            </span>
            <span className="text-xs uppercase font-bold text-slate-400">Total Orders</span>
          </div>

          <span className="text-slate-600 text-xl font-light hidden sm:inline">|</span>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-blue-300">
              {periodStats.totalPrints}
            </span>
            <span className="text-xs uppercase font-bold text-slate-400">Total Prints</span>
          </div>

          <span className="text-slate-600 text-xl font-light hidden sm:inline">|</span>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
              {formatRev(periodStats.revenue)}
            </span>
            <span className="text-xs uppercase font-bold text-slate-400">Total Income</span>
          </div>
        </div>

        {/* Paper & Status Breakdown */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl">
            <span className="text-slate-400 font-medium">Paper Breakdown:</span>
            <span className="font-mono">
              A4: <b className="text-white">{periodStats.a4Prints}</b>
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono">
              A3: <b className="text-white">{periodStats.a3Prints}</b>
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono">
              Photo: <b className="text-white">{periodStats.photoPrints}</b>
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl">
            <span className="text-slate-400 font-medium">Status Breakdown:</span>
            <span className="font-mono">
              Completed: <b className="text-emerald-400">{periodStats.completedOrders}</b>
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono">
              Pending/In-Process: <b className="text-amber-400">{periodStats.pendingOrders}</b>
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono">
              Cancelled: <b className="text-red-400">{periodStats.cancelledOrders}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Owner Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeTab === 'overview' ? 'text-white' : 'text-blue-600'}`} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live_jobs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'live_jobs'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Printer className={`w-4 h-4 ${activeTab === 'live_jobs' ? 'text-white' : 'text-blue-600'}`} />
          <span>Orders Queue ({jobs.filter((j) => j.status !== 'completed' && j.status !== 'cancelled').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('services_prices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'services_prices'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Tag className={`w-4 h-4 ${activeTab === 'services_prices' ? 'text-white' : 'text-blue-600'}`} />
          <span>Services & Prices</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'staff' ? 'text-white' : 'text-indigo-600'}`} />
          <span>Staff & PCs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-white' : 'text-blue-600'}`} />
          <span>Full Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Order History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'activity' ? 'text-white' : 'text-emerald-600'}`} />
          <span>Activity Log</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('send_file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'send_file'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Send className={`w-4 h-4 ${activeTab === 'send_file' ? 'text-white' : 'text-red-500'}`} />
          <span>Send Files</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qr_poster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'qr_poster'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'qr_poster' ? 'text-white' : 'text-blue-600'}`} />
          <span>Shop QR Poster</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Shop Profile</span>
        </button>
      </div>

      {/* TAB 1: BUSINESS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Staff Workload & Performance Summary (Requirement 21) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-900" />
                  <span>Team Workload & Counter Productivity</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track orders completed, prints processed, and revenue generated per staff member
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
              >
                <span>Manage Team</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {staffStats.map((st) => (
                <div key={st.staff_id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{st.staff_name}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-slate-200 text-slate-700">
                      {st.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    🖥️ Floating
                  </span>

                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Orders</span>
                      <span className="font-mono font-bold text-slate-900">{st.completed_orders}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Sheets</span>
                      <span className="font-mono font-bold text-blue-900">{st.total_prints}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Revenue</span>
                      <span className="font-mono font-bold text-emerald-700">{formatRev(st.total_revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access to Services & Queue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-800" />
                  <span>Configured Printing Rates</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('services_prices')}
                  className="text-xs font-bold text-blue-900 hover:underline"
                >
                  Manage Rates →
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Owners can adjust A4, A3, and Photo rates at any time. Prices are automatically synced across all counter PCs
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-bold">
                  A4 B/W: Rs. 5/p
                </span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-900 rounded-lg font-bold">
                  A4 Color: Rs. 15/p
                </span>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-900 rounded-lg font-bold">
                  A3 Color: Rs. 40/p
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-lg font-bold">
                  Photo: Rs. 25/p
                </span>
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-700" />
                  <span>Unassigned Jobs Queue</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('live_jobs')}
                  className="text-xs font-bold text-blue-900 hover:underline"
                >
                  View All Orders →
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {unassignedJobsCount} incoming customer jobs are currently waiting in the pool to be claimed by staff
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-bold text-xs">
                  {unassignedJobsCount} Unassigned Orders
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs">
                  {jobs.filter((j) => j.status === 'in_progress').length} In Progress
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS QUEUE */}
      {activeTab === 'live_jobs' && (
        <div className="space-y-4">
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by job #, customer, staff, or terminal..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Job #</th>
                    <th className="py-3 px-4 font-bold">Customer</th>
                    <th className="py-3 px-4 font-bold">Assigned Staff</th>
                    <th className="py-3 px-4 font-bold">Terminal</th>
                    <th className="py-3 px-4 font-bold">Service & Specs</th>
                    <th className="py-3 px-4 font-bold">Prints</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {jobs
                    .filter((j) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        j.job_number.toLowerCase().includes(q) ||
                        (j.customer_name && j.customer_name.toLowerCase().includes(q)) ||
                        (j.assigned_to_name && j.assigned_to_name.toLowerCase().includes(q))
                      );
                    })
                    .map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono font-black text-blue-950">
                          #{job.job_number}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {job.customer_name || 'Walk-in'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {job.assigned_to_name || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {job.status|| job.status|| ""}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize font-medium">
                            {job.service_type.replace('_', ' ')} · {job.paper_size} · {job.is_color ? 'Color' : 'B/W'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {job.total_prints} sheets
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                          {formatRev(job.order_amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {job.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                              }}
                              className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                              title="Direct print workflow"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">PRINT NOW</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                            >
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICE MANAGEMENT (Requirement 14 & 15) */}
      {activeTab === 'services_prices' && (
        <ServicesPricingView shop={shop} lang={lang} currentUser={ownerUser} />
      )}

      {/* TAB 4: STAFF & PCS MANAGEMENT (Requirement 3, 4, 5, 6) */}
      {activeTab === 'staff' && (
        <StaffManagement
          shop={shop}
          
          currentUser={ownerUser}
          lang={lang}
          onShopUpdated={onShopUpdated}
        />
      )}

      {/* TAB 5: ADVANCED ANALYTICS (Requirement 16) */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard
          jobs={jobs}
          shop={shop}
          lang={lang}
          currentUser={ownerUser}
          isRevenueVisible={isRevenueVisible}
          calendarMode={calendarMode}
        />
      )}

      {/* TAB 6: ORDER HISTORY WITH FINANCIAL REVENUE (Requirement 19) */}
      {activeTab === 'history' && (
        <OrderHistoryView
          jobs={jobs}
          lang={lang}
          currentUser={ownerUser}
          isRevenueVisible={isRevenueVisible}
          onSelectJob={(job) => setSelectedJob(job)}
        />
      )}

      {/* TAB 7: ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <ActivityLogView shop={shop} lang={lang} />
      )}

      {/* TAB 8: SEND FILES */}
      {activeTab === 'send_file' && (
        <SendToCustomerModal shop={shop} lang={lang} />
      )}

      {/* TAB 9: QR POSTER (Requirements 40-47: Complete 9:16 Design with Center Logo) */}
      {activeTab === 'qr_poster' && (
        <QrPosterModal
          shop={shop}
          lang={lang}
          currentUser={ownerUser}
          onShopUpdated={onShopUpdated}
        />
      )}

      {/* TAB 10: SHOP PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <ShopSettings shop={shop} lang={lang} onShopUpdated={onShopUpdated} />
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          shop={shop}
          currentUser={ownerUser}

          lang={lang}
          onClose={() => setSelectedJob(null)}
          onUpdateStatus={handleUpdateStatus}
          onJobUpdated={(updated) => {
            setJobs(getJobs());
            setSelectedJob(updated);
          }}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
