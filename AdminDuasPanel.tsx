import React, { useMemo, useState } from 'react';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  BookHeart,
  Check,
  Database,
  Edit3,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { DUA_OCCASIONS, DuaItem, DuaOccasionId } from '../../data/duasData';
import { createSafeId, toBengaliDigits } from '../../lib/bengaliUtils';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';

interface DuaFormState {
  id?: string;
  occasion: DuaOccasionId;
  title: string;
  arabic: string;
  pronunciation: string;
  translation: string;
  reference: string;
  virtue: string;
  targetCount: number;
  featured: boolean;
  order: number;
}

const emptyForm = (nextOrder = 1): DuaFormState => ({
  occasion: 'morning-evening',
  title: '',
  arabic: '',
  pronunciation: '',
  translation: '',
  reference: '',
  virtue: '',
  targetCount: 1,
  featured: true,
  order: nextOrder,
});

export function AdminDuasPanel() {
  const { isAdmin } = useAuth();
  const { duas, restoreDefaultDuas, clearAllDuas } = useData();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DuaFormState>(() => emptyForm(1));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOccasion, setFilterOccasion] = useState<'all' | DuaOccasionId>('all');
  const [saving, setSaving] = useState(false);
  const [busyBulk, setBusyBulk] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredDuas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return duas.filter((dua) => {
      if (filterOccasion !== 'all' && dua.occasion !== filterOccasion) return false;
      if (!q) return true;
      return (
        dua.title.toLowerCase().includes(q) ||
        dua.translation.toLowerCase().includes(q) ||
        dua.reference.toLowerCase().includes(q) ||
        dua.occasionLabel.toLowerCase().includes(q)
      );
    });
  }, [duas, filterOccasion, searchTerm]);

  const featuredCount = useMemo(() => duas.filter((d) => d.featured).length, [duas]);

  const openNew = () => {
    setNotice(null);
    const maxOrder = duas.reduce((max, d) => Math.max(max, typeof d.order === 'number' ? d.order : 0), 0);
    setForm(emptyForm(Math.min(maxOrder + 1, 9999)));
    setEditing(true);
  };

  const openEdit = (dua: DuaItem) => {
    setNotice(null);
    setForm({
      id: dua.id,
      occasion: dua.occasion,
      title: dua.title,
      arabic: dua.arabic,
      pronunciation: dua.pronunciation || '',
      translation: dua.translation,
      reference: dua.reference,
      virtue: dua.virtue || '',
      targetCount: dua.targetCount || 1,
      featured: Boolean(dua.featured),
      order: typeof dua.order === 'number' ? dua.order : 1,
    });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    const title = form.title.trim().slice(0, 240);
    const arabic = form.arabic.trim().slice(0, 4000);
    const pronunciation = form.pronunciation.trim().slice(0, 4000);
    const translation = form.translation.trim().slice(0, 4000);
    const reference = form.reference.trim().slice(0, 500);
    const virtue = form.virtue.trim().slice(0, 2000);
    const targetCount = Math.min(10000, Math.max(1, Math.round(Number(form.targetCount) || 1)));
    const order = Math.min(10000, Math.max(0, Math.round(Number(form.order) || 0)));

    if (title.length < 2) {
      setNotice({ type: 'error', text: 'দুআর শিরোনাম কমপক্ষে ২ অক্ষরের হতে হবে।' });
      return;
    }
    if (arabic.length < 2) {
      setNotice({ type: 'error', text: 'আরবি পাঠ্য কমপক্ষে ২ অক্ষরের হতে হবে।' });
      return;
    }
    if (translation.length < 2) {
      setNotice({ type: 'error', text: 'বাংলা অর্থ কমপক্ষে ২ অক্ষরের হতে হবে।' });
      return;
    }
    if (reference.length < 1) {
      setNotice({ type: 'error', text: 'উৎস বা হাদিসের সূত্র উল্লেখ করুন।' });
      return;
    }

    const occasionObj = DUA_OCCASIONS.find((o) => o.id === form.occasion) || DUA_OCCASIONS[0];

    setSaving(true);
    try {
      const id = form.id || createSafeId('dua');
      const ref = doc(db, 'duas', id);
      const snap = await getDoc(ref);
      const payload = {
        id,
        occasion: occasionObj.id,
        occasionLabel: occasionObj.label,
        title,
        arabic,
        pronunciation,
        translation,
        reference,
        virtue,
        targetCount,
        featured: Boolean(form.featured),
        order,
      };

      if (snap.exists()) {
        await updateDoc(ref, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await setDoc(
          doc(db, 'settings', 'site'),
          { duasInitialized: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }

      setEditing(false);
      setNotice({ type: 'success', text: 'দুআ ও যিকির সফলভাবে সংরক্ষিত হয়েছে।' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `duas/${form.id || 'new'}`);
      setNotice({ type: 'error', text: 'দুআ সংরক্ষণ করা যায়নি। অনুগ্রহ করে তথ্য যাচাই করুন।' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (dua: DuaItem) => {
    setNotice(null);
    try {
      const ref = doc(db, 'duas', dua.id);
      const snap = await getDoc(ref);
      const payload = {
        id: dua.id,
        occasion: dua.occasion,
        occasionLabel: dua.occasionLabel,
        title: dua.title,
        arabic: dua.arabic,
        pronunciation: dua.pronunciation || '',
        translation: dua.translation,
        reference: dua.reference,
        virtue: dua.virtue || '',
        targetCount: dua.targetCount || 1,
        featured: !dua.featured,
        order: typeof dua.order === 'number' ? dua.order : 1,
      };

      if (snap.exists()) {
        await updateDoc(ref, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `duas/${dua.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    setNotice(null);
    try {
      await deleteDoc(doc(db, 'duas', id));
      setConfirmDeleteId(null);
      setNotice({ type: 'success', text: 'দুআটি স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `duas/${id}`);
      setNotice({ type: 'error', text: 'দুআটি মুছে ফেলা যায়নি।' });
    }
  };

  const handleRestoreDefaults = async () => {
    setBusyBulk(true);
    setNotice(null);
    try {
      const count = await restoreDefaultDuas(false);
      setNotice({
        type: 'success',
        text:
          count > 0
            ? `${toBengaliDigits(count)}টি সংকলিত মাসনূন দুআ যুক্ত করা হয়েছে।`
            : 'সংকলিত সকল মাসনূন দুআ ইতিমধ্যেই তালিকায় রয়েছে।',
      });
    } catch {
      setNotice({ type: 'error', text: 'সংকলিত দুআ লোড করা যায়নি।' });
    } finally {
      setBusyBulk(false);
    }
  };

  const handleClearAll = async () => {
    if (!isAdmin) return;
    setBusyBulk(true);
    setNotice(null);
    try {
      const removed = await clearAllDuas();
      setConfirmClearAll(false);
      setNotice({
        type: 'success',
        text: `পূর্বের ${toBengaliDigits(removed)}টি দুআ ও যিকির স্থায়ীভাবে মুছে ফেলা হয়েছে। এখন আপনি নিজস্ব দুআ যোগ করতে পারেন।`,
      });
    } catch {
      setNotice({ type: 'error', text: 'সব দুআ মুছতে সমস্যা হয়েছে।' });
    } finally {
      setBusyBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
            <BookHeart className="w-5 h-5 text-[#AD823E]" />
            <span>দুআ ও যিকির ব্যবস্থাপনা</span>
          </h2>
          <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] mt-0.5 tabular-nums-bn">
            মোট {toBengaliDigits(duas.length)}টি দুআ • হোমপেজের জন্য বাছাইকৃত: {toBengaliDigits(featuredCount)}টি
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> নতুন দুআ যোগ করুন
          </button>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            disabled={busyBulk}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E] text-xs font-semibold hover:bg-[#EADBC0] cursor-pointer disabled:opacity-60"
          >
            <Database className="w-3.5 h-3.5" /> সংকলিত দুআ লোড
          </button>

          {isAdmin && duas.length > 0 && (
            confirmClearAll ? (
              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={busyBulk}
                  className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {busyBulk ? 'মুছছে...' : 'হ্যাঁ, সব মুছুন'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  disabled={busyBulk}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1711] text-xs text-[#5A4B3C] dark:text-[#CBBBA6] cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> সব মুছুন
              </button>
            )
          )}
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Create / Edit Dua Form */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-[#F0E7D8] dark:border-[#2E251B] pb-3">
            <h3 className="font-serif-bn font-bold text-base text-[#2D2216] dark:text-[#F4ECE0]">
              {form.id ? 'দুআ ও যিকির সম্পাদনা' : 'নতুন দুআ ও যিকির যোগ করুন'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="p-1.5 rounded-lg text-[#6E5D4B] hover:bg-[#FAF6EF] dark:hover:bg-[#120F0B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">দুআর শিরোনাম *</label>
              <input
                type="text"
                required
                maxLength={240}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: সকাল ও সন্ধ্যার সুরক্ষার দুআ"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">উপলক্ষ *</label>
              <select
                value={form.occasion}
                onChange={(e) => setForm({ ...form, occasion: e.target.value as DuaOccasionId })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              >
                {DUA_OCCASIONS.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">তাসবিহ সংখ্যা *</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={form.targetCount}
                  onChange={(e) => setForm({ ...form, targetCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ক্রম (Order)</label>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">আরবি দুআ (Arabic Text) *</label>
            <textarea
              required
              rows={3}
              maxLength={4000}
              dir="rtl"
              value={form.arabic}
              onChange={(e) => setForm({ ...form, arabic: e.target.value })}
              placeholder="আরবি দুআ লিখুন..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] font-arabic text-xl leading-loose text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">বাংলা উচ্চারণ (ঐচ্ছিক)</label>
            <textarea
              rows={2}
              maxLength={4000}
              value={form.pronunciation}
              onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
              placeholder="উচ্চারণ লিখুন..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">বাংলা অর্থ / অনুবাদ *</label>
            <textarea
              required
              rows={3}
              maxLength={4000}
              value={form.translation}
              onChange={(e) => setForm({ ...form, translation: e.target.value })}
              placeholder="দুআর বাংলা অর্থ লিখুন..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">উৎস / হাদিস ও কুরআনের সূত্র *</label>
              <input
                type="text"
                required
                maxLength={500}
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="যেমন: সহিহ বুখারি: হাদিস নং ৬৩০৬"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">ফজিলত ও আমল (ঐচ্ছিক)</label>
              <input
                type="text"
                maxLength={2000}
                value={form.virtue}
                onChange={(e) => setForm({ ...form, virtue: e.target.value })}
                placeholder="সকালে বা সন্ধ্যায় পাঠের ফজিলত..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#F0E7D8] dark:border-[#2E251B]">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="accent-[#AD823E]"
              />
              <span>হোমপেজের &quot;দুআ ও যিকির&quot; সেকশনে প্রদর্শন করুন</span>
            </label>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Occasion Filter */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#9E8E7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="শিরোনাম, অর্থ বা হাদিসের সূত্র খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterOccasion('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              filterOccasion === 'all'
                ? 'bg-[#AD823E] text-white border-[#AD823E]'
                : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6]'
            }`}
          >
            সকল ({toBengaliDigits(duas.length)})
          </button>
          {DUA_OCCASIONS.map((occ) => {
            const count = duas.filter((d) => d.occasion === occ.id).length;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => setFilterOccasion(occ.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  filterOccasion === occ.id
                    ? 'bg-[#AD823E] text-white border-[#AD823E]'
                    : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6]'
                }`}
              >
                {occ.label} ({toBengaliDigits(count)})
              </button>
            );
          })}
        </div>
      </div>

      {/* List of Duas */}
      {filteredDuas.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            কোনো দুআ ও যিকির পাওয়া যায়নি। নতুন দুআ যোগ করুন অথবা সংকলিত দুআ লোড করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDuas.map((dua) => (
            <div
              key={dua.id}
              className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E]">
                      {dua.occasionLabel}
                    </span>
                    <span className="text-[#7A6855] dark:text-[#A3927D] tabular-nums-bn">
                      ক্রম: {toBengaliDigits(typeof dua.order === 'number' ? dua.order : 1)} • তাসবিহ: {toBengaliDigits(dua.targetCount)} বার
                    </span>
                    {dua.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        <Star className="w-3 h-3 fill-current" /> হোমপেজে সক্রিয়
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif-bn font-bold text-base text-[#2D2216] dark:text-[#F4ECE0]">
                    {dua.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(dua)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      dua.featured
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-[#FAF6EF] dark:bg-[#120F0B] border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B] dark:text-[#B6A691]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${dua.featured ? 'fill-current' : ''}`} />
                    <span>{dua.featured ? 'হোমপেজ: চালু' : 'হোমপেজে দিন'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(dua)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> সম্পাদনা
                  </button>

                  {isAdmin && (
                    confirmDeleteId === dua.id ? (
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                        <button
                          type="button"
                          onClick={() => handleDelete(dua.id)}
                          className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          নিশ্চিত
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-xs text-[#5A4B3C] dark:text-[#CBBBA6] cursor-pointer"
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(dua.id)}
                        aria-label="মুছুন"
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>

              <p
                dir="rtl"
                className="font-arabic text-lg sm:text-xl text-[#8F682B] dark:text-[#D4A75E] leading-relaxed text-right bg-[#FAF6EF] dark:bg-[#120F0B] rounded-xl px-3.5 py-2.5"
              >
                {dua.arabic}
              </p>

              <p className="text-xs sm:text-sm text-[#4A3B2C] dark:text-[#D8CBB8] leading-relaxed">
                {dua.translation}
              </p>

              <p className="text-[11px] font-medium text-[#7A6855] dark:text-[#A3927D]">
                সূত্র: {dua.reference}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
