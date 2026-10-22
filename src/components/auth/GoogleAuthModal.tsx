import React, { useState } from 'react';
import { Shop, StaffMember } from '../../types';
import { NamasteLogo } from '../NamasteLogo';
import { X, Lock, ArrowRight, User, KeyRound, AlertCircle } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (result: {
    isNewShop: boolean;
    shop?: Shop;
    user?: any;
    staffUser?: StaffMember;
    role?: 'owner' | 'staff' | 'manager';
  }) => void;
  defaultMode?: 'login' | 'signup';
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter username and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' 
        ? { identifier: username, password }
        : { username, password };

      const res = await fetch('http://localhost:5000' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('current_user', JSON.stringify(data.user));
        localStorage.setItem('namaste_shop', JSON.stringify(data.shop));
        
        onAuthSuccess({
          isNewShop: mode === 'signup',
          shop: data.shop,
          staffUser: data.user,
          role: data.user.role
        });
      } else {
        setErrorMessage(data.message || 'Authentication failed');
      }
    } catch (err: any) {
      setErrorMessage('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md my-auto rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-2xl animate-scale-in relative">
        {/* Decorative ambient corner glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 relative z-10">
          <NamasteLogo size="sm" variant="horizontal" showTagline={false} />
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-5 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60 mb-1">
              <span>Station Security</span>
            </div>
            <h2 id="auth-modal-title" className="font-display text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'signup' ? 'Create Shop Account' : 'Welcome to Namaste Print'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {mode === 'signup' ? 'Sign up to configure and launch your print counter station.' : 'Sign in to access your counter terminal and owner dashboard.'}
            </p>
          </div>

          <div className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 font-medium animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="auth-username" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="auth-username"
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === 'signup' ? 'e.g. cityprint_nepal' : 'Enter username'}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="auth-password" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Create a secure password' : 'Enter password'}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Authenticating…</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{mode === 'signup' ? 'Create Station Account' : 'Sign In to Station'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-3 text-xs border-t border-slate-100 text-slate-500">
              {mode === 'login' ? (
                <>New counter station?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMessage(null); }}
                    className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                  >Create an account</button>
                </>
              ) : (
                <>Already have a station login?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMessage(null); }}
                    className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                  >Sign in</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
