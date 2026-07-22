'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Ticket } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
}

export function CouponsManagementClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    apiClient.get('/coupons/admin').then((res) => setCoupons(res.data.data));
  }

  async function handleCreate() {
    if (!code || !value) return;
    await apiClient.post('/coupons/admin', { code, type, value: Number(value) });
    setCode('');
    setValue('');
    refresh();
  }

  async function handleToggle(id: string) {
    await apiClient.patch(`/coupons/admin/${id}/toggle`);
    refresh();
  }

  async function handleDelete(id: string) {
    await apiClient.delete(`/coupons/admin/${id}`);
    refresh();
  }

  return (
    <div className="p-6">
      <div className="card-surface mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1.5 block text-xs text-muted">كود الكوبون</label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SIRAJ20" />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1.5 block text-xs text-muted">النوع</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
            className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white focus:border-siraj-500 focus:outline-none"
          >
            <option value="PERCENTAGE">نسبة %</option>
            <option value="FIXED_AMOUNT">قيمة ثابتة</option>
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1.5 block text-xs text-muted">القيمة</label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="20" />
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} /> إنشاء
        </Button>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-soft text-right text-xs text-muted">
            <tr>
              <th className="px-5 py-3">الكود</th>
              <th className="px-5 py-3">القيمة</th>
              <th className="px-5 py-3">الاستخدام</th>
              <th className="px-5 py-3">الحالة</th>
              <th className="px-5 py-3">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-t border-ink-border/50">
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2 font-mono font-bold text-siraj-400">
                    <Ticket size={14} /> {coupon.code}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-light">
                  {coupon.value}{coupon.type === 'PERCENTAGE' ? '%' : ' ر.س'}
                </td>
                <td className="px-5 py-3 text-muted-light">
                  {coupon.usedCount} / {coupon.maxUses ?? '∞'}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleToggle(coupon.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      coupon.isActive ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted',
                    )}
                  >
                    {coupon.isActive ? 'فعّال' : 'معطّل'}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => handleDelete(coupon.id)} className="text-muted hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
