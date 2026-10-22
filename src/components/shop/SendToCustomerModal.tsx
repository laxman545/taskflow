import React, { useState, useRef, useEffect } from 'react';
import { Shop, Language, OutgoingTransfer, OutgoingFile } from '../../types';
import { translations } from '../../utils/translations';
import { getTransfers, createTransfer, deleteTransfer, updateTransferPin } from '../../utils/storage';

import { generateRandomPin, formatTimeRemaining } from '../../utils/security';
import {
  Upload,
  KeyRound,
  User,
  Plus,
  Trash2,
  Printer,
  Copy,
  Check,
  Clock,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Edit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SendToCustomerModalProps {
  shop: Shop;
  lang: Language;
}

export const SendToCustomerModal: React.FC<SendToCustomerModalProps> = ({
  shop,
  lang,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [pin, setPin] = useState(() => generateRandomPin());
  const [files, setFiles] = useState<OutgoingFile[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTransfer, setSuccessTransfer] = useState<OutgoingTransfer | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Transfers list state
  const [transfers, setTransfers] = useState<OutgoingTransfer[]>([]);
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);
  const [newEditPin, setNewEditPin] = useState<string>('');

  const refreshTransfers = async () => {
    try {
      const data = await getTransfers();
      setTransfers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshTransfers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (!e.target.files || e.target.files.length === 0) return;

    const maxSizeBytes = 20 * 1024 * 1024;
    Array.from(e.target.files).forEach((file) => {
      if (file.size > maxSizeBytes) {
        setErrorMsg(`File ${file.name} exceeds 20MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const outDoc: OutgoingFile = {
          id: `out_file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          transfer_id: '',
          file_name: file.name,
          file_path: `/outgoing/${file.name}`,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          data_url: reader.result as string,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        setFiles((prev) => [...prev, outDoc]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter customer name.');
      return;
    }
    if (pin.length !== 4) {
      setErrorMsg('PIN must be 4 digits.');
      return;
    }
    if (files.length === 0) {
      setErrorMsg('Please upload at least one file for the customer.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const transfer = await createTransfer({
        customer_name: customerName,
        pin,
        files,
      });

      setSuccessTransfer(transfer);
      refreshTransfers();

      // Reset form
      setCustomerName('');
      setPin(generateRandomPin());
      setFiles([]);
    } catch (err) {
      console.error('Transfer creation error:', err);
      setErrorMsg('Failed to create transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (confirm('Are you sure you want to delete this file transfer early?')) {
      await deleteTransfer(id);
      refreshTransfers();
    }
  };

  const handleSavePinChange = async (transferId: string) => {
    if (newEditPin.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }
    await updateTransferPin(transferId, newEditPin);
    setEditingTransferId(null);
    setNewEditPin('');
    refreshTransfers();
  };

  const handlePrintSlip = (transfer: OutgoingTransfer) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer File Slip - ${transfer.customer_name}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
          .shop { font-weight: bold; font-size: 16px; }
          .field { margin: 8px 0; font-size: 14px; }
          .pin-box { font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; border: 2px solid #000; padding: 8px; margin: 15px 0; }
          .footer { font-size: 11px; text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop">${shop.shop_name}</div>
          <div style="font-size:12px;">Namaste Print - File Receipt</div>
          <div style="font-size:11px;">${new Date().toLocaleString()}</div>
        </div>
        <div class="field">Customer: <b>${transfer.customer_name}</b></div>
        <div class="field">Files: <b>${transfer.files.length} document(s)</b></div>
        <div style="text-align:center; font-size:12px; margin-top:10px;">YOUR 4-DIGIT RETRIEVAL PIN:</div>
        <div class="pin-box">${transfer.raw_pin_for_shop || '••••'}</div>
        <div style="font-size:12px; line-height: 1.4;">
          1. Scan the shop counter QR code.<br/>
          2. Tap "Receive a file".<br/>
          3. Enter your name & PIN to download.<br/>
        </div>
        <div class="footer">
          Valid for 24 Hours Only.<br/>
          Files auto-delete for privacy
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      {/* Upload & Create Transfer Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="max-w-xl">
          <h3 className="text-lg font-bold text-slate-900 font-display">
            {t.sendToCustomerTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {t.sendToCustomerSub}
          </p>
        </div>

        <form onSubmit={handleCreateTransfer} className="mt-6 space-y-4 max-w-xl">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.customerRecipientName}
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t.customerRecipientPlaceholder}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          {/* 4-digit PIN setup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                {t.pinLabel}
              </label>
              <button
                type="button"
                onClick={() => setPin(generateRandomPin())}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.generateRandomPin}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono tracking-widest font-black text-blue-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="absolute right-3 top-3 text-[11px] text-slate-400 font-medium">
                4-digit code
              </span>
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.uploadFilesForCustomer}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 p-4 rounded-xl text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-700">
                Choose Scanned Documents / Photos
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PDF, JPG, PNG (Max 20MB per file)
              </p>
            </div>

            {/* Chosen files preview */}
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-xs"
                  >
                    <span className="truncate font-medium text-blue-950">{f.file_name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createTransferButton}</span>
          </button>
        </form>

        {/* Success Slip Banner */}
        {successTransfer && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t.transferCreatedSuccess}
              </span>
              <button
                type="button"
                onClick={() => setSuccessTransfer(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Customer: <b className="text-slate-800">{successTransfer.customer_name}</b></p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">4-Digit PIN:</span>
                  <span className="text-lg font-mono font-black text-blue-950 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {successTransfer.raw_pin_for_shop}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (successTransfer.raw_pin_for_shop) {
                      navigator.clipboard.writeText(successTransfer.raw_pin_for_shop);
                      setCopiedPin(true);
                      setTimeout(() => setCopiedPin(false), 2000);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintSlip(successTransfer)}
                  className="px-2.5 py-1.5 bg-blue-900 text-white hover:bg-blue-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active & Recent Transfers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 font-display text-base">
              {t.activeTransfers}
            </h4>
            <p className="text-xs text-slate-500">
              Files auto-delete after 24 hours
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {transfers.length} {transfers.length === 1 ? 'transfer' : 'transfers'}
          </span>
        </div>

        {transfers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No outgoing file transfers yet. Create one above for a customer
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">PIN</th>
                  <th className="py-3 px-4 font-bold">Files</th>
                  <th className="py-3 px-4 font-bold">Sender & PC</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Expires In</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transfers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      {editingTransferId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            maxLength={4}
                            value={newEditPin}
                            onChange={(e) => setNewEditPin(e.target.value.replace(/\D/g, ''))}
                            className="w-16 px-1.5 py-0.5 border border-blue-400 rounded text-xs font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePinChange(item.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{item.raw_pin_for_shop || '••••'}</span>
                          {item.status === 'waiting' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTransferId(item.id);
                                setNewEditPin(item.raw_pin_for_shop || '');
                              }}
                              className="text-slate-400 hover:text-slate-600"
                              title={t.changePin}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.files.length} file(s)
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">
                          {item.sent_by_staff_name || 'Front Desk Staff'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Floating
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'downloaded'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'expired'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status === 'downloaded'
                          ? t.transferStatusDownloaded
                          : item.status === 'expired'
                          ? t.transferStatusExpired
                          : t.transferStatusWaiting}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {formatTimeRemaining(item.expires_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintSlip(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t.printSlip}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransfer(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t.deleteTransfer}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
