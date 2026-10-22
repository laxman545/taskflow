import React from 'react';
import { ShopNotification, StaffMember, Shop } from '../../types';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../utils/storage';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Monitor,
  ArrowRight,
  X
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: ShopNotification[];
  currentUser: StaffMember | null;
  shop: Shop;
  onOpenOrder: (jobNumber: string) => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentUser,
  shop,
  onOpenOrder,
  onClose,
}) => {
  const unreadCount = notifications.filter(n => !n.read_status).length;

  const handleItemClick = (notif: ShopNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.job_number) {
      onOpenOrder(notif.job_number);
      onClose();
    }
  };

  const handleMarkAll = () => {
    if (currentUser) {
      markAllNotificationsAsRead(shop.id, currentUser.id);
    }
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs uppercase tracking-wider">
            Station Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-[10px] text-blue-300 hover:text-white font-semibold flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No notifications yet
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs space-y-1 ${
                !notif.read_status ? 'bg-blue-50/50 font-semibold' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  {!notif.read_status && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
                  <span>{notif.title}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed font-normal">
                {notif.message}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                <span className="flex items-center gap-1 text-blue-800 font-medium">
                  <Monitor className="w-3 h-3" />
                  <span></span>
                </span>
                {notif.job_number && (
                  <span className="text-blue-900 font-bold flex items-center gap-0.5 hover:underline">
                    <span>Open #{notif.job_number}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
