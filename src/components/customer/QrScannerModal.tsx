import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, X, QrCode, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Shop, Language } from '../../types';
import { getPublicShops } from '../../utils/storage';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShopFound: (shop: Shop) => void;
  lang: Language;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onShopFound,
  lang,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanningFile, setIsScanningFile] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio not permitted or supported
    }
  };

  const handleQrPayload = async (rawText: string) => {
    setErrorMsg('');
    let slug = rawText.trim();

    // Check if it's a URL like http://.../#shop/namaste-print
    if (slug.includes('#shop/')) {
      slug = slug.split('#shop/')[1].split('?')[0].split('/')[0];
    } else if (slug.startsWith('http://') || slug.startsWith('https://')) {
      const parts = slug.split('/');
      slug = parts[parts.length - 1];
    }

    slug = slug.replace(/[^a-zA-Z0-9_-]/g, '').trim();

    if (!slug) {
      setErrorMsg(lang === 'ne' ? 'अमान्य QR कोड' : 'Invalid QR code');
      return;
    }

    try {
      // Fetch shop details from backend API
      const res = await fetch(`http://localhost:5000/api/shops/public/${slug}`);
      const data = await res.json();
      if (data.success && data.shop) {
        playSuccessSound();
        stopCamera();
        onShopFound(data.shop);
        return;
      }
    } catch {
      // Offline fallback
    }

    // Try finding in public shops list or default shop
    const shops = await getPublicShops();
    const found = shops.find(
      (s) =>
        s.qr_slug?.toLowerCase() === slug.toLowerCase() ||
        s.username?.toLowerCase() === slug.toLowerCase() ||
        s.id.toLowerCase() === slug.toLowerCase()
    );

    if (found) {
      playSuccessSound();
      stopCamera();
      onShopFound(found);
    } else {
      // If only one default shop exists and slug matches print keyword
      if (shops.length === 1 && (slug.toLowerCase().includes('print') || slug.toLowerCase().includes('shop'))) {
        playSuccessSound();
        stopCamera();
        onShopFound(shops[0]);
        return;
      }
      setErrorMsg(
        lang === 'ne'
          ? `पसल '${slug}' फेला परेन। कृपया कोड पुनः जाँच गर्नुहोस्।`
          : `Shop '${slug}' not found. Please try scanning again or enter code.`
      );
    }
  };

  const startCamera = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setErrorMsg(
        lang === 'ne'
          ? 'क्यामेरा खोल्न सकिएन। कृपया अनुमति दिनुहोस् वा QR फोटो अपलोड गर्नुहोस्।'
          : 'Could not access camera. Please allow camera permission or upload a QR image.'
      );
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleQrPayload(code.data);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsScanningFile(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        setIsScanningFile(false);
        if (code && code.data) {
          handleQrPayload(code.data);
        } else {
          setErrorMsg(
            lang === 'ne'
              ? 'अपलोड गरिएको फोटोमा QR कोड फेला परेन।'
              : 'No QR code found in the uploaded image. Please try another.'
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <QrCode className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {lang === 'ne' ? 'पसलको QR कोड स्क्यान गर्नुहोस्' : 'Scan Shop QR Code'}
              </h3>
              <p className="text-xs text-blue-200">
                {lang === 'ne' ? 'काउन्टरको पोस्टरमा क्यामेरा देखाउनुहोस्' : 'Point camera at the counter poster'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-5 flex-1 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden min-h-[300px]">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover rounded-2xl ${cameraActive ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Holographic Target Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-60 h-60 border-2 border-dashed border-blue-400 rounded-3xl relative shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                {/* 4 Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />

                {/* Laser scanline animation */}
                <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_8px_#22d3ee]" />
              </div>
            </div>
          )}

          {/* Camera Loading or Inactive State */}
          {!cameraActive && (
            <div className="text-center p-6 space-y-3 text-slate-300">
              <Camera className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-sm font-medium">
                {errorMsg || (lang === 'ne' ? 'क्यामेरा खोल्दै...' : 'Starting camera feed...')}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'ne' ? 'पुनः प्रयास गर्नुहोस्' : 'Retry Camera'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="px-4 py-2.5 bg-red-50 text-red-700 text-xs flex items-center gap-2 border-b border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Alternative Actions: Upload Image or Enter Code */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="flex gap-2">
            {/* Upload QR image button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanningFile}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isScanningFile ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Upload className="w-4 h-4 text-blue-600" />
              )}
              <span>{lang === 'ne' ? 'QR फोटो अपलोड' : 'Upload QR Image'}</span>
            </button>
          </div>

          {/* Quick manual shop code input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                handleQrPayload(manualCode.trim());
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={lang === 'ne' ? 'वा पसल कोड (उदा: namaste-print)' : 'Or enter shop slug (e.g. namaste-print)'}
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none lowercase font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {lang === 'ne' ? 'खोल्नुहोस्' : 'Open'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
