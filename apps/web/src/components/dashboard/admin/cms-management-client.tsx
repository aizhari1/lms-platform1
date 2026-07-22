'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CmsPage {
  id: string;
  slug: string;
  titleAr: string;
  contentAr: string;
  isPublished: boolean;
}

export function CmsManagementClient() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selected, setSelected] = useState<CmsPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    apiClient.get('/admin/cms/pages').then((res) => setPages(res.data.data));
  }

  async function handleCreate() {
    if (!newSlug || !newTitle) return;
    await apiClient.post('/admin/cms/pages', {
      slug: newSlug,
      titleAr: newTitle,
      contentAr: '',
    });
    setNewSlug('');
    setNewTitle('');
    setIsCreating(false);
    refresh();
  }

  async function handleSave() {
    if (!selected) return;
    await apiClient.patch(`/admin/cms/pages/${selected.id}`, {
      titleAr: selected.titleAr,
      contentAr: selected.contentAr,
      isPublished: selected.isPublished,
    });
    refresh();
  }

  async function handleDelete(id: string) {
    await apiClient.delete(`/admin/cms/pages/${id}`);
    if (selected?.id === id) setSelected(null);
    refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      <div className="card-surface p-4 lg:col-span-1">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">الصفحات</h3>
          <button onClick={() => setIsCreating(!isCreating)} className="text-siraj-400">
            <Plus size={18} />
          </button>
        </div>

        {isCreating && (
          <div className="mb-3 space-y-2 rounded-lg border border-ink-border p-3">
            <Input placeholder="العنوان" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Input placeholder="about-us" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            <Button size="sm" onClick={handleCreate} className="w-full">
              إنشاء
            </Button>
          </div>
        )}

        <ul className="space-y-1">
          {pages.map((page) => (
            <li key={page.id}>
              <button
                onClick={() => setSelected(page)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-light hover:bg-ink-card hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <FileText size={14} /> {page.titleAr}
                </span>
                <span onClick={(e) => { e.stopPropagation(); handleDelete(page.id); }}>
                  <Trash2 size={13} className="text-muted hover:text-danger" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-surface p-6 lg:col-span-2">
        {selected ? (
          <div className="space-y-4">
            <Input
              value={selected.titleAr}
              onChange={(e) => setSelected({ ...selected, titleAr: e.target.value })}
            />
            <textarea
              value={selected.contentAr}
              onChange={(e) => setSelected({ ...selected, contentAr: e.target.value })}
              rows={14}
              className="w-full rounded-xl border border-ink-border bg-ink-soft px-4 py-3 text-sm text-white focus:border-siraj-500 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-light">
                <input
                  type="checkbox"
                  checked={selected.isPublished}
                  onChange={(e) => setSelected({ ...selected, isPublished: e.target.checked })}
                />
                منشورة
              </label>
              <Button onClick={handleSave}>حفظ</Button>
            </div>
          </div>
        ) : (
          <p className="py-20 text-center text-muted">اختر صفحة من القائمة للتعديل</p>
        )}
      </div>
    </div>
  );
}
