import React, { useState } from 'react';
import { Shop, Language } from '../../types';
import { translations } from '../../utils/translations';
import { updateShop, resetSampleData, normalizeUsername, isUsernameAvailable } from '../../utils/storage';
import { Store, Phone, MapPin, Link2, Check, RefreshCw, AlertCircle, ShieldCheck, Mail } from 'lucide-react';

interface ShopSettingsProps {
  shop: Shop;
  lang: Language;
  onShopUpdated: (updatedShop: Shop) => void;
}

export const ShopSettings: React.FC<ShopSettingsProps> = ({
  shop,
  lang,
  onShopUpdated,
}) => {
  const t = translations[lang];

  const [shopName, setShopName] = useState(shop.shop_name);
  const [ownerName, setOwnerName] = useState(shop.owner_name || '');
  const [phone, setPhone] = useState(shop.phone);
  const [address, setAddress] = useState(shop.address);
  const [tagline, setTagline] = useState(shop.tagline || '');
  const [username, setUsername] = useState(shop.username || shop.qr_slug || '');
  const [password, setPassword] = useState(shop.password || 'print123');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normUsername = normalizeUsername(username);
    if (!normUsername || normUsername.length < 3) {
      setError('Please choose a valid username with at least 3 characters.');
      return;
    }

    if (!isUsernameAvailable(normUsername, shop.id)) {
      setError(`The username "@${normUsername}" is already taken by another shop.`);
      return;
    }

    const updated: Shop = {
      ...shop,
      shop_name: shopName.trim(),
      owner_name: ownerName.trim() || undefined,
      phone: phone.trim(),
      address: address.trim(),
      tagline: tagline.trim() || undefined,
      username: normUsername,
      password: password.trim() || 'print123',
      qr_slug: normUsername,
      updated_at: new Date().toISOString(),
    };

    updateShop(updated);
    onShopUpdated(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Reset to initial sample orders and demo configuration?')) {
      (() => {})();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">
            {t.profileTab}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your shop profile, connected Google account, and unique username
          </p>
        </div>

        <div className="text-right">
          <span className="font-mono text-[11px] text-slate-400 block">
            ID: #{shop.id}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Active Profile</span>
          </span>
        </div>
      </div>

      {/* Connected Google Account Information Card (Requirement 8 & 12) */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Connected Google Account
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
              {(shop.owner_name || 'O').charAt(0)}
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                {shop.owner_name || 'Shop Owner'}
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{shop.email || 'contact@namasteprint.np'}</span>
              </span>
            </div>
          </div>
          {shop.owner_google_id && (
            <span className="font-mono text-[10px] text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
              Google ID: {shop.owner_google_id.slice(0, 16)}...
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Shop Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Shop Display Name
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
            <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        {/* Tagline / Subtitle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Shop Tagline / Services Summary
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Digital Printing, Xerox, Photo Studio & Lamination"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Phone & Address in 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Phone / Mobile
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location / Address
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        {/* Unique Custom Shop Username (Requirements 4, 6, 7 & 13) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Custom Shop Username (URL Identity & Slug)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold text-sm">
              @
            </span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(normalizeUsername(e.target.value))}
              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold text-blue-900"
            />
            <Link2 className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
          </div>
          <span className="block text-[11px] text-slate-500 mt-1">
            Customer upload URL: <b className="font-mono text-blue-900">{window.location.origin}/#shop/{normalizeUsername(username) || 'username'}</b>
          </span>
        </div>

        {/* Owner Account Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Owner Account Password
            </label>
            <span className="text-[10px] text-slate-400">
              Used when signing in with @{normalizeUsername(username) || 'username'}
            </span>
          </div>
          <input
            type="text"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-medium"
          />
        </div>

        {/* Save button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
            <span>{saved ? 'Changes Saved!' : t.save}</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Orders</span>
          </button>
        </div>
      </form>
    </div>
  );
};
