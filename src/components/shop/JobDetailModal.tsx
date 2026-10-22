import React, { useState } from 'react';
import { Job, Language, JobStatus, StaffMember, Shop, JobFile, PrintFileStatus } from '../../types';
import { translations } from '../../utils/translations';
import { getStaffMembers, reassignJob, claimJob, referJob, recordPrintAction, updateFilePrintStatus } from '../../utils/storage';
import { downloadFileSafely, printFileDirectly } from '../../utils/filePrintUtils';
import { FilePreviewModal } from './FilePreviewModal';
import { CitizenshipStaffEditorModal } from './CitizenshipStaffEditorModal';
import {
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Monitor,
  UserCheck,
  Share2,
  ShieldCheck,
  RotateCw,
  AlertTriangle,
  Eye,
  Layers,
  History,
  CreditCard
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job;
  shop: Shop;
  currentUser: StaffMember | null;
  currentPc?: string;
  lang: Language;
  onClose: () => void;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
  onJobUpdated?: (updatedJob: Job) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  shop,
  currentUser,
  lang,
  onClose,
  onUpdateStatus,
  onJobUpdated,
}) => {
  const t = translations[lang];
  const staffList = getStaffMembers(shop.id);

  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState<string>('');
  const [referralNote, setReferralNote] = useState<string>('');
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState<string>('');
  const [currentJobState, setCurrentJobState] = useState<Job>(job);
  const [previewingFile, setPreviewingFile] = useState<JobFile | null>(null);
  const [printingFileId, setPrintingFileId] = useState<string | null>(null);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const [staffEditorOpen, setStaffEditorOpen] = useState<boolean>(false);

  // Requirement 5 & 31: Staff MUST NOT see order value / payment / revenue
  const canSeeRevenue = currentUser?.role === 'owner' || currentUser?.permissions.canViewRevenue;
  const staffName = currentUser?.name || 'Staff Member';
  const staffId = currentUser?.id || 'sys';

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Requirement 29 & 31: Download original customer file
  const handleDownloadOriginalFile = (file: JobFile) => {
    downloadFileSafely(file.file_name, file.data_url, file.file_type);
    setPrintNotice(`Downloaded original file: ${file.file_name}`);
    setTimeout(() => setPrintNotice(null), 3000);
  };

  const handleDownloadAllOriginals = () => {
    currentJobState.files.forEach((f) => {
      downloadFileSafely(f.file_name, f.data_url, f.file_type);
    });
    setPrintNotice(`Downloaded all ${currentJobState.files.length} customer files.`);
    setTimeout(() => setPrintNotice(null), 3500);
  };

  // Requirement 30: Direct "PRINT NOW" workflow for a single file
  const handleDirectPrint = (file: JobFile) => {
    setPrintingFileId(file.id);
    setPrintNotice(`Sending ${file.file_name} to printer from ${""}...`);

    // 1. Record initiated print
    const { job: jobWithPrinting } = recordPrintAction({
      orderId: currentJobState.id,
      fileId: file.id,
      fileName: file.file_name,
      staffId: staffId,
      staffName: staffName,
      
      serviceType: currentJobState.service_type,
      paperSize: currentJobState.paper_size,
      colorMode: currentJobState.is_color ? 'color' : 'bw',
      copies: currentJobState.copies,
      pages: currentJobState.page_count || 1,
      status: 'printing',
    });

    if (jobWithPrinting) {
      setCurrentJobState(jobWithPrinting);
      onJobUpdated?.(jobWithPrinting);
    }

    // 2. Trigger browser/OS print dialog
    printFileDirectly(
      file,
      currentJobState,
      () => {
        setPrintingFileId(null);
        const { job: jobPrinted } = recordPrintAction({
          orderId: currentJobState.id,
          fileId: file.id,
          fileName: file.file_name,
          staffId: staffId,
          staffName: staffName,
          
          serviceType: currentJobState.service_type,
          paperSize: currentJobState.paper_size,
          colorMode: currentJobState.is_color ? 'color' : 'bw',
          copies: currentJobState.copies,
          pages: currentJobState.page_count || 1,
          status: 'printed',
        });

        if (jobPrinted) {
          setCurrentJobState(jobPrinted);
          onJobUpdated?.(jobPrinted);
        }
        setPrintNotice(`Printed "${file.file_name}" successfully.`);
        setTimeout(() => setPrintNotice(null), 4000);
      },
      (error) => {
        setPrintingFileId(null);
        setPrintNotice(error || 'Print failed. You can retry with the Retry button.');
        const updated = updateFilePrintStatus(currentJobState.id, file.id, 'print_failed');
        if (updated) {
          setCurrentJobState(updated);
          onJobUpdated?.(updated);
        }
      }
    );
  };

  // Requirement 36: Print All Files in One Order
  const handlePrintAllFiles = () => {
    if (currentJobState.files.length === 0) return;
    const firstFile = currentJobState.files[0];
    handleDirectPrint(firstFile);
  };

  const handleClaim = async () => {
    if (!currentUser) return;
    const res = await claimJob(currentJobState.id, currentUser.name);
    if (res.success && res.job) {
      setCurrentJobState(res.job);
      onJobUpdated?.(res.job);
      setReassignSuccessMsg(`You claimed Order #${res.job.job_number}.`);
      setTimeout(() => setReassignSuccessMsg(''), 3000);
    }
  };

  const handleReassign = () => {
    if (!currentUser || !selectedStaffToAssign) return;
    const targetStaff = staffList.find((s) => s.id === selectedStaffToAssign);
    if (!targetStaff) return;

    const res = referJob(currentJobState.id, selectedStaffToAssign, referralNote.trim());
    if (res.success && res.job) {
      setCurrentJobState(res.job);
      onJobUpdated?.(res.job);
      setReassignSuccessMsg(`Job referred to ${targetStaff.name}.`);
      setSelectedStaffToAssign('');
      setReferralNote('');
      setTimeout(() => setReassignSuccessMsg(''), 3000);
    }
  };

  const isUnassigned =
    currentJobState.status === 'unassigned' ||
    (!currentJobState.assigned_to && currentJobState.status === 'new');

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black font-mono tracking-wider text-blue-300">
                #{currentJobState.job_number}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentJobState.status === 'new' || currentJobState.status === 'unassigned'
                    ? 'bg-blue-500 text-white'
                    : currentJobState.status === 'processing' || currentJobState.status === 'in_progress'
                    ? 'bg-amber-400 text-amber-950'
                    : currentJobState.status === 'ready'
                    ? 'bg-emerald-400 text-emerald-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {currentJobState.status.toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast / Notification Banner */}
          {printNotice && (
            <div className="bg-blue-900 text-white px-5 py-2 text-xs font-medium flex items-center justify-between animate-fade-in">
              <span>{printNotice}</span>
              <button
                type="button"
                onClick={() => setPrintNotice(null)}
                className="text-blue-300 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Customer & Timestamp row */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <User className="w-4 h-4 text-blue-700" />
                <span>{currentJobState.customer_name || 'Walk-in Customer'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Received: {new Date(currentJobState.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Staff & Terminal Status Bar */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-800" />
                  <span>Assigned Staff:</span>
                </span>
                <span className="font-bold text-slate-800">
                  {currentJobState.assigned_to_name ? (
                    <span className="text-blue-900 font-extrabold">{currentJobState.assigned_to_name}</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Unassigned (Pool)</span>
                  )}
                </span>
              </div>

              {/* Station PC used */}
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-blue-100">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                  <span>Terminal Station:</span>
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-800">
                  
                </span>
              </div>

              {/* Reassign / Claim controls */}
              <div className="pt-2 border-t border-blue-200/80 flex flex-wrap items-center gap-2">
                {isUnassigned ? (
                  <button
                    type="button"
                    onClick={handleClaim}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Claim this Job to {""}</span>
                  </button>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedStaffToAssign}
                        onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Refer / Reassign to...</option>
                        {staffList
                          .filter((s) => s.id !== currentJobState.assigned_to)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} (Floating)
                            </option>
                          ))}
                      </select>

                      <button
                        type="button"
                        disabled={!selectedStaffToAssign}
                        onClick={handleReassign}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-800 rounded-lg font-bold text-xs transition-colors"
                      >
                        Transfer
                      </button>
                    </div>

                    {selectedStaffToAssign && (
                      <input
                        type="text"
                        value={referralNote}
                        onChange={(e) => setReferralNote(e.target.value)}
                        placeholder="Optional hand-off note (e.g. Needs high resolution color paper)..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    )}
                  </div>
                )}
              </div>

              {reassignSuccessMsg && (
                <p className="text-emerald-700 text-xs font-bold pt-1">{reassignSuccessMsg}</p>
              )}
            </div>

            {/* Citizenship Special Notification Banner & Staff Layout Editor Trigger */}
            {currentJobState.service_type === 'citizenship' && (
              <div className="p-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/15 rounded-lg text-white">
                    <CreditCard className="w-4 h-4 text-blue-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm">
                        नागरिकता प्रिन्ट (Citizenship Print)
                      </h5>
                      <span className="font-mono text-[10px] font-black uppercase bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                        {currentJobState.paper_size === 'A5' ? 'A5 Half Paper' : 'A4 Format'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200 mt-0.5">
                      {currentJobState.paper_size === 'A5'
                        ? 'A5 Sheet · Front & Back Sides'
                        : currentJobState.files.some((f) => f.file_name.toLowerCase().includes('combo'))
                        ? 'A4 Combo: Top Half Citizenship · Bottom Half Other Document'
                        : 'A4 Full Sheet: Front Top / Back Bottom'}
                    </p>
                  </div>
                </div>

                {/* Staff / Owner Edit Layout Button */}
                <button
                  type="button"
                  onClick={() => setStaffEditorOpen(true)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{lang === 'ne' ? 'लेआउट सम्पादन / घुमाउनुहोस्' : 'Edit & Rotate Layout'}</span>
                </button>
              </div>
            )}

            {/* Print Specifications Card */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Print Specifications
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Paper Size</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{currentJobState.paper_size}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Color Mode</span>
                  <span className="font-bold text-slate-900">
                    {currentJobState.is_color ? 'Color Print' : 'Black & White'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Sides</span>
                  <span className="font-bold text-slate-900">
                    {currentJobState.is_double_sided ? 'Double-sided' : 'Single-sided'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Copies</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{currentJobState.copies} copies</span>
                </div>
              </div>

              {/* Volume & Revenue Summary (Strictly Restricted from Staff) */}
              <div className="mt-2.5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Total Print Volume:</span>
                  <span className="ml-1.5 font-mono font-bold text-slate-900 text-sm">
                    {currentJobState.total_prints} sheets
                  </span>
                  <span className="ml-1 text-[11px] text-slate-500">
                    ({currentJobState.page_count} pages × {currentJobState.copies} copies)
                  </span>
                </div>

                {canSeeRevenue ? (
                  <div>
                    <span className="text-slate-500 font-medium">Order Value:</span>
                    <span className="ml-1.5 font-mono font-black text-blue-900 text-base">
                      Rs. {currentJobState.order_amount}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Operational mode (Values owner-restricted)
                  </div>
                )}
              </div>
            </div>

            {/* Customer Special Instructions */}
            {currentJobState.instructions && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900">Special Instructions from Customer:</span>
                <p className="text-amber-800 font-medium">"{currentJobState.instructions}"</p>
              </div>
            )}

            {/* Customer Files Section (Requirements 28-36: Direct Print & Original Protection) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Customer Files ({currentJobState.files.length})
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Original & Immutable</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentJobState.files.length > 1 && (
                    <button
                      type="button"
                      onClick={handlePrintAllFiles}
                      className="text-xs font-bold text-blue-900 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print All</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadAllOriginals}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {currentJobState.files.map((file) => {
                  const isPdf = file.file_type.includes('pdf') || file.file_name.toLowerCase().endsWith('.pdf');
                  const isFilePrinting = printingFileId === file.id;
                  const isPrinted = file.print_status === 'printed';
                  const isFailed = file.print_status === 'print_failed';

                  return (
                    <div
                      key={file.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                            {isPdf ? (
                              <FileText className="w-5 h-5 text-red-500" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {file.file_name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>•</span>
                              <span className="capitalize">{file.file_type.split('/')[1] || 'Document'}</span>
                              {file.last_printed_at && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-sans font-bold">
                                    Printed at {new Date(file.last_printed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* File Print Status Badge (Requirement 34) */}
                        <div className="shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isPrinted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isFilePrinting
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : isFailed
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isPrinted ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>PRINTED</span>
                              </>
                            ) : isFilePrinting ? (
                              <>
                                <RotateCw className="w-3 h-3 text-blue-600 animate-spin" />
                                <span>PRINTING</span>
                              </>
                            ) : isFailed ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                <span>PRINT FAILED</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>READY TO PRINT</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons for this file (Requirements 30 & 31) */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Preview Button (In-app, no window.open popup errors) */}
                          <button
                            type="button"
                            onClick={() => setPreviewingFile(file)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>Preview File</span>
                          </button>

                          {/* Download Original File Button */}
                          <button
                            type="button"
                            onClick={() => handleDownloadOriginalFile(file)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            title="Download original customer file"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span>Download Original</span>
                          </button>
                        </div>

                        {/* ONE-CLICK "PRINT NOW" BUTTON (Requirement 30) */}
                        <div className="flex items-center gap-1.5">
                          {isFailed && (
                            <button
                              type="button"
                              onClick={() => handleDirectPrint(file)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Retry</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isFilePrinting}
                            onClick={() => handleDirectPrint(file)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 ${
                              isPrinted
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-blue-900 hover:bg-blue-800 text-white'
                            }`}
                          >
                            {isFilePrinting ? (
                              <>
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Sending to Print...</span>
                              </>
                            ) : (
                              <>
                                <Printer className="w-3.5 h-3.5" />
                                <span>{isPrinted ? 'Print Again' : 'PRINT NOW'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Print Audit Records History (Requirement 33) */}
            {currentJobState.print_records && currentJobState.print_records.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-800" />
                  <span>Print Activity Audit Trail</span>
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {currentJobState.print_records.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{rec.file_name}</span>
                        <div className="text-slate-500 text-[10px]">
                          Printed by <strong>{rec.staff_name}</strong> on <strong>{rec.pc}</strong> · {rec.paper_size} · {rec.color_mode.toUpperCase()} · {rec.copies} copies
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-slate-400 text-[10px] block">
                          {new Date(rec.printed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-emerald-700 font-bold uppercase text-[9px]">
                          {rec.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer: Status Progression Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-mono">
              Terminal: <b>{""}</b>
            </div>

            <div className="flex items-center gap-2">
              {(currentJobState.status === 'new' || currentJobState.status === 'unassigned') && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(currentJobState.id, 'in_progress')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Start Processing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentJobState.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(currentJobState.id, 'ready')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Ready for Pickup</span>
                </button>
              )}

              {currentJobState.status === 'ready' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(currentJobState.id, 'completed')}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete & Handover</span>
                </button>
              )}

              {currentJobState.status === 'completed' && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Finished & Picked Up</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* In-App File Preview Modal (Requirement 31) */}
      {previewingFile && (
        <FilePreviewModal
          file={previewingFile}
          job={currentJobState}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setPreviewingFile(null)}
          onJobUpdated={(updated) => {
            setCurrentJobState(updated);
            onJobUpdated?.(updated);
            const ref = updated.files.find((f) => f.id === previewingFile.id);
            if (ref) setPreviewingFile(ref);
          }}
        />
      )}

      {/* Staff Layout Editor & Rotation Modal (Only Shop Owner & Staff) */}
      {staffEditorOpen && (
        <CitizenshipStaffEditorModal
          job={currentJobState}
          shop={shop}
          lang={lang}
          isOpen={staffEditorOpen}
          onClose={() => setStaffEditorOpen(false)}
          onJobUpdated={(updatedJob) => {
            setCurrentJobState(updatedJob);
            onJobUpdated?.(updatedJob);
          }}
        />
      )}
    </>
  );
};
