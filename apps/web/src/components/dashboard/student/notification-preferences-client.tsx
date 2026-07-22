'use client';

import { useEffect, useState } from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  NOTIFICATION_TYPE_LABELS,
  type NotificationPrefs,
  type ChannelToggles,
} from '@/lib/api/notifications';

const CHANNELS: { key: keyof ChannelToggles; label: string; icon: typeof Bell }[] = [
  { key: 'inApp', label: 'داخل المنصة', icon: Bell },
  { key: 'email', label: 'البريد الإلكتروني', icon: Mail },
  { key: 'push', label: 'إشعارات الجوال', icon: Smartphone },
];

export function NotificationPreferencesClient() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchNotificationPreferences().then(setPrefs);
  }, []);

  async function handleToggle(type: string, channel: keyof ChannelToggles) {
    if (!prefs) return;
    const current = prefs[type];
    const updatedValue = { ...current, [channel]: !current[channel] };

    setPrefs({ ...prefs, [type]: updatedValue });
    setIsSaving(type);
    try {
      await updateNotificationPreferences({ [type]: updatedValue });
    } finally {
      setIsSaving(null);
    }
  }

  if (!prefs) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-surface h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="card-surface overflow-hidden">
        <div className="grid grid-cols-4 gap-2 border-b border-ink-border bg-ink-soft px-5 py-3 text-xs font-bold text-muted">
          <span>نوع الإشعار</span>
          {CHANNELS.map((c) => (
            <span key={c.key} className="flex items-center justify-center gap-1">
              <c.icon size={13} /> {c.label}
            </span>
          ))}
        </div>

        {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
          <div
            key={type}
            className="grid grid-cols-4 items-center gap-2 border-b border-ink-border px-5 py-4 last:border-0"
          >
            <span className="text-sm font-semibold text-white">{label}</span>
            {CHANNELS.map((c) => {
              const isOn = prefs[type]?.[c.key] ?? true;
              return (
                <div key={c.key} className="flex justify-center">
                  <button
                    onClick={() => handleToggle(type, c.key)}
                    disabled={isSaving === type}
                    role="switch"
                    aria-checked={isOn}
                    className={`h-6 w-11 rounded-full transition ${
                      isOn ? 'bg-siraj-500' : 'bg-ink-border'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                        isOn ? 'translate-x-0.5' : 'translate-x-5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
