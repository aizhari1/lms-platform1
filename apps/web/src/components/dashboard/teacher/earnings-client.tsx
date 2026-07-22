'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface EarningRow {
  id: string;
  amount: string;
  netAmount: string;
  commissionPct: string;
  isPaidOut: boolean;
  createdAt: string;
}

export function EarningsClient() {
  const [data, setData] = useState<{
    earnings: EarningRow[];
    totalEarned: string;
    pendingPayout: string;
  } | null>(null);

  useEffect(() => {
    apiClient.get('/payments/my-earnings').then((res) => setData(res.data.data));
  }, []);

  if (!data) {
    return (
      <div className="p-6">
        <div className="card-surface h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card-surface flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
            <Wallet size={22} />
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold text-white">
              {Number(data.totalEarned).toLocaleString()} ر.س
            </p>
            <p className="text-xs text-muted">إجمالي الأرباح</p>
          </div>
        </div>

        <div className="card-surface flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold text-white">
              {Number(data.pendingPayout).toLocaleString()} ر.س
            </p>
            <p className="text-xs text-muted">في انتظار السحب</p>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-soft text-right text-xs text-muted">
            <tr>
              <th className="px-5 py-3">التاريخ</th>
              <th className="px-5 py-3">إجمالي البيع</th>
              <th className="px-5 py-3">نسبة العمولة</th>
              <th className="px-5 py-3">صافي الربح</th>
              <th className="px-5 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {data.earnings.map((row) => (
              <tr key={row.id} className="border-t border-ink-border/50 text-muted-light">
                <td className="px-5 py-3">{new Date(row.createdAt).toLocaleDateString('ar')}</td>
                <td className="px-5 py-3">{row.amount} ر.س</td>
                <td className="px-5 py-3">{row.commissionPct}%</td>
                <td className="px-5 py-3 font-semibold text-siraj-400">{row.netAmount} ر.س</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      row.isPaidOut ? 'text-success' : 'text-muted'
                    }
                  >
                    {row.isPaidOut ? 'تم السحب' : 'قيد الانتظار'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
