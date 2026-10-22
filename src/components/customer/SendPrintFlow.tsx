import React, { useState, useRef, useEffect } from 'react';
import { Shop, Language, ServiceType, PaperSize, JobFile, Job } from '../../types';
import { translations } from '../../utils/translations';
import { addJob } from '../../utils/storage';
import { calculateOrderPrice } from '../../utils/analytics';
import {
  calculateDynamicOrderPrice,
  getStartingServicePrice,
  fetchShopServices,
  getShopServices
} from '../../utils/servicesStorage';
import confetti from 'canvas-confetti';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Plus,
  Minus,
  CreditCard,
  Sparkles,
  Camera,
  Download,
  Tag
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { CitizenshipMerger, MergedCitizenshipResult } from './CitizenshipMerger';

interface SendPrintFlowProps {
  shop: Shop;
  lang: Language;
  initialServiceType?: ServiceType;
  onBack: () => void;
  onViewStatus: (jobNumber: string) => void;
}

export const SendPrintFlow: React.FC<SendPrintFlowProps> = ({
  shop,
  lang,
  initialServiceType = 'print',
  onBack,
  onViewStatus,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow step: 'form' | 'review' | 'success'
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');

  // Form states
  const [files, setFiles] = useState<JobFile[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>(initialServiceType);
  const [citizenshipResult, setCitizenshipResult] = useState<MergedCitizenshipResult | null>(null);
  const [copies, setCopies] = useState<number>(1);
  const [isColor, setIsColor] = useState<boolean>(false);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [isDoubleSided, setIsDoubleSided] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');

  // Status & validation states
  const [fileError, setFileError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdJob, setCreatedJob] = useState<Job | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState<boolean>(false);
  const [screenshotSaved, setScreenshotSaved] = useState<boolean>(false);
  const tokenCardRef = useRef<HTMLDivElement>(null);

  // Fetch latest active shop services on mount or shop change
  useEffect(() => {
    fetchShopServices(shop.id).catch(() => {});
  }, [shop.id]);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles: JobFile[] = [];
    const maxSizeBytes = 20 * 1024 * 1024; // 20 MB max

    Array.from(e.target.files).forEach((file) => {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png)$/i)) {
        setFileError(
          lang === 'ne'
            ? `${file.name}: असमर्थित ढाँचा। केवल PDF, JPG वा PNG फाइलहरू समर्थित छन्।`
            : `${file.name}: Unsupported file format. Only PDF, JPG, or PNG are allowed.`
        );
        return;
      }

      // Validate 20 MB size limit
      if (file.size > maxSizeBytes) {
        setFileError(
          lang === 'ne'
            ? `${file.name}: फाइल २० MB भन्दा ठूलो छ।`
            : `${file.name}: File exceeds 20MB limit.`
        );
        return;
      }

      // Convert to local data URL for preview/storage
      const reader = new FileReader();
      reader.onload = () => {
        const jobFile: JobFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          job_id: '',
          file_name: file.name,
          file_path: `/uploads/${file.name}`,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          data_url: reader.result as string,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        setFiles((prev) => [...prev, jobFile]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const effectiveFiles =
    serviceType === 'citizenship'
      ? citizenshipResult
        ? [citizenshipResult.mergedFile]
        : []
      : files;

  const effectivePageCount = Math.max(1, effectiveFiles.length);
  const effectivePaperSize =
    serviceType === 'citizenship'
      ? (citizenshipResult?.paperSize || 'A5')
      : paperSize;
  const effectiveIsDoubleSided = serviceType === 'citizenship' ? false : isDoubleSided;

  const dynamicPricing = calculateDynamicOrderPrice({
    serviceType,
    paperSize: effectivePaperSize,
    isColor,
    copies,
    pageCount: effectivePageCount,
    isDoubleSided: effectiveIsDoubleSided,
    shopId: shop.id,
  });

  const handleProceedToReview = () => {
    if (serviceType === 'citizenship') {
      if (!citizenshipResult) {
        setFileError(
          lang === 'ne'
            ? 'कृपया नागरिकताको अगाडि र पछाडि दुवै भाग फोटो अपलोड गर्नुहोस्।'
            : 'Please upload both front and back sides of your citizenship card.'
        );
        return;
      }
    } else {
      if (files.length === 0) {
        setFileError(
          lang === 'ne'
            ? 'कृपया कम्तिमा एउटा फाइल अपलोड गर्नुहोस्'
            : 'Please upload at least one file to print'
        );
        return;
      }
    }
    setFileError('');
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const filesToSubmit =
      serviceType === 'citizenship' && citizenshipResult
        ? [citizenshipResult.mergedFile, ...citizenshipResult.rawFiles]
        : files;

    const paperSizeToSubmit =
      serviceType === 'citizenship'
        ? (citizenshipResult?.paperSize || 'A5')
        : paperSize;
    const isDoubleSidedToSubmit = serviceType === 'citizenship' ? false : isDoubleSided;
    const paperModeLabel =
      citizenshipResult?.paperMode === 'a5'
        ? 'A5 Half Paper'
        : citizenshipResult?.paperMode === 'a4_combo'
        ? 'A4 Combo (Half Citizenship + Half Other Document)'
        : 'A4 Full Sheet';

    const instructionsToSubmit =
      serviceType === 'citizenship'
        ? instructions.trim()
          ? `[नागरिकता प्रिन्ट / ${paperModeLabel}] ${instructions.trim()}`
          : `[नागरिकता प्रिन्ट / ${paperModeLabel}]`
        : instructions;

    try {
      const job = await addJob({
        shop_id: shop.id,
        customer_name: customerName,
        service_type: serviceType,
        copies,
        is_color: isColor,
        paper_size: paperSizeToSubmit,
        is_double_sided: isDoubleSidedToSubmit,
        page_count: effectivePageCount,
        total_prints: dynamicPricing.totalPrints,
        order_amount: dynamicPricing.totalAmount,
        instructions: instructionsToSubmit,
        files: filesToSubmit,
      });

      setCreatedJob(job);
      setStep('success');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0842B0', '#E61A24', '#00C853'],
        });
      } catch {
        // Confetti fallback
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyJobNumber = () => {
    if (!createdJob) return;
    navigator.clipboard.writeText(createdJob.job_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTakeScreenshot = async () => {
    if (!tokenCardRef.current || isTakingScreenshot || !createdJob) return;
    setIsTakingScreenshot(true);

    try {
      const canvas = await html2canvas(tokenCardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `TrackingToken_${createdJob.job_number}.png`;
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

  // ---------------- Render Step 3: Success Screen ----------------
  if (step === 'success' && createdJob) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            {t.orderSubmitted}
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {t.orderNextStep}
          </p>
        </div>

        {/* Prominent Job Tracking Token Card (Target for Screenshot Capture) */}
        <div
          ref={tokenCardRef}
          className="bg-white border-2 border-blue-600/90 rounded-3xl p-5 sm:p-6 shadow-md text-slate-900 text-left relative overflow-hidden space-y-3.5"
        >
          {/* Shop Header & Order Timestamp */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block leading-tight">
                {shop.shop_name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Official Order Token Pass
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {new Date(createdJob.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Central Token Box */}
          <div className="py-3 px-4 text-center bg-blue-50/90 rounded-2xl border border-blue-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-800">
              {t.yourJobNumber}
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-blue-950 tracking-wider">
                {createdJob.job_number}
              </span>
              <button
                type="button"
                onClick={handleCopyJobNumber}
                className="p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-200/60 rounded-xl transition-colors shrink-0"
                title={t.copyJobCode}
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Key Specs Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Customer</span>
              <span className="font-bold text-slate-800 truncate block">
                {createdJob.customer_name || 'Walk-in Customer'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Service</span>
              <span className="font-bold text-slate-800 truncate block capitalize">
                {createdJob.service_type === 'citizenship'
                  ? 'Citizenship Print'
                  : createdJob.service_type === 'photocopy'
                  ? 'Photocopy'
                  : createdJob.service_type === 'photo_print'
                  ? 'Photo Print'
                  : 'Document Print'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Specifications</span>
              <span className="font-semibold text-slate-700 block text-[11px]">
                {createdJob.paper_size} · {createdJob.is_color ? 'Color' : 'B/W'} · {createdJob.copies} {createdJob.copies > 1 ? 'copies' : 'copy'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Current Status</span>
              <span className="font-bold text-blue-900 block text-xs">
                {t.statusReceived}
              </span>
            </div>
          </div>

          {/* Billable Amount Banner on Token Pass */}
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                {t.orderAmountLabel || 'Order Total'}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                {createdJob.total_prints || 1} prints ({createdJob.page_count || 1} pages × {createdJob.copies || 1} {createdJob.copies > 1 ? 'copies' : 'copy'})
              </span>
            </div>
            <span className="text-xl font-black font-mono text-emerald-800">
              Rs. {(createdJob.order_amount || 0).toLocaleString()}
            </span>
          </div>

          {/* Dotted Tear Line & Counter Notice */}
          <div className="pt-2 border-t border-dashed border-slate-300 flex items-center justify-center gap-1.5 text-[11px] text-slate-600 text-center font-medium">
            <span className="text-slate-400">✂</span>
            <span>{t.keepThisNumber}</span>
          </div>
        </div>

        {/* Screenshot Token Button (Requested Feature) */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={handleTakeScreenshot}
            disabled={isTakingScreenshot}
            className={`w-full h-12 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 ${
              screenshotSaved
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {isTakingScreenshot ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t.savingTokenScreenshot}</span>
              </>
            ) : screenshotSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{t.tokenScreenshotSaved}</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-emerald-100" />
                <span>{t.takeTokenScreenshot}</span>
              </>
            )}
          </button>

          {screenshotSaved && (
            <p className="text-[11px] text-emerald-700 font-semibold animate-fade-in text-center">
              ✓ {lang === 'ne' ? 'स्क्रिनसट ग्यालरी वा डाउनलोड्समा सुरक्षित भयो!' : 'Screenshot downloaded to your device gallery!'}
            </p>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => onViewStatus(createdJob.job_number)}
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.trackOrderNow}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full h-11 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors cursor-pointer"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Render Step 2: Review Order Screen (Section 3.3) ----------------
  if (step === 'review') {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {t.reviewTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.reviewSubtitle}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
          {/* Files List Preview */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{t.selectedFiles} ({effectiveFiles.length})</span>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-blue-700 hover:underline"
              >
                Edit
              </button>
            </div>

            {serviceType === 'citizenship' && citizenshipResult ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-900 text-white rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="font-bold text-xs text-blue-950">
                      {t.serviceCitizenship}
                    </p>
                    <p className="text-[10px] text-blue-700">
                      {citizenshipResult.paperMode === 'a5'
                        ? 'A5 Half Paper · Front & Back'
                        : citizenshipResult.paperMode === 'a4_combo'
                        ? 'A4 Combo · Half Citizenship + Half Other Document'
                        : 'A4 Full Sheet · Front Top / Back Bottom'}
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full uppercase">
                    {citizenshipResult.paperMode === 'a5'
                      ? 'A5 Half'
                      : citizenshipResult.paperMode === 'a4_combo'
                      ? 'A4 Combo'
                      : 'A4 Full'}
                  </span>
                </div>

                {citizenshipResult.mergedFile.data_url && (
                  <div
                    className={`max-w-[160px] mx-auto ${
                      citizenshipResult.paperMode === 'a5' && citizenshipResult.orientation === 'landscape'
                        ? 'aspect-[1.414/1]'
                        : 'aspect-[1/1.414]'
                    } bg-white border-2 border-slate-300 rounded-lg shadow-sm overflow-hidden`}
                  >
                    <img
                      src={citizenshipResult.mergedFile.data_url}
                      alt="Citizenship Sheet"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <p className="text-[10px] text-center text-slate-500 font-mono">
                  {citizenshipResult.mergedFile.file_name} ({formatFileSize(citizenshipResult.mergedFile.file_size)})
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {effectiveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.file_type.includes('pdf') ? (
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <span className="truncate font-medium text-slate-800">{file.file_name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0 ml-2">
                      {formatFileSize(file.file_size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Option Breakdown */}
          <div className="p-4 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">{t.summaryService}</span>
              <span className="font-semibold text-slate-900 capitalize">
                {serviceType === 'print'
                  ? t.servicePrint
                  : serviceType === 'photocopy'
                  ? t.servicePhotocopy
                  : serviceType === 'photo_print'
                  ? t.servicePhotoPrint
                  : t.serviceCitizenship}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">{t.summaryCopies}</span>
              <span className="font-bold text-slate-900">{copies} {copies > 1 ? 'copies' : 'copy'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">{t.summaryColor}</span>
              <span className="font-semibold text-slate-900">
                {isColor ? (
                  <span className="text-indigo-600 font-bold">{t.colorModeColor}</span>
                ) : (
                  <span>{serviceType === 'citizenship' ? t.photocopyGrayscale : t.colorModeBw}</span>
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">{t.summaryPaper}</span>
              <span className="font-semibold text-slate-900">
                {serviceType === 'citizenship'
                  ? citizenshipResult?.paperMode === 'a5'
                    ? 'A5 Half Paper · Single-sided'
                    : citizenshipResult?.paperMode === 'a4_combo'
                    ? 'A4 Combo (Half Citizenship + Half Other Document)'
                    : 'A4 Full Sheet · Single-sided'
                  : `${paperSize} · ${isDoubleSided ? t.doubleSided : t.singleSided}`}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">{t.summaryCustomer}</span>
              <span className="font-medium text-slate-900">
                {customerName.trim() || t.noneSpecified}
              </span>
            </div>

            {/* Applied Service Rate & Estimated Price Row */}
            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-700" />
                  <span>{t.activeServiceRate}:</span>
                </span>
                <span className="font-bold text-blue-950 font-mono">
                  {dynamicPricing.matchedServiceName} · Rs. {dynamicPricing.unitPrice} {dynamicPricing.unitLabel}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-blue-200/60 font-bold">
                <div>
                  <span className="text-slate-800 text-xs block">{t.estimatedTotal}:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {dynamicPricing.totalPrints} sheets × Rs. {dynamicPricing.unitPrice}
                  </span>
                </div>
                <span className="text-blue-900 font-mono text-xl font-black">
                  Rs. {dynamicPricing.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {instructions.trim() && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block mb-1">{t.summaryInstructions}</span>
                <p className="p-2 bg-slate-50 rounded-lg text-slate-700 italic">
                  "{instructions.trim()}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Clear compact summary badge */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 text-center font-medium leading-relaxed">
          {effectiveFiles.length} {effectiveFiles.length === 1 ? 'file' : 'files'} •{' '}
          {serviceType === 'citizenship'
            ? citizenshipResult?.paperMode === 'a5'
              ? 'A5 Half Paper'
              : citizenshipResult?.paperMode === 'a4_combo'
              ? 'A4 Combo Sheet'
              : 'A4 Full Sheet'
            : paperSize}{' '}
          • {isColor ? 'Color' : 'B/W'} •{' '}
          {serviceType === 'citizenship'
            ? 'Single-sided'
            : isDoubleSided
            ? 'Double-sided'
            : 'Single-sided'}{' '}
          • {copies} {copies === 1 ? 'copy' : 'copies'} •{' '}
          {serviceType === 'citizenship' ? t.serviceCitizenship : serviceType}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinalSubmit}
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{t.sendingOrder}</span>
            ) : (
              <>
                <span>{t.sendOrderButton}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            {t.back}
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Render Step 1: Upload & Options Form ----------------
  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            {t.sendHeader}
          </h2>
          <p className="text-xs text-slate-500">
            {shop.shop_name}
          </p>
        </div>
      </div>

      {/* 1. Service Type Selector (Prominent at top so upload adjusts to selected mode) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t.serviceType}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'print', label: t.servicePrint, icon: FileText },
            { id: 'photocopy', label: t.servicePhotocopy, icon: Copy },
            { id: 'photo_print', label: t.servicePhotoPrint, icon: ImageIcon },
            { id: 'citizenship', label: t.serviceCitizenship, icon: CreditCard, badge: 'A5 / A4' },
          ].map((srv) => {
            const Icon = srv.icon;
            const isSelected = serviceType === srv.id;
            const starting = getStartingServicePrice(srv.id as ServiceType, shop.id);
            return (
              <button
                key={srv.id}
                type="button"
                onClick={() => {
                  setServiceType(srv.id as ServiceType);
                  setFileError('');
                  if (srv.id === 'citizenship') {
                    setPaperSize(citizenshipResult?.paperSize || 'A5');
                    setIsDoubleSided(false);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[80px] cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-200' : 'text-blue-700'}`} />
                  {srv.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                        isSelected
                          ? 'bg-emerald-400 text-blue-950'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {srv.badge}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold leading-tight mt-1 line-clamp-1 block">
                    {srv.label}
                  </span>
                  <span className={`text-[10px] font-medium mt-0.5 block ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                    Rs. {starting.minPrice} {starting.unitLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Upload Files or Citizenship Merger */}
      {serviceType === 'citizenship' ? (
        <div className="space-y-2">
          <CitizenshipMerger
            lang={lang}
            isColor={isColor}
            onColorChange={setIsColor}
            onMergedChange={(merged) => {
              setCitizenshipResult(merged);
              if (merged) {
                setFileError('');
                setPaperSize(merged.paperSize);
              }
            }}
          />
          {fileError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t.step1Upload}
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 p-6 rounded-2xl text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 bg-white rounded-xl shadow-xs text-blue-700 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-blue-950">
              {t.dragDropText}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {t.supportedFormats}
            </p>
          </div>

          {fileError && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                <span>{t.selectedFiles} ({files.length})</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-700 hover:underline flex items-center gap-1 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addMoreFiles}</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      {file.file_type.includes('pdf') ? (
                        <FileText className="w-5 h-5 text-red-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">
                          {file.file_name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title={t.removeFile}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Print Options */}
      <div className="space-y-4 pt-2 border-t border-slate-200">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {t.step2Options}
        </label>

        {/* Copies Counter */}
        <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
          <div>
            <span className="block text-xs font-bold text-slate-900">{t.copies}</span>
            <span className="text-[11px] text-slate-500">Total sets to produce</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCopies(Math.max(1, copies - 1))}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm font-mono">{copies}</span>
            <button
              type="button"
              onClick={() => setCopies(copies + 1)}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Citizenship specific options / standard options */}
        {serviceType === 'citizenship' ? (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Paper Format:</span>
              <span className="font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                {citizenshipResult?.paperMode === 'a5'
                  ? 'A5 Half Paper (148×210mm)'
                  : citizenshipResult?.paperMode === 'a4_combo'
                  ? 'A4 Combo (Half Citizenship + Half Other Document)'
                  : 'A4 Full Sheet (210×297mm)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Layout:</span>
              <span className="font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {citizenshipResult?.paperMode === 'a5'
                  ? 'A5 Half Sheet · Front & Back'
                  : citizenshipResult?.paperMode === 'a4_combo'
                  ? 'Top: Citizenship Front & Back · Bottom: Other Document'
                  : 'Top Half Front · Bottom Half Back'}
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Color Mode & Paper Size Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Color Mode */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.colorMode}
                </span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsColor(false)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                      !isColor ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    B/W
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsColor(true)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                      isColor ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Color
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.paperSize}
                </span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaperSize('A4')}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                      paperSize === 'A4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    A4
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize('A3')}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
                      paperSize === 'A3' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    A3
                  </button>
                </div>
              </div>
            </div>

            {/* Single or Double Sided */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.singleDouble}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsDoubleSided(false)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    !isDoubleSided
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.singleSided}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDoubleSided(true)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    isDoubleSided
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.doubleSided}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Optional Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.customerNameOptional}
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t.customerNamePlaceholder}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Optional Customer Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {t.instructionsOptional}
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t.instructionsPlaceholder}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* 4. Live Pricing & Rate Estimate Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 text-white p-4 rounded-2xl shadow-sm border border-blue-800/80 space-y-2.5 animate-fade-in">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-bold text-blue-100 tracking-wide truncate">
              {dynamicPricing.matchedServiceName}
            </span>
          </div>
          <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-blue-200 shrink-0 whitespace-nowrap">
            {t.activeServiceRate}: Rs. {dynamicPricing.unitPrice} {dynamicPricing.unitLabel}
          </span>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-white/10">
          <div>
            <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold block">
              {t.estimatedTotal}
            </span>
            <span className="text-xs text-blue-200 font-medium">
              {effectivePageCount} {effectivePageCount === 1 ? 'file' : 'files'} × {copies} {copies === 1 ? 'copy' : 'copies'} ({dynamicPricing.totalPrints} {dynamicPricing.totalPrints === 1 ? 'sheet' : 'sheets'})
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-emerald-300 leading-none block">
              Rs. {dynamicPricing.totalAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-300 font-medium">
              ({dynamicPricing.totalPrints} × Rs. {dynamicPricing.unitPrice})
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Button (Proceed to Review Order) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleProceedToReview}
          className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{t.continueToReview}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
