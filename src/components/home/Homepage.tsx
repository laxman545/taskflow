import React, { useState } from 'react';
import { Shop, GoogleAuthUser } from '../../types';
import { NamasteLogo } from '../NamasteLogo';
import {
  Store,
  QrCode,
  Smartphone,
  ShieldCheck,
  Printer,
  CheckCircle2,
  ArrowRight,
  Monitor,
  Users,
  User,
  BarChart3,
  Lock,
  Download,
  Zap,
  ShieldAlert,
  Globe,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Calculator,
  Flame,
  Check,
  XCircle,
  Copy,
  Receipt,
  Play,
  Layers,
  TrendingUp,
  Activity,
  HardDrive,
  Cpu,
  Shield
} from 'lucide-react';

interface HomepageProps {
  shop: Shop;
  isLoggedIn: boolean;
  authUser: GoogleAuthUser | null;
  onContinueWithGoogle: (mode: 'login' | 'signup') => void;
  onGoToDashboard: () => void;
  onViewCustomerFlow: () => void;
  onGoToAdmin?: () => void;
}

/* ------------------------------------------------------------------
   3D PERSPECTIVE SAAS DASHBOARD MOCKUP
   Matches the Nexora reference image with authentic print shop metrics
------------------------------------------------------------------ */
const PerspectiveHeroMockup: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl mx-auto perspective-1200 py-6 sm:py-10">
      {/* Background Soft Ambient Light Spheres (matching reference image) */}
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Floating 3D Crystal / Live Badge */}
      <div className="absolute -top-3 -left-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-slate-200 text-xs font-bold text-slate-800 animate-slide-up">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-mono text-blue-900">Live Terminal Port 5000</span>
      </div>

      {/* Main 3D Tilted Dashboard Card */}
      <div className="dashboard-mockup-3d bg-white rounded-3xl p-5 sm:p-6 text-slate-900 font-sans border border-slate-200/90 relative overflow-hidden select-none">
        
        {/* Mockup Top Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
              NP
            </div>
            <div>
              <span className="font-display font-black text-xs text-slate-900 tracking-tight block">
                Everest Print Hub
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Terminal #01 · Bagbazar</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-mono">
              <span>Search job #...</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold border border-blue-200">
              ⚡
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
              CS
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="pt-4 pb-3">
          <h4 className="font-display font-black text-base text-slate-900 leading-tight">
            Welcome back, Counter Staff! 👋
          </h4>
          <p className="text-[11px] text-slate-500">
            Here's what's happening at your print counter today.
          </p>
        </div>

        {/* 4 Metric Cards Row (matching Nexora reference) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Today's Revenue
            </span>
            <span className="font-mono font-black text-sm text-slate-950 block">
              Rs. 24,980
            </span>
            <span className="text-[9px] font-bold text-emerald-600 block">
              +18.4% vs yday
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Queue
            </span>
            <span className="font-mono font-black text-sm text-blue-600 block">
              12 Jobs
            </span>
            <span className="text-[9px] font-bold text-blue-600 block">
              4 printing now
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Sheets
            </span>
            <span className="font-mono font-black text-sm text-slate-950 block">
              1,245 A4
            </span>
            <span className="text-[9px] font-bold text-slate-500 block">
              980 B&W · 265 Color
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Completed
            </span>
            <span className="font-mono font-black text-sm text-emerald-700 block">
              8,430
            </span>
            <span className="text-[9px] font-bold text-emerald-600 block">
              100% picked up
            </span>
          </div>
        </div>

        {/* Middle Section: Chart + Live Queue */}
        <div className="grid sm:grid-cols-12 gap-3 mb-3">
          {/* Revenue Chart Mockup (7 cols) */}
          <div className="sm:col-span-7 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700">Revenue Overview</span>
              <span className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                This Week
              </span>
            </div>
            {/* SVG Wavy Line Chart */}
            <div className="h-18 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,45 Q25,20 50,38 T100,22 T150,15 T200,8 L200,60 L0,60 Z"
                  fill="url(#chartGlow)"
                />
                <path
                  d="M0,45 Q25,20 50,38 T100,22 T150,15 T200,8"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="150" cy="15" r="3.5" fill="#2563EB" stroke="#ffffff" strokeWidth="2" />
              </svg>
              {/* Tooltip callout */}
              <div className="absolute top-0 right-10 px-1.5 py-0.5 rounded bg-blue-900 text-white text-[9px] font-mono font-bold shadow-md">
                Rs. 8,420
              </div>
            </div>
          </div>

          {/* Recent Activity List (5 cols) */}
          <div className="sm:col-span-5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">Recent Activity</span>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">Token #1048 ready</span>
                <span className="text-slate-400 font-mono ml-auto">1m</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">Citizenship merge done</span>
                <span className="text-slate-400 font-mono ml-auto">3m</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">Loksewa form (6 pgs)</span>
                <span className="text-slate-400 font-mono ml-auto">5m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Active Jobs Mini Table */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
            <span>Live Counter Queue</span>
            <span className="text-blue-600 font-semibold text-[10px] hover:underline cursor-pointer">
              View All 12 Jobs &rarr;
            </span>
          </div>

          <div className="space-y-1.5">
            {[
              { token: 'NP-1048', name: 'Rohan Shrestha', item: 'Citizenship Front/Back', status: 'Ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { token: 'NP-1049', name: 'Pooja Thapa', item: 'A4 Duplex Form (8 pgs)', status: 'Printing', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map((job) => (
              <div key={job.token} className="p-2 rounded-lg bg-white border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-blue-900 text-[11px]">#{job.token.split('-')[1]}</span>
                  <span className="font-semibold text-slate-800 truncate text-[11px]">{job.name}</span>
                  <span className="text-slate-400 text-[10px] hidden sm:inline truncate">· {job.item}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${job.color}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
   INTERACTIVE LIVE RATE ESTIMATOR COMPONENT
------------------------------------------------------------------ */
const InteractiveRateEstimator: React.FC = () => {
  const [service, setService] = useState<'print_bw' | 'print_color' | 'citizenship' | 'photo'>('print_bw');
  const [pages, setPages] = useState<number>(4);
  const [copies, setCopies] = useState<number>(1);
  const [isDuplex, setIsDuplex] = useState<boolean>(false);

  const calculateEstimate = () => {
    switch (service) {
      case 'print_bw': {
        const ratePerPage = isDuplex ? 4 : 5;
        return pages * copies * ratePerPage;
      }
      case 'print_color': {
        const ratePerPage = isDuplex ? 15 : 20;
        return pages * copies * ratePerPage;
      }
      case 'citizenship':
        return copies * 10;
      case 'photo':
        return copies * 40;
      default:
        return 20;
    }
  };

  const estimatedTotal = calculateEstimate();

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl p-6 sm:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-2 border border-blue-200/60">
            <Calculator className="w-3.5 h-3.5" />
            Live Nepali Rate Calculator
          </span>
          <h3 className="font-display font-black text-2xl text-slate-900">
            Instant Cost & Time Estimator
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Standard Kathmandu & Pokhara cyber rates calculated automatically.
          </p>
        </div>
        <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-slate-100">
          <span className="text-xs font-mono text-slate-400 block">Est. Counter Total</span>
          <span className="font-display font-black text-3xl sm:text-4xl text-blue-900 font-mono">
            Rs. {estimatedTotal}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8 pt-6">
        {/* Left Column: Controls */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Service
            </label>
            <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
              {[
                { id: 'print_bw', label: 'B&W Print', sub: 'Rs. 5/page' },
                { id: 'print_color', label: 'Color Print', sub: 'Rs. 20/page' },
                { id: 'citizenship', label: 'Citizenship Merge', sub: 'Rs. 10/set' },
                { id: 'photo', label: 'Passport Photo', sub: 'Rs. 40/sheet' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setService(item.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    service === item.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-black shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <span className="block font-bold">{item.label}</span>
                  <span className="block text-[11px] font-mono text-slate-500 mt-0.5">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {service !== 'citizenship' && service !== 'photo' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Document Pages</label>
                <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {pages} Pages
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={pages}
                onChange={(e) => setPages(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Quantity / Copies</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm text-center flex-1">{copies}</span>
                <button
                  type="button"
                  onClick={() => setCopies(copies + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {service !== 'citizenship' && service !== 'photo' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Print Sides</label>
                <button
                  type="button"
                  onClick={() => setIsDuplex(!isDuplex)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    isDuplex
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {isDuplex ? 'Double-Sided (Duplex)' : 'Single-Sided'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Breakdown Summary */}
        <div className="bg-slate-50/90 rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between">
          <div className="space-y-3.5 text-xs">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
              Transparent Pricing Formula
            </span>
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-600">Base Unit Rate</span>
              <span className="font-mono font-bold text-slate-900">
                {service === 'print_bw' ? 'Rs. 5.00' : service === 'print_color' ? 'Rs. 20.00' : service === 'citizenship' ? 'Rs. 10.00' : 'Rs. 40.00'}
              </span>
            </div>
            {service !== 'citizenship' && service !== 'photo' && (
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-600">Total Billable Impressions</span>
                <span className="font-mono font-bold text-slate-900">
                  {pages} pgs × {copies} {copies > 1 ? 'copies' : 'copy'}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-slate-200">
              <span className="text-slate-600">Duplex Paper Savings</span>
              <span className="font-mono font-bold text-emerald-700">
                {isDuplex ? 'Applied (Save 20%)' : 'None'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 text-slate-600">
              <span>Estimated Production Time</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                ~{Math.max(1, Math.ceil((pages * copies) / 20))} Minute(s)
              </span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Calculated Cash Total:</span>
            <span className="font-display font-black text-2xl text-blue-900 font-mono">
              Rs. {estimatedTotal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Homepage: React.FC<HomepageProps> = ({
  shop,
  isLoggedIn,
  authUser,
  onContinueWithGoogle,
  onGoToDashboard,
  onViewCustomerFlow,
  onGoToAdmin,
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">

      {/* ======================================================== */}
      {/* 1. HERO SECTION (Matching Nexora Reference Image Exactly)  */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F0F6FF] via-[#F8FAFC] to-white pt-8 sm:pt-14 pb-16 sm:pb-24 border-b border-slate-200/80">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left 6.5 Columns: Hero Typography & Actions */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8 animate-hero-enter">
              
              {/* Pill Announcement (matching "Nexora 2.0 is now live >") */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-200 shadow-2xs text-xs font-semibold text-slate-800">
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-600 text-white">
                  NEW
                </span>
                <span className="text-slate-600">Namaste Print 2.0 is now live</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Major Display Headline (matching reference typography) */}
              <div>
                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-[3.5rem] text-slate-950 tracking-tight leading-[1.12]">
                  The All-in-One <br />
                  Counter Platform <br />
                  for{' '}
                  <span className="text-blue-600">
                    Modern Print Shops
                  </span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                  Namaste Print helps you receive customer files, automate citizenship photocopy merges, manage multi-terminal queues, and grow your revenue — all in one powerful platform.
                </p>
              </div>

              {/* Action Buttons Row (matching reference button with circular arrow) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                {isLoggedIn ? (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onGoToDashboard}
                      className="btn-pill-primary text-sm shadow-xl shadow-blue-500/25"
                    >
                      <span>Open Shop Dashboard</span>
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={onViewCustomerFlow}
                      className="btn-pill-secondary text-sm"
                    >
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>Customer QR View</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onContinueWithGoogle('signup')}
                      className="btn-pill-primary text-sm shadow-xl shadow-blue-500/25"
                    >
                      <span>Start Your Free Counter</span>
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={onViewCustomerFlow}
                      className="btn-pill-secondary text-sm"
                    >
                      <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                      <span>Watch Demo / Scan</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Value Proposition Checks Row (matching reference) */}
              <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>No customer app required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>24-Hour privacy auto-purge</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Instant counter stand</span>
                </div>
              </div>

            </div>

            {/* Right 5.5 Columns: 3D Perspective Isometric Dashboard (matching reference) */}
            <div className="lg:col-span-6 animate-hero-enter stagger-2">
              <PerspectiveHeroMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. TRUSTED BY PRINT SHOPS LOGO STRIP (Matching Reference)*/}
      {/* ======================================================== */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase mb-8">
            TRUSTED BY FAST-GROWING PRINT SHOPS & CYBER CAFES ACROSS NEPAL
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75">
            {[
              { name: 'Everest Digital Print', city: 'Kathmandu' },
              { name: 'Bagbazar Cyber Hub', city: 'Bagbazar' },
              { name: 'Patan Stationery & Xerox', city: 'Lalitpur' },
              { name: 'Pokhara Express Print', city: 'Pokhara' },
              { name: 'Himalayan Form Center', city: 'Butwal' },
              { name: 'KU Student Xerox', city: 'Dhulikhel' },
            ].map((partner) => (
              <div key={partner.name} className="flex items-center gap-2 group cursor-default">
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px] group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  NP
                </div>
                <div className="text-left">
                  <span className="font-display font-bold text-xs text-slate-700 tracking-tight block">
                    {partner.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {partner.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. "EVERYTHING YOU NEED TO SUCCEED" 6-CARD GRID          */}
      {/* (Directly Matching the Nexora 2x3 Feature Card Layout)   */}
      {/* ======================================================== */}
      <section className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-widest">
              FEATURES
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Everything You Need to{' '}
              <span className="text-blue-600">Succeed</span>
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Powerful tools built to eliminate counter chaos, speed up customer queues, and drive real profit.
            </p>
          </div>

          {/* 6 Feature Cards (Matching 2x3 White Cards with Icon Tiles & "Learn more ->") */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Tabletop Stand QR
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Customers scan directly with any phone camera. Zero WhatsApp numbers exchanged, zero cables, and zero app download required.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Multi-Terminal Sync
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Run seamlessly across all counter PCs. Reception desk, express photocopy operators, and print rooms share the same live queue.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-red-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Citizenship Card Merger
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatically aligns front and back photos of Nepali citizenship cards on a single A4 or A5 sheet with zero manual glass flipping.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Real-Time Order Tracking
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generates an official token ticket with 1-click screenshot saving. Customers track order stages (New &rarr; Ready &rarr; Done).
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  4-Digit PIN File Delivery
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Need to send scanned certificates or forms back to a customer? Deliver securely via 4-digit PIN code with auto-expiry.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                  Revenue Analytics & Privacy
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Track daily, monthly, and yearly cash flow. Includes a discrete 1-tap privacy eye toggle (Rs. ••••••) when customers lean over your desk.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. DEEP DIVE SECTION: "SCALE YOUR BUSINESS WITHOUT LIMITS"*/}
      {/* (Matching Lower Split Section of Reference Image)        */}
      {/* ======================================================== */}
      <section className="py-20 sm:py-28 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left 6 Columns: Secondary UI Mockup */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-900">Counter Performance</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    This Month
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">Tasks Done</span>
                    <span className="text-base font-black font-mono text-slate-900">2,450</span>
                    <span className="text-[9px] font-bold text-emerald-600">+18.2%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">On Track</span>
                    <span className="text-base font-black font-mono text-blue-600">83%</span>
                    <span className="text-[9px] font-bold text-blue-600">+7.4%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">Duplex Save</span>
                    <span className="text-base font-black font-mono text-purple-700">68%</span>
                    <span className="text-[9px] font-bold text-purple-600">-4.3%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-700 block mb-2">Live Staff Activity</span>
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                        SS
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-[11px]">Suman Shrestha</span>
                        <span className="text-[10px] text-slate-500">Printed 40 pgs Loksewa Form</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 6 Columns: Value Copy & Bullets */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-widest">
                BUILT FOR GROWTH
              </span>

              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-950 tracking-tight leading-tight">
                Scale Your Business <br />
                <span className="text-blue-600">Without Limits</span>
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Namaste Print grows with you. Whether you operate a single photocopy counter near a government office or a multi-terminal cyber cafe chain, our platform is built to scale.
              </p>

              <ul className="space-y-3 pt-2 text-sm text-slate-700 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Scalable for teams of any size across multiple counter terminals</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Enterprise-grade encryption with automatic 24-hour file purge</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>99.9% uptime with offline queue tolerance</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Bilingual Nepali (नेपाली) & English support with Bikram Sambat (BS)</span>
                </li>
              </ul>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => onContinueWithGoogle('signup')}
                  className="btn-pill-primary text-sm shadow-xl shadow-blue-500/25"
                >
                  <span>Start Your Free Counter</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE NEPALI RATE CALCULATOR SECTION             */}
      {/* ======================================================== */}
      <section className="py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveRateEstimator />
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CALL TO ACTION STRIP                                  */}
      {/* ======================================================== */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="h-1 w-full bg-blue-600 absolute top-0 left-0" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
            Ready to upgrade your print counter?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join hundreds of print shops across Nepal using Namaste Print to eliminate WhatsApp chaos, speed up queues, and serve customers with pride.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="btn-pill-primary text-sm shadow-xl shadow-blue-500/30"
              >
                <span>Go to Shop Dashboard</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onContinueWithGoogle('signup')}
                  className="btn-pill-primary text-sm shadow-xl shadow-blue-500/30"
                >
                  <span>Start Your Free Counter</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={onViewCustomerFlow}
                  className="btn-pill-secondary text-sm"
                >
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Customer Scan Demo</span>
                </button>
              </>
            )}
          </div>

          {onGoToAdmin && (
            <div className="pt-10 border-t border-slate-900 flex justify-center">
              <button
                type="button"
                onClick={onGoToAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                <span>System Administrator Console Access</span>
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
