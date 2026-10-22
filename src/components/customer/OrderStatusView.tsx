import React, { useState, useEffect, useRef } from 'react';
import { Job, Shop, Language, JobFile } from '../../types';
import { translations } from '../../utils/translations';
import {
  getJobByNumber,
  cancelJob,
  replaceJobFiles,
  subscribeToStateChanges,
  normalizeJobNumber,
  getJobs
} from '../../utils/storage';
import {
  ArrowLeft,
  Clock,
  Printer,
  CheckCircle,
  FileCheck2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Upload,
  Phone,
  Store,
  MapPin,
  Check,
  Camera,
  CheckCircle2,
  Search
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';

interface OrderStatusViewProps {
  jobNumber: string;
  shop: Shop;
  lang: Language;
  onBack: () => void;
}

export const OrderStatusView: React.FC<OrderStatusViewProps> = ({
  jobNumber,
  shop,
  lang,
  onBack,
}) => {
  const t = translations[lang];
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const [activeJobNumber, setActiveJobNumber] = useState<string>(() => normalizeJobNumber(jobNumber) || jobNumber);
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchJobInput, setSearchJobInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState<string>('');
  const [replaceError, setReplaceError] = useState<string>('');
  const [replaceSuccess, setReplaceSuccess] = useState<boolean>(false);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState<boolean>(false);
  const [screenshotSaved, setScreenshotSaved] = useState<boolean>(false);
  const tokenCardRef = useRef<HTMLDivElement>(null);

  const recentJobs = getJobs().slice(0, 4);

  // Synchronize prop updates
  useEffect(() => {
    const norm = normalizeJobNumber(jobNumber) || jobNumber;
    if (norm && norm !== activeJobNumber) {
      setActiveJobNumber(norm);
    }
  }, [jobNumber]);

  const fetchJob = async (targetNum?: string) => {
    const numToFetch = targetNum || activeJobNumber;
    if (!numToFetch || !numToFetch.trim()) {
      setLoading(false);
      return;
    }
    try {
      const refreshed = await getJobByNumber(numToFetch);
      setJob(refreshed);
      if (refreshed && refreshed.job_number && refreshed.job_number !== activeJobNumber) {
        setActiveJobNumber(refreshed.job_number);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Subscribe to live status updates and poll every 3s
  useEffect(() => {
    setLoading(true);
    fetchJob(activeJobNumber);
    const interval = setInterval(() => fetchJob(activeJobNumber), 3000);
    const unsub = subscribeToStateChanges(() => {
      fetchJob(activeJobNumber);
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [activeJobNumber]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchJob(activeJobNumber);
  };

  const handleTrackDifferentJob = async (rawNum: string) => {
    if (!rawNum.trim()) {
      setSearchError(lang === 'ne' ? 'कृपया जब नम्बर प्रविष्ट गर्नुहोस्' : 'Please enter a job number');
      return;
    }
    setSearchError('');
    const normalized = normalizeJobNumber(rawNum) || rawNum.trim();
    setLoading(true);
    setActiveJobNumber(normalized);
    window.location.hash = `#status/${normalized}`;
    await fetchJob(normalized);
    setShowSearchModal(false);
    setSearchJobInput('');
  };

  const handleTakeScreenshot = async () => {
    if (!tokenCardRef.current || isTakingScreenshot || !job) return;
    setIsTakingScreenshot(true);

    try {
      const canvas = await html2canvas(tokenCardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `TrackingToken_${job.job_number}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setScreenshotSaved(true);
      setTimeout(() => setScreenshotSaved(false), 3500);
    } catch (err) {
      console.error('Screenshot capture error:', err);
    } finally {
      setIsTakingScreenshot(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!job) return;
    const res = await cancelJob(job.id);
    if (res.success) {
      await fetchJob(activeJobNumber);
      setShowCancelModal(false);
      setCancelFeedback(lang === 'ne' ? 'अर्डर रद्द गरियो' : 'Order has been cancelled.');
    } else {
      setCancelFeedback(res.message || 'Cannot cancel order.');
    }
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceError('');
    if (!e.target.files || e.target.files.length === 0 || !job) return;

    const file = e.target.files[0];
    if (file.size > 20 * 1024 * 1024) {
      setReplaceError(
        lang === 'ne'
          ? 'फाइल २० MB भन्दा ठूलो छ।'
          : 'File exceeds 20MB limit.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const newFile: JobFile = {
        id: `file_${Date.now()}_rep`,
        job_id: job.id,
        file_name: file.name,
        file_path: `/uploads/${file.name}`,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        data_url: reader.result as string,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const res = await replaceJobFiles(job.id, [newFile]);
      if (res.success && res.job) {
        setJob({ ...res.job });
        setReplaceSuccess(true);
        setTimeout(() => {
          setReplaceSuccess(false);
          setShowReplaceModal(false);
        }, 1500);
      } else {
        setReplaceError(res.message || 'Failed to replace file.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Loading Screen
  if (loading && job === undefined) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">
          {lang === 'ne' ? 'अर्डर स्थिति लोड हुँदैछ...' : 'Loading order status...'}
        </p>
      </div>
    );
  }

  // Order Not Found Screen with inline search & recent jobs
  if (!job) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-slate-500">
            {t.orderStatusTitle}
          </span>
          <div className="w-9" />
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {lang === 'ne' ? 'अर्डर फेला परेन' : 'Order Not Found'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {lang === 'ne'
                ? `जब नम्बर '${activeJobNumber}' प्रणालीमा फेला परेन। कृपया सही नम्बर जाँच गरी पुनः प्रयास गर्नुहोस्।`
                : `No order found for job number '${activeJobNumber}'. Please verify your token and try again.`}
            </p>
          </div>

          {/* Inline Retry Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrackDifferentJob(searchJobInput);
            }}
            className="space-y-2 pt-2 text-left"
          >
            <label className="block text-xs font-bold text-slate-700">
              {t.trackExistingOrder}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchJobInput}
                  onChange={(e) => {
                    setSearchJobInput(e.target.value);
                    setSearchError('');
                  }}
                  placeholder={t.enterJobNumber}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase font-mono"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                {t.trackButton}
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-red-600 font-medium">{searchError}</p>
            )}
          </form>

          {/* Recent Orders quick chips */}
          {recentJobs.length > 0 && (
            <div className="pt-3 border-t border-slate-100 text-left space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 block">
                {lang === 'ne' ? 'यस डिभाइसमा हालका अर्डरहरू:' : 'Recent orders on this device:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentJobs.map((rj) => (
                  <button
                    key={rj.id}
                    type="button"
                    onClick={() => handleTrackDifferentJob(rj.job_number)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-mono font-bold transition-all active:scale-[0.98]"
                  >
                    <span>{rj.job_number}</span>
                    <span className="text-[10px] font-sans font-normal text-blue-600">
                      ({rj.status})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {t.backToHome}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stages definition (Section 3.5)
  const stages = [
    { key: 'new', label: t.stageNew, desc: t.stageNewDesc, icon: Clock },
    { key: 'processing', label: t.stageProcessing, desc: t.stageProcessingDesc, icon: Printer },
    { key: 'ready', label: t.stageReady, desc: t.stageReadyDesc, icon: FileCheck2 },
    { key: 'completed', label: t.stageCompleted, desc: t.stageCompletedDesc, icon: CheckCircle },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'new':
      case 'unassigned':
        return 0;
      case 'assigned':
      case 'in_progress':
      case 'processing':
      case 'printing':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageIndex(job.status);
  const isCancelled = job.status === 'cancelled';
  const isCompleted = job.status === 'completed';
  const isReady = job.status === 'ready';
  const isProcessing =
    job.status === 'processing' ||
    job.status === 'in_progress' ||
    job.status === 'printing' ||
    job.status === 'assigned';
  const canCancelOrModify = job.status === 'new' || job.status === 'unassigned';

  const effectiveShopName = job.shop_name || shop.shop_name;
  const effectiveShopPhone = job.shop_phone || shop.phone;
  const effectiveShopAddress = job.shop_address || shop.address;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-slate-500">
          {t.orderStatusTitle}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Track Another Order"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="p-2 rounded-xl hover:bg-slate-100 text-blue-700 transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Order Reference Card (Target for Screenshot Capture) */}
      <div
        ref={tokenCardRef}
        className="p-6 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white rounded-3xl shadow-xl shadow-blue-950/20 border border-blue-500/20 space-y-3.5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-300">
              {t.orderStatusFor}
            </span>
          </div>
          <span className="text-xs font-mono text-blue-300 font-semibold">
            {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-baseline justify-between relative z-10 pt-1">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white">
            {job.job_number}
          </span>
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
              isCancelled
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : isCompleted
                ? 'bg-emerald-400 text-emerald-950 font-black shadow-sm'
                : isReady
                ? 'bg-emerald-400 text-emerald-950 font-black animate-pulse shadow-sm shadow-emerald-400/30'
                : isProcessing
                ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                : 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
            }`}
          >
            {isCancelled
              ? t.stageCancelled
              : isCompleted
              ? t.stageCompleted
              : isReady
              ? t.stageReady
              : isProcessing
              ? t.stageProcessing
              : t.stageNew}
          </span>
        </div>

        {/* Customer & Shop name */}
        <div className="pt-3 border-t border-blue-800/60 flex items-center justify-between text-xs text-blue-100 relative z-10">
          <span className="font-medium text-slate-300">{job.customer_name ? `Customer: ${job.customer_name}` : 'Counter Walk-in'}</span>
          <span className="text-blue-300 font-bold">{effectiveShopName}</span>
        </div>

        {typeof job.order_amount === 'number' && job.order_amount > 0 && (
          <div className="pt-2 border-t border-blue-800/60 flex items-center justify-between text-xs relative z-10">
            <span className="text-blue-300 font-medium">{t.orderAmountLabel || 'Order Total'}:</span>
            <span className="font-mono font-black text-emerald-300 text-base">
              Rs. {job.order_amount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Screenshot Token Action Button */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={handleTakeScreenshot}
          disabled={isTakingScreenshot}
          className={`w-full py-3 px-4 rounded-2xl font-bold text-xs shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
            screenshotSaved
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 hover:border-blue-300 shadow-slate-200/50'
          }`}
        >
          {isTakingScreenshot ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
              <span>{t.savingTokenScreenshot}</span>
            </>
          ) : screenshotSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>{t.tokenScreenshotSaved}</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-blue-600" />
              <span>{t.takeTokenScreenshot}</span>
            </>
          )}
        </button>

        {screenshotSaved && (
          <p className="text-[11px] text-emerald-600 font-bold animate-fade-in text-center">
            ✓ {lang === 'ne' ? 'स्क्रिनसट ग्यालरी वा डाउनलोड्समा सुरक्षित भयो!' : 'Screenshot downloaded to your device gallery!'}
          </p>
        )}
      </div>

      {/* Cancelled Banner if applicable */}
      {isCancelled ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <XCircle className="w-6 h-6 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">{t.stageCancelled}</p>
            <p className="text-red-600 mt-0.5">{t.stageCancelledDesc}</p>
          </div>
        </div>
      ) : (
        /* Section 3.5: 4-Stage Progress Timeline */
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Live Print Progress
            </h3>
            <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">
              Real-Time
            </span>
          </div>

          <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {stages.map((stage, idx) => {
              const isPastOrCurrent = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex items-start gap-3.5 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 ring-4 ring-blue-500/10'
                        : isPastOrCurrent
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="pt-0.5">
                    <p
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-slate-900 font-display'
                          : isPastOrCurrent
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pickup Banner when Ready */}
          {isReady && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600" />
                {lang === 'ne' ? 'प्रिन्ट तयार भयो!' : 'Your print is ready!'}
              </p>
              <p className="text-emerald-700">
                {t.pickupNotice || 'Your print job is finished. Please visit the counter to collect.'}
              </p>
            </div>
          )}

          {/* Completed Banner */}
          {isCompleted && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {lang === 'ne' ? 'अर्डर सम्पन्न भयो (सम्पन्न)!' : 'Order completed & collected!'}
              </p>
              <p className="text-emerald-700">
                {lang === 'ne'
                  ? 'तपाईंको प्रिन्ट काम सफलतापूर्वक सम्पन्न भई हस्तान्तरण गरिएको छ। सेवा प्रयोग गर्नुभएकोमा धन्यवाद!'
                  : 'Your print order has been completed and collected. Thank you for using our service!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Print Specifications Review Card */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider">
          Order Details
        </h4>
        <div className="grid grid-cols-2 gap-2 text-slate-600">
          <div>
            <span className="text-slate-400 block">{t.serviceType}</span>
            <span className="font-semibold text-slate-800">
              {job.service_type === 'citizenship'
                ? t.serviceCitizenship
                : job.service_type === 'print'
                ? t.servicePrint
                : job.service_type === 'photocopy'
                ? t.servicePhotocopy
                : job.service_type === 'photo_print'
                ? t.servicePhotoPrint
                : job.service_type}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{t.copies}</span>
            <span className="font-bold text-slate-800">{job.copies}</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t.colorMode}</span>
            <span className="font-semibold text-slate-800">
              {job.is_color
                ? 'Color'
                : job.service_type === 'citizenship'
                ? 'B/W Photocopy'
                : 'B/W'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{t.paperSize}</span>
            <span className="font-semibold text-slate-800">
              {job.service_type === 'citizenship'
                ? 'A4 · Single-sided (A4 2-in-1)'
                : `${job.paper_size} · ${job.is_double_sided ? 'Double-sided' : 'Single-sided'}`}
            </span>
          </div>
        </div>

        {/* Order Price & Print Volume */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">{t.totalBillablePrints || 'Total Sheets'}</span>
            <span className="font-bold text-slate-800 font-mono">
              {job.total_prints || (job.copies * (job.page_count || 1))} sheets
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">{t.orderAmountLabel || 'Order Total'}</span>
            <span className="font-black text-blue-900 font-mono text-base">
              Rs. {(job.order_amount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Files in order */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-slate-400 block mb-1.5">{t.selectedFiles} ({job.files.length})</span>
          <div className="space-y-1.5">
            {job.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-slate-700 text-xs">
                <div className="flex items-center gap-2 truncate mr-2">
                  {file.file_type.includes('pdf') ? (
                    <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate font-medium">{file.file_name}</span>
                </div>
                {file.print_status === 'printed' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded shrink-0">
                    Printed
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Customer Instructions if any */}
        {job.instructions && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-slate-400 block mb-0.5">Instructions:</span>
            <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg">
              "{job.instructions}"
            </p>
          </div>
        )}
      </div>

      {/* Customer Quick Actions: Replace File or Cancel Order (allowed while New/Unassigned) */}
      {!isCancelled && !isCompleted && (
        <div className="space-y-2">
          {cancelFeedback && (
            <p className="text-xs text-center font-medium text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
              {cancelFeedback}
            </p>
          )}

          <div className="flex gap-2">
            {/* Replace File Button */}
            <button
              type="button"
              disabled={!canCancelOrModify}
              onClick={() => setShowReplaceModal(true)}
              className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                canCancelOrModify
                  ? 'bg-white hover:bg-slate-50 text-blue-900 border-blue-200 shadow-xs'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={!canCancelOrModify ? t.replaceDisabledHint : ''}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.replaceFile}</span>
            </button>

            {/* Cancel Order Button */}
            <button
              type="button"
              disabled={!canCancelOrModify}
              onClick={() => setShowCancelModal(true)}
              className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                canCancelOrModify
                  ? 'bg-white hover:bg-red-50 text-red-600 border-red-200 shadow-xs'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={!canCancelOrModify ? t.cancelOrderDisabledHint : ''}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{t.cancelOrder}</span>
            </button>
          </div>

          {!canCancelOrModify && (
            <p className="text-[11px] text-center text-slate-400">
              {t.cancelOrderDisabledHint}
            </p>
          )}
        </div>
      )}

      {/* Shop Info Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-700" />
            <span>{effectiveShopName}</span>
          </p>
          <p className="text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{effectiveShopAddress}</span>
          </p>
        </div>
        <a
          href={`tel:${effectiveShopPhone}`}
          className="p-2.5 bg-white text-blue-700 hover:text-blue-900 border border-slate-200 rounded-xl shadow-xs shrink-0"
        >
          <Phone className="w-4 h-4" />
        </a>
      </div>

      {/* Modal: Track Another Order */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {t.trackExistingOrder}
              </h3>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrackDifferentJob(searchJobInput);
              }}
              className="space-y-2"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchJobInput}
                  onChange={(e) => {
                    setSearchJobInput(e.target.value);
                    setSearchError('');
                  }}
                  placeholder={t.enterJobNumber}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase font-mono"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>

              {searchError && (
                <p className="text-xs text-red-600 font-medium">{searchError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs"
                >
                  {t.back}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs"
                >
                  {t.trackButton}
                </button>
              </div>
            </form>

            {recentJobs.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {lang === 'ne' ? 'हालका अर्डरहरू:' : 'Recent orders:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentJobs.map((rj) => (
                    <button
                      key={rj.id}
                      type="button"
                      onClick={() => handleTrackDifferentJob(rj.job_number)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-mono font-bold"
                    >
                      <span>{rj.job_number}</span>
                      <span className="text-[10px] font-sans font-normal text-blue-600">
                        ({rj.status})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 3.6: Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl animate-scale-in">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {t.cancelOrder}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t.cancelOrderConfirm}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                {t.confirmCancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 3.7: Replace File Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {t.replaceFile}
              </h3>
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              {t.replaceFileDesc}
            </p>

            <div
              onClick={() => replaceFileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 p-6 rounded-xl text-center cursor-pointer transition-all"
            >
              <input
                ref={replaceFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleReplaceFileChange}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-blue-700 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-blue-900">
                {t.selectReplacementFile}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                PDF, JPG, PNG (Max 20MB)
              </p>
            </div>

            {replaceError && (
              <p className="text-xs text-red-600 font-medium">{replaceError}</p>
            )}

            {replaceSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center">
                File successfully replaced!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
