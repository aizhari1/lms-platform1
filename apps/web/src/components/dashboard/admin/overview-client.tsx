'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchAdminOverview, fetchRevenueChart, fetchTopCourses } from '@/lib/api/admin';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-siraj-900/40 text-siraj-400">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-display text-xl font-extrabold text-white">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

export function AdminOverviewClient() {
  const [overview, setOverview] = useState<any>(null);
  const [revenue, setRevenue] = useState<{ date: string; revenue: number }[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminOverview().then(setOverview);
    fetchRevenueChart(30).then(setRevenue);
    fetchTopCourses(5).then(setTopCourses);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="الطلاب" value={overview?.totalStudents ?? '—'} />
        <StatCard icon={Users} label="المعلمون" value={overview?.totalTeachers ?? '—'} />
        <StatCard icon={BookOpen} label="الكورسات المنشورة" value={overview?.publishedCourses ?? '—'} />
        <StatCard
          icon={DollarSign}
          label="إجمالي الإيرادات"
          value={overview ? `${Number(overview.totalRevenue).toLocaleString()} ر.س` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-surface p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-white">الإيرادات (آخر 30 يوم)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#131B2E', border: '1px solid #1E293B', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#F5B84A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-6">
          <h3 className="mb-4 text-sm font-bold text-white">أفضل الكورسات</h3>
          <ul className="space-y-3">
            {topCourses.map((course, idx) => (
              <li key={course.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-siraj-900/40 text-xs font-bold text-siraj-400">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="line-clamp-1 text-xs font-semibold text-white">{course.titleAr}</p>
                  <p className="text-xs text-muted">{course.totalStudents} طالب</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
