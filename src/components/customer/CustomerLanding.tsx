import React, { useState } from 'react';
import { Shop, Language } from '../../types';
import { translations } from '../../utils/translations';
import { NamasteLogo } from '../NamasteLogo';
import { Printer, DownloadCloud, Search, Phone, MapPin, ArrowRight, Clock } from 'lucide-react';
import { getJobs, normalizeJobNumber } from '../../utils/storage';

interface CustomerLandingProps {
  shop: Shop;
  lang: Language;
  onSendClick: () => void;
  onReceiveClick: () => void;
  onTrackOrder: (jobNumber: string) => void;
}

export const CustomerLanding: React.FC<CustomerLandingProps> = ({
  shop,
  lang,
  onSendClick,
  onReceiveClick,
  onTrackOrder,
}) => {
  const t = translations[lang];
  const [searchJob, setSearchJob] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recentJobs = getJobs().slice(0, 3);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchJob.trim()) {
      setErrorMsg(lang === 'ne' ? 'कृपया जब नम्बर प्रविष्ट गर्नुहोस्' : 'Please enter a job number');
      return;
    }
    setErrorMsg('');
    const normalized = normalizeJobNumber(searchJob);
    onTrackOrder(normalized || searchJob.trim());
  };

  const statusColor = (status: string) => {
    if (status === 'completed' || status === 'ready') return { bg: '#ECFDF5', text: '#065F46' };
    if (status === 'in_progress' || status === 'processing' || status === 'printing') return { bg: '#FFFBEB', text: '#92400E' };
    if (status === 'cancelled') return { bg: '#FEF2F2', text: '#991B1B' };
    return { bg: 'var(--color-navy-light)', text: 'var(--color-navy)' };
  };

  return (
    <div className="min-h-screen bg-slate-50/60 relative overflow-hidden pb-12">
      {/* Background ambient decorative glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-b from-blue-100/50 via-blue-50/20 to-transparent blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-40 -left-20 w-80 h-80 rounded-full bg-indigo-100/30 blur-3xl -z-10 pointer-events-none" />

      {/* Shop Identity Header */}
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center mb-3">
          <NamasteLogo size="md" variant="full" showTagline={false} />
        </div>

        {/* Shop badge & details card */}
        <div className="mt-2 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/60 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Counter Terminal Active</span>
          </div>

          <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">
            {shop.shop_name}
          </h1>

          {shop.tagline && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{shop.tagline}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {shop.address && (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {shop.address}
              </span>
            )}
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                {shop.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main actions container */}
      <div className="max-w-xl mx-auto px-4 mt-2 space-y-3.5">
        {/* Send to print — primary action */}
        <button
          type="button"
          onClick={onSendClick}
          className="w-full text-left group"
        >
          <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Printer className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                  {t.sendToPrintTitle}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                  Popular
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                {t.sendToPrintDesc}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>

        {/* Receive file (PIN pickup) */}
        <button
          type="button"
          onClick={onReceiveClick}
          className="w-full text-left group"
        >
          <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <DownloadCloud className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                  {t.receiveFileTitle}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  4-Digit PIN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                {t.receiveFileDesc}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>

        {/* Track order */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="job-number-input"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.trackExistingOrder}</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">Format: NP-XXXX</span>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="job-number-input"
                type="text"
                value={searchJob}
                onChange={(e) => {
                  setSearchJob(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={t.enterJobNumber || "e.g. NP-7821"}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                autoCapitalize="characters"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow transition-all duration-150 shrink-0 cursor-pointer active:scale-95"
            >
              {t.trackButton}
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs font-semibold text-red-600 animate-shake">
              {errorMsg}
            </p>
          )}

          {recentJobs.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Clock className="w-3 h-3 text-slate-400" />
                {lang === 'ne' ? 'यस डिभाइसका हालका अर्डर' : 'Recent on this device'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentJobs.map((j) => {
                  const colors = statusColor(j.status);
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => onTrackOrder(j.job_number)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-800 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>{j.job_number}</span>
                      <span
                        className="text-[10px] font-sans font-extrabold px-1.5 py-0.5 rounded-md uppercase"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {j.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Privacy & Trust Footnote */}
        <div className="text-center pt-2 pb-4 space-y-1">
          <p className="text-xs text-slate-500 font-medium">
            🇳🇵{' '}
            {lang === 'ne'
              ? 'नेपालको स्मार्ट काउन्टर प्रिन्ट प्लेटफर्म'
              : "Nepal's smart counter print platform"}
          </p>
          <p className="text-[11px] text-slate-400">
            No registration required · Automatic 24h file privacy deletion
          </p>
        </div>
      </div>
    </div>
  );
};
