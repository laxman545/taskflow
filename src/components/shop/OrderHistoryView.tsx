import React, { useState } from 'react';
import { Job, Language, StaffMember, CalendarMode } from '../../types';
import { formatDateWithCalendar, formatDateTimeWithCalendar, getDateRangeFromPreset } from '../../utils/nepaliCalendar';
import { getCalendarMode, setCalendarMode } from '../../utils/storage';
import { CalendarToggle } from './CalendarToggle';
import {
  Search,
  Download,
  Calendar,
  Monitor,
  User,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';

interface OrderHistoryViewProps {
  jobs: Job[];
  lang: Language;
  currentUser?: StaffMember | null;
  isRevenueVisible?: boolean;
  onSelectJob: (job: Job) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  jobs,
  lang,
  currentUser,
  isRevenueVisible = true,
  onSelectJob,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [calendarMode, setCalendarModeState] = useState<CalendarMode>(() => getCalendarMode());

  // Requirement 5: Strict Staff Financial Restriction
  const canSeeRevenue = (currentUser?.role === 'owner' || currentUser?.permissions.canViewRevenue) && isRevenueVisible;

  const formatRev = (amount: number) => {
    return canSeeRevenue ? `Rs. ${amount.toLocaleString()}` : 'Rs. ••••••';
  };

  const handleCalendarModeChange = (mode: CalendarMode) => {
    setCalendarModeState(mode);
    setCalendarMode(mode);
  };

  // Filter logic
  const filteredJobs = jobs.filter((job) => {
    // 1. Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = job.job_number.toLowerCase().includes(q);
      const matchCust = job.customer_name?.toLowerCase().includes(q) || false;
      const matchStaff = job.assigned_to_name?.toLowerCase().includes(q) || false;
      const matchPc = job.status?.toLowerCase().includes(q) || false;
      if (!matchNum && !matchCust && !matchStaff && !matchPc) return false;
    }

    // 2. Date filter (Requirements 17 & 18)
    if (dateFilter !== 'all') {
      const jobDate = new Date(job.created_at);
      if (dateFilter === 'custom' && customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (jobDate < start || jobDate > end) return false;
      } else {
        const range = getDateRangeFromPreset(dateFilter);
        if (jobDate < range.start || jobDate > range.end) return false;
      }
    }

    // 3. Service type filter
    if (serviceFilter !== 'all' && job.service_type !== serviceFilter) {
      return false;
    }

    // 4. Paper size filter
    if (sizeFilter !== 'all' && job.paper_size !== sizeFilter) {
      return false;
    }

    // 5. Status filter
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Calculate totals of filtered results
  const totalFilteredRevenue = filteredJobs.reduce(
    (acc, j) => (j.status !== 'cancelled' ? acc + (j.order_amount || 0) : acc),
    0
  );
  const totalFilteredPrints = filteredJobs.reduce(
    (acc, j) => (j.status !== 'cancelled' ? acc + (j.total_prints || 0) : acc),
    0
  );

  // Export filtered orders to CSV
  const handleExportCsv = () => {
    const headers = [
      'Job Number',
      'Date (A.D)',
      'Date (B.S)',
      'Customer',
      'Staff',
      'PC Terminal',
      'Service',
      'Paper Size',
      'Color/BW',
      'Copies',
      'Total Prints',
      'Status',
    ];

    if (canSeeRevenue) {
      headers.push('Amount (Rs)');
    }

    const rows = filteredJobs.map((j) => {
      const r = [
        j.job_number,
        new Date(j.created_at).toLocaleString(),
        formatDateWithCalendar(j.created_at, 'BS', lang),
        j.customer_name || 'Walk-in',
        j.assigned_to_name || j.completed_by_name || 'Unassigned',
        'Front Desk',
        j.service_type,
        j.paper_size,
        j.is_color ? 'Color' : 'B/W',
        j.copies,
        j.total_prints,
        j.status,
      ];
      if (canSeeRevenue) {
        r.push(j.order_amount || 0);
      }
      return r;
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `namaste_print_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, job #, staff, or PC terminal..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Calendar Format Switcher (Requirement 18) */}
            <CalendarToggle
              currentMode={calendarMode}
              onModeChange={handleCalendarModeChange}
              lang={lang}
              showTodayBadge={false}
            />

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Download CSV report of current filtered view"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdown Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Date Filter (Requirements 17 & 18) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Date Period
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-xs focus:bg-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_7_days">Past 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Print Service
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-xs focus:bg-white"
            >
              <option value="all">All Services</option>
              <option value="print">Document Print</option>
              <option value="photocopy">Photocopy / Xerox</option>
              <option value="photo_print">Photo Print</option>
            </select>
          </div>

          {/* Paper Size Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Paper Size
            </label>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-xs focus:bg-white"
            >
              <option value="all">All Sizes</option>
              <option value="A4">A4</option>
              <option value="A3">A3</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-xs focus:bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="ready">Ready for Pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-xs"
            />
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-xs"
            />
          </div>
        )}

        {/* Filter Summary Stats Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
          <span>
            Showing <b>{filteredJobs.length}</b> matching orders
          </span>
          <div className="flex items-center gap-4">
            <span>
              Total Sheets: <b className="text-slate-900">{totalFilteredPrints.toLocaleString()}</b>
            </span>
            {canSeeRevenue && (
              <span>
                Total Revenue: <b className="text-blue-900 font-bold">{formatRev(totalFilteredRevenue)}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-1">
            <p className="font-bold text-slate-600">No orders found matching your filters.</p>
            <p>Try resetting the search query or date filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Job #</th>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Staff & Station</th>
                  <th className="py-3 px-4 font-bold">Service & Size</th>
                  <th className="py-3 px-4 font-bold">Prints</th>
                  {canSeeRevenue && <th className="py-3 px-4 font-bold">Amount</th>}
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-950">
                      #{job.job_number}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateTimeWithCalendar(job.created_at, calendarMode, lang)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {job.customer_name || 'Walk-in'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{job.assigned_to_name || job.completed_by_name || 'Unassigned'}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Monitor className="w-3 h-3 text-blue-700" />
                          <span>{job.status|| job.status|| 'Front Desk'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="capitalize font-bold text-slate-800">
                          {job.service_type.replace('_', ' ')}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {job.paper_size} · {job.is_color ? 'Color' : 'B/W'} {job.is_double_sided ? '· 2-Sided' : ''}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {job.total_prints} <span className="text-[10px] text-slate-400 font-normal">sheets</span>
                    </td>

                    {/* Requirement 5: Amount column only shown to authorized Owner */}
                    {canSeeRevenue && (
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {formatRev(job.order_amount)}
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        job.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'processing' || job.status === 'in_progress' || job.status === 'assigned'
                          ? 'bg-amber-100 text-amber-800'
                          : job.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {job.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJob(job);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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
