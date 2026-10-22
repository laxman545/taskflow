import React, { useState } from 'react';
import { Job, StaffMember, Language } from '../../types';
import { claimJob } from '../../utils/storage';
import {
  Inbox,
  CheckCircle2,
  FileText,
  Clock,
  User,
  Monitor,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';

interface AvailableJobsViewProps {
  jobs: Job[];
  currentUser: StaffMember | null;
  "": string;
  lang: Language;
  onJobClaimed: (claimedJob: Job) => void;
  onOpenJobDetail: (job: Job) => void;
}

export const AvailableJobsView: React.FC<AvailableJobsViewProps> = ({
  jobs,
  currentUser,
  lang,
  onJobClaimed,
  onOpenJobDetail,
}) => {
  const [claimError, setClaimError] = useState<string>('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Filter unassigned jobs (Requirement 11)
  const unassignedJobs = jobs.filter(
    (j) => (j.status === 'unassigned' || (j.status === 'new' && !j.assigned_to))
  );

  const handleClaim = async (job: Job) => {
    if (!currentUser) {
      setClaimError('Please log in with a staff account to claim jobs.');
      return;
    }

    setClaimError('');
    setClaimingId(job.id);

    try {
      const result = await claimJob(job.id, currentUser.name);
      setClaimingId(null);
      if (result.success && result.job) {
        onJobClaimed(result.job);
      } else {
        setClaimError('Failed to claim job.');
      }
    } catch {
      setClaimingId(null);
      setClaimError('Failed to claim job.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <Inbox className="w-5 h-5 text-blue-900" />
              <span>Available Jobs Pool</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-black bg-blue-100 text-blue-900 rounded-full font-mono">
              {unassignedJobs.length} Unassigned
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming orders waiting to be claimed and processed by staff
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400">Claiming as:</span>
            <span className="font-bold text-slate-800">{currentUser.name}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-blue-900 font-semibold">{""}</span>
          </div>
        )}
      </div>

      {claimError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{claimError}</span>
        </div>
      )}

      {/* Available Jobs Queue Cards */}
      {unassignedJobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-700">All Jobs Have Been Claimed!</p>
          <p className="text-slate-500">
            There are currently no unassigned print jobs in the queue. New orders from customers or other PCs will appear here automatically in real time
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unassignedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 to-indigo-600" />

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black font-mono tracking-wider text-blue-950">
                    #{job.job_number}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 rounded-full">
                    UNASSIGNED
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {job.customer_name || 'Walk-in Counter Customer'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize font-medium">
                    {job.service_type.replace('_', ' ')} · {job.paper_size} · {job.is_color ? 'Color' : 'B/W'}{' '}
                    {job.is_double_sided ? '· 2-Sided' : ''}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Volume:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {job.total_prints} sheets ({job.copies}x copies)
                  </span>
                </div>

                {job.instructions && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg italic line-clamp-2">
                    "{job.instructions}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                  <span>{job.files.length} file(s) attached</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenJobDetail(job)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Preview
                </button>

                <button
                  type="button"
                  disabled={claimingId === job.id}
                  onClick={() => handleClaim(job)}
                  className="flex-1 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{claimingId === job.id ? 'Claiming...' : 'Claim Job'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
