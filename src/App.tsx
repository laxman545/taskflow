/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AppView,
  CustomerViewStep,
  Language,
  Shop,
  GoogleAuthUser,
  StaffMember,
  ServiceType
} from './types';
import {
  getShop,
  getJobs,
  subscribeToStateChanges,
  getShopByUsername,
  setActiveShopId,
  getAuthSession,
  clearAuthSession,
  getCurrentUser,
  setCurrentUser,
  normalizeJobNumber
} from './utils/storage';
import { NamasteLogo } from './components/NamasteLogo';
import { Navbar } from './components/Navbar';
import { Homepage } from './components/home/Homepage';
import { CustomerLanding } from './components/customer/CustomerLanding';
import { SendPrintFlow } from './components/customer/SendPrintFlow';
import { OrderStatusView } from './components/customer/OrderStatusView';
import { ReceiveFileFlow } from './components/customer/ReceiveFileFlow';
import { ShopSelector } from './components/customer/ShopSelector';
import { ShopDashboard } from './components/shop/ShopDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ShopSetupWizard } from './components/shop/ShopSetupWizard';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [shop, setShop] = useState<Shop>(() => getShop());
  const [lang, setLang] = useState<Language>('en');

  // Initial view based on hash URL or auth status
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#status/') || hash.startsWith('#shop/')) return 'customer';
    if (hash === '#shop-dashboard') return 'shop';
    if (hash === '#setup') return 'setup';
    if (hash === '#admin' || hash === '#admin-console' || hash === '#admin-dashboard') return 'admin';
    return 'home';
  });

  const [customerStep, setCustomerStep] = useState<CustomerViewStep>('shop_select');
  const [customerServiceType, setCustomerServiceType] = useState<ServiceType>('print');
  const [trackingJobNumber, setTrackingJobNumber] = useState<string>('');
  const [newJobsCount, setNewJobsCount] = useState<number>(0);

  // Authentication State
  const [authSession, setAuthSessionState] = useState(() => getAuthSession());
  const [currentUser, setCurrentUserState] = useState<StaffMember | null>(() => getCurrentUser());
  const [pendingAuthUser, setPendingAuthUser] = useState<GoogleAuthUser | null>(null);
  const [googleAuthModalOpen, setGoogleAuthModalOpen] = useState(false);
  const [googleAuthMode, setGoogleAuthMode] = useState<'login' | 'signup'>('login');

  const isLoggedIn = !!authSession || !!currentUser;

  // Sync state changes across tabs / BroadcastChannel
  useEffect(() => {
    const updateCount = () => {
      const allJobs = getJobs();
      const count = allJobs.filter(
        (j) => j.status === 'unassigned' || (j.status === 'new' && !j.assigned_to)
      ).length;
      setNewJobsCount(count);
    };

    updateCount();
    const unsub = subscribeToStateChanges((msg) => {
      updateCount();
      setShop(getShop());
      setAuthSessionState(getAuthSession());
      setCurrentUserState(getCurrentUser());
    });
    return unsub;
  }, []);

  // Hash change router (supports #home, #shop/{slug}, #status/{job}, #shop-dashboard, #setup)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;

      if (hash.startsWith('#status/')) {
        const rawNum = decodeURIComponent(hash.replace('#status/', '')).trim();
        if (rawNum) {
          const normalized = normalizeJobNumber(rawNum) || rawNum;
          setTrackingJobNumber(normalized);
          setCurrentView('customer');
          setCustomerStep('status');
        }
      } else if (hash.startsWith('#shop/')) {
        const slug = hash.replace('#shop/', '').trim();
        if (slug) {
          const found = getShopByUsername(slug);
          if (found) {
            setShop(found);
            setActiveShopId(found.id);
          }
        }
        setCurrentView('customer');
        setCustomerStep('landing');
      } else if (hash === '#admin' || hash === '#admin-console' || hash === '#admin-dashboard') {
        setCurrentView('admin');
      } else if (hash === '#shop-dashboard') {
        const session = getAuthSession();
        if (session || getCurrentUser()) {
          setCurrentView('shop');
        } else {
          setGoogleAuthMode('login');
          setGoogleAuthModalOpen(true);
        }
      } else if (hash === '#setup') {
        setCurrentView('setup');
      } else if (hash === '#home' || hash === '' || hash === '#') {
        setCurrentView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ne' : 'en'));
  };

  const handleTrackOrder = (jobNum: string) => {
    const raw = (jobNum || '').trim();
    const normalized = normalizeJobNumber(raw) || raw;
    setTrackingJobNumber(normalized);
    setCurrentView('customer');
    setCustomerStep('status');
    window.location.hash = `#status/${normalized}`;
  };

  const handleBackToLanding = () => {
    setCustomerStep('landing');
    setTrackingJobNumber('');
    window.location.hash = `#shop/${shop.username || shop.qr_slug}`;
  };

  // Google Authentication callbacks
  const handleOpenGoogleAuth = (mode: 'login' | 'signup') => {
    setGoogleAuthMode(mode);
    setGoogleAuthModalOpen(true);
  };

  const handleAuthSuccess = (result: {
    isNewShop: boolean;
    shop?: Shop;
    user?: GoogleAuthUser;
    staffUser?: StaffMember;
    role?: 'owner' | 'staff' | 'manager';
  }) => {
    setGoogleAuthModalOpen(false);
    setAuthSessionState(getAuthSession());
    const activeStaff = result.staffUser || getCurrentUser();
    setCurrentUserState(activeStaff);

    if (activeStaff?.role === 'admin') {
      setCurrentView('admin' as any);
      window.location.hash = '#admin-dashboard';
    } else if (result.isNewShop && result.user) {
      // First-time login: proceed to Shop Account Setup wizard (Requirement 2 & 3)
      setPendingAuthUser(result.user);
      setCurrentView('setup');
      window.location.hash = '#setup';
    } else if (result.shop) {
      // Returning owner or staff: open Shop Dashboard directly (Requirement 1, 2 & 3)
      setShop(result.shop);
      setActiveShopId(result.shop.id);
      setCurrentView('shop');
      window.location.hash = '#shop-dashboard';
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    setCurrentUser(null);
    setAuthSessionState(null);
    setCurrentUserState(null);
    setPendingAuthUser(null);
    setCurrentView('home');
    window.location.hash = '#home';
  };

  const handleSetupComplete = (createdShop: Shop) => {
    setShop(createdShop);
    setActiveShopId(createdShop.id);
    setPendingAuthUser(null);
    setCurrentUserState(getCurrentUser());
    setCurrentView('shop');
    window.location.hash = '#shop-dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}>
      {/* Top Bar with View Switcher, Brand, Account Menu and Controls */}
      {currentView !== 'admin' && (
        <div className="no-print">
          <Navbar
            currentView={currentView}
            onViewChange={(view) => {
              setCurrentView(view);
              if (view === 'home') {
                window.location.hash = '#home';
              } else if (view === 'customer') {
                window.location.hash = `#shop/${shop.username || shop.qr_slug}`;
                if (customerStep === 'status' && !trackingJobNumber) {
                  setCustomerStep('landing');
                }
              } else if (view === 'shop') {
                window.location.hash = '#shop-dashboard';
              } else if (view === 'admin') {
                window.location.hash = '#admin-console';
              }
            }}
            lang={lang}
            onToggleLang={handleToggleLang}
            newJobsCount={newJobsCount}
            shop={shop}
            isLoggedIn={isLoggedIn}
            authUser={authSession?.user || null}
            currentUser={currentUser}
            onOpenGoogleAuth={handleOpenGoogleAuth}
            onSignOut={handleSignOut}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {/* VIEW 1: HOMEPAGE / LANDING PAGE (Requirement 1 & 16) */}
        {currentView === 'home' && (
          <div className="animate-fade-in">
            <Homepage
              shop={shop}
              isLoggedIn={isLoggedIn}
              authUser={authSession?.user || null}
              onContinueWithGoogle={handleOpenGoogleAuth}
              onGoToDashboard={() => {
                setCurrentView('shop');
                window.location.hash = '#shop-dashboard';
              }}
              onViewCustomerFlow={() => {
                setCurrentView('customer');
                setCustomerStep('shop_select');
                window.location.hash = `#shop/${shop.username || shop.qr_slug}`;
              }}
              onGoToAdmin={() => {
                setCurrentView('admin');
                window.location.hash = '#admin-console';
              }}
            />
          </div>
        )}

        {/* VIEW 2: SHOP ACCOUNT SETUP WIZARD (Requirement 3, 4, 5, 6, 7 & 8) */}
        {currentView === 'setup' && (
          <div className="animate-fade-in">
            <ShopSetupWizard
              authUser={
                pendingAuthUser ||
                authSession?.user || {
                  google_id: `google_user_${Date.now()}`,
                  email: 'owner@gmail.com',
                  name: 'Shop Owner',
                }
              }
              onSetupComplete={handleSetupComplete}
              onCancel={handleSignOut}
            />
          </div>
        )}

        {/* VIEW 3: CUSTOMER ORDER & QR FLOW */}
        {currentView === 'customer' && (
          <div className="animate-fade-in">
            {customerStep === 'shop_select' && (
              <ShopSelector
                lang={lang}
                onShopSelect={(selectedShop) => {
                  setShop(selectedShop);
                  setCustomerStep('landing');
                }}
              />
            )}

            {customerStep === 'landing' && (
              <CustomerLanding
                shop={shop}
                lang={lang}
                onSendClick={() => {
                  setCustomerServiceType('print');
                  setCustomerStep('send');
                }}
                onReceiveClick={() => setCustomerStep('receive')}
                onTrackOrder={handleTrackOrder}
              />
            )}

            {customerStep === 'send' && (
              <SendPrintFlow
                shop={shop}
                lang={lang}
                initialServiceType={customerServiceType}
                onBack={handleBackToLanding}
                onViewStatus={(num) => handleTrackOrder(num)}
              />
            )}

            {customerStep === 'status' && (
              <OrderStatusView
                jobNumber={trackingJobNumber}
                shop={shop}
                lang={lang}
                onBack={handleBackToLanding}
              />
            )}

            {customerStep === 'receive' && (
              <ReceiveFileFlow
                shop={shop}
                lang={lang}
                onBack={handleBackToLanding}
              />
            )}
          </div>
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          <div className="animate-fade-in">
            <AdminDashboard
              onExitToHome={() => {
                setCurrentView('home');
                window.location.hash = '#home';
              }}
              onExitToShop={() => {
                setCurrentView('shop');
                window.location.hash = '#shop-dashboard';
              }}
              onSwitchShop={(selectedShop) => {
                setShop(selectedShop);
                setActiveShopId(selectedShop.id);
                setCurrentView('shop');
                window.location.hash = '#shop-dashboard';
              }}
            />
          </div>
        )}

        {/* VIEW 4: SHOP DASHBOARD (OWNER / STAFF) */}
        {currentView === 'shop' && (
          <div className="animate-fade-in">
            <ShopDashboard
              shop={shop}
              lang={lang}
              onShopUpdated={(updated) => setShop({ ...updated })}
              onViewCustomerFlow={() => {
                setCurrentView('customer');
                setCustomerStep('shop_select');
                window.location.hash = `#shop/${shop.username || shop.qr_slug}`;
              }}
            />
          </div>
        )}
      </main>

      {/* Google Authentication Modal (Requirement 2) */}
      <GoogleAuthModal
        isOpen={googleAuthModalOpen}
        onClose={() => setGoogleAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultMode={googleAuthMode}
      />

      {/* World-Class Elevated Footer */}
      {currentView !== 'admin' && (
        <footer className="border-t border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 text-slate-500 no-print mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200/60">
              <div className="flex items-center gap-3 text-left">
                <NamasteLogo size="sm" variant="horizontal" showTagline={false} />
                <div className="pl-3 border-l border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">
                    Nepal's smart QR counter platform for print shops & cyber cafes
                  </p>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('customer');
                    setCustomerStep('shop_select');
                    window.location.hash = '#shop';
                  }}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Find Stations
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('customer');
                    setCustomerStep('status');
                    window.location.hash = '#status';
                  }}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Track Order
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isLoggedIn) {
                      setCurrentView('shop');
                      window.location.hash = '#shop-dashboard';
                    } else {
                      handleOpenGoogleAuth('login');
                    }
                  }}
                  className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Shop Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('admin');
                    window.location.hash = '#admin-console';
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin Console</span>
                </button>
              </div>
            </div>

            {/* Bottom copyright and localization strip */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
              <p>
                © {new Date().getFullYear()} Namaste Print. All rights reserved · {shop.shop_name}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  24h Private Auto-Purge
                </span>
                <span className="text-slate-300">·</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                  Bilingual EN / नेपाली
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600 font-semibold">
                  Crafted for Nepal 🇳🇵
                </span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
