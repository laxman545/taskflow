import React, { useState, useEffect } from 'react';
import { Shop, Language, OutgoingTransfer, OutgoingFile } from '../../types';
import { translations } from '../../utils/translations';
import { verifyTransfer } from '../../utils/storage';
import { formatTimeRemaining } from '../../utils/security';
import { downloadFileSafely, generateValidPdfDataUrl, generateValidImageDataUrl } from '../../utils/filePrintUtils';
import {
  ArrowLeft,
  KeyRound,
  User,
  Download,
  FileText,
  Image as ImageIcon,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Eye,
  X
} from 'lucide-react';

interface ReceiveFileFlowProps {
  shop: Shop;
  lang: Language;
  onBack: () => void;
}

export const ReceiveFileFlow: React.FC<ReceiveFileFlowProps> = ({
  shop,
  lang,
  onBack,
}) => {
  const t = translations[lang];

  const [customerName, setCustomerName] = useState('');
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockedRemaining, setLockedRemaining] = useState<number>(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Successfully verified transfer state
  const [verifiedTransfer, setVerifiedTransfer] = useState<OutgoingTransfer | null>(null);
  const [previewFile, setPreviewFile] = useState<OutgoingFile | null>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (lockedRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockedRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedRemaining]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedRemaining > 0) return;

    if (!customerName.trim()) {
      setErrorMessage(lang === 'ne' ? 'कृपया आफ्नो नाम प्रविष्ट गर्नुहोस्' : 'Please enter your name');
      return;
    }

    if (pin.trim().length !== 4) {
      setErrorMessage(lang === 'ne' ? 'कृपया ४-अंकको पिन प्रविष्ट गर्नुहोस्' : 'Please enter a 4-digit PIN');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await verifyTransfer(customerName, pin);

      if (res.locked && res.remainingSeconds) {
        setLockedRemaining(res.remainingSeconds);
        setErrorMessage(t.tooManyAttempts);
      } else if (!res.success) {
        setErrorMessage(res.message || t.invalidNamePin);
        if (res.attemptsLeft !== undefined) {
          setAttemptsRemaining(res.attemptsLeft);
        }
      } else if (res.transfer) {
        setVerifiedTransfer(res.transfer);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadFile = (file: OutgoingFile) => {
    downloadFileSafely(file.file_name, file.data_url, file.file_type);
  };

  const handleDownloadAll = () => {
    if (!verifiedTransfer) return;
    verifiedTransfer.files.forEach((file) => {
      downloadFileSafely(file.file_name, file.data_url, file.file_type);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ---------------- Render: Verified Files Download View ----------------
  if (verifiedTransfer) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVerifiedTransfer(null)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              {t.availableFiles}
            </h2>
            <p className="text-xs text-slate-500">
              For: {verifiedTransfer.customer_name}
            </p>
          </div>
        </div>

        {/* Expiry notice card (24 hours rule) */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">{t.expiresIn} {formatTimeRemaining(verifiedTransfer.expires_at)}</p>
              <p className="text-amber-700 text-[11px] mt-0.5">{t.shopSentNotice}</p>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="space-y-2">
          {verifiedTransfer.files.map((file) => (
            <div
              key={file.id}
              className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  {file.file_type.includes('pdf') ? (
                    <FileText className="w-5 h-5 text-red-500" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {file.file_name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewFile(file)}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  title="Preview / Open File"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadFile(file)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shadow-blue-500/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadFile}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Download All CTA */}
        {verifiedTransfer.files.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadAll} ({verifiedTransfer.files.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBack}
          className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          {t.backToHome}
        </button>

        {/* In-App File Preview Modal for Customer */}
        {previewFile && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {previewFile.file_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-center min-h-[250px] max-h-[50vh] overflow-auto border border-slate-200/80">
                {(() => {
                  const isPdf =
                    previewFile.file_type.includes('pdf') || previewFile.file_name.toLowerCase().endsWith('.pdf');
                  const validSrc =
                    previewFile.data_url && previewFile.data_url.trim().length > 0
                      ? previewFile.data_url
                      : isPdf
                      ? generateValidPdfDataUrl(previewFile.file_name, 'Shop Customer File')
                      : generateValidImageDataUrl(previewFile.file_name, 'Shop Customer Image');

                  if (!validSrc || validSrc.trim().length === 0) {
                    return (
                      <div className="text-center p-6 text-slate-500">
                        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Preview not available</p>
                      </div>
                    );
                  }

                  return isPdf ? (
                    <iframe
                      src={validSrc}
                      title={previewFile.file_name}
                      className="w-full h-[45vh] rounded-xl border-0 bg-white"
                    />
                  ) : (
                    <img
                      src={validSrc}
                      alt={previewFile.file_name}
                      className="max-w-full max-h-[45vh] object-contain rounded-xl shadow-xs"
                    />
                  );
                })()}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-500 font-mono">
                  {formatFileSize(previewFile.file_size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewFile)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- Render: Name + 4-digit PIN Entry Form ----------------
  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
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
          <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
            {t.receiveHeader}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {shop.shop_name} · Counter Direct Pickup
          </p>
        </div>
      </div>

      <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-2xl text-xs text-blue-900 leading-relaxed font-medium">
        {t.receiveSubHeader}
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.enterName}</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setErrorMessage('');
            }}
            placeholder={t.enterNamePlaceholder}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 4-digit PIN input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.enterPin}</span>
          </label>
          <input
            type="password"
            maxLength={4}
            pattern="[0-9]*"
            inputMode="numeric"
            required
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setErrorMessage('');
            }}
            placeholder={t.enterPinPlaceholder || "••••"}
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-black text-slate-900 transition-all"
          />
          <span className="block text-[11px] text-slate-400 text-center mt-1.5">
            Enter the 4 numeric digits provided on your counter pickup slip
          </span>
        </div>

        {/* Lockout Notice if locked */}
        {lockedRemaining > 0 && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <Lock className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">{t.tooManyAttempts}</p>
              <p className="text-[11px] mt-0.5">
                {t.lockedCountdown} {Math.floor(lockedRemaining / 60)} {t.minutes} {lockedRemaining % 60} {t.seconds}
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && lockedRemaining === 0 && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium animate-shake">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Attempts remaining notice */}
        {attemptsRemaining !== null && attemptsRemaining < 5 && attemptsRemaining > 0 && lockedRemaining === 0 && (
          <p className="text-center text-xs font-bold text-amber-700">
            ⚠️ {attemptsRemaining} attempt(s) remaining before 15-minute lock
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isVerifying || lockedRemaining > 0 || pin.length !== 4}
          className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isVerifying ? (
            <span>{t.verifying}</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.verifyAndDownload}</span>
            </>
          )}
        </button>
      </form>

      {/* Security badge note */}
      <div className="text-center text-[11px] text-slate-400 space-y-1 pt-2">
        <p>🔒 End-to-end PIN protection · 24h automatic purge</p>
        <p>Your documents remain completely private until verified.</p>
      </div>
    </div>
  );
};
