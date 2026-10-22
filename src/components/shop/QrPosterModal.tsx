import React, { useEffect, useRef, useState } from 'react';
import { Shop, Language, StaffMember } from '../../types';
import { translations } from '../../utils/translations';
import { NamasteLogo } from '../NamasteLogo';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  Download,
  Printer,
  Copy,
  Check,
  MapPin,
  Phone,
  FileCheck,
  Share2,
  ShieldCheck,
  QrCode,
  MessageCircle,
  X,
  Loader2
} from 'lucide-react';

interface QrPosterModalProps {
  shop: Shop;
  lang: Language;
  currentUser?: StaffMember | null;
  onShopUpdated?: (shop: Shop) => void;
}

// Official Namaste Print Graphical Logo Icon (Symbol Only, NO text)
// Precisely centered inside the square QR code (Requirements 3, 4 & 5)
const NAMASTE_ICON_ONLY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none">
  <defs>
    <linearGradient id="qrIconBlueStem" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0842B0" />
      <stop offset="100%" stop-color="#002D80" />
    </linearGradient>
    <linearGradient id="qrIconFlagRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E61A24" />
      <stop offset="100%" stop-color="#C91019" />
    </linearGradient>
  </defs>
  <!-- QR Code Pixel Matrix elements forming top of N -->
  <rect x="25" y="35" width="42" height="42" rx="3" fill="#0842B0" />
  <rect x="33" y="43" width="26" height="26" rx="2" fill="#FFFFFF" />
  <rect x="39" y="49" width="14" height="14" rx="1" fill="#0842B0" />
  <rect x="73" y="35" width="12" height="12" rx="1" fill="#0842B0" />
  <rect x="88" y="35" width="12" height="12" rx="1" fill="#0842B0" />
  <rect x="73" y="50" width="12" height="12" rx="1" fill="#0842B0" />
  <rect x="25" y="82" width="12" height="12" rx="1" fill="#0842B0" />
  <rect x="40" y="82" width="12" height="12" rx="1" fill="#0842B0" />
  <rect x="67" y="66" width="18" height="18" rx="1" fill="#0842B0" />
  <rect x="25" y="98" width="12" height="12" rx="1" fill="#0842B0" />
  <rect x="42" y="98" width="12" height="12" rx="1" fill="#0842B0" />
  <rect x="58" y="98" width="12" height="12" rx="1" fill="#0842B0" />
  <!-- Solid Left Pillar Base -->
  <rect x="25" y="112" width="42" height="60" rx="3" fill="url(#qrIconBlueStem)" />
  <!-- Diagonal Connecting Bridge of N -->
  <path d="M60 76 L130 148 L170 148 L95 76 Z" fill="url(#qrIconBlueStem)" />
  <!-- Right Vertical Pillar of N -->
  <rect x="130" y="72" width="40" height="100" rx="3" fill="url(#qrIconBlueStem)" />
  <!-- Nepal Flag Pennant Peak (Red) -->
  <path d="M128 66 L175 66 L128 32 Z" fill="url(#qrIconFlagRed)" />
  <!-- Flag Sun Emblem -->
  <circle cx="145" cy="53" r="5" fill="#FFFFFF" />
  <path d="M145 44 L146.5 48 L151 46.5 L148.5 50.5 L153 53 L148.5 55.5 L151 59.5 L146.5 58 L145 62 L143.5 58 L139 59.5 L141.5 55.5 L137 53 L141.5 50.5 L139 46.5 L143.5 48 Z" fill="#FFFFFF" />
