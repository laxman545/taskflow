import React, { useState, useEffect } from 'react';
import { Shop, Language } from '../../types';
import { getPublicShops } from '../../utils/storage';
import { translations } from '../../utils/translations';
import { Store, MapPin, ChevronRight, Loader2, Camera } from 'lucide-react';
import { NamasteLogo } from '../NamasteLogo';
import { QrScannerModal } from './QrScannerModal';

interface ShopSelectorProps {
  lang: Language;
  onShopSelect: (shop: Shop) => void;
}

export const ShopSelector: React.FC<ShopSelectorProps> = ({ lang, onShopSelect }) => {
  const t = translations[lang];
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const fetchShops = async () => {
      const publicShops = await getPublicShops();
      setShops(publicShops);
      setLoading(false);
    };
    fetchShops();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 relative overflow-hidden pb-12">
      {/* Background ambient decorative glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-b from-blue-100/50 via-blue-50/20 to-transparent blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center mb-3">
          <NamasteLogo size="md" variant="full" showTagline={false} />
        </div>

        <div className="mt-2 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/60 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>{lang === 'ne' ? 'काउन्टर छनोट' : 'Counter Selection'}</span>
          </div>

          <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">
            {lang === 'ne' ? 'पसल छान्नुहोस्' : 'Select a Print Station'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {lang === 'ne'
              ? 'काउन्टरको QR स्क्यान गर्नुहोस् वा तलको सूचीबाट छान्नुहोस्'
              : 'Scan the tabletop QR code at the counter or pick your local station below'}
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-2 space-y-4">
        {/* Primary: Scan QR */}
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="w-full text-left group"
        >
          <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 relative overflow-hidden group-hover:-translate-y-0.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Camera className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  {lang === 'ne' ? 'QR कोड स्क्यान गर्नुहोस्' : 'Scan Station QR Code'}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Instant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {lang === 'ne'
                  ? 'काउन्टरको पोस्टर स्क्यान गरी सिधै फाइल पठाउनुहोस्'
                  : 'Point camera at the tabletop counter poster to connect instantly'}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-1 border-t border-slate-200/80" />
          <span className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 bg-transparent">
            {lang === 'ne' ? 'वा स्टेशन सूची' : 'or choose a station'}
          </span>
          <div className="flex-1 border-t border-slate-200/80" />
        </div>

        {/* Shop list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">
              {lang === 'ne' ? 'पसलहरू लोड हुँदैछ...' : 'Loading registered stations…'}
            </p>
          </div>
        ) : shops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl gap-3 text-center bg-white border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                {lang === 'ne' ? 'हाल कुनै पसल उपलब्ध छैन' : 'No stations online right now'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ne' ? 'पसलको QR कोड स्क्यान गर्नुहोस्' : 'Scan the shop QR code directly at the counter'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {shops.map((shopItem) => (
              <button
                key={shopItem.id}
                type="button"
                onClick={() => onShopSelect(shopItem)}
                className="w-full text-left group"
              >
                <div className="rounded-2xl p-4 bg-white border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-4 group-hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                      {shopItem.shop_name}
                    </h3>
                    {shopItem.address && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="text-xs text-slate-500 truncate">
                          {shopItem.address}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onShopFound={(selectedShop) => {
          setShowScanner(false);
          onShopSelect(selectedShop);
        }}
        lang={lang}
      />
    </div>
  );
};
