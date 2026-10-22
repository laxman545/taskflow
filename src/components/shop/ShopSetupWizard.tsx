import React, { useState, useEffect } from 'react';
import { GoogleAuthUser, Shop } from '../../types';
import {
  normalizeUsername,
  isUsernameAvailable,
  generateUsernameSuggestions,
  createShop
} from '../../utils/storage';
import { NamasteLogo } from '../NamasteLogo';
import {
  Store,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Phone,
  MapPin,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface ShopSetupWizardProps {
  authUser: GoogleAuthUser;
  onSetupComplete: (createdShop: Shop) => void;
  onCancel?: () => void;
}

export const ShopSetupWizard: React.FC<ShopSetupWizardProps> = ({
  authUser,
  onSetupComplete,
  onCancel,
}) => {
  // Form state
  const [shopName, setShopName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+977 ');
  const [address, setAddress] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Username validation & recommendations state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [alternativeSuggestions, setAlternativeSuggestions] = useState<string[]>([]);
  const [userManuallyEditedUsername, setUserManuallyEditedUsername] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step tracking for progress indicator (Requirement 3)
  // Step 1: Google Account Verified (done)
  // Step 2: Shop Info
  // Step 3: Choose Username
  // Step 4: Confirmation & Launch
  const currentStep = !shopName.trim()
    ? 2
    : !username.trim() || usernameStatus !== 'available'
    ? 3
    : 4;

  // Auto-generate suggestions when Shop Name changes (Requirement 5)
  useEffect(() => {
    if (!shopName.trim()) {
      setSuggestions([]);
      return;
    }

    const generated = (() => [])();
    setSuggestions(generated);

    // If owner hasn't manually edited the username field, auto-fill the best suggestion
    if (!userManuallyEditedUsername && generated.length > 0) {
      const best = generated[0];
      setUsername(best);
      setUsernameStatus('available');
    }
  }, [shopName, userManuallyEditedUsername]);

  // Real-time debounced username validation & availability check (Requirement 6 & 7)
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus('idle');
      return;
    }

    const normalized = normalizeUsername(username);

    if (normalized.length < 3) {
      setUsernameStatus('invalid');
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(() => {
      const available = isUsernameAvailable(normalized);
      setIsCheckingUsername(false);

      if (available) {
        setUsernameStatus('available');
        setAlternativeSuggestions([]);
      } else {
        setUsernameStatus('taken');
        // Provide smart alternatives immediately if username is unavailable (Requirement 6)
        const alternatives = [
          `${normalized}nepal`,
          `${normalized}ktm`,
          `${normalized}cyber`,
          `${normalized}_print`,
        ].filter((alt) => isUsernameAvailable(alt)).slice(0, 3);
        setAlternativeSuggestions(alternatives);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSelectSuggestion = (selected: string) => {
    setUserManuallyEditedUsername(true);
    setUsername(selected);
    setUsernameStatus('available');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserManuallyEditedUsername(true);
    const normalized = normalizeUsername(e.target.value);
    setUsername(normalized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normUsername = normalizeUsername(username);
    if (!normUsername || normUsername.length < 3) {
      setErrorMessage('Please choose a valid username with at least 3 characters.');
      return;
    }

    if (!isUsernameAvailable(normUsername)) {
      setErrorMessage('This username is already taken. Please choose another username.');
      return;
    }

    if (!shopName.trim()) {
      setErrorMessage('Please enter your Shop Name.');
      return;
    }

    if (!phone.trim() || phone.trim() === '+977') {
      setErrorMessage('Please enter a valid phone number for customer inquiries.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter your shop address/location.');
      return;
    }

    try {
      setIsSubmitting(true);

      const created = createShop({
        shop_name: shopName.trim(),
        username: normUsername,
        owner_name: authUser.name,
        owner_google_id: authUser.google_id,
        email: authUser.email,
        phone: phone.trim(),
        address: address.trim(),
        tagline: tagline.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
      });

      setIsSubmitting(false);
      onSetupComplete(created);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to create shop. Please try again.');
    }
  };

  const sampleUrlPreview = `${window.location.origin}/#shop/${normalizeUsername(username) || 'your-shop'}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/90 space-y-8 animate-scale-in">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <NamasteLogo size="md" variant="horizontal" showTagline={false} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            Set Up Your Shop Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Welcome to Namaste Print! Set up your shop profile and choose your unique tabletop QR username
          </p>
        </div>

        {/* Progress Indicator (Requirement 3) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            {/* Step 1: Google Account */}
            <div className="space-y-1">
              <div className="w-7 h-7 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-emerald-800 text-[11px] block">Google Account</span>
            </div>

            {/* Step 2: Shop Info */}
            <div className="space-y-1">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs shadow-xs font-black ${
                  currentStep >= 2
                    ? 'bg-blue-600 text-white shadow-blue-500/25'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <span className={currentStep >= 2 ? 'text-blue-600 font-bold text-[11px]' : 'text-slate-400 text-[11px]'}>
                Shop Info
              </span>
            </div>

            {/* Step 3: Choose Username */}
            <div className="space-y-1">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs shadow-xs font-black ${
                  currentStep >= 3
                    ? 'bg-blue-600 text-white shadow-blue-500/25'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                3
              </div>
              <span className={currentStep >= 3 ? 'text-blue-600 font-bold text-[11px]' : 'text-slate-400 text-[11px]'}>
                Username
              </span>
            </div>

            {/* Step 4: Complete */}
            <div className="space-y-1">
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs shadow-xs font-black ${
                  currentStep >= 4
                    ? 'bg-blue-600 text-white shadow-blue-500/25'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                4
              </div>
              <span className={currentStep >= 4 ? 'text-blue-600 font-bold text-[11px]' : 'text-slate-400 text-[11px]'}>
                Launch
              </span>
            </div>
          </div>
        </div>

        {/* Google Account Summary Card */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
              {authUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs">{authUser.name}</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                  Verified Owner
                </span>
              </div>
              <span className="text-xs text-slate-600 block">{authUser.email}</span>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Sign Out
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Shop Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-blue-900" />
              <span>1. Shop Information</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shop Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pashupati Digital & Cyber Hub"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-semibold transition-all"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                This name appears on your customer counter poster and receipts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Phone Number</span> <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+977 98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>Shop Address</span> <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bagbazar, Kathmandu"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Custom Username (Requirements 4, 5, 6, 7 & 13) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-blue-900" />
              <span>2. Choose Your Custom Shop Username</span>
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Custom Username / Link Slug <span className="text-red-600">*</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm font-bold">
                  @
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. pashupatidigital"
                  value={username}
                  onChange={handleUsernameChange}
                  className={`w-full bg-slate-50 border rounded-xl pl-8 pr-10 py-2.5 text-sm font-mono font-bold outline-none transition-all ${
                    usernameStatus === 'available'
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/30'
                      : usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'border-red-400 focus:ring-2 focus:ring-red-500/20 bg-red-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-600'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  {isCheckingUsername ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : usernameStatus === 'available' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : usernameStatus === 'taken' ? (
                    <X className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>
              </div>

              {/* Real-time Status Badge (Requirement 6 & 7) */}
              <div className="flex items-center justify-between text-xs">
                {usernameStatus === 'available' && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Username available</span>
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-red-600 font-bold flex items-center gap-1 animate-fade-in">
                    <X className="w-3.5 h-3.5" />
                    <span>❌ Username unavailable</span>
                  </span>
                )}
                {usernameStatus === 'invalid' && (
                  <span className="text-amber-700 text-[11px]">
                    Use at least 3 characters (letters, numbers, underscore).
                  </span>
                )}
                {usernameStatus === 'idle' && (
                  <span className="text-slate-400 text-[11px]">
                    Lowercase letters, numbers, and underscores allowed
                  </span>
                )}
              </div>

              {/* Automatic Username Recommendations (Requirement 5) */}
              {suggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Suggested for you (Click to select):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((sug) => {
                      const isSelected = username === sug;
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleSelectSuggestion(sug)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200'
                          }`}
                        >
                          @{sug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Alternatives if taken (Requirement 6) */}
              {usernameStatus === 'taken' && alternativeSuggestions.length > 0 && (
                <div className="space-y-1.5 p-3 bg-red-50/70 border border-red-200 rounded-xl animate-fade-in">
                  <div className="text-[11px] font-bold text-red-800">
                    Available alternatives you can use:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {alternativeSuggestions.map((alt) => (
                      <button
                        key={alt}
                        type="button"
                        onClick={() => handleSelectSuggestion(alt)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-colors shadow-2xs"
                      >
                        ✓ {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Public URL Live Preview (Requirement 13) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <span className="text-slate-500 block font-medium text-[11px]">
                  Your permanent public shop link:
                </span>
                <span className="font-mono text-blue-900 font-bold block truncate">
                  {sampleUrlPreview}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || usernameStatus === 'taken' || !shopName.trim()}
              className="w-full sm:flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Your Shop...</span>
                </>
              ) : (
                <>
                  <span>Create Shop Profile & Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
