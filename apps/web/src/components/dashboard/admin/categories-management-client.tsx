'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, FolderTree } from 'lucide-react';
import { fetchCategoryTree } from '@/lib/api/courses';
import { createCategory, deleteCategory } from '@/lib/api/admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function slugifyLocal(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, '-');
}

export function CategoriesManagementClient() {
  const [categories, setCategories] = useState<any[]>([]);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    fetchCategoryTree().then(setCategories);
  }

  async function handleCreate() {
    if (!nameAr || !nameEn) return;
    await createCategory({ nameAr, nameEn, slug: slugifyLocal(nameEn) });
    setNameAr('');
    setNameEn('');
    refresh();
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      refresh();
    } catch {
      alert('لا يمكن حذف تصنيف يحتوي على كورسات أو تصنيفات فرعية');
    }
  }

  return (
    <div className="p-6">
      <div className="card-surface mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1.5 block text-xs text-muted">الاسم بالعربي</label>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="تطوير الويب" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1.5 block text-xs text-muted">الاسم بالإنجليزي</label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Web Development" />
        </div>
        <Button onClick={handleCreate}>
          <Plus size={16} /> إضافة تصنيف
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="card-surface flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FolderTree size={18} className="text-siraj-400" />
              <div>
                <p className="text-sm font-semibold text-white">{cat.nameAr}</p>
                <p className="text-xs text-muted">{cat._count?.courses ?? 0} كورس</p>
              </div>
            </div>
            <button onClick={() => handleDelete(cat.id)} className="text-muted hover:text-danger">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
