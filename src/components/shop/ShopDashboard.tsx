import React, { useState, useEffect } from 'react';
import { Shop, Language, StaffMember, ShopTab } from '../../types';
import { getCurrentUser, subscribeToStateChanges } from '../../utils/storage';
import { OwnerDashboard } from './OwnerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { AuthModal } from './AuthModal';
import { StaffManagement } from './StaffManagement';

export { StaffManagement };

interface ShopDashboardProps {
  shop: Shop;
  lang: Language;
  onShopUpdated: (shop: Shop) => void;
  onViewCustomerFlow?: () => void;
  initialTab?: ShopTab;
}

export const ShopDashboard: React.FC<ShopDashboardProps> = ({
  shop,
  lang,
  onShopUpdated,
  onViewCustomerFlow,
  initialTab,
}) => {
  const [currentUser, setCurrentUserState] = useState<StaffMember | null>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsub = subscribeToStateChanges((msg) => {
      if (msg.action === 'AUTH_STATE_CHANGED') {
        setCurrentUserState(getCurrentUser());
      }
    });
    return unsub;
  }, []);

  const handleLoginSuccess = (user: StaffMember) => {
    setCurrentUserState(user);
    setShowAuthModal(false);
  };

  // Requirement 1 & 2: Owners go to OwnerDashboard, Staff & Managers go to StaffDashboard
  const isOwner = currentUser?.role === 'owner';

  return (
    <>
      {!isOwner ? (
        <StaffDashboard
          shop={shop}
          staffUser={currentUser!}
          lang={lang}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onViewCustomerFlow={onViewCustomerFlow}
        />
      ) : (
        <OwnerDashboard
          shop={shop}
          ownerUser={currentUser!}
          lang={lang}
          onShopUpdated={onShopUpdated}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onViewCustomerFlow={onViewCustomerFlow}
          initialTab={initialTab}
        />
      )}

      {showAuthModal && (
        <AuthModal
          shop={shop}
          currentUser={currentUser}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
};
