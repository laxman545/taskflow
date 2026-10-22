import React, { useState, useEffect } from 'react';
import {
  Shop,
  Language,
  Job,
  JobStatus,
  StaffMember,
  ShopNotification,
  CalendarMode
} from '../../types';
import { translations } from '../../utils/translations';
import { getShop, getJobs, getStaffMembers, getJobsForUser, getCalendarMode, setCalendarMode, getNotifications, subscribeToStateChanges, claimJob, referJob, updateJobStatus } from '../../utils/storage';
import { formatDateWithCalendar, formatDateTimeWithCalendar } from '../../utils/nepaliCalendar';
import { JobDetailModal } from './JobDetailModal';
import { SendToCustomerModal } from './SendToCustomerModal';
import { QrPosterModal } from './QrPosterModal';
import { NotificationCenter } from './NotificationCenter';
import { CalendarToggle } from './CalendarToggle';
import {
  Inbox,
  Printer,
  CheckCircle2,
  Clock,
  Send,
  QrCode,
  History,
  Users,
  Bell,
  Monitor,
  User,
  Zap,
  ChevronRight,
  Search,
  AlertCircle,
  FileText,
  Volume2,
  VolumeX,
  Share2,
  BarChart3
} from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface StaffDashboardProps {
  shop: Shop;
  staffUser: StaffMember;
  lang: Language;
  onOpenAuthModal: () => void;
  onViewCustomerFlow?: () => void;
}

