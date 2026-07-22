'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export function ProfileClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/users/me').then((res) => setProfile(res.data.data));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setMessage(null);
    try {
      await apiClient.patch('/users/me', {
        fullName: profile.fullName,
        phone: profile.phone,
        bio: profile.bio,
      });
      setMessage('تم حفظ التغييرات بنجاح');
    } finally {
      setIsSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="card-surface h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <form onSubmit={handleSave} className="card-surface max-w-lg space-y-5 p-6">
        {message && (
          <div className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
            {message}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-siraj-900/40 font-display text-xl font-bold text-siraj-400">
            {profile.fullName.charAt(0)}
          </div>
          <Button type="button" variant="outline" size="sm">
            تغيير الصورة
          </Button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">الاسم الكامل</label>
          <Input
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">البريد الإلكتروني</label>
          <Input value={profile.email} disabled />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">رقم الهاتف</label>
          <Input
            value={profile.phone ?? ''}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-muted-light">نبذة عني</label>
          <textarea
            value={profile.bio ?? ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white placeholder:text-muted focus:border-siraj-500 focus:outline-none focus:ring-1 focus:ring-siraj-500"
          />
        </div>

        <Button type="submit" isLoading={isSaving}>
          حفظ التغييرات
        </Button>
      </form>
    </div>
  );
}
