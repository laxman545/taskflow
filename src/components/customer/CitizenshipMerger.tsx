import React, { useState, useRef, useEffect, useCallback } from 'react';
import { JobFile, Language, CitizenshipPaperMode, PageOrientation } from '../../types';
import { translations } from '../../utils/translations';
import {
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Scissors,
  Sparkles,
  Maximize2,
  X,
  CreditCard,
  FilePlus,
  Layers,
  Info
} from 'lucide-react';

export interface MergedCitizenshipResult {
  mergedFile: JobFile;
  rawFiles: JobFile[];
  paperMode: CitizenshipPaperMode;
  paperSize: 'A5' | 'A4';
  orientation: PageOrientation;
}

interface CitizenshipMergerProps {
  lang: Language;
  isColor: boolean;
  onColorChange: (isColor: boolean) => void;
  onMergedChange: (result: MergedCitizenshipResult | null) => void;
  initialPaperMode?: CitizenshipPaperMode;
}

interface CardSideState {
  rawUrl: string | null;
  name: string;
  size: number;
}

export const CitizenshipMerger: React.FC<CitizenshipMergerProps> = ({
  lang,
  isColor,
  onColorChange,
  onMergedChange,
  initialPaperMode = 'a5',
}) => {
  const t = translations[lang];

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const otherDocInputRef = useRef<HTMLInputElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [paperMode, setPaperMode] = useState<CitizenshipPaperMode>(initialPaperMode);
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');

  const [frontSide, setFrontSide] = useState<CardSideState>({
    rawUrl: null,
    name: '',
    size: 0,
  });

  const [backSide, setBackSide] = useState<CardSideState>({
    rawUrl: null,
    name: '',
    size: 0,
  });

  const [otherDocSide, setOtherDocSide] = useState<CardSideState>({
    rawUrl: null,
    name: '',
    size: 0,
  });

  const [includeCutLine, setIncludeCutLine] = useState<boolean>(true);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedPreviewUrl, setMergedPreviewUrl] = useState<string | null>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Helper to load HTMLImageElement from data URL
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  };

  // Canvas Drawing Engine for A5, A4 Combo, and A4 Full
  const generateMergedCanvas = useCallback(async () => {
    if (!frontSide.rawUrl || !backSide.rawUrl) {
      setMergedPreviewUrl(null);
      onMergedChange(null);
      return;
    }

    setIsMerging(true);
    setErrorMessage('');

    try {
      const promises: Promise<HTMLImageElement>[] = [
        loadImage(frontSide.rawUrl),
        loadImage(backSide.rawUrl),
      ];

      if (paperMode === 'a4_combo' && otherDocSide.rawUrl) {
        promises.push(loadImage(otherDocSide.rawUrl));
      }

      const images = await Promise.all(promises);
      const frontImg = images[0];
      const backImg = images[1];
      const otherDocImg = images[2] || null;

      const canvas = hiddenCanvasRef.current || document.createElement('canvas');

      // Define dimensions based on paper mode
      let targetWidth = 1600;
      let targetHeight = 2262; // Standard A4 Portrait (1:1.414)
      let effectivePaperSize: 'A5' | 'A4' = 'A4';

      if (paperMode === 'a5') {
        effectivePaperSize = 'A5';
        if (orientation === 'landscape') {
          targetWidth = 1600;
          targetHeight = 1131; // A5 Landscape
        } else {
          targetWidth = 1131;
          targetHeight = 1600; // A5 Portrait
        }
      } else {
        effectivePaperSize = 'A4';
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
      if (!ctx) throw new Error('Failed to get 2D canvas context');

      // 1. Pure White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Helper to fit an image into a specified rectangle with nice border
      const drawFittedImage = (
        img: HTMLImageElement,
        boxX: number,
        boxY: number,
        boxW: number,
        boxH: number,
        label?: string
      ) => {
        const padding = 20;
        const availW = Math.max(10, boxW - padding * 2);
        const availH = Math.max(10, boxH - padding * 2 - (label ? 25 : 0));

        const scale = Math.min(availW / img.width, availH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;

        const centerX = boxX + boxW / 2;
        const centerY = boxY + (label ? 25 : 0) + (boxH - (label ? 25 : 0)) / 2;

        ctx.save();
        ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);

        // Subtle clean outer card border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
        ctx.restore();

        if (label) {
          ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'center';
          ctx.fillText(label, centerX, boxY + 22);
        }
      };

      // 2. Render Based on Paper Mode
      if (paperMode === 'a5') {
        // --- MODE A: A5 PAPER (HALF OF A4) ---
        if (orientation === 'landscape') {
          // Left Half Front, Right Half Back
          const halfW = targetWidth / 2;
          drawFittedImage(frontImg, 0, 0, halfW, targetHeight, 'नागरिकता अगाडि (Front Side)');
          drawFittedImage(backImg, halfW, 0, halfW, targetHeight, 'नागरिकता पछाडि (Back Side)');

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
          // Portrait: Top Half Front, Bottom Half Back
          const halfH = targetHeight / 2;
          drawFittedImage(frontImg, 0, 0, targetWidth, halfH, 'नागरिकता अगाडिको भाग (Front Side)');
          drawFittedImage(backImg, 0, halfH, targetWidth, halfH, 'नागरिकता पछाडिको भाग (Back Side)');

          if (includeCutLine) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 10]);
            ctx.beginPath();
            ctx.moveTo(40, halfH);
            ctx.lineTo(targetWidth - 40, halfH);
            ctx.stroke();

            // Center scissors label
            ctx.fillStyle = '#ffffff';
            const cutTxt = ' ✂ - - - Fold / Cut Guide Line (पट्याउने वा काट्ने रेखा) - - - ✂ ';
            ctx.font = '500 16px monospace';
            const textMetrics = ctx.measureText(cutTxt);
            const textW = textMetrics.width + 20;
            ctx.fillRect(targetWidth / 2 - textW / 2, halfH - 12, textW, 24);

            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cutTxt, targetWidth / 2, halfH);
            ctx.restore();
          }
        }
      } else if (paperMode === 'a4_combo') {
        // --- MODE B: A4 PAPER (HALF CITIZENSHIP + HALF OTHER DOCUMENT) ---
        const halfH = targetHeight / 2;

        // TOP HALF: Contains BOTH Front & Back of Citizenship side-by-side
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(20, 20, targetWidth - 40, 40);
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#1e3a8a';
        ctx.textAlign = 'center';
        ctx.fillText('नागरिकता प्रमाणपत्र (Citizenship Card - Front & Back)', targetWidth / 2, 46);

        const subWidth = targetWidth / 2;
        drawFittedImage(frontImg, 0, 65, subWidth, halfH - 85, 'अगाडिको भाग (Front)');
        drawFittedImage(backImg, subWidth, 65, subWidth, halfH - 85, 'पछाडिको भाग (Back)');

        // Separator between Front and Back inside top half
        ctx.save();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(subWidth, 75);
        ctx.lineTo(subWidth, halfH - 20);
        ctx.stroke();
        ctx.restore();

        // MIDDLE CUT / DIVIDER LINE
        if (includeCutLine) {
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.moveTo(50, halfH);
          ctx.lineTo(targetWidth - 50, halfH);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          const cutTxt = ' ✂ - - - - - - Fold / Cut Guide Line (पट्याउने वा काट्ने रेखा) - - - - - - ✂ ';
          ctx.font = '500 18px monospace';
          const textMetrics = ctx.measureText(cutTxt);
          const textW = textMetrics.width + 30;
          ctx.fillRect(targetWidth / 2 - textW / 2, halfH - 14, textW, 28);

          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cutTxt, targetWidth / 2, halfH);
          ctx.restore();
        }

        // BOTTOM HALF: Reserved for Another Document (License / PAN / Certificate / Photo)
        if (otherDocImg) {
          drawFittedImage(
            otherDocImg,
            0,
            halfH,
            targetWidth,
            halfH,
            'अतिरिक्त कागजात (Additional Document: License / PAN / Certificate)'
          );
        } else {
          // Placeholder outline in bottom half
          ctx.save();
          ctx.strokeStyle = '#cbd5e1';
          ctx.setLineDash([8, 8]);
          ctx.lineWidth = 2;
          ctx.strokeRect(60, halfH + 40, targetWidth - 120, halfH - 80);

          ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(
            'थप कागजात अपलोड गर्नुहोस् (License / PAN / Photo)',
            targetWidth / 2,
            halfH + halfH / 2 - 10
          );
          ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(
            'Second half space reserved for additional document',
            targetWidth / 2,
            halfH + halfH / 2 + 22
          );
          ctx.restore();
        }
      } else {
        // --- MODE C: A4 FULL SHEET (TOP HALF FRONT, BOTTOM HALF BACK) ---
        const halfH = targetHeight / 2;
        drawFittedImage(frontImg, 0, 0, targetWidth, halfH, 'नागरिकता अगाडिको भाग (Front Side)');
        drawFittedImage(backImg, 0, halfH, targetWidth, halfH, 'नागरिकता पछाडिको भाग (Back Side)');

        if (includeCutLine) {
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.moveTo(50, halfH);
          ctx.lineTo(targetWidth - 50, halfH);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          const cutTxt = ' ✂ - - - - - - Fold / Cut Guide Line (पट्याउने वा काट्ने रेखा) - - - - - - ✂ ';
          ctx.font = '500 18px monospace';
          const textMetrics = ctx.measureText(cutTxt);
          const textW = textMetrics.width + 30;
          ctx.fillRect(targetWidth / 2 - textW / 2, halfH - 14, textW, 28);

          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cutTxt, targetWidth / 2, halfH);
          ctx.restore();
        }
      }

      // 3. Apply Photocopy Style (Grayscale with high contrast) if Black & White is selected
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

      // 4. Generate final JPEG data URL
      const mergedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setMergedPreviewUrl(mergedDataUrl);

      // 5. Emit JobFile package to parent
      const approxBytes = Math.round((mergedDataUrl.length * 3) / 4);
      const mergedFileName =
        paperMode === 'a5'
          ? `Citizenship_A5_${orientation}_Merged.jpg`
          : paperMode === 'a4_combo'
          ? 'Citizenship_A4_Combo_Merged.jpg'
          : 'Citizenship_A4_Full_Merged.jpg';

      const mergedFile: JobFile = {
        id: `file_citizenship_${Date.now()}`,
        job_id: '',
        file_name: mergedFileName,
        file_path: `/uploads/${mergedFileName}`,
        file_size: approxBytes,
        file_type: 'image/jpeg',
        data_url: mergedDataUrl,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Raw source files preserved for staff/owner editing
      const rawFiles: JobFile[] = [
        {
          id: `file_cit_front_raw_${Date.now()}`,
          job_id: '',
          file_name: 'Citizenship_Front_Original.jpg',
          file_path: '/uploads/Citizenship_Front_Original.jpg',
          file_size: frontSide.size,
          file_type: 'image/jpeg',
          data_url: frontSide.rawUrl,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: `file_cit_back_raw_${Date.now()}`,
          job_id: '',
          file_name: 'Citizenship_Back_Original.jpg',
          file_path: '/uploads/Citizenship_Back_Original.jpg',
          file_size: backSide.size,
          file_type: 'image/jpeg',
          data_url: backSide.rawUrl,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      if (otherDocSide.rawUrl) {
        rawFiles.push({
          id: `file_cit_other_raw_${Date.now()}`,
          job_id: '',
          file_name: 'Additional_Document_Original.jpg',
          file_path: '/uploads/Additional_Document_Original.jpg',
          file_size: otherDocSide.size,
          file_type: 'image/jpeg',
          data_url: otherDocSide.rawUrl,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      onMergedChange({
        mergedFile,
        rawFiles,
        paperMode,
        paperSize: effectivePaperSize,
        orientation,
      });
    } catch (err: any) {
      console.error('Citizenship merge error:', err);
      setErrorMessage(
        lang === 'ne'
          ? 'फोटो मर्ज गर्दा समस्या आयो। कृपया फोटो पुनः अपलोड गर्नुहोस्।'
          : 'Failed to merge citizenship photos. Please re-upload.'
      );
      onMergedChange(null);
    } finally {
      setIsMerging(false);
    }
  }, [
    frontSide,
    backSide,
    otherDocSide,
    paperMode,
    orientation,
    isColor,
    includeCutLine,
    lang,
    onMergedChange,
  ]);

  // Re-trigger merge when files or settings change
  useEffect(() => {
    if (frontSide.rawUrl && backSide.rawUrl) {
      generateMergedCanvas();
    } else {
      setMergedPreviewUrl(null);
      onMergedChange(null);
    }
  }, [
    frontSide,
    backSide,
    otherDocSide,
    paperMode,
    orientation,
    isColor,
    includeCutLine,
    generateMergedCanvas,
    onMergedChange,
  ]);

  // Handle file selection (Clean for customer: no rotation needed)
  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back' | 'other'
  ) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        lang === 'ne'
          ? 'कृपया फोटो फाइल (JPG, PNG) मात्र छान्नुहोस्।'
          : 'Please select an image file (JPG, PNG) only.'
      );
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage(
        lang === 'ne' ? 'फाइल २५ MB भन्दा ठूलो छ।' : 'Image exceeds 25MB limit.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'front') {
        setFrontSide({ rawUrl: result, name: file.name, size: file.size });
      } else if (type === 'back') {
        setBackSide({ rawUrl: result, name: file.name, size: file.size });
      } else {
        setOtherDocSide({ rawUrl: result, name: file.name, size: file.size });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemove = (type: 'front' | 'back' | 'other') => {
    if (type === 'front') {
      setFrontSide({ rawUrl: null, name: '', size: 0 });
    } else if (type === 'back') {
      setBackSide({ rawUrl: null, name: '', size: 0 });
    } else {
      setOtherDocSide({ rawUrl: null, name: '', size: 0 });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* 1. Paper Format Options (A5 Half Paper vs A4 Combo vs A4 Full) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          Paper & Layout Options (कागज तथा लेआउट छनोट)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* OPTION 1: A5 HALF PAPER */}
          <button
            type="button"
            onClick={() => {
              setPaperMode('a5');
              setErrorMessage('');
            }}
            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              paperMode === 'a5'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-900/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1 rounded-lg bg-white/20 text-white">
                <CreditCard className="w-4 h-4" />
              </span>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                  paperMode === 'a5'
                    ? 'bg-emerald-400 text-blue-950'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                A5 Half Paper
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold leading-tight">
                {t.paperModeA5}
              </p>
              <p
                className={`text-[10px] mt-0.5 line-clamp-2 ${
                  paperMode === 'a5' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {t.paperModeA5Desc}
              </p>
            </div>
          </button>

          {/* OPTION 2: A4 COMBO (HALF CITIZENSHIP + HALF OTHER DOCUMENT) */}
          <button
            type="button"
            onClick={() => {
              setPaperMode('a4_combo');
              setErrorMessage('');
            }}
            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              paperMode === 'a4_combo'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-900/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1 rounded-lg bg-white/20 text-white">
                <FilePlus className="w-4 h-4" />
              </span>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                  paperMode === 'a4_combo'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                A4 2-in-1 Combo
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold leading-tight">
                {t.paperModeA4Combo}
              </p>
              <p
                className={`text-[10px] mt-0.5 line-clamp-2 ${
                  paperMode === 'a4_combo' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {t.paperModeA4ComboDesc}
              </p>
            </div>
          </button>

          {/* OPTION 3: A4 FULL SHEET */}
          <button
            type="button"
            onClick={() => {
              setPaperMode('a4_full');
              setErrorMessage('');
            }}
            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
              paperMode === 'a4_full'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-900/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1 rounded-lg bg-white/20 text-white">
                <Layers className="w-4 h-4" />
              </span>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                  paperMode === 'a4_full'
                    ? 'bg-emerald-400 text-blue-950'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                A4 Full
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold leading-tight">
                {t.paperModeA4Full}
              </p>
              <p
                className={`text-[10px] mt-0.5 line-clamp-2 ${
                  paperMode === 'a4_full' ? 'text-blue-200' : 'text-slate-500'
                }`}
              >
                {t.paperModeA4FullDesc}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Customer Notice: No need for customer to rotate or edit */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">
            {lang === 'ne'
              ? 'तपाईंले फोटो सिधा खिचेर अपलोड मात्र गरे पुग्छ।'
              : 'Simply upload clear photos. No editing needed!'}
          </p>
          <p className="text-[11px] text-blue-800/90 mt-0.5">
            {t.staffOnlyEditHint}
          </p>
        </div>
      </div>

      {/* 2. Upload Slots (Front, Back, and Optional Other Document) */}
      <div className={`grid grid-cols-1 ${paperMode === 'a4_combo' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        {/* SLOT 1: FRONT SIDE */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span>{t.uploadFront}</span>
            </span>
            {frontSide.rawUrl && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                ✓ Ready
              </span>
            )}
          </div>

          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleUpload(e, 'front')}
            className="hidden"
          />

          {!frontSide.rawUrl ? (
            <div
              onClick={() => frontInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[120px]"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-blue-700 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-blue-950">
                {t.snapOrUploadFront}
              </span>
              <span className="text-[10px] text-slate-400">JPG or PNG</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={frontSide.rawUrl}
                  alt="Front Side"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  {t.changeImage}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove('front')}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SLOT 2: BACK SIDE */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <span>{t.uploadBack}</span>
            </span>
            {backSide.rawUrl && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                ✓ Ready
              </span>
            )}
          </div>

          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleUpload(e, 'back')}
            className="hidden"
          />

          {!backSide.rawUrl ? (
            <div
              onClick={() => backInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[120px]"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-blue-700 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-blue-950">
                {t.snapOrUploadBack}
              </span>
              <span className="text-[10px] text-slate-400">JPG or PNG</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={backSide.rawUrl}
                  alt="Back Side"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  {t.changeImage}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove('back')}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SLOT 3: ANOTHER DOCUMENT (SHOWN FOR A4 COMBO) */}
        {paperMode === 'a4_combo' && (
          <div className="p-3.5 bg-white border-2 border-amber-200 bg-amber-50/20 rounded-2xl shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <span>{t.uploadOtherDoc}</span>
              </span>
              {otherDocSide.rawUrl && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ✓ Ready
                </span>
              )}
            </div>

            <input
              ref={otherDocInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleUpload(e, 'other')}
              className="hidden"
            />

            {!otherDocSide.rawUrl ? (
              <div
                onClick={() => otherDocInputRef.current?.click()}
                className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/40 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 min-h-[120px]"
              >
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-amber-700 flex items-center justify-center">
                  <FilePlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-amber-950">
                  {t.snapOrUploadOtherDoc}
                </span>
                <span className="text-[10px] text-amber-700/80">
                  License, PAN, Photo or Certificate
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={otherDocSide.rawUrl}
                    alt="Other Document"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => otherDocInputRef.current?.click()}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {t.changeImage}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove('other')}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Style & Cut Guide Controls */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Print Output Style
          </span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onColorChange(false)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                !isColor
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.photocopyGrayscale}
            </button>
            <button
              type="button"
              onClick={() => onColorChange(true)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                isColor
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.colorOriginal}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label
            htmlFor="include-cut-line"
            className="text-slate-600 font-medium flex items-center gap-2 cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-slate-500" />
            <span>Include Center Cut / Fold Guideline</span>
          </label>
          <input
            id="include-cut-line"
            type="checkbox"
            checked={includeCutLine}
            onChange={(e) => setIncludeCutLine(e.target.checked)}
            className="w-4 h-4 rounded text-blue-900 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4. Live Visual Document Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.mergedPreview}</span>
          </span>

          {mergedPreviewUrl && (
            <button
              type="button"
              onClick={() => setZoomModalOpen(true)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Preview</span>
            </button>
          )}
        </div>

        {/* Paper Container Mockup */}
        <div
          className={`relative mx-auto max-w-[320px] ${
            paperMode === 'a5' && orientation === 'landscape'
              ? 'aspect-[1.414/1]'
              : 'aspect-[1/1.414]'
          } bg-white border-2 border-slate-300 rounded-xl shadow-lg overflow-hidden flex flex-col`}
        >
          {/* Paper Size Tag */}
          <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-500 font-bold bg-white/90 px-1.5 py-0.5 rounded border border-slate-200 z-10 shadow-2xs">
            {paperMode === 'a5' ? 'A5 Half Sheet' : 'A4 Standard'}
          </div>

          {mergedPreviewUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={mergedPreviewUrl}
                alt="Merged Document Preview"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setZoomModalOpen(true)}
                className="absolute inset-0 bg-slate-900/10 hover:bg-slate-900/25 transition-colors flex items-center justify-center group"
                title="Click to zoom preview"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-black/75 backdrop-blur-xs text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Document</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                {paperMode === 'a5'
                  ? 'A5 Paper Mockup'
                  : paperMode === 'a4_combo'
                  ? 'A4 Combo (Half Citizenship + Half Other Doc)'
                  : 'A4 Full Sheet Mockup'}
              </p>
              <p className="text-[10px] text-slate-400">
                Upload Front and Back sides above to generate preview
              </p>
            </div>
          )}
        </div>

        {/* Status notice */}
        <div className="text-center">
          {mergedPreviewUrl ? (
            <p className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {paperMode === 'a5'
                  ? 'Merged onto Half A5 Paper — Ready to Print'
                  : paperMode === 'a4_combo'
                  ? 'Merged onto A4 (Half Citizenship + Half Other Document) — Ready to Print'
                  : 'Merged onto Full A4 Sheet — Ready to Print'}
              </span>
            </p>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{t.bothSidesNeeded}</span>
            </p>
          )}
        </div>
      </div>

      {/* Fullscreen Inspection Modal */}
      {zoomModalOpen && mergedPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold font-mono">
                  {paperMode === 'a5' ? 'A5 Half Sheet Preview' : 'A4 Sheet Preview'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              <div className="max-w-md w-full bg-white shadow-2xl border border-slate-200 rounded-lg overflow-hidden">
                <img
                  src={mergedPreviewUrl}
                  alt="High Resolution Preview"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800 text-slate-300 text-xs text-center border-t border-slate-700">
              Shop counter staff can adjust rotation and orientation before printing.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