export type StaffTab =
  | 'available_jobs'
  | 'my_jobs'
  | 'live_queue'
  | 'who_is_working'
  | 'operational_history'
  | 'send_file'
  | 'shop_qr'
  | 'analytics';

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  shop,
  staffUser,
  lang,
  onOpenAuthModal,
  onViewCustomerFlow,
}) => {
  const t = translations[lang];
  const staffList = getStaffMembers(shop.id);


  const [activeTab, setActiveTab] = useState<StaffTab>('available_jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [calendarMode, setCalendarModeState] = useState<CalendarMode>(() => getCalendarMode());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<ShopNotification[]>(() =>
    getNotifications(shop.id, staffUser.id)
  );

  // Quick refer modal state
  const [jobToRefer, setJobToRefer] = useState<Job | null>(null);
  const [targetStaffId, setTargetStaffId] = useState<string>('');
  const [referralNote, setReferralNote] = useState<string>('');
  const [referSuccessMsg, setReferSuccessMsg] = useState<string>('');

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
    let lastJobCount = 0;
    const fetchJobs = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setJobs(getJobs());
        return;
      }
      try {
        const res = await fetch('http://localhost:5000/api/jobs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.jobs) {
          if (lastJobCount > 0 && data.jobs.length > lastJobCount) {
            playChime();
          }
          lastJobCount = data.jobs.length;
          setJobs(data.jobs);
        }
      } catch (err) {
        setJobs(getJobs());
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
  }, [soundEnabled]);

  useEffect(() => {
    const unsub = subscribeToStateChanges((msg: any) => {
      setJobs(getJobsForUser(""));
      setNotifications([]);
      if (msg.action === 'NEW_JOB_RECEIVED' || msg.action === 'NOTIFICATION_RECEIVED' || msg.action === 'JOB_REFERRED') {
        playChime();
      }
    });
    return unsub;
  }, [soundEnabled, staffUser.id, shop.id]);

  const handlePcChange = (newPc: string) => {
    // setCurrentPcState(newPc);
    
  };

  const handleModeChange = (mode: CalendarMode) => {
    setCalendarModeState(mode);
    setCalendarMode(false);
  };

  const handleClaim = async (job: Job) => {
    const res = await claimJob(job.id, staffUser.name);
    if (res.success && res.job) {
      setSelectedJob(res.job);
    }
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const r = await fetch('http://localhost:5000/api/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await r.json();
        if (d.success) setJobs(d.jobs);
      } catch {}
    } else {
      setJobs(getJobs());
    }
  };

  const handleConfirmRefer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobToRefer || !targetStaffId) return;

    const target = staffList.find((s) => s.id === targetStaffId);
    if (!target) return;

    const res = referJob(jobToRefer.id, targetStaffId, referralNote);
    if (res.success) {
      setJobs(getJobs());
      setReferSuccessMsg(`Successfully referred Order #${jobToRefer.job_number} to ${target.name}.`);
      setTimeout(() => {
        setJobToRefer(null);
        setTargetStaffId('');
        setReferralNote('');
        setReferSuccessMsg('');
      }, 1800);
    }
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
          setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Operational Queues (Requirement 7)
  const availableJobs = jobs.filter(
    (j) => j.status === 'unassigned' || (j.status === 'new' && !j.assigned_to)
  );
  const myAssignedJobs = jobs.filter(
    (j) => j.assigned_to === staffUser.id && j.status !== 'completed' && j.status !== 'cancelled'
  );
  const liveQueueJobs = jobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'cancelled' && j.status !== 'unassigned'
  );

  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length;
  const inProcessCount = jobs.filter((j) => j.status === 'in_progress' || j.status === 'processing').length;
  const pendingCount = jobs.filter((j) => j.status === 'assigned' || j.status === 'ready').length;

  const unreadNotifsCount = notifications.filter((n) => !n.read_status).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Staff Header Bar */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl"
        style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-navy)', color: '#fff' }}
          >
            <Monitor className="w-6 h-6" />
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
                Staff Terminal
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              Logged in as <b className="text-slate-800">{staffUser.name}</b> ({staffUser.role.toUpperCase()}) · {shop.address}
            </p>
          </div>
        </div>

        {/* Action & Station Tools */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Calendar format toggle (A.D. / B.S. / Both) */}
          <CalendarToggle
            currentMode={calendarMode}
            onModeChange={handleModeChange}
            lang={lang}
            showTodayBadge={true}
          />

          {/* PC Terminal Selector (Requirement 23) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <Monitor className="w-3.5 h-3.5 text-indigo-700 ml-1.5" />
            <select
              value={""}
              onChange={(e) => handlePcChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 pr-2 py-1 focus:outline-none cursor-pointer"
              title="Change Active Computer Station"
            >
              {[].map((pc) => (
                <option key={pc} value={pc}>
                  {pc}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 relative transition-colors"
              title="Staff Notifications"
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
                currentUser={staffUser}
                shop={shop}
                onOpenOrder={(num) => {
                  const targetJob = jobs.find((j) => j.job_number === num);
                  if (targetJob) setSelectedJob(targetJob);
                }}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* Switch User / Account Button */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            title="Switch Account or Station"
          >
            <User className="w-3.5 h-3.5" />
            <span>Switch User</span>
          </button>
        </div>
      </div>

      {/* Staff Operational Queue Overview (Requirement 7: Total Queue - NO FINANCIAL DATA) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Counter Operational Queue · {formatDateWithCalendar(new Date(), calendarMode, lang)}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Active Station: <b className="text-white">{""}</b>
          </span>
        </div>

        {/* Operational Counts: Available | Assigned to Me | Total Active Queue | Completed Today */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div
            onClick={() => setActiveTab('available_jobs')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-colors"
          >
            <span className="text-[11px] text-amber-300 font-bold uppercase block">
              Available to Claim
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {availableJobs.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Unassigned jobs</span>
          </div>

          <div
            onClick={() => setActiveTab('my_jobs')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-colors"
          >
            <span className="text-[11px] text-indigo-300 font-bold uppercase block">
              My Assigned Jobs
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-200">
              {myAssignedJobs.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Assigned to you</span>
          </div>

          <div
            onClick={() => setActiveTab('live_queue')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-colors"
          >
            <span className="text-[11px] text-blue-300 font-bold uppercase block">
              Total In Process
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-300">
              {inProcessCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Printing now</span>
          </div>

          <div
            onClick={() => setActiveTab('operational_history')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-colors"
          >
            <span className="text-[11px] text-emerald-300 font-bold uppercase block">
              Completed Today
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {completedJobsCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Finished prints</span>
          </div>
        </div>
      </div>

      {/* Staff Navigation Tabs (Requirement 4 & 5) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('available_jobs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'available_jobs'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Inbox className={`w-4 h-4 ${activeTab === 'available_jobs' ? 'text-white' : 'text-amber-600'}`} />
          <span>Available Jobs ({availableJobs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_jobs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'my_jobs'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <User className={`w-4 h-4 ${activeTab === 'my_jobs' ? 'text-white' : 'text-indigo-600'}`} />
          <span>My Jobs ({myAssignedJobs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live_queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'live_queue'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Printer className={`w-4 h-4 ${activeTab === 'live_queue' ? 'text-white' : 'text-blue-600'}`} />
          <span>Shop Queue ({liveQueueJobs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('who_is_working')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'who_is_working'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'who_is_working' ? 'text-white' : 'text-indigo-600'}`} />
          <span>Who Is Working on What</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operational_history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'operational_history'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Order History</span>
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
          <span>Send Files to Customer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shop_qr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'shop_qr'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'shop_qr' ? 'text-white' : 'text-blue-600'}`} />
          <span>Shop QR Poster</span>
        </button>

        {(staffUser.role === 'manager' || staffUser.permissions?.canViewAnalytics) && (
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
            <span>Analytics</span>
          </button>
        )}
      </div>

      {/* TAB 1: AVAILABLE JOBS QUEUE (Requirement 6) */}
      {activeTab === 'available_jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <b>Available Jobs:</b> Pick and claim incoming customer jobs. Once claimed, it is locked to your account and terminal to prevent duplicate printing
              </span>
            </div>
            <span className="font-mono font-bold text-amber-900">{availableJobs.length} Available</span>
          </div>

          {availableJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">All Jobs Claimed!</p>
              <p>No unassigned orders in the pool right now. New customer scans will appear automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-indigo-950">
                        #{job.job_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900">
                        AVAILABLE
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {job.customer_name || 'Walk-in Customer'}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize">
                        {job.service_type.replace('_', ' ')} · {job.paper_size} · {job.is_color ? 'Color' : 'B/W'} {job.is_double_sided ? '· 2-Sided' : ''}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                      <span className="text-slate-500">Volume:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {job.total_prints} sheets ({job.copies}x, {job.page_count}p)
                      </span>
                    </div>

                    {job.instructions && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg italic">
                        "{job.instructions}"
                      </p>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono">
                      Received: {formatDateTimeWithCalendar(job.created_at, calendarMode, lang)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleClaim(job)}
                      className="flex-1 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Claim Job ({""})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ASSIGNED JOBS */}
      {activeTab === 'my_jobs' && (
        <div className="space-y-4">
          {myAssignedJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs space-y-2">
              <Printer className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No active jobs assigned to you.</p>
              <button
                type="button"
                onClick={() => setActiveTab('available_jobs')}
                className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 rounded-xl font-bold text-xs"
              >
                Go to Available Jobs Pool
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAssignedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-indigo-950">
                        #{job.job_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        job.status === 'in_progress' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {job.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {job.customer_name || 'Walk-in Customer'}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize">
                        {job.service_type.replace('_', ' ')} · {job.paper_size} · {job.is_color ? 'Color' : 'B/W'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-indigo-50/60 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-indigo-900 font-medium">Sheets to print:</span>
                      <span className="font-mono font-bold text-indigo-950">
                        {job.total_prints} sheets ({job.copies}x)
                      </span>
                    </div>

                    {job.files.length > 0 && (
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{job.files[0].file_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="flex-1 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PRINT NOW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(job.id, 'completed')}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Completed</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobToRefer(job)}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      title="Refer or hand off to another staff"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Refer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE QUEUE (Requirement 7) */}
      {activeTab === 'live_queue' && (
        <div className="space-y-4">
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
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {liveQueueJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        job.assigned_to === staffUser.id ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-950">
                        #{job.job_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {job.customer_name || 'Walk-in'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {job.assigned_to_name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {job.status|| ""}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium">
                          {job.service_type.replace('_', ' ')} · {job.paper_size} · {job.is_color ? 'Color' : 'B/W'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {job.total_prints} sheets
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHO IS WORKING ON WHAT (Requirement 8) */}
      {activeTab === 'who_is_working' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-900" />
              <span>Current Live Staff & PC Workload</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status across all terminals in the shop to avoid duplicate work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {staffList.map((member) => {
              const activeMemberJobs = jobs.filter(
                (j) => j.assigned_to === member.id && j.status !== 'completed' && j.status !== 'cancelled'
              );
              const currentActiveJob = activeMemberJobs[0];

              return (
                <div
                  key={member.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    member.id === staffUser.id
                      ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white font-bold text-xs flex items-center justify-center">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{member.name}</h4>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          Floating
                        </span>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`} />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Currently Processing:
                    </span>
                    {currentActiveJob ? (
                      <div className="space-y-1">
                        <span className="font-bold font-mono text-indigo-950 block">
                          Order #{currentActiveJob.job_number}
                        </span>
                        <p className="text-slate-600 text-[11px] truncate">
                          {currentActiveJob.customer_name || 'Walk-in'} · {currentActiveJob.service_type}
                        </p>
                        <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900">
                          {currentActiveJob.status.toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Ready / Idle</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: OPERATIONAL ORDER HISTORY (Requirement 19 - NO FINANCIAL DATA) */}
      {activeTab === 'operational_history' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-900" />
                <span>Operational Order History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Technical printing log (Job #, Customer, Specs, Sheets, Station, Delivery status).
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job # or customer..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none"
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
                    <th className="py-3 px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-4 font-bold">Customer</th>
                    <th className="py-3 px-4 font-bold">Service & Specs</th>
                    <th className="py-3 px-4 font-bold">Print Volume</th>
                    <th className="py-3 px-4 font-bold">Handled By</th>
                    <th className="py-3 px-4 font-bold">Terminal</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {jobs
                    .filter((j) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return j.job_number.toLowerCase().includes(q) || (j.customer_name && j.customer_name.toLowerCase().includes(q));
                    })
                    .map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-950">
                          #{job.job_number}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatDateTimeWithCalendar(job.created_at, calendarMode, lang)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {job.customer_name || 'Walk-in'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize font-medium">
                            {job.service_type.replace('_', ' ')} · {job.paper_size} · {job.is_color ? 'Color' : 'B/W'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {job.total_prints} sheets
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {job.completed_by_name || job.assigned_to_name || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {job.status|| ""}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {job.status.toUpperCase()}
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

      {/* TAB 6: SEND TO CUSTOMER */}
      {activeTab === 'send_file' && (
        <SendToCustomerModal shop={shop} lang={lang} />
      )}

      {/* TAB 7: SHOP QR & POSTER (Requirements 40-47: 9:16 Design with Center Logo) */}
      {activeTab === 'shop_qr' && (
        <QrPosterModal shop={shop} lang={lang} currentUser={staffUser} />
      )}

      {/* TAB 8: ADVANCED ANALYTICS */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard
          jobs={jobs}
          shop={shop}
          lang={lang}
          currentUser={staffUser}
          isRevenueVisible={staffUser.permissions?.canViewRevenue ?? false}
          calendarMode={calendarMode}
        />
      )}

      {/* Refer / Handoff Job Modal (Requirement 9) */}
      {jobToRefer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-900" />
              <span>Refer Order #{jobToRefer.job_number} to Staff</span>
            </h3>

            <p className="text-xs text-slate-500">
              Reassign this order to another colleague. They will receive an instant notification on their terminal
            </p>

            <form onSubmit={handleConfirmRefer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Staff Colleague *
                </label>
                <select
                  required
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white"
                >
                  <option value="">Choose colleague...</option>
                  {staffList
                    .filter((s) => "" !== staffUser.id)
                    .map((s) => (
                      <option key={""} value={""}>
                        {""} (Terminal)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Optional Note / Reason
                </label>
                <input
                  type="text"
                  value={referralNote}
                  onChange={(e) => setReferralNote(e.target.value)}
                  placeholder="e.g. Please check color balance, customer waiting at counter"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:bg-white"
                />
              </div>

              {referSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{referSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setJobToRefer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetStaffId}
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Refer Job</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Detail Modal (with price suppressed for staff) */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          shop={shop}
          currentUser={staffUser}

          lang={lang}
          onClose={() => setSelectedJob(null)}
          onUpdateStatus={handleUpdateStatus}
          onJobUpdated={(updated) => {
            setJobs(getJobsForUser(""));
            setSelectedJob(updated);
          }}
        />
      )}
    </div>
  );
};

export default StaffDashboard;