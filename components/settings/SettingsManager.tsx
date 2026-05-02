'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/Button';
import { Loader2, Settings, Clock, Bell, Globe, Target } from 'lucide-react';
import type { SettingsUpdate } from '@/lib/validators/settings';
import { cn } from '@/lib/utils';

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function SettingsManager() {
  const { settings, isLoading, error, updateSettings } = useSettings();
  
  const [form, setForm] = useState<SettingsUpdate>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        wake_time: settings.wake_time,
        sleep_time: settings.sleep_time,
        leave_time: settings.leave_time,
        return_time: settings.return_time,
        notification_morning: settings.notification_morning,
        notification_night: settings.notification_night,
        timezone: settings.timezone,
        pillar_balance_target: settings.pillar_balance_target,
        days_off: settings.days_off || [],
      });
    }
  }, [settings]);

  const handleChange = (field: keyof SettingsUpdate, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handlePillarChange = (pillar: 'money' | 'soul' | 'curiosity', value: number) => {
    if (!form.pillar_balance_target) return;
    setForm((prev) => ({
      ...prev,
      pillar_balance_target: {
        ...prev.pillar_balance_target!,
        [pillar]: value,
      },
    }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const toggleDayOff = (dayValue: number) => {
    setForm((prev) => {
      const currentDaysOff = prev.days_off || [];
      const isOff = currentDaysOff.includes(dayValue);
      
      return {
        ...prev,
        days_off: isOff
          ? currentDaysOff.filter((d) => d !== dayValue)
          : [...currentDaysOff, dayValue],
      };
    });
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    // Validate pillar sum
    if (form.pillar_balance_target) {
      const { money, soul, curiosity } = form.pillar_balance_target;
      if (money + soul + curiosity !== 100) {
        setSaveError(`Pillar targets must sum to 100. Current sum: ${money + soul + curiosity}`);
        return;
      }
    }

    setSaving(true);
    try {
      await updateSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        Failed to load settings.
      </div>
    );
  }

  const currentSum = form.pillar_balance_target
    ? form.pillar_balance_target.money + form.pillar_balance_target.soul + form.pillar_balance_target.curiosity
    : 100;
  
  const sumError = currentSum !== 100;

  return (
    <div className="max-w-2xl w-full mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-400" />
            User Settings & Preferences
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Configure your daily routine, notifications, and balance targets.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* TIME PREFERENCES */}
        <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <h3 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Clock className="h-4 w-4" /> Routine Timings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Wake Time</label>
              <input
                type="time"
                value={form.wake_time || ''}
                onChange={(e) => handleChange('wake_time', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sleep Time</label>
              <input
                type="time"
                value={form.sleep_time || ''}
                onChange={(e) => handleChange('sleep_time', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Leave for Work</label>
              <input
                type="time"
                value={form.leave_time || ''}
                onChange={(e) => handleChange('leave_time', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Return from Work</label>
              <input
                type="time"
                value={form.return_time || ''}
                onChange={(e) => handleChange('return_time', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
          </div>
        </section>

        {/* DAYS OFF */}
        <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <h3 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Settings className="h-4 w-4" /> Days Off
          </h3>
          <p className="text-xs text-zinc-400">
            Select the days you do not work. Standard scheduling rules (like commute times) might be skipped on these days.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {DAYS_OF_WEEK.map((day) => {
              const isOff = form.days_off?.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDayOff(day.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    isOff
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30"
                      : "bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* NOTIFICATIONS & LOCALE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Bell className="h-4 w-4" /> Notifications
            </h3>
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Morning Plan Time</label>
                <input
                  type="time"
                  value={form.notification_morning || ''}
                  onChange={(e) => handleChange('notification_morning', e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Night Check-In Time</label>
                <input
                  type="time"
                  value={form.notification_night || ''}
                  onChange={(e) => handleChange('notification_night', e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>
            </div>
          </section>

          <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Globe className="h-4 w-4" /> Region
            </h3>
            <div className="pt-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Timezone</label>
              <select
                value={form.timezone || ''}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </section>
        </div>

        {/* PILLAR BALANCE */}
        <section className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
          <h3 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Target className="h-4 w-4" /> Pillar Balance Target
          </h3>
          
          <div className="pt-2 space-y-6">
            <p className="text-xs text-zinc-400">
              Set the desired percentage of your time allocated to each pillar. Must sum to exactly 100%.
            </p>

            {form.pillar_balance_target && (
              <div className="space-y-4">
                {/* Money */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-amber-400 font-medium">💰 Money Making</span>
                    <span className="text-amber-400 font-bold">{form.pillar_balance_target.money}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.pillar_balance_target.money}
                    onChange={(e) => handlePillarChange('money', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Soul */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-rose-400 font-medium">🔥 For My Soul</span>
                    <span className="text-rose-400 font-bold">{form.pillar_balance_target.soul}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.pillar_balance_target.soul}
                    onChange={(e) => handlePillarChange('soul', parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* Curiosity */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-indigo-400 font-medium">🧠 For My Curiosity</span>
                    <span className="text-indigo-400 font-bold">{form.pillar_balance_target.curiosity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.pillar_balance_target.curiosity}
                    onChange={(e) => handlePillarChange('curiosity', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Sum indicator */}
            <div className={cn(
              "p-3 rounded-lg flex items-center justify-between font-medium text-sm",
              sumError ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            )}>
              <span>Total Allocation</span>
              <span>{currentSum}%</span>
            </div>
          </div>
        </section>

        {/* SUBMIT */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex-1">
            {saveError && <p className="text-sm text-rose-400">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-emerald-400">Settings saved successfully!</p>}
          </div>
          <Button type="submit" disabled={saving || sumError} className="min-w-32">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
