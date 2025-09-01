'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';

export default function AdminProductEditPage() {
  const fetcher = useAuthorizedFetch();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const isNew = id === 'new';
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [SKU, setSKU] = useState('');
  const [description, setDescription] = useState('');
  const [weightGrams, setWeightGrams] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew) {
      (async () => {
        try {
          const res = await fetcher(`/products/${id}`);
          const json = await res.json();
          if (res.ok) {
            const p = json.data.product;
            setName(p.name || '');
            setSlug(p.slug || '');
            setSKU(p.SKU || '');
            setDescription(p.description || '');
            setWeightGrams(p.weightGrams ?? '');
            setIsActive(!!p.isActive);
          } else {
            setError(json.message || 'Failed to load product');
          }
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [fetcher, id, isNew]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { name, slug, SKU, description, weightGrams: weightGrams === '' ? null : Number(weightGrams), isActive };
      const res = await fetcher(isNew ? '/products' : `/products/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok) {
        router.push('/admin/products');
      } else {
        setError(json.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isNew) return;
    if (!confirm('Delete this product?')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetcher(`/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        router.push('/admin/products');
      } else {
        setError(json.message || 'Delete failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">{isNew ? 'New Product' : 'Edit Product'}</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <label htmlFor="name" className="block text-sm mb-1">Name</label>
              <input id="name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm mb-1">Slug</label>
              <input id="slug" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm mb-1">SKU</label>
              <input id="sku" placeholder="SKU" value={SKU} onChange={(e) => setSKU(e.target.value)} className="w-full border rounded p-2" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm mb-1">Description</label>
              <textarea id="description" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded p-2" rows={4} />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm mb-1">Weight (grams)</label>
              <input id="weight" placeholder="0" type="number" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border rounded p-2" />
            </div>
            <div className="flex items-center space-x-2">
              <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <label htmlFor="active">Active</label>
            </div>
            <div className="flex gap-2">
              <button disabled={saving} onClick={onSave} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              {!isNew && (
                <button disabled={saving} onClick={onDelete} className="px-4 py-2 rounded bg-red-600 text-white text-sm disabled:opacity-50">Delete</button>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}


