import React, { useState, useEffect } from 'react';
import { NamasteLogo } from './NamasteLogo';
import { AppView, Language, Shop, GoogleAuthUser, StaffMember } from '../types';
import { translations } from '../utils/translations';
import { AccountMenu } from './shop/AccountMenu';
import {
  Store,
  Smartphone,
  Globe,
  Download,
  Home,
  User,
  ShieldAlert,
  X,
  Menu,
  ArrowRight
} from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  lang: Language;
  onToggleLang: () => void;
  newJobsCount?: number;
  shop: Shop;
  isLoggedIn: boolean;
  authUser: GoogleAuthUser | null;
  currentUser: StaffMember | null;
  onOpenGoogleAuth: (mode: 'login' | 'signup') => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  lang,
  onToggleLang,
  newJobsCount = 0,
  shop,
  isLoggedIn,
  authUser,
  currentUser,
  onOpenGoogleAuth,
  onSignOut,
}) => {
  const t = translations[lang];
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on view change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentView]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const navItems = [
    { view: 'home' as AppView, label: 'Home', icon: <Home className="w-4 h-4" /> },
    {
      view: 'customer' as AppView,
      label: 'Customer Scan',
      icon: <Smartphone className="w-4 h-4" />,
    },
    {
      view: 'shop' as AppView,
      label: 'Shop Dashboard',
      icon: <Store className="w-4 h-4" />,
      badge: newJobsCount > 0 ? newJobsCount : undefined,
      requiresAuth: true,
    },
  ];

  const NavLink: React.FC<{
    item: typeof navItems[0];
    mobile?: boolean;
  }> = ({ item, mobile }) => {
    const active = currentView === item.view;
    const handleClick = () => {
      if (item.requiresAuth && !isLoggedIn) {
        onOpenGoogleAuth('login');
      } else {
        onViewChange(item.view);
      }
    };

    if (mobile) {
      return (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors duration-150"
          style={{
            backgroundColor: active ? 'var(--color-navy-light)' : 'transparent',
            color: active ? 'var(--color-navy)' : 'var(--color-ink-muted)',
          }}
        >
          <span style={{ color: active ? 'var(--color-navy)' : 'var(--color-ink-faint)' }}>
            {item.icon}
          </span>
          {item.label}
          {item.badge && (
            <span
              className="ml-auto text-xs font-black px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: 'var(--color-red)' }}
            >
              {item.badge}
            </span>
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
        style={{
          backgroundColor: active ? '#EFF6FF' : 'transparent',
          color: active ? '#1D4ED8' : '#475569',
          fontWeight: active ? '700' : '600',
        }}
      >
        <span
          style={{
            color: active ? '#2563EB' : '#94A3B8',
          }}
        >
          {item.icon}
        </span>
        <span className="hidden sm:inline">{item.label}</span>
        <span className="sm:hidden">
          {item.view === 'home' ? 'Home' : item.view === 'customer' ? 'Scan' : 'Shop'}
        </span>
        {item.badge && (
          <span
            className="absolute -top-1 -right-1 text-[10px] font-black px-1.5 py-0.5 rounded-full text-white min-w-[16px] text-center"
            style={{ backgroundColor: 'var(--color-red)' }}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 transition-all duration-200 no-print"
        style={{
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
          boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          {/* Brand */}
          <button
            type="button"
            onClick={() => onViewChange('home')}
            className="flex items-center gap-0 shrink-0 cursor-pointer select-none group"
            aria-label="Namaste Print home"
          >
            <NamasteLogo size="sm" variant="horizontal" showTagline={false} />
          </button>

          {/* Desktop nav — centered pill */}
          <nav
            className="hidden sm:flex items-center gap-0.5 p-1 ml-4 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <NavLink key={item.view} item={item} />
            ))}

            {/* Admin — always visible but visually de-emphasised */}
            <button
              type="button"
              onClick={() => onViewChange('admin')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                backgroundColor: currentView === 'admin' ? '#FEF2F2' : 'transparent',
                color: currentView === 'admin' ? 'var(--color-red)' : 'var(--color-ink-faint)',
              }}
              title="System Admin Console"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden lg:inline">Admin</span>
            </button>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right zone */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink-muted)',
              }}
              title="Switch Language / भाषा परिवर्तन"
              aria-label={`Switch to ${lang === 'en' ? 'Nepali' : 'English'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.langToggle}</span>
            </button>

            {/* Install */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150"
              style={{
                backgroundColor: 'var(--color-navy-light)',
                border: '1px solid #BFDBFE',
                color: 'var(--color-navy)',
              }}
              title="Install app on phone or PC"
              aria-label="Install Namaste Print app"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Install</span>
            </button>

            {/* Auth / account */}
            {isLoggedIn ? (
              <AccountMenu
                shop={shop}
                currentUser={currentUser}
                authUser={authUser}
                onSignOut={onSignOut}
                onViewCustomerFlow={() => onViewChange('customer')}
                onNavigateToAdmin={() => onViewChange('admin')}
              />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenGoogleAuth('login')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-900 transition-colors"
                  title="Sign in as shop owner or staff"
                >
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Sign in</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenGoogleAuth('signup')}
                  className="btn-pill-primary text-xs py-1.5 px-3.5 shadow-md shadow-blue-500/20"
                  title="Register your print counter"
                >
                  <span>Get Started Free</span>
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-2.5 h-2.5 text-white" />
                  </div>
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{
                backgroundColor: mobileMenuOpen ? 'var(--color-surface)' : 'transparent',
                color: 'var(--color-ink-muted)',
              }}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div
            className="sm:hidden animate-slide-up px-4 pb-4 space-y-1"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div className="pt-3 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.view} item={item} mobile />
              ))}
              <button
                type="button"
                onClick={() => { onViewChange('admin'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors"
                style={{
                  backgroundColor: currentView === 'admin' ? '#FEF2F2' : 'transparent',
                  color: currentView === 'admin' ? 'var(--color-red)' : 'var(--color-ink-faint)',
                }}
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Console
              </button>
            </div>
            <div
              className="pt-3 mt-3 flex items-center gap-2"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg"
                style={{
                  backgroundColor: 'var(--color-navy-light)',
                  color: 'var(--color-navy)',
                  border: '1px solid #BFDBFE',
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Install app
              </button>
              <button
                type="button"
                onClick={onToggleLang}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-ink-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Globe className="w-3.5 h-3.5" />
                {t.langToggle}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Install / Download App Guide Modal */}
      {showInstallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-modal-title"
        >
          <div
            className="animate-scale-in w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-canvas)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                backgroundColor: 'var(--color-navy)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 id="install-modal-title" className="font-display font-bold text-white text-sm">
                    Install Namaste Print
                  </h3>
                  <p className="text-xs text-blue-300">Run as a standalone app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="text-blue-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions */}
            <div className="p-5 space-y-3">
              {[
                { platform: 'Android (Chrome)', instruction: 'Tap the three-dot menu → "Install app" or "Add to Home screen".' },
                { platform: 'iPhone (Safari)', instruction: 'Tap the Share button → "Add to Home Screen".' },
                { platform: 'Desktop (Chrome / Edge)', instruction: 'Click the install icon in the address bar, or Menu → "Install Namaste Print".' },
              ].map(({ platform, instruction }) => (
                <div
                  key={platform}
                  className="p-3.5 rounded-xl"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <p className="text-xs font-bold text-slate-800 mb-1">{platform}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{instruction}</p>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="btn-navy w-full py-2.5 text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
