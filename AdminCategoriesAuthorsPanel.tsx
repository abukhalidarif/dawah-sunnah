import React, { useState } from 'react';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { ArrowDown, ArrowUp, Edit3, Plus, Trash2, Upload, UserCheck, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { createSafeId, createSlug, toBengaliDigits } from '../../lib/bengaliUtils';
import { uploadImageAsset } from '../../lib/imageUpload';
import { Author, Category } from '../../types';

export function AdminCategoriesPanel() {
  const { categories } = useData();
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return;
    setSaving(true);
    const id = editing.id || createSafeId('cat');
    const slug = editing.slug?.trim() || createSlug(editing.name, id.slice(-4));
    const payload: Record<string, any> = {
      id,
      name: editing.name.trim(),
      slug,
      description: (editing.description || '').trim(),
      type: editing.type || 'both',
      icon: editing.icon || 'book',
      order: Number(editing.order ?? sorted.length + 1),
      isActive: editing.isActive ?? true,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editing.id) {
        await updateDoc(doc(db, 'categories', id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'categories', id), payload);
      }
      setEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const moveOrder = async (index: number, dir: -1 | 1) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[targetIdx];
    try {
      await updateDoc(doc(db, 'categories', a.id), { order: b.order, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'categories', b.id), { order: a.order, updatedAt: serverTimestamp() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'categories/reorder');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          ক্যাটাগরি ব্যবস্থাপনা ({toBengaliDigits(sorted.length)})
        </h2>
        <button
          type="button"
          onClick={() => setEditing({ name: '', slug: '', description: '', type: 'both', order: sorted.length + 1, isActive: true })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> নতুন ক্যাটাগরি
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between">
            <h3 className="font-bold">{editing.id ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}</h3>
            <button type="button" onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">ক্যাটাগরির নাম *</label>
              <input
                type="text"
                required
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">স্লাগ (URL)</label>
              <input
                type="text"
                value={editing.slug || ''}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="স্বয়ংক্রিয় তৈরি হবে"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">ধরন</label>
              <select
                value={editing.type || 'both'}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as any })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              >
                <option value="both">প্রশ্ন ও প্রবন্ধ উভয়</option>
                <option value="question">শুধু প্রশ্নোত্তর</option>
                <option value="article">শুধু প্রবন্ধ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">ক্রম (Order)</label>
              <input
                type="number"
                value={editing.order ?? 1}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">বিবরণ</label>
              <input
                type="text"
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold">
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl divide-y divide-[#F0E7D8] dark:divide-[#2E251B]">
        {sorted.map((cat, idx) => (
          <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#2D2216] dark:text-[#F4ECE0]">
                {toBengaliDigits(cat.order)}. {cat.name}
              </p>
              <p className="text-xs text-[#7C6A55] truncate">{cat.slug}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => moveOrder(idx, -1)} className="p-1.5 rounded-lg hover:bg-[#FAF6EF]" title="উপরে নিন">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => moveOrder(idx, 1)} className="p-1.5 rounded-lg hover:bg-[#FAF6EF]" title="নিচে নিন">
                <ArrowDown className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setEditing(cat)} className="p-1.5 rounded-lg hover:bg-[#F5ECDB] text-[#AD823E]" title="সম্পাদনা">
                <Edit3 className="w-4 h-4" />
              </button>
              {confirmDeleteId === cat.id ? (
                <div className="inline-flex items-center gap-1">
                  <button type="button" onClick={() => handleDelete(cat.id)} className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold">
                    নিশ্চিত
                  </button>
                  <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 rounded-lg border border-[#E8DFCE] dark:border-[#2E251B] text-[11px]">
                    না
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDeleteId(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="মুছুন">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAuthorsPanel() {
  const { authors } = useData();
  const [editing, setEditing] = useState<Partial<Author> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const url = await uploadImageAsset(file, 'authors');
      setEditing({ ...editing, photoURL: url });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return;
    setSaving(true);
    const id = editing.id || createSafeId('author');
    const slug = editing.slug || createSlug(editing.name, id.slice(-4));
    const payload: Record<string, any> = {
      id,
      name: editing.name.trim(),
      title: (editing.title || '').trim(),
      slug,
      photoURL: (editing.photoURL || '').trim(),
      bio: (editing.bio || '').trim(),
      qualifications: (editing.qualifications || '').trim(),
      specialties: (editing.specialties || '').trim(),
      totalPublications: Number(editing.totalPublications || 0),
      isActive: editing.isActive ?? true,
      updatedAt: serverTimestamp(),
    };
    try {
      if (editing.id) {
        await updateDoc(doc(db, 'authors', id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'authors', id), payload);
      }
      setEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `authors/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'authors', id));
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `authors/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          লেখক ও মুফতি ব্যবস্থাপনা ({toBengaliDigits(authors.length)})
        </h2>
        <button
          type="button"
          onClick={() => setEditing({ name: '', title: '', bio: '', qualifications: '', isActive: true })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> নতুন লেখক যোগ করুন
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between">
            <h3 className="font-bold">{editing.id ? 'লেখক প্রোফাইল সম্পাদনা' : 'নতুন লেখক'}</h3>
            <button type="button" onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">নাম *</label>
              <input type="text" required value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">পদবি / পরিচয়</label>
              <input type="text" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">শিক্ষাগত যোগ্যতা *</label>
              <input type="text" required value={editing.qualifications || ''} onChange={(e) => setEditing({ ...editing, qualifications: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">সংক্ষিপ্ত জীবনী *</label>
              <textarea rows={3} required value={editing.bio || ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="text"
                value={editing.photoURL && !editing.photoURL.includes('/src/assets/images/') ? editing.photoURL : ''}
                onChange={(e) => setEditing({ ...editing, photoURL: e.target.value })}
                placeholder="ছবির URL বা আপলোড করুন"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5ECDB] text-[#8F682B] text-xs font-semibold cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          </div>
          <button type="submit" disabled={saving || uploading} className="px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold">
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {authors.map((a) => {
          const customPhoto = a.photoURL && !a.photoURL.includes('/src/assets/images/') ? a.photoURL : '';
          return (
            <div key={a.id} className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {customPhoto ? (
                  <img src={customPhoto} alt={a.name} className="w-12 h-12 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E] shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#2D2216] dark:text-[#F4ECE0] truncate">{a.name}</p>
                  <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] truncate">{a.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => setEditing(a)} className="p-2 rounded-lg hover:bg-[#F5ECDB] text-[#AD823E]">
                  <Edit3 className="w-4 h-4" />
                </button>
                {confirmDeleteId === a.id ? (
                  <div className="inline-flex items-center gap-1">
                    <button type="button" onClick={() => handleDelete(a.id)} className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold">
                      নিশ্চিত
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 rounded-lg border border-[#E8DFCE] dark:border-[#2E251B] text-[11px]">
                      না
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDeleteId(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
