'use client';

import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle2 } from 'lucide-react';
import { fetchUsers, updateUserStatus } from '@/lib/api/admin';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'طالب',
  TEACHER: 'معلم',
  ADMIN: 'أدمن',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success/20 text-success',
  SUSPENDED: 'bg-danger/20 text-danger',
  BANNED: 'bg-danger/20 text-danger',
  PENDING_VERIFICATION: 'bg-muted/20 text-muted',
};

export function UsersManagementClient() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(true);
      fetchUsers({ search, role: roleFilter || undefined })
        .then((res) => setUsers(res.items))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, roleFilter]);

  async function handleToggleStatus(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateUserStatus(userId, newStatus);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)),
    );
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-muted ltr:left-3 rtl:right-3" />
          <Input
            placeholder="بحث بالاسم أو البريد الإلكتروني"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white focus:border-siraj-500 focus:outline-none"
        >
          <option value="">كل الأدوار</option>
          <option value="STUDENT">طلاب</option>
          <option value="TEACHER">معلمون</option>
          <option value="ADMIN">أدمن</option>
        </select>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-soft text-right text-xs text-muted">
            <tr>
              <th className="px-5 py-3">الاسم</th>
              <th className="px-5 py-3">البريد الإلكتروني</th>
              <th className="px-5 py-3">الدور</th>
              <th className="px-5 py-3">الحالة</th>
              <th className="px-5 py-3">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  جارٍ التحميل...
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-ink-border/50">
                  <td className="px-5 py-3 font-medium text-white">{user.fullName}</td>
                  <td className="px-5 py-3 text-muted-light">{user.email}</td>
                  <td className="px-5 py-3 text-muted-light">{ROLE_LABELS[user.role]}</td>
                  <td className="px-5 py-3">
                    <span className={cn('rounded-full px-3 py-1 text-xs', STATUS_STYLES[user.status])}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={cn(
                        'flex items-center gap-1 text-xs font-semibold',
                        user.status === 'ACTIVE' ? 'text-danger' : 'text-success',
                      )}
                    >
                      {user.status === 'ACTIVE' ? (
                        <>
                          <Ban size={13} /> تعليق
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> تفعيل
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