</svg>`;

export const QrPosterModal: React.FC<QrPosterModalProps> = ({
  shop,
  lang,
  currentUser,
}) => {
  const t = translations[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const isOwner = currentUser?.role === 'owner' || !currentUser;

  // Real, permanent shop destination link (never modified)
  const shopUrl = `${window.location.origin}/#shop/${shop.qr_slug}`;

  // Generate functional square QR code with Level 'H' error correction (30% tolerance)
  // and draw the Namaste Print graphical icon symbol into the exact center (Requirements 2, 3, 4 & 5)
  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      shopUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#002B7F', // Deep royal blue brand color
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // High 30% error recovery tolerance
      },
      (error) => {
        if (error) {
          console.error('QR code generation error:', error);
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw the Namaste Print graphical icon in the center of the QR canvas
        const logoImg = new Image();
        const svgBlob = new Blob([NAMASTE_ICON_ONLY_SVG], {
          type: 'image/svg+xml;charset=utf-8',
        });
        const url = URL.createObjectURL(svgBlob);

        logoImg.onload = () => {
          // Icon badge occupies ~20% of the QR width, safely below the 30% Level H tolerance
          const badgeSize = Math.round(canvas.width * 0.20);
          const badgeX = (canvas.width - badgeSize) / 2;
          const badgeY = (canvas.height - badgeSize) / 2;
          const radius = Math.round(badgeSize * 0.22);

          ctx.save();
          // Small clean white rounded area at the exact center of the QR
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, radius);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.lineWidth = Math.max(1.5, Math.round(canvas.width * 0.006));
          ctx.strokeStyle = '#002B7F';
          ctx.stroke();

          // Draw ONLY the graphical icon inside with clean proportional padding
          const pad = Math.round(badgeSize * 0.12);
          ctx.drawImage(
            logoImg,
            badgeX + pad,
            badgeY + pad,
            badgeSize - pad * 2,
            badgeSize - pad * 2
          );
          ctx.restore();

          URL.revokeObjectURL(url);
        };

        logoImg.src = url;
      }
    );
  }, [shopUrl]);

  // High-fidelity fallback canvas generator matching the exact poster design
  const createFallbackPosterCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1680;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background: Pure White
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer Border
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(40, 40, canvas.width - 80, canvas.height - 80, 36);
    ctx.stroke();

    // 1. TOP SECTION
    ctx.textAlign = 'center';
    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('OFFICIAL PRINT COUNTER', canvas.width / 2, 125);

    ctx.fillStyle = '#020617';
    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.fillText(shop.shop_name, canvas.width / 2, 185);

    ctx.fillStyle = '#475569';
    ctx.font = 'normal 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${shop.address}   ·   Phone: ${shop.phone}`, canvas.width / 2, 235);

    // Divider Line
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(80, 275);
    ctx.lineTo(canvas.width - 80, 275);
    ctx.stroke();

    // 2. INSTRUCTIONS
    ctx.fillStyle = '#172554';
    ctx.font = '900 38px system-ui, -apple-system, sans-serif';
    ctx.fillText(t.scanInstructionEn || 'Scan to send or receive your file', canvas.width / 2, 345);

    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText(t.scanInstructionNe || 'स्क्यान गरी अर्डर पठाउनुहोस् वा फाइल लिनुहोस्', canvas.width / 2, 400);

    // 3. SQUARE QR FRAME
    const qrFrameSize = 580;
    const qrFrameX = (canvas.width - qrFrameSize) / 2;
    const qrFrameY = 460;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 24);
    ctx.fill();
    ctx.strokeStyle = '#172554';
    ctx.lineWidth = 8;
    ctx.stroke();

    if (canvasRef.current) {
      const qrDrawSize = 520;
      const qrDrawX = (canvas.width - qrDrawSize) / 2;
      const qrDrawY = qrFrameY + (qrFrameSize - qrDrawSize) / 2;
      ctx.drawImage(canvasRef.current, qrDrawX, qrDrawY, qrDrawSize, qrDrawSize);
    }

    // 4. HIGHLIGHTS BOX
    const boxY = 1100;
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(100, boxY, canvas.width - 200, 210, 24);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#172554';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('1. Send to Print', 140, boxY + 60);
    ctx.fillStyle = '#64748B';
    ctx.font = 'normal 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('PDFs, Photos & Documents directly from mobile', 140, boxY + 95);

    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('2. Receive Files', 140, boxY + 145);
    ctx.fillStyle = '#64748B';
    ctx.font = 'normal 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Scans & Photos via secure 4-digit PIN', 140, boxY + 180);

    // 5. BOTTOM BRANDING
    ctx.textAlign = 'center';
    ctx.fillStyle = '#002B7F';
    ctx.font = '900 38px system-ui, -apple-system, sans-serif';
    ctx.fillText('NAMASTE PRINT', canvas.width / 2, 1420);

    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Scan. Upload. Print.   ·   नमस्ते प्रिन्ट', canvas.width / 2, 1465);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'normal 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('No App or Account Required · Direct Browser Scan', canvas.width / 2, 1515);

    return canvas;
  };

  // Requirement 14: Download the COMPLETE poster as High-Resolution PNG
  const handleDownloadFullPosterPng = async () => {
    if (!posterRef.current || isExportingPng) return;
    setIsExportingPng(true);

    try {
      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(posterRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false,
        });
      } catch (captureErr) {
        console.warn('DOM capture warning, generating fallback canvas:', captureErr);
        canvas = createFallbackPosterCanvas();
      }

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${shop.qr_slug}-complete-qr-poster.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PNG poster export error:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Requirement 14 & 15: Download the COMPLETE poster as Print-Ready PDF (A4 Sheet)
  const handleDownloadFullPosterPdf = async () => {
    if (!posterRef.current || isExportingPdf) return;
    setIsExportingPdf(true);

    try {
      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(posterRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false,
        });
      } catch (captureErr) {
        console.warn('DOM capture warning, generating fallback canvas:', captureErr);
        canvas = createFallbackPosterCanvas();
      }

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Standard A4 dimensions: 210 x 297 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasAspectRatio = canvas.width / canvas.height;
      const margin = 15; // 15mm margin
      let imgWidth = pdfWidth - margin * 2;
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > pdfHeight - margin * 2) {
        imgHeight = pdfHeight - margin * 2;
        imgWidth = imgHeight * canvasAspectRatio;
      }

      const xPos = (pdfWidth - imgWidth) / 2;
      const yPos = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`${shop.qr_slug}-namaste-print-poster.pdf`);
    } catch (err) {
      console.error('PDF poster export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Requirement 15: Print complete poster on A4 sheet
  const handlePrintPoster = () => {
    window.print();
  };

  // Requirement 16: Copy actual Shop QR destination URL
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Share poster via Web Share API or interactive modal
  const handleShareQr = async () => {
    setIsSharing(true);
    try {
      let canvas: HTMLCanvasElement;
      if (posterRef.current) {
        try {
          canvas = await html2canvas(posterRef.current, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false,
          });
        } catch {
          canvas = createFallbackPosterCanvas();
        }
      } else {
        canvas = createFallbackPosterCanvas();
      }

      if (navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png', 0.95)
        );
        if (blob) {
          const file = new File([blob], `${shop.qr_slug}-qr-poster.png`, {
            type: 'image/png',
          });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${shop.shop_name} — Namaste Print Poster`,
              text: `Scan our official Namaste Print QR code to print files or receive documents at ${shop.shop_name}!`,
              url: shopUrl,
            });
            setIsSharing(false);
            return;
          }
        }
      }

      if (navigator.share) {
        await navigator.share({
          title: `${shop.shop_name} — Namaste Print Poster`,
          text: `Scan our official Namaste Print QR code to print files or receive documents at ${shop.shop_name}!`,
          url: shopUrl,
        });
      } else {
        setShowShareModal(true);
      }
    } catch (err) {
      console.warn('Share dismissed or cancelled:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Control Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-900" />
              <span>{t.myQrTitle || 'Shop Official QR Poster'}</span>
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-800 rounded-full border border-blue-200">
              High Resolution A4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOwner
              ? 'Complete printable poster with your shop name, square QR, centered brand icon, and instant customer instructions.'
              : 'Staff access: View, share, and print the official shop counter QR poster.'}
          </p>
        </div>

        {/* Action Buttons Panel (Requirements 14, 15 & 16) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Share QR Button */}
          <button
            type="button"
            disabled={isSharing}
            onClick={handleShareQr}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Share complete poster via WhatsApp or social apps"
          >
            {isSharing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-indigo-700" />
            )}
            <span>Share QR</span>
          </button>

          {/* Copy Direct Shop Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Copy permanent direct customer URL"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Requirement 14: Download Complete Poster as PNG */}
          <button
            type="button"
            disabled={isExportingPng}
            onClick={handleDownloadFullPosterPng}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Download the full poster as high-resolution PNG"
          >
            {isExportingPng ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-800" />
            )}
            <span>Download Poster (PNG)</span>
          </button>

          {/* Requirement 14 & 15: Download Complete Poster as PDF */}
          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadFullPosterPdf}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Download the entire poster formatted for A4 printing as PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileCheck className="w-3.5 h-3.5 text-red-600" />
            )}
            <span>Download Poster (PDF)</span>
          </button>

          {/* Requirement 15: Direct Browser Print (A4 Sheet) */}
          <button
            type="button"
            onClick={handlePrintPoster}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            title="Print directly to local printer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print (A4 Sheet)</span>
          </button>
        </div>
      </div>

      {/* Role / Ownership Notice */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-500 no-print">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {isOwner
              ? 'Owner Management: Official printable counter poster for your shop.'
              : 'Staff Access: Authorized to view, print, and share the official shop counter poster.'}
          </span>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Permanent ID: #{shop.qr_slug}
        </span>
      </div>

      {/* 
        ======================================================================
        COMPLETE PRINTABLE POSTER CARD (Preserved Exact Original Visual Appearance)
        With the Namaste Print graphical icon symbol precisely centered inside the QR======================================================================
      */}
      <div className="flex justify-center p-2">
        <div
          ref={posterRef}
          id="printable-poster"
          className="print-page w-full max-w-[480px] bg-white border-2 border-slate-900 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-5 select-none relative overflow-hidden"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Top Shop Banner (Preserved Exactly) */}
          <div className="space-y-1 w-full border-b-2 border-slate-900 pb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
              OFFICIAL PRINT COUNTER
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-display">
              {shop.shop_name}
            </h2>
            <div className="flex items-center justify-center gap-3 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{shop.address}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                <span>{shop.phone}</span>
              </span>
            </div>
          </div>

          {/* Bilingual Action Callout (Preserved Exactly) */}
          <div className="space-y-1.5 px-2">
            <h3 className="text-lg sm:text-xl font-black text-blue-950 font-display leading-tight">
              {t.scanInstructionEn || 'Scan to send or receive your file'}
            </h3>
            <p className="text-sm sm:text-base font-bold text-red-600 leading-snug">
              {t.scanInstructionNe || 'स्क्यान गरी अर्डर पठाउनुहोस् वा फाइल लिनुहोस्'}
            </p>
          </div>

          {/* 
            High Contrast Permanent QR Frame (Preserved Container & Size)
            With the Namaste Print graphical logo icon placed precisely in the center
            (Requirements 3, 4, 5, 6 & 7)
          */}
          <div className="relative p-3 bg-white border-4 border-blue-950 rounded-2xl shadow-sm flex items-center justify-center">
            <canvas ref={canvasRef} className="w-60 h-60 mx-auto rounded-lg block" />
            {/* Center Area: Clean white rounded square with ONLY the graphical Namaste Print icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[50px] h-[50px] bg-white rounded-xl shadow-xs p-1 flex items-center justify-center border border-blue-900/30">
                <NamasteLogo variant="mark-only" size="sm" />
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid (Preserved Exactly) */}
          <div className="grid grid-cols-2 gap-3 w-full text-left text-xs bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
            <div className="space-y-0.5">
              <p className="font-bold text-blue-950 text-xs">1. Send to Print</p>
              <p className="text-slate-500 text-[11px]">PDFs, Photos & Documents</p>
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-red-600 text-xs">2. Receive Files</p>
              <p className="text-slate-500 text-[11px]">Scans & Photos via 4-digit PIN</p>
            </div>
          </div>

          {/* Namaste Print Official Platform Branding Footer (Preserved Exactly) */}
          <div className="pt-2 w-full flex flex-col items-center border-t border-slate-200">
            <NamasteLogo size="md" variant="horizontal" showTagline={true} />
            <p className="text-[10px] text-slate-400 font-medium mt-1.5">
              No App or Account Required · Direct Browser Scan
            </p>
          </div>
        </div>
      </div>

      {/* Share Sheet Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 font-display flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-900" />
                <span>Share Shop QR</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Share your shop's official counter QR poster on social apps or copy the direct link
            </p>

            <div className="space-y-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Send files or print directly at ${shop.shop_name} via Namaste Print: ${shopUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleDownloadFullPosterPng();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Poster Image (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCopyLink();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Direct Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
