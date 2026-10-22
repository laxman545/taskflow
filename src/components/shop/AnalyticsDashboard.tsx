import React, { useState, useMemo } from 'react';
import { Job, Language, StaffMember, Shop, CalendarMode, ServiceType } from '../../types';
import {
  computePeriodStats,
  getTodayStats,
  getMonthStats,
  getYearStats,
  getDailySeries,
  getHourlySeries,
  getServiceTypeBreakdown,
  getColorBreakdown,
  getPaperSizeBreakdown,
  getRangeStats,
  exportAnalyticsToCSV
} from '../../utils/analytics';
import { getStaffPerformanceStats, getShop } from '../../utils/storage';
import { formatDateWithCalendar, adToBs, BS_MONTH_NAMES_EN, BS_MONTH_NAMES_NE } from '../../utils/nepaliCalendar';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  Download,
  Printer,
  Users,
  Award,
  Filter,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Check,
  ChevronRight,
  HelpCircle,
  FileCheck2
} from 'lucide-react';

interface AnalyticsDashboardProps {
  jobs: Job[];
  shop?: Shop;
  lang: Language;
  currentUser?: StaffMember | null;
  isRevenueVisible?: boolean;
  calendarMode?: CalendarMode;
  onRefresh?: () => void;
}

export type AnalyticsTimeframe = 'today' | '7days' | '30days' | 'monthly' | 'yearly' | 'custom';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  jobs,
  shop,
  lang,
  currentUser,
  isRevenueVisible: initialRevenueVisible = true,
  calendarMode = 'BOTH',
  onRefresh,
}) => {
  const currentShop = shop || getShop();
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('today');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Local discrete revenue privacy toggle
  const [localRevenueVisible, setLocalRevenueVisible] = useState<boolean>(initialRevenueVisible);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [selectedColorFilter, setSelectedColorFilter] = useState<'all' | 'color' | 'bw'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [activeTabSection, setActiveTabSection] = useState<'overview' | 'charts' | 'staff' | 'matrix'>('overview');

  const canSeeRevenue = (currentUser?.role === 'owner' || currentUser?.permissions.canViewRevenue) && localRevenueVisible;

  const formatRev = (amount: number) => {
    return canSeeRevenue ? `Rs. ${amount.toLocaleString()}` : 'Rs. ••••••';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Base jobs filtered by optional service/color filter
  const baseJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedServiceFilter !== 'all' && j.service_type !== selectedServiceFilter) return false;
      if (selectedColorFilter === 'color' && !j.is_color) return false;
      if (selectedColorFilter === 'bw' && j.is_color) return false;
      return true;
    });
  }, [jobs, selectedServiceFilter, selectedColorFilter]);

  // Statistics calculation depending on timeframe
  const todayStats = useMemo(() => getTodayStats(baseJobs), [baseJobs]);
  const monthData = useMemo(() => getMonthStats(baseJobs, selectedYear, selectedMonth), [baseJobs, selectedYear, selectedMonth]);
  const yearData = useMemo(() => getYearStats(baseJobs, selectedYear), [baseJobs, selectedYear]);

  // Daily Series for charts
  const dailySeries = useMemo(() => {
    if (timeframe === '30days') return getDailySeries(baseJobs, 30);
    if (timeframe === 'custom') {
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      return getRangeStats(baseJobs, s, e).dailySeries;
    }
    return getDailySeries(baseJobs, 7);
  }, [baseJobs, timeframe, customStartDate, customEndDate]);

  // Today's hourly breakdown for peak hours insight
  const hourlySeries = useMemo(() => getHourlySeries(baseJobs), [baseJobs]);

  // Active stats for top metric cards
  const activeStats = useMemo(() => {
    if (timeframe === 'today') return todayStats;
    if (timeframe === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return computePeriodStats(baseJobs.filter((j) => new Date(j.created_at) >= sevenDaysAgo));
    }
    if (timeframe === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return computePeriodStats(baseJobs.filter((j) => new Date(j.created_at) >= thirtyDaysAgo));
    }
    if (timeframe === 'monthly') return monthData.current;
    if (timeframe === 'yearly') return yearData.current;
    if (timeframe === 'custom') {
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      return getRangeStats(baseJobs, s, e).stats;
    }
    return todayStats;
  }, [timeframe, todayStats, monthData, yearData, baseJobs, customStartDate, customEndDate]);

  // Service and Paper breakdown
  const serviceBreakdown = useMemo(() => getServiceTypeBreakdown(baseJobs), [baseJobs]);
  const colorBreakdown = useMemo(() => getColorBreakdown(baseJobs), [baseJobs]);
  const paperBreakdown = useMemo(() => getPaperSizeBreakdown(baseJobs), [baseJobs]);
  const staffPerformance = useMemo(() => getStaffPerformanceStats(currentShop.id), [currentShop.id]);

  // Human-readable timeframe label for report export and title
  const activePeriodLabel = useMemo(() => {
    if (timeframe === 'today') return `Today (${new Date().toLocaleDateString()})`;
    if (timeframe === '7days') return 'Past 7 Days';
    if (timeframe === '30days') return 'Past 30 Days';
    if (timeframe === 'monthly') return `${monthNames[selectedMonth]} ${selectedYear}`;
    if (timeframe === 'yearly') return `Year ${selectedYear}`;
    if (timeframe === 'custom') return `${customStartDate} to ${customEndDate}`;
    return 'Active Period';
  }, [timeframe, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Handle CSV Export
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      exportAnalyticsToCSV({
        shopName: currentShop.shop_name,
        periodLabel: activePeriodLabel,
        stats: activeStats,
        jobs: baseJobs,
        dailySeries,
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Print Report
  const handlePrintReport = () => {
    window.print();
  };

  const bsNow = adToBs(new Date());

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* 1. Station Control & Period Heading Bar */}
      <div
        className="p-5 rounded-2xl space-y-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <BarChart3 className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display flex items-center gap-2" style={{ color: 'var(--color-text-main)' }}>
                  <span>Shop Performance Analytics</span>
                  <span className="badge-primary text-[11px] font-bold">
                    Live
                  </span>
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {currentShop.shop_name} · {formatDateWithCalendar(new Date(), calendarMode, lang)} (
                  {calendarMode === 'BS' || calendarMode === 'BOTH' ? `${bsNow.monthNameEn} ${bsNow.day}, ${bsNow.year} BS` : 'Nepal Time'}
                  )
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Tools: Privacy Toggle, CSV Export, Print Report, Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Revenue Privacy Toggle */}
            <button
              type="button"
              onClick={() => setLocalRevenueVisible(!localRevenueVisible)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              title={localRevenueVisible ? 'Hide Financial Figures' : 'Show Financial Figures'}
            >
              {localRevenueVisible ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-blue-700" />}
              <span>{localRevenueVisible ? 'Hide Revenue' : 'Show Revenue'}</span>
            </button>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                exportSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800'
              }`}
              title="Download CSV Report for Excel / Google Sheets"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Report Downloaded!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            {/* Print Summary Report */}
            <button
              type="button"
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              title="Print Clean Summary Sheet"
            >
              <Printer className="w-4 h-4 text-blue-800" />
              <span>Print Report</span>
            </button>

            {/* Refresh */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-blue-700 transition-colors"
                title="Refresh Analytics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center gap-1.5 p-1 rounded-xl overflow-x-auto text-xs font-bold"
            style={{ backgroundColor: 'var(--color-canvas)', border: '1px solid var(--color-border)' }}
          >
            <button
              type="button"
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'today' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setTimeframe('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === '7days' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>

            <button
              type="button"
              onClick={() => setTimeframe('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === '30days' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>

            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'monthly' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'yearly' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly Matrix
            </button>

            <button
              type="button"
              onClick={() => setTimeframe('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'custom' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Quick Filters: Service Type & Color Mode */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold text-xs focus:outline-none"
            >
              <option value="all">All Services</option>
              <option value="print">Document Print</option>
              <option value="photocopy">Photocopy</option>
              <option value="citizenship">Citizenship Print</option>
              <option value="photo_print">Photo Studio</option>
            </select>

            <select
              value={selectedColorFilter}
              onChange={(e) => setSelectedColorFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold text-xs focus:outline-none"
            >
              <option value="all">All Colors</option>
              <option value="color">Color Only</option>
              <option value="bw">B/W Only</option>
            </select>
          </div>
        </div>

        {/* Sub-bar for Monthly Selector */}
        {timeframe === 'monthly' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-xs font-semibold text-blue-950">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>Select Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-blue-200 rounded-lg px-2.5 py-1 font-bold text-xs"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-blue-200 rounded-lg px-2.5 py-1 font-bold text-xs"
              >
                <option value={2026}>2026 (२०८२/८३ BS)</option>
                <option value={2025}>2025 (२०८१/८२ BS)</option>
              </select>
            </div>

            {/* MoM Performance Pill */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-normal">vs Previous Month:</span>
              <span
                className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-md ${
                  monthData.revenueGrowth >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {monthData.revenueGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{Math.abs(monthData.revenueGrowth).toFixed(1)}% Revenue</span>
              </span>
              <span
                className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-md ${
                  monthData.ordersGrowth >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                }`}
              >
                <span>{monthData.ordersGrowth >= 0 ? '+' : ''}{monthData.ordersGrowth.toFixed(0)}% Orders</span>
              </span>
            </div>
          </div>
        )}

        {/* Sub-bar for Custom Date Range */}
        {timeframe === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-xs font-semibold text-blue-950">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-2.5 py-1 font-bold text-xs"
              />
              <span>To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-blue-200 rounded-lg px-2.5 py-1 font-bold text-xs"
              />
            </div>
            <span className="text-slate-500 text-[11px]">
              Showing data between selected custom dates ({activeStats.ordersCount} matching orders)
            </span>
          </div>
        )}
      </div>

      {/* 2. Top Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Revenue (Hero) */}
        <div className="p-5 bg-gradient-to-br from-blue-950 to-blue-900 text-white rounded-2xl shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Total Revenue
            </span>
            <DollarSign className="w-4 h-4 text-blue-300" />
          </div>

          <div className="space-y-1">
            <span className="text-3xl font-black font-mono tracking-tight text-white block">
              {formatRev(activeStats.revenue)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-blue-200">
              <span>Avg Order:</span>
              <b className="font-mono text-white">
                {canSeeRevenue ? `Rs. ${activeStats.avgOrderValue || 0}` : '••••'}
              </b>
            </div>
          </div>

          <div className="pt-2.5 border-t border-blue-800/80 flex items-center justify-between text-[11px] text-blue-200">
            <span>Period: {activePeriodLabel}</span>
            <span className="font-semibold text-emerald-300">Net NPR</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <Layers className="w-4 h-4 text-blue-700" />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">
                {activeStats.ordersCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">orders</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-emerald-700 font-bold">
                {activeStats.ordersCount > 0 ? Math.round((activeStats.completedOrders / activeStats.ordersCount) * 100) : 0}%
              </span>
              <span className="text-slate-400">fulfilled</span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-medium">✓ {activeStats.completedOrders} Done</span>
            <span className="text-amber-700 font-medium">⏳ {activeStats.pendingOrders} Active</span>
            {activeStats.cancelledOrders > 0 && (
              <span className="text-red-600 font-medium">✕ {activeStats.cancelledOrders}</span>
            )}
          </div>
        </div>

        {/* Card 3: Total Sheets Printed */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sheets Printed
            </span>
            <Printer className="w-4 h-4 text-indigo-700" />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-blue-950">
                {activeStats.totalPrints}
              </span>
              <span className="text-xs text-slate-400 font-medium">sheets</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Avg sheets/order:</span>
              <b className="font-mono text-slate-800">
                {activeStats.ordersCount > 0 ? (activeStats.totalPrints / activeStats.ordersCount).toFixed(1) : 0}
              </b>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-indigo-700 font-bold">Color: {activeStats.colorPrints}</span>
            <span className="text-slate-600 font-bold">B/W: {activeStats.bwPrints}</span>
          </div>
        </div>

        {/* Card 4: Paper & Service Distribution */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Paper Formats
            </span>
            <FileText className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">A4 Standard:</span>
              <span className="font-bold font-mono text-slate-900">{activeStats.a4Prints} sheets</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">A3 Large:</span>
              <span className="font-bold font-mono text-blue-900">{activeStats.a3Prints} sheets</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">A5 / Photos:</span>
              <span className="font-bold font-mono text-amber-900">
                {(activeStats.a5Prints || 0) + activeStats.photoPrints} prints
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Citizenship: <b className="text-emerald-700">{activeStats.citizenshipPrints || 0}</b></span>
            <span>Photos: <b className="text-red-600">{activeStats.photoPrints}</b></span>
          </div>
        </div>
      </div>

      {/* 3. Visual Charts Grid (Volume Trends, Trajectory, Services, and Color Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Orders & Print Volume Trend Bar Chart */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <span>📊 Printing Demand & Volume Trend</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {timeframe === '30days' ? 'Daily sheets printed (Past 30 Days)' : 'Daily sheets printed (Past 7 Days)'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-900 font-mono block">
                {dailySeries.reduce((acc, d) => acc + d.prints, 0)} Sheets Total
              </span>
              <span className="text-[10px] text-slate-400">
                {dailySeries.reduce((acc, d) => acc + d.orders, 0)} Orders
              </span>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="h-52 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-100">
            {dailySeries.map((day, idx) => {
              const maxPrints = Math.max(...dailySeries.map((d) => d.prints), 20);
              const heightPercent = Math.max(8, Math.round((day.prints / maxPrints) * 100));
              const isToday = idx === dailySeries.length - 1;

              return (
                <div key={day.dateLabel + idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  {/* Hover Tooltip */}
                  <div className="absolute -top-14 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-lg border border-slate-700">
                    <div className="font-bold text-blue-200">{day.dateLabel}</div>
                    <div>{day.orders} orders · {day.prints} sheets</div>
                    <div className="font-mono text-emerald-400 font-bold">
                      {formatRev(day.revenue)}
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[40px] rounded-t-lg transition-all group-hover:brightness-110 ${
                      isToday
                        ? 'bg-blue-900 ring-2 ring-blue-400 shadow-xs'
                        : 'bg-blue-600/80 hover:bg-blue-700'
                    }`}
                  />
                  <span className={`text-[10px] truncate max-w-full ${isToday ? 'text-blue-950 font-bold' : 'text-slate-400'}`}>
                    {day.dateLabel.split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-900 rounded-sm" />
              <span>Today / Most Recent</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600/80 rounded-sm" />
              <span>Historical Days</span>
            </span>
          </div>
        </div>

        {/* Chart 2: Revenue Trajectory Area Chart */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <span>📈 Revenue Trajectory Curve</span>
              </h3>
              <p className="text-[11px] text-slate-400">Daily shop earnings in Nepalese Rupees (Rs. NPR)</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 font-mono block">
                {formatRev(dailySeries.reduce((acc, d) => acc + d.revenue, 0))}
              </span>
              <span className="text-[10px] text-slate-400">In period</span>
            </div>
          </div>

          {/* SVG Polyline with Gradient */}
          <div className="h-52 relative flex items-center justify-center pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {(() => {
                const maxRev = Math.max(...dailySeries.map((d) => d.revenue), 100);
                const points = dailySeries.map((d, i) => {
                  const x = (i / Math.max(1, dailySeries.length - 1)) * 300;
                  const y = 115 - (d.revenue / maxRev) * 95;
                  return { x, y, rev: d.revenue, dateLabel: d.dateLabel };
                });

                const pathD = points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
                const areaD = `${pathD} L 300 130 L 0 130 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#analyticsRevGrad)" />
                    <path d={pathD} fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#FFFFFF"
                        stroke="#1e3a8a"
                        strokeWidth="2.5"
                        className="hover:scale-150 transition-transform cursor-pointer"
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Highest Day:{' '}
              <b className="text-slate-800">
                {formatRev(Math.max(...dailySeries.map((d) => d.revenue), 0))}
              </b>
            </span>
            <span>
              Today:{' '}
              <b className="text-emerald-700">
                {formatRev(todayStats.revenue)}
              </b>
            </span>
          </div>
        </div>

        {/* Chart 3: Service Type Breakdown (Document, Photocopy, Citizenship, Photo) */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <span>📑 Service Distribution & Mix</span>
              </h3>
              <p className="text-[11px] text-slate-400">Share of volume & earnings by service</p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {serviceBreakdown.reduce((sum, s) => sum + s.count, 0)} Total Jobs
            </span>
          </div>

          {/* Segmented Volume Bar */}
          <div className="space-y-3">
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 shadow-inner">
              {serviceBreakdown.map((s, idx) => {
                const colors = ['bg-blue-900', 'bg-amber-600', 'bg-emerald-600', 'bg-red-500'];
                return (
                  <div
                    key={s.service}
                    style={{ width: `${s.percentOfPrints}%` }}
                    className={`${colors[idx % colors.length]} flex items-center justify-center text-[10px] text-white font-bold transition-all`}
                    title={`${s.label}: ${s.prints} prints (${s.percentOfPrints}%)`}
                  >
                    {s.percentOfPrints >= 10 && `${s.percentOfPrints}%`}
                  </div>
                );
              })}
            </div>

            {/* Service detail cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {serviceBreakdown.map((s, idx) => {
                const borderColors = ['border-blue-200 bg-blue-50/60', 'border-amber-200 bg-amber-50/60', 'border-emerald-200 bg-emerald-50/60', 'border-red-200 bg-red-50/60'];
                const dotColors = ['bg-blue-900', 'bg-amber-600', 'bg-emerald-600', 'bg-red-500'];

                return (
                  <div key={s.service} className={`p-2.5 border rounded-xl ${borderColors[idx % borderColors.length]}`}>
                    <span className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] truncate">
                      <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                      <span className="truncate">{s.label}</span>
                    </span>
                    <p className="text-base font-black font-mono text-slate-900 mt-1">
                      {s.prints} <span className="text-[10px] font-normal text-slate-400">prints</span>
                    </p>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between font-mono">
                      <span>{s.count} orders</span>
                      <span className="font-bold text-blue-950">{formatRev(s.revenue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 4: Color vs Black & White Ratio */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <span>🎨 Color Mode vs Black & White</span>
              </h3>
              <p className="text-[11px] text-slate-400">Print mode volume and revenue comparison</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 font-mono">
              {colorBreakdown.colorPercent}% Color / {colorBreakdown.bwPercent}% B&W
            </span>
          </div>

          <div className="space-y-4">
            {/* Visual ratio bar */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 shadow-inner">
              <div
                style={{ width: `${colorBreakdown.colorPercent}%` }}
                className="bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                title={`Color: ${colorBreakdown.colorPrints} prints (${colorBreakdown.colorPercent}%)`}
              >
                {colorBreakdown.colorPercent >= 10 && `Color ${colorBreakdown.colorPercent}%`}
              </div>
              <div
                style={{ width: `${colorBreakdown.bwPercent}%` }}
                className="bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold transition-all"
                title={`B/W: ${colorBreakdown.bwPrints} prints (${colorBreakdown.bwPercent}%)`}
              >
                {colorBreakdown.bwPercent >= 10 && `B/W ${colorBreakdown.bwPercent}%`}
              </div>
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-indigo-950">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span>Color Printing</span>
                  </span>
                  <span className="text-[11px] bg-indigo-200/60 px-1.5 py-0.2 rounded font-mono">
                    {colorBreakdown.colorPercent}%
                  </span>
                </div>
                <p className="text-xl font-black font-mono text-indigo-950">
                  {colorBreakdown.colorPrints} <span className="text-xs font-normal text-indigo-700">sheets</span>
                </p>
                <p className="text-[11px] text-indigo-800 font-mono">
                  Revenue: <b>{formatRev(colorBreakdown.colorRevenue)}</b>
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    <span>Black & White</span>
                  </span>
                  <span className="text-[11px] bg-slate-200 px-1.5 py-0.2 rounded font-mono">
                    {colorBreakdown.bwPercent}%
                  </span>
                </div>
                <p className="text-xl font-black font-mono text-slate-900">
                  {colorBreakdown.bwPrints} <span className="text-xs font-normal text-slate-500">sheets</span>
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  Revenue: <b>{formatRev(colorBreakdown.bwRevenue)}</b>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Hourly Peak Shift Analysis (When Today or 7 Days is active) */}
      {(timeframe === 'today' || timeframe === '7days') && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Today's Peak Hours Operational Rhythm (8 AM - 8 PM)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Identify rush hours to optimize staff workstation allocation and counter staffing
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Rush Hour Monitor
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-1.5 pt-2">
            {hourlySeries.map((h) => {
              const maxHourlyPrints = Math.max(...hourlySeries.map((x) => x.prints), 10);
              const intensity = Math.min(100, Math.round((h.prints / maxHourlyPrints) * 100));

              return (
                <div
                  key={h.hour}
                  className="p-2 rounded-xl text-center border transition-all hover:scale-105"
                  style={{
                    backgroundColor: intensity > 60 ? '#eff6ff' : intensity > 20 ? '#f8fafc' : '#ffffff',
                    borderColor: intensity > 60 ? '#93c5fd' : '#e2e8f0',
                  }}
                  title={`${h.hourLabel}: ${h.orders} orders, ${h.prints} prints (Rs. ${h.revenue})`}
                >
                  <span className="text-[10px] text-slate-500 font-semibold block">{h.hourLabel}</span>
                  <p className="text-sm font-black font-mono text-slate-900 mt-1">{h.prints}</p>
                  <span className="text-[9px] text-slate-400 block font-mono">{h.orders} ord</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Staff Workload & Performance Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Staff Counter Productivity & Performance
              </h3>
              <p className="text-[11px] text-slate-400">
                Live output, completed printing jobs, and sheet volumes per staff terminal
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-900 font-mono">
            {staffPerformance.length} Staff Member{staffPerformance.length > 1 ? 's' : ''}
          </span>
        </div>

        {staffPerformance.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No staff members configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Staff Member</th>
                  <th className="py-2.5 px-4 font-bold">Role</th>
                  <th className="py-2.5 px-4 font-bold">Completed Jobs</th>
                  <th className="py-2.5 px-4 font-bold">Total Sheets Printed</th>
                  <th className="py-2.5 px-4 font-bold">Revenue Handled</th>
                  <th className="py-2.5 px-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {staffPerformance.map((st, idx) => (
                  <tr key={st.staff_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                        {st.staff_name.charAt(0)}
                      </div>
                      <div>
                        <span>{st.staff_name}</span>
                        {idx === 0 && st.completed_orders > 0 && (
                          <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            🏆 Top Producer
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-indigo-700">
                      {st.role}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {st.completed_orders} jobs
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {st.total_prints} sheets
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {formatRev(st.total_revenue)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Yearly 12-Month Performance Matrix */}
      {timeframe === 'yearly' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <span>📅 Year {selectedYear} Monthly Matrix Breakdown</span>
                <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Best Month: {yearData.bestMonth}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Full annual financial and operational review</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">12 Months</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Month</th>
                  <th className="py-2.5 px-4 font-bold">Orders</th>
                  <th className="py-2.5 px-4 font-bold">Sheets Printed</th>
                  <th className="py-2.5 px-4 font-bold">Revenue (NPR)</th>
                  <th className="py-2.5 px-4 font-bold text-right">Avg / Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {yearData.monthlyBreakdown.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 font-mono">{m.orders}</td>
                    <td className="py-3 px-4 font-mono">{m.prints}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{formatRev(m.revenue)}</td>
                    <td className="py-3 px-4 font-mono text-right text-slate-500">
                      {canSeeRevenue ? `Rs. ${m.orders > 0 ? Math.round(m.revenue / m.orders) : 0}` : '••••'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Recent High-Volume Orders in Period */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-display">
            ⚡ Recent Orders Sample in {activePeriodLabel}
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {baseJobs.length} Orders Loaded
          </span>
        </div>

        {baseJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No orders found for this timeframe. Place a print order to see real-time analytics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-bold">Token</th>
                  <th className="py-2 px-3 font-bold">Customer</th>
                  <th className="py-2 px-3 font-bold">Service</th>
                  <th className="py-2 px-3 font-bold">Paper / Color</th>
                  <th className="py-2 px-3 font-bold">Sheets</th>
                  <th className="py-2 px-3 font-bold">Amount</th>
                  <th className="py-2 px-3 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {baseJobs.slice(0, 8).map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-blue-900">{j.job_number}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{j.customer_name || 'Walk-in'}</td>
                    <td className="py-2 px-3 capitalize">{j.service_type.replace('_', ' ')}</td>
                    <td className="py-2 px-3">
                      {j.paper_size} · {j.is_color ? <span className="text-indigo-600 font-bold">Color</span> : 'B/W'}
                    </td>
                    <td className="py-2 px-3 font-mono">{j.total_prints || (j.copies * (j.page_count || 1))}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{formatRev(j.order_amount || 0)}</td>
                    <td className="py-2 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          j.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : j.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
