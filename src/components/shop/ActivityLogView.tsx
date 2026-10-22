import React, { useState } from 'react';
import { ActivityLog, Language, Shop } from '../../types';
import { getActivityLogs } from '../../utils/storage';
import {
  Activity,
  Clock,
  User,
  Monitor,
  Search,
  Filter,
  CheckCircle2,
  Printer,
  FilePlus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ActivityLogViewProps {
  shop: Shop;
  lang: Language;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  shop,
  lang,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>(() => getActivityLogs(shop.id));
  const [searchStaff, setSearchStaff] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const refreshLogs = () => {
    setActivities(getActivityLogs(shop.id));
  };

  const filteredLogs = activities.filter((act) => {
    if (searchStaff.trim()) {
      const q = searchStaff.toLowerCase();
      const matchName = act.staff_name.toLowerCase().includes(q);
      const matchOrder = act.job_number?.toLowerCase().includes(q) || false;
      const matchPc = false;
      if (!matchName && !matchOrder && !matchPc) return false;
    }

    if (actionFilter !== 'all' && act.action !== actionFilter) {
      return false;
    }

    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'claimed_job':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md text-[10px] font-bold">Claimed Job</span>;
      case 'assigned_job':
        return <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded-md text-[10px] font-bold">Assigned Job</span>;
      case 'completed_order':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md text-[10px] font-bold">Completed</span>;
      case 'created_order':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[10px] font-bold">Created Order</span>;
      case 'started_printing':
      case 'status_change':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md text-[10px] font-bold">In Progress</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-900" />
            <span>Shop Real-Time Activity Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of orders, job claims, computer stations used, and completions
          </p>
        </div>

        <button
          type="button"
          onClick={refreshLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            placeholder="Search by staff name, order #, or PC terminal..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
        >
          <option value="all">All Action Types</option>
          <option value="claimed_job">Claimed Jobs</option>
          <option value="assigned_job">Job Assignments</option>
          <option value="completed_order">Completed Orders</option>
          <option value="created_order">Created Orders</option>
          <option value="started_printing">Started Printing</option>
        </select>
      </div>

      {/* Activity Timeline Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No activity logs match your search
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const dateObj = new Date(log.created_at);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {log.staff_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.staff_name}</span>
                        {getActionBadge(log.action)}
                        {log.job_number && (
                          <span className="font-mono font-bold text-blue-950 bg-blue-50 px-1.5 py-0.2 rounded">
                            #{log.job_number}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-1">{log.description}</p>
                    </div>
                  </div>

                  {/* Metadata: PC & Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-right text-[11px] text-slate-400 font-mono shrink-0 pl-12 sm:pl-0">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Monitor className="w-3 h-3 text-blue-700" />
                      <span></span>
                    </span>
                    <span className="mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{timeStr} · {dateStr}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
