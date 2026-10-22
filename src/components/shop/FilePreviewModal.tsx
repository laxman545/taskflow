import React, { useState } from 'react';
import { Job, JobFile, Language, StaffMember, PrintFileStatus } from '../../types';
import { translations } from '../../utils/translations';
import { downloadFileSafely, printFileDirectly, generateValidPdfDataUrl, generateValidImageDataUrl } from '../../utils/filePrintUtils';
import { recordPrintAction, updateFilePrintStatus } from '../../utils/storage';
import {
  Printer,
  Download,
  X,
  FileText,
  ImageIcon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCw,
  Monitor,
  User,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface FilePreviewModalProps {
  file: JobFile;
  job: Job;
  currentUser: StaffMember | null;
  currentPc?: string;
  lang: Language;
  onClose: () => void;
  onJobUpdated: (updatedJob: Job) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  job,
  currentUser,
  lang,
  onClose,
  onJobUpdated,
}) => {
  const t = translations[lang];
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<PrintFileStatus>(
    file.print_status || 'ready_to_print'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const isPdf = file.file_type.includes('pdf') || file.file_name.toLowerCase().endsWith('.pdf');
  const staffName = currentUser?.name || 'Staff Member';
  const staffId = currentUser?.id || 'sys';

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Requirement 30 & 38: One-Click "PRINT NOW" workflow
  const handlePrintNow = () => {
    setIsPrinting(true);
    setStatusMessage('Preparing direct print workflow...');

    // 1. Record that staff initiated printing
    const { job: updatedJob } = recordPrintAction({
      orderId: job.id,
      fileId: file.id,
      fileName: file.file_name,
      staffId: staffId,
      staffName: staffName,
      
      serviceType: job.service_type,
      paperSize: job.paper_size,
      colorMode: job.is_color ? 'color' : 'bw',
      copies: job.copies,
      pages: job.page_count || 1,
      status: 'printing',
    });

    if (updatedJob) {
      onJobUpdated(updatedJob);
    }
    setPrintStatus('printing');

    // 2. Open supported print workflow via browser/OS dialog
    printFileDirectly(
      file,
      job,
      () => {
        // Print initiated successfully
        setIsPrinting(false);
        const { job: finalJob } = recordPrintAction({
          orderId: job.id,
          fileId: file.id,
          fileName: file.file_name,
          staffId: staffId,
          staffName: staffName,
          
          serviceType: job.service_type,
          paperSize: job.paper_size,
          colorMode: job.is_color ? 'color' : 'bw',
          copies: job.copies,
          pages: job.page_count || 1,
          status: 'printed',
        });

        setPrintStatus('printed');
        setStatusMessage(`Successfully sent to printer from ${""}.`);
        if (finalJob) {
          onJobUpdated(finalJob);
        }
      },
      (error) => {
        setIsPrinting(false);
        setPrintStatus('print_failed');
        setStatusMessage(error || 'Print workflow encountered an issue. You can retry anytime.');
        const updated = updateFilePrintStatus(job.id, file.id, 'print_failed');
        if (updated) onJobUpdated(updated);
      }
    );
  };

  // Requirement 29 & 31: Download Original Customer File
  const handleDownloadOriginal = () => {
    downloadFileSafely(file.file_name, file.data_url, file.file_type);
    setStatusMessage(`Original file "${file.file_name}" downloaded to your device.`);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="w-4 h-4 text-red-400" />
              ) : (
                <ImageIcon className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm truncate text-white">
                  {file.file_name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Original (Protected)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Order #{job.job_number} · {formatFileSize(file.file_size)} · Uploaded:{' '}
                {new Date(file.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Configuration Quick Bar (Requirement 32) */}
        <div className="px-5 py-2.5 bg-blue-50/80 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-slate-700 flex-wrap">
            <span className="font-bold text-blue-950 flex items-center gap-1">
              <span>Customer Specifications:</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-blue-200 font-bold text-blue-900 font-mono">
              {job.paper_size}
            </span>
            <span className={`px-2 py-0.5 rounded border font-bold ${
              job.is_color
                ? 'bg-amber-100/60 border-amber-200 text-amber-900'
                : 'bg-slate-200/60 border-slate-300 text-slate-800'
            }`}>
              {job.is_color ? 'Color Print' : 'Black & White'}
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-blue-200 text-slate-800">
              {job.copies} {job.copies === 1 ? 'Copy' : 'Copies'}
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-blue-200 text-slate-800">
              {job.is_double_sided ? 'Double-sided' : 'Single-sided'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Station: <strong>{""}</strong>
            </span>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className={`px-5 py-2 text-xs font-medium flex items-center justify-between ${
            printStatus === 'printed'
              ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
              : printStatus === 'print_failed'
              ? 'bg-red-50 text-red-900 border-b border-red-200'
              : 'bg-blue-50 text-blue-900 border-b border-blue-200'
          }`}>
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Document Preview Canvas (Requirement 31) */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6 flex items-center justify-center min-h-[340px] relative">
          {/* Zoom controls for preview */}
          {!isPdf && (
            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono px-1 font-bold">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            className="w-full flex items-center justify-center transition-transform duration-150"
            style={{ transform: !isPdf ? `scale(${zoomLevel})` : undefined }}
          >
            {(() => {
              const previewSrc =
                file.data_url && file.data_url.trim().length > 0
                  ? file.data_url
                  : isPdf
                  ? generateValidPdfDataUrl(file.file_name, `Order #${job.job_number} - Customer File`)
                  : generateValidImageDataUrl(file.file_name, `Order #${job.job_number} - Customer File`);

              if (!previewSrc || previewSrc.trim().length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-white rounded-xl shadow-xs border border-slate-200">
                    <FileText className="w-12 h-12 text-slate-400 mb-2 stroke-1" />
                    <p className="font-semibold text-slate-700">Preview not available</p>
                    <p className="text-xs text-slate-400 mt-1">Use the Download or Print buttons below to access the file</p>
                  </div>
                );
              }

              return isPdf ? (
                <div className="w-full h-[65vh] bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 flex flex-col">
                  <iframe
                    src={previewSrc}
                    title={file.file_name}
                    className="w-full flex-1 border-0"
                  />
                </div>
              ) : (
                <img
                  src={previewSrc}
                  alt={file.file_name}
                  className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg border border-slate-200 bg-white"
                />
              );
            })()}
          </div>
        </div>

        {/* Modal Footer with Primary Action Buttons (Requirement 30 & 31) */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Status indicator */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              printStatus === 'printed'
                ? 'bg-emerald-100 text-emerald-800'
                : printStatus === 'printing'
                ? 'bg-blue-100 text-blue-800 animate-pulse'
                : printStatus === 'print_failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {printStatus === 'printed' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Printed</span>
                </>
              ) : printStatus === 'printing' ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Printing in Progress...</span>
                </>
              ) : printStatus === 'print_failed' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Print Failed</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ready to Print</span>
                </>
              )}
            </span>

            {file.last_printed_at && (
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Last printed by {file.last_printed_by || staffName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Download Original File Button (Requirement 31) */}
            <button
              type="button"
              onClick={handleDownloadOriginal}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              title="Download the unaltered customer original file"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Original</span>
            </button>

            {/* ONE-CLICK "PRINT NOW" BUTTON (Requirement 30) */}
            <button
              type="button"
              disabled={isPrinting}
              onClick={handlePrintNow}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${
                printStatus === 'print_failed'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800'
              }`}
            >
              {isPrinting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Opening Printer...</span>
                </>
              ) : printStatus === 'print_failed' ? (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Retry Print</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>PRINT NOW</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
