'use client';

/**
 * components/notifications/NotificationBanner.tsx
 *
 * Shows a soft banner on first visit prompting the user to enable push notifications.
 * Dismissed permanently via localStorage — does not re-appear after user interacts.
 *
 * Placement: Rendered inside the root layout Providers wrapper.
 */

import { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISSED_KEY = 'lifeos_notification_banner_dismissed';

export function NotificationBanner() {
  const { permission, isSubscribed, isLoading, requestPermission } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  // Show the banner only if:
  // - Notifications are supported
  // - Permission not yet decided (default)
  // - User hasn't dismissed the banner before
  useEffect(() => {
    if (permission === 'default' && !isSubscribed) {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) {
        // Small delay so it doesn't flash immediately on page load
        const timer = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [permission, isSubscribed]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleEnable = async () => {
    await requestPermission();
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Enable push notifications"
      className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4"
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
          <Bell className="w-4 h-4 text-indigo-400" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Enable reminders</p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
            Get notified at 6:15 AM for your plan &amp; 9:30 PM for your check-in.
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              id="notification-enable-btn"
              onClick={handleEnable}
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
            >
              {isLoading ? 'Enabling…' : 'Enable notifications'}
            </button>
            <button
              id="notification-dismiss-btn"
              onClick={handleDismiss}
              className="text-xs text-zinc-400 hover:text-zinc-200 py-1.5 px-2 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          id="notification-close-btn"
          onClick={handleDismiss}
          aria-label="Dismiss notification prompt"
          className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact settings toggle — used on /settings page
// ---------------------------------------------------------------------------
export function NotificationToggle() {
  const { permission, isSubscribed, isLoading, requestPermission, unsubscribe } =
    usePushNotifications();

  if (permission === 'unsupported') {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <BellOff className="w-4 h-4" aria-hidden="true" />
        <span>Push notifications not supported in this browser</span>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Bell className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <span>Push notifications enabled</span>
        </div>
        <button
          id="notification-disable-btn"
          onClick={unsubscribe}
          disabled={isLoading}
          className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Disabling…' : 'Disable'}
        </button>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <BellOff className="w-4 h-4" aria-hidden="true" />
        <span>Notifications blocked — enable in browser settings</span>
      </div>
    );
  }

  return (
    <button
      id="notification-enable-settings-btn"
      onClick={requestPermission}
      disabled={isLoading}
      className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
    >
      <Bell className="w-4 h-4" aria-hidden="true" />
      <span>{isLoading ? 'Requesting…' : 'Enable push notifications'}</span>
    </button>
  );
}
