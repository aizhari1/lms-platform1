'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Shield,
  Monitor,
  Smartphone,
  LogIn,
  LogOut,
  Trash2,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import {
  fetchLoginHistory,
  fetchActiveSessions,
  revokeSession,
  revokeOtherSessions,
  fetchTrustedDevices,
  removeTrustedDevice,
  setup2fa,
  enable2fa,
  disable2fa,
  type LoginHistoryEntry,
  type ActiveSession,
  type TrustedDevice,
} from '@/lib/api/security';
import { Button } from '@/components/ui/button';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TwoFactorSection() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  async function handleStartSetup() {
    setError('');
    const data = await setup2fa();
    setSetupData(data);
  }

  async function handleEnable() {
    setError('');
    try {
      const { backupCodes } = await enable2fa(code);
      setBackupCodes(backupCodes);
      setIsEnabled(true);
      setSetupData(null);
      setCode('');
    } catch {
      setError('الكود غلط، جرب تاني');
    }
  }

  async function handleDisable() {
    setError('');
    try {
      await disable2fa(code);
      setIsEnabled(false);
      setCode('');
    } catch {
      setError('الكود غلط، جرب تاني');
    }
  }

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
          {isEnabled ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
        </span>
        <div>
          <h3 className="text-sm font-bold text-white">التحقق بخطوتين (2FA)</h3>
          <p className="text-xs text-muted">
            {isEnabled ? 'مفعّل — حسابك محمي بطبقة أمان إضافية' : 'غير مفعّل'}
          </p>
        </div>
      </div>

      {backupCodes && (
        <div className="mb-4 rounded-lg bg-amber-500/10 p-4">
          <p className="mb-2 text-xs font-bold text-amber-400">
            احفظ أكواد النسخ الاحتياطي دي في مكان آمن — هتحتاجها لو فقدت هاتفك:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((c) => (
              <code key={c} className="rounded bg-ink-soft px-2 py-1 text-xs text-white">
                {c}
              </code>
            ))}
          </div>
        </div>
      )}

      {!isEnabled && !setupData && (
        <Button size="sm" variant="outline" onClick={handleStartSetup}>
          تفعيل التحقق بخطوتين
        </Button>
      )}

      {setupData && (
        <div className="space-y-3">
          <p className="text-xs text-muted-light">
            امسح الكود ده بتطبيق Google Authenticator أو أي تطبيق مشابه:
          </p>
          <Image src={setupData.qrCodeDataUrl} alt="2FA QR" width={160} height={160} className="rounded-lg" />
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>أو أدخل الكود يدويًا:</span>
            <code className="rounded bg-ink-soft px-2 py-1 text-white">{setupData.secret}</code>
          </div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="أدخل الكود من التطبيق"
              className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
            />
            <Button size="sm" onClick={handleEnable}>
              تأكيد
            </Button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}

      {isEnabled && (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="أدخل الكود لإلغاء التفعيل"
            className="flex-1 rounded-xl border border-ink-border bg-ink-soft px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none"
          />
          <Button size="sm" variant="outline" onClick={handleDisable}>
            إلغاء التفعيل
          </Button>
        </div>
      )}
      {error && isEnabled && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function SecuritySettingsClient() {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function loadAll() {
    Promise.all([
      fetchLoginHistory().catch(() => []),
      fetchActiveSessions().catch(() => []),
      fetchTrustedDevices().catch(() => []),
    ]).then(([h, s, d]) => {
      setHistory(h);
      setSessions(s);
      setDevices(d);
      setIsLoading(false);
    });
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleRevokeSession(id: string) {
    await revokeSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleRevokeOthers() {
    await revokeOtherSessions();
    loadAll();
  }

  async function handleRemoveDevice(id: string) {
    await removeTrustedDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <TwoFactorSection />

      <div className="card-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Monitor size={16} className="text-siraj-400" /> الجلسات النشطة
          </h3>
          <Button size="sm" variant="ghost" onClick={handleRevokeOthers}>
            تسجيل خروج من كل الأجهزة التانية
          </Button>
        </div>
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg bg-ink-soft p-3">
              <Smartphone size={16} className="text-muted" />
              <div className="flex-1">
                <p className="text-sm text-white">
                  {s.deviceLabel} {s.isCurrent && <span className="text-xs text-siraj-400">(الجهاز الحالي)</span>}
                </p>
                <p className="text-xs text-muted">
                  {s.ipAddress} — آخر نشاط {formatDateTime(s.lastUsedAt)}
                </p>
              </div>
              {!s.isCurrent && (
                <button onClick={() => handleRevokeSession(s.id)} className="text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <Shield size={16} className="text-siraj-400" /> الأجهزة الموثوقة
        </h3>
        {devices.length === 0 ? (
          <p className="text-xs text-muted">مفيش أجهزة موثوقة</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg bg-ink-soft p-3">
                <div className="flex-1">
                  <p className="text-sm text-white">{d.label}</p>
                  <p className="text-xs text-muted">آخر استخدام {formatDateTime(d.lastUsedAt)}</p>
                </div>
                <button onClick={() => handleRemoveDevice(d.id)} className="text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-surface p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <LogIn size={16} className="text-siraj-400" /> سجل تسجيل الدخول
        </h3>
        <div className="space-y-2">
          {history.map((h, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs text-muted-light">
              {h.action === 'LOGIN' ? (
                <LogIn size={13} className="text-success" />
              ) : (
                <LogOut size={13} className="text-muted" />
              )}
              <span>{h.action === 'LOGIN' ? 'تسجيل دخول' : 'تسجيل خروج'}</span>
              <span className="text-muted">{h.ipAddress}</span>
              <span className="ms-auto text-muted">{formatDateTime(h.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
