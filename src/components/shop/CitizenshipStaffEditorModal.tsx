import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Job, JobFile, Language, Shop, CitizenshipPaperMode, PageOrientation } from '../../types';
import { translations } from '../../utils/translations';
import { replaceJobFiles } from '../../utils/storage';
import { printFileDirectly } from '../../utils/filePrintUtils';
import {
  X,
  RotateCw,
  Printer,
  Save,
  CheckCircle2,
  FileText,
  CreditCard,
  FilePlus,
  Layers,
  Sparkles,
  ArrowLeftRight,
  Maximize2
} from 'lucide-react';

interface CitizenshipStaffEditorModalProps {
  job: Job;
  shop: Shop;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated?: (updatedJob: Job) => void;
}

export const CitizenshipStaffEditorModal: React.FC<CitizenshipStaffEditorModalProps> = ({
  job,
  lang,
  isOpen,
  onClose,
  onJobUpdated,
}) => {
  const t = translations[lang];

  // Find existing files or fallback
  const frontFile = job.files.find((f) => f.file_name.toLowerCase().includes('front')) || job.files[1] || job.files[0];
  const backFile = job.files.find((f) => f.file_name.toLowerCase().includes('back')) || job.files[2] || job.files[0];
  const otherDocFile = job.files.find((f) => f.file_name.toLowerCase().includes('additional') || f.file_name.toLowerCase().includes('other')) || null;
  const mergedFile = job.files.find((f) => f.file_name.toLowerCase().includes('merged')) || job.files[0];

  const [paperMode, setPaperMode] = useState<CitizenshipPaperMode>(() => {
    if (job.paper_size === 'A5' || mergedFile?.file_name.includes('A5')) return 'a5';
    if (mergedFile?.file_name.includes('Combo') || otherDocFile) return 'a4_combo';
    return 'a4_full';
  });

  const [orientation, setOrientation] = useState<PageOrientation>(() => {
    if (mergedFile?.file_name.toLowerCase().includes('landscape')) return 'landscape';
    return 'portrait';
  });

  const [frontRotation, setFrontRotation] = useState<number>(0);
  const [backRotation, setBackRotation] = useState<number>(0);
  const [docRotation, setDocRotation] = useState<number>(0);
  const [isColor, setIsColor] = useState<boolean>(!!job.is_color);
  const [includeCutLine, setIncludeCutLine] = useState<boolean>(true);

  const [frontUrl, setFrontUrl] = useState<string | null>(frontFile?.data_url || null);
  const [backUrl, setBackUrl] = useState<string | null>(backFile?.data_url || null);
  const [otherDocUrl, setOtherDocUrl] = useState<string | null>(otherDocFile?.data_url || null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(mergedFile?.data_url || null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper to load image
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  };

  // Re-generate canvas with staff rotation and orientation adjustments
  const renderCanvas = useCallback(async () => {
    if (!frontUrl || !backUrl) return;

    try {
      const promises: Promise<HTMLImageElement>[] = [loadImage(frontUrl), loadImage(backUrl)];
      if (paperMode === 'a4_combo' && otherDocUrl) {
        promises.push(loadImage(otherDocUrl));
      }

      const images = await Promise.all(promises);
      const frontImg = images[0];
      const backImg = images[1];
      const otherDocImg = images[2] || null;

      const canvas = canvasRef.current || document.createElement('canvas');

      let targetWidth = 1600;
      let targetHeight = 2262;

      if (paperMode === 'a5') {
        if (orientation === 'landscape') {
          targetWidth = 1600;
          targetHeight = 1131;
        } else {
          targetWidth = 1131;
          targetHeight = 1600;
        }
      } else {
        if (orientation === 'landscape') {
          targetWidth = 2262;
          targetHeight = 1600;
        } else {
          targetWidth = 1600;
          targetHeight = 2262;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Helper to draw image with specific rotation inside box
      const drawRotatedImage = (
        img: HTMLImageElement,
        rotationDeg: number,
        boxX: number,
        boxY: number,
        boxW: number,
        boxH: number,
        label?: string
      ) => {
        const padding = 20;
        const availW = Math.max(10, boxW - padding * 2);
        const availH = Math.max(10, boxH - padding * 2 - (label ? 25 : 0));

        const isSwap = rotationDeg === 90 || rotationDeg === 270;
        const effW = isSwap ? img.height : img.width;
        const effH = isSwap ? img.width : img.height;

        const scale = Math.min(availW / effW, availH / effH);
        const drawW = img.width * scale;
        const drawH = img.height * scale;

        const centerX = boxX + boxW / 2;
        const centerY = boxY + (label ? 25 : 0) + (boxH - (label ? 25 : 0)) / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotationDeg * Math.PI) / 180);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(-drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        if (label) {
          ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'center';
          ctx.fillText(label, centerX, boxY + 22);
        }
      };

      // 2. Layout rendering
      if (paperMode === 'a5') {
        if (orientation === 'landscape') {
          const halfW = targetWidth / 2;
          drawRotatedImage(frontImg, frontRotation, 0, 0, halfW, targetHeight, 'अगाडि (Front)');
          drawRotatedImage(backImg, backRotation, halfW, 0, halfW, targetHeight, 'पछाडि (Back)');

          if (includeCutLine) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 8]);
            ctx.beginPath();
            ctx.moveTo(halfW, 40);
            ctx.lineTo(halfW, targetHeight - 40);
            ctx.stroke();
            ctx.restore();
          }
        } else {
          const halfH = targetHeight / 2;
          drawRotatedImage(frontImg, frontRotation, 0, 0, targetWidth, halfH, 'अगाडिको भाग (Front)');
          drawRotatedImage(backImg, backRotation, 0, halfH, targetWidth, halfH, 'पछाडिको भाग (Back)');

          if (includeCutLine) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 10]);
            ctx.beginPath();
            ctx.moveTo(40, halfH);
            ctx.lineTo(targetWidth - 40, halfH);
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (paperMode === 'a4_combo') {
        const halfH = targetHeight / 2;

        // Top Half: Citizenship Front and Back
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(20, 20, targetWidth - 40, 40);
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#1e3a8a';
        ctx.textAlign = 'center';
        ctx.fillText('नागरिकता प्रमाणपत्र (Citizenship Card - Front & Back)', targetWidth / 2, 46);

        const subWidth = targetWidth / 2;
        drawRotatedImage(frontImg, frontRotation, 0, 65, subWidth, halfH - 85, 'अगाडि (Front)');
        drawRotatedImage(backImg, backRotation, subWidth, 65, subWidth, halfH - 85, 'पछाडि (Back)');

        // Middle Divider Line
        if (includeCutLine) {
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.moveTo(50, halfH);
          ctx.lineTo(targetWidth - 50, halfH);
          ctx.stroke();
          ctx.restore();
        }

        // Bottom Half: Other Document
        if (otherDocImg) {
          drawRotatedImage(
            otherDocImg,
            docRotation,
            0,
            halfH,
            targetWidth,
            halfH,
            'अतिरिक्त कागजात (Additional Document: License / PAN / Certificate)'
          );
        } else {
          ctx.save();
          ctx.strokeStyle = '#cbd5e1';
          ctx.setLineDash([8, 8]);
          ctx.lineWidth = 2;
          ctx.strokeRect(60, halfH + 40, targetWidth - 120, halfH - 80);
          ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText('थप कागजात (Other Document Space)', targetWidth / 2, halfH + halfH / 2);
          ctx.restore();
        }
      } else {
        // A4 Full
        const halfH = targetHeight / 2;
        drawRotatedImage(frontImg, frontRotation, 0, 0, targetWidth, halfH, 'अगाडिको भाग (Front)');
        drawRotatedImage(backImg, backRotation, 0, halfH, targetWidth, halfH, 'पछाडिको भाग (Back)');

        if (includeCutLine) {
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.moveTo(50, halfH);
          ctx.lineTo(targetWidth - 50, halfH);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Grayscale Photocopy Filter
      if (!isColor) {
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;
        const contrastFactor = 1.22;
        const contrastOffset = 128 * (1 - contrastFactor);

        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const finalGray = Math.min(255, Math.max(0, gray * contrastFactor + contrastOffset));
          data[i] = finalGray;
          data[i + 1] = finalGray;
          data[i + 2] = finalGray;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const newUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewUrl(newUrl);
    } catch (e) {
      console.error('Error rendering staff canvas:', e);
    }
  }, [
    frontUrl,
    backUrl,
    otherDocUrl,
    paperMode,
    orientation,
    frontRotation,
    backRotation,
    docRotation,
    isColor,
    includeCutLine,
  ]);

  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [
    isOpen,
    renderCanvas,
  ]);

  if (!isOpen) return null;

  // Swap front & back
  const handleSwap = () => {
    const tempUrl = frontUrl;
    setFrontUrl(backUrl);
    setBackUrl(tempUrl);
  };

  // Save changes to job
  const handleSaveToJob = async () => {
    if (!previewUrl) return;
    setIsSaving(true);
    setSaveSuccessMsg('');

    try {
      const fileName =
        paperMode === 'a5'
          ? `Citizenship_A5_${orientation}_Edited.jpg`
          : paperMode === 'a4_combo'
          ? 'Citizenship_A4_Combo_Edited.jpg'
          : 'Citizenship_A4_Full_Edited.jpg';

      const approxBytes = Math.round((previewUrl.length * 3) / 4);

      const editedFile: JobFile = {
        id: mergedFile?.id || `file_merged_${Date.now()}`,
        job_id: job.id,
        file_name: fileName,
        file_path: `/uploads/${fileName}`,
        file_size: approxBytes,
        file_type: 'image/jpeg',
        data_url: previewUrl,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Keep raw originals alongside the edited merged sheet
      const updatedFilesList = job.files.map((f) => (f.id === editedFile.id ? editedFile : f));
      if (!updatedFilesList.some((f) => f.id === editedFile.id)) {
        updatedFilesList.unshift(editedFile);
      }

      const res = await replaceJobFiles(job.id, updatedFilesList);
      if (res.success && res.job) {
        onJobUpdated?.(res.job);
        setSaveSuccessMsg(t.layoutSavedSuccess || 'Layout saved successfully!');
        setTimeout(() => {
          setSaveSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error('Save layout error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Direct print with edited layout
  const handleDirectPrintNow = () => {
    if (!previewUrl) return;

    const printFile: JobFile = {
      id: `print_edited_${Date.now()}`,
      job_id: job.id,
      file_name: `Citizenship_${paperMode.toUpperCase()}_${orientation}.jpg`,
      file_path: `/uploads/print.jpg`,
      file_size: Math.round((previewUrl.length * 3) / 4),
      file_type: 'image/jpeg',
      data_url: previewUrl,
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    };

    const targetJob: Job = {
      ...job,
      paper_size: paperMode === 'a5' ? 'A5' : 'A4',
      is_color: isColor,
    };

    printFileDirectly(printFile, targetJob);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-600/30 text-blue-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base font-display">
                Staff Layout Editor & Orientation (लेआउट सम्पादन)
              </h3>
              <p className="text-xs text-slate-400">
                Order #{job.job_number} · {job.customer_name || 'Customer'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls on left, Live Canvas Preview on right */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Controls Column (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Paper Format Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Paper Format (कागज प्रकार)
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaperMode('a5')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg text-center transition-all ${
                    paperMode === 'a5'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A5 Half
                </button>
                <button
                  type="button"
                  onClick={() => setPaperMode('a4_combo')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg text-center transition-all ${
                    paperMode === 'a4_combo'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Combo
                </button>
                <button
                  type="button"
                  onClick={() => setPaperMode('a4_full')}
                  className={`py-2 px-1 text-xs font-bold rounded-lg text-center transition-all ${
                    paperMode === 'a4_full'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Full
                </button>
              </div>
            </div>

            {/* Page Orientation (Portrait vs Landscape) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Page Orientation (पानाको दिशा)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                    orientation === 'portrait'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {t.orientationPortrait}
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                    orientation === 'landscape'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {t.orientationLandscape}
                </button>
              </div>
            </div>

            {/* Individual Card Rotation Controls */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Card Rotation (९०° घुमाउनुहोस्)
                </span>
                <button
                  type="button"
                  onClick={handleSwap}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  title="Swap Front and Back sides"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Swap Sides</span>
                </button>
              </div>

              {/* Front Rotation */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Front Side:</span>
                <button
                  type="button"
                  onClick={() => setFrontRotation((prev) => (prev + 90) % 360)}
                  className="py-1 px-3 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-700" />
                  <span>{frontRotation}°</span>
                </button>
              </div>

              {/* Back Rotation */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Back Side:</span>
                <button
                  type="button"
                  onClick={() => setBackRotation((prev) => (prev + 90) % 360)}
                  className="py-1 px-3 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-700" />
                  <span>{backRotation}°</span>
                </button>
              </div>

              {/* Other Document Rotation (if A4 combo) */}
              {paperMode === 'a4_combo' && otherDocUrl && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Other Doc:</span>
                  <button
                    type="button"
                    onClick={() => setDocRotation((prev) => (prev + 90) % 360)}
                    className="py-1 px-3 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-700" />
                    <span>{docRotation}°</span>
                  </button>
                </div>
              )}
            </div>

            {/* Output Style & Cut Line */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Color Mode:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsColor(false)}
                    className={`px-2 py-1 font-bold rounded-md ${
                      !isColor ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    B/W
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsColor(true)}
                    className={`px-2 py-1 font-bold rounded-md ${
                      isColor ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Color
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Center Cut Guide:</span>
                <input
                  type="checkbox"
                  checked={includeCutLine}
                  onChange={(e) => setIncludeCutLine(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-900"
                />
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Live Preview Column (7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Live Edited Layout Preview</span>
              </span>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                {paperMode === 'a5' ? 'A5 Half' : 'A4'} · {orientation.toUpperCase()}
              </span>
            </div>

            <div
              className={`relative max-w-full max-h-[50vh] ${
                orientation === 'landscape' ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'
              } bg-white border-2 border-slate-400 rounded-lg shadow-xl overflow-hidden flex items-center justify-center`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Edited Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-slate-400 p-8 text-center">
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDirectPrintNow}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>{t.printEditedLayout}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveToJob}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : t.saveLayoutChanges}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
