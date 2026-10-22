import React, { useState, useRef, useEffect } from 'react';
import { Shop, GoogleAuthUser, StaffMember } from '../../types';
import { clearAuthSession } from '../../utils/storage';
import {
  User,
  Store,
  Settings,
  Users,
  LogOut,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  ExternalLink
} from 'lucide-react';

interface AccountMenuProps {
  shop: Shop;
  currentUser: StaffMember | null;
  authUser: GoogleAuthUser | null;
  onNavigateTab?: (tab: any) => void;
  onSignOut: () => void;
  onViewCustomerFlow?: () => void;
  onNavigateToAdmin?: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  shop,
  currentUser,
  authUser,
  onNavigateTab,
  onSignOut,
  onViewCustomerFlow,
  onNavigateToAdmin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOwner = currentUser?.role === 'owner' || (!currentUser && !!authUser);
  const isManager = currentUser?.role === 'manager';
  const roleLabel = isOwner ? 'Shop Owner' : isManager ? 'Shop Manager' : 'Staff Member';

  const displayName = currentUser?.name || authUser?.name || shop.owner_name || 'Counter Staff';
  const displayEmail = currentUser?.email || authUser?.email || shop.email || 'counter@namasteprint.np';
  const displayUsername = currentUser?.username || shop.username || shop.qr_slug || 'staff';

  const handleAction = (callback?: () => void) => {
    setIsOpen(false);
    if (callback) callback();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all text-xs font-bold text-slate-800"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
          isOwner ? 'bg-blue-900 text-white' : isManager ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-white'
        }`}>
          {displayName.charAt(0)}
        </div>
        <div className="hidden sm:block text-left leading-tight max-w-[120px] truncate">
          <span className="block truncate font-bold">{displayName}</span>
          <span className="block text-[10px] text-slate-500 font-mono truncate">
            @{displayUsername}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {/* Dropdown Menu (Requirement 12) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-scale-in">
          {/* Header Info */}
          <div className="px-4 py-3 border-b border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isOwner
                  ? 'text-blue-900 bg-blue-50 border-blue-200'
                  : isManager
                  ? 'text-indigo-900 bg-indigo-50 border-indigo-200'
                  : 'text-slate-800 bg-slate-100 border-slate-300'
              }`}>
                {roleLabel}
              </span>
              {false && (
                <span className="text-[10px] font-semibold text-slate-500">
                  🖥️ 
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 text-sm truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{displayEmail}</p>

            <div className="pt-1.5 text-xs text-slate-700">
              <span className="font-medium text-slate-500 text-[11px] block">Shop:</span>
              <span className="font-bold text-slate-900 block truncate">{shop.shop_name}</span>
              <span className="font-mono text-blue-900 font-bold text-[11px] block">
                @{displayUsername}
              </span>
            </div>
          </div>

          {/* Quick Menu Options */}
          <div className="py-1 text-xs text-slate-700">
            {isOwner && onNavigateTab && (
              <>
                <button
                  type="button"
                  onClick={() => handleAction(() => onNavigateTab('profile'))}
                  className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-left font-semibold transition-colors"
                >
                  <Store className="w-4 h-4 text-blue-800" />
                  <span>Shop Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onNavigateTab('profile'))}
                  className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-left font-semibold transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>Shop Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onNavigateTab('staff'))}
                  className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-left font-semibold transition-colors"
                >
                  <Users className="w-4 h-4 text-indigo-700" />
                  <span>Manage Staff</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAction(() => onNavigateTab('qr_poster'))}
                  className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-left font-semibold transition-colors"
                >
                  <QrCode className="w-4 h-4 text-red-600" />
                  <span>Tabletop QR Stand</span>
                </button>
              </>
            )}

            {onViewCustomerFlow && (
              <button
                type="button"
                onClick={() => handleAction(onViewCustomerFlow)}
                className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-left font-semibold transition-colors text-blue-900"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Public Customer Page</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAction(() => {
                if (onNavigateToAdmin) {
                  onNavigateToAdmin();
                } else {
                  window.location.hash = '#admin-console';
                }
              })}
              className="w-full px-4 py-2 hover:bg-red-50 text-red-700 flex items-center gap-2.5 text-left font-semibold transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>System Admin Console</span>
            </button>
          </div>

          {/* Sign Out (Requirement 10) */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleAction(onSignOut)}
              className="w-full px-4 py-2.5 hover:bg-red-50 text-red-700 flex items-center gap-2.5 text-left font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
