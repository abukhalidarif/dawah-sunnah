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
  Check,
  Database,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Scale,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { createSafeId, toBengaliDigits } from '../../lib/bengaliUtils';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { MasalaItem } from '../../types';

interface MasalaFormState {
  id?: string;
  categoryId: string;
  subTopic: string;
  authorName: string;
  title: string;
  summary: string;
  content: string;
  arabicReference: string;
  quranHadithRefs: string;
  featured: boolean;
  order: number;
  status: 'published' | 'draft';
}

export function AdminMasalasPanel() {
  const { isAdmin } = useAuth();
  const {
    masalas,
    categories,
    isDatabaseSeeded,
    seedDatabase,
    restoreIslamicTopicsContent,
    clearAllMasalas,
  } = useData();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<MasalaFormState>({
    categoryId: categories[0]?.id || 'cat-salah',
    subTopic: '',
    authorName: '',
    title: '',
    summary: '',
    content: '',
    arabicReference: '',
    quranHadithRefs: '',
    featured: false,
    order: 1,
    status: 'published',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCatId, setFilterCatId] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [busyBulk, setBusyBulk] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredMasalas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return masalas.filter((m) => {
      if (filterCatId !== 'all' && m.categoryId !== filterCatId) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.subTopic.toLowerCase().includes(q) ||
        (m.authorName || '').toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.categoryName.toLowerCase().includes(q)
      );
    });
  }, [masalas, filterCatId, searchTerm]);

  const openNew = () => {
    setNotice(null);
    const maxOrder = masalas.reduce((max, m) => Math.max(max, typeof m.order === 'number' ? m.order : 0), 0);
    setForm({
      categoryId: filterCatId !== 'all' ? filterCatId : categories[0]?.id || 'cat-salah',
      subTopic: '',
      authorName: '',
      title: '',
      summary: '',
      content: '',
      arabicReference: '',
      quranHadithRefs: '',
      featured: false,
      order: Math.min(maxOrder + 1, 9999),
      status: 'published',
    });
    setEditing(true);
  };

  const openEdit = (item: MasalaItem) => {
    setNotice(null);
    setForm({
      id: item.id,
      categoryId: item.categoryId,
      subTopic: item.subTopic,
      authorName: item.authorName || '',
      title: item.title,
      summary: item.summary,
      content: item.content,
      arabicReference: item.arabicReference || '',
      quranHadithRefs: item.quranHadithRefs || '',
      featured: Boolean(item.featured),
      order: typeof item.order === 'number' ? item.order : 1,
      status: item.status === 'draft' ? 'draft' : 'published',
    });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!isDatabaseSeeded) {
      await seedDatabase(false);
    }

    const cat = categories.find((c) => c.id === form.categoryId) || categories[0];
    if (!cat) {
      setNotice({ type: 'error', text: 'প্রথমে অন্তত একটি ক্যাটাগরি নির্বাচন করুন।' });
      return;
    }

    const title = form.title.trim().slice(0, 240);
    const subTopic = form.subTopic.trim().slice(0, 120);
    const authorName = form.authorName.trim().slice(0, 150);
    const summary = form.summary.trim().slice(0, 600);
    const content = form.content.trim().slice(0, 30000);
    const arabicReference = form.arabicReference.trim().slice(0, 4000);
    const quranHadithRefs = form.quranHadithRefs.trim().slice(0, 2000);
    const order = Math.min(10000, Math.max(0, Math.round(Number(form.order) || 0)));

    if (title.length < 2) {
      setNotice({ type: 'error', text: 'মাসআলার শিরোনাম কমপক্ষে ২ অক্ষরের হতে হবে।' });
      return;
    }
    if (subTopic.length < 1) {
      setNotice({ type: 'error', text: 'উপ-বিষয় (যেমন: ওজুর ফরজ, কসর নামাজ) উল্লেখ করুন।' });
      return;
    }
    if (summary.length < 1) {
      setNotice({ type: 'error', text: 'সংক্ষিপ্ত সারমর্ম লিখুন।' });
      return;
    }
    if (content.length < 10) {
      setNotice({ type: 'error', text: 'বিস্তারিত মাসআলা কমপক্ষে ১০ অক্ষরের হতে হবে।' });
      return;
    }

    setSaving(true);
    try {
      const id = form.id || createSafeId('masala');
      const ref = doc(db, 'masalas', id);
      const snap = await getDoc(ref);
      const payload = {
        id,
        categoryId: cat.id,
        categoryName: cat.name.slice(0, 120),
        subTopic,
        authorName,
        title,
        summary,
        content,
        arabicReference,
        quranHadithRefs,
        featured: Boolean(form.featured),
        order,
        status: form.status === 'draft' ? 'draft' : 'published',
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
          { topicsContentInitialized: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }

      setEditing(false);
      setNotice({ type: 'success', text: 'মাসআলা সফলভাবে সংরক্ষিত হয়েছে।' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `masalas/${form.id || 'new'}`);
      setNotice({ type: 'error', text: 'মাসআলা সংরক্ষণ করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: MasalaItem) => {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const ref = doc(db, 'masalas', item.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: item.id,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          subTopic: item.subTopic,
          authorName: item.authorName || '',
          title: item.title,
          summary: item.summary,
          content: item.content,
          arabicReference: item.arabicReference || '',
          quranHadithRefs: item.quranHadithRefs || '',
          featured: Boolean(item.featured),
          order: typeof item.order === 'number' ? item.order : 1,
          status: nextStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `masalas/${item.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    setNotice(null);
    try {
      await deleteDoc(doc(db, 'masalas', id));
      setConfirmDeleteId(null);
      setNotice({ type: 'success', text: 'মাসআলাটি স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `masalas/${id}`);
      setNotice({ type: 'error', text: 'মাসআলাটি মুছে ফেলা যায়নি।' });
    }
  };

  const handleLoadTopicDefaults = async () => {
    setBusyBulk(true);
    setNotice(null);
    try {
      const added = await restoreIslamicTopicsContent(false);
      const total = added.masalas + added.questions + added.articles;
      setNotice({
        type: 'success',
        text:
          total > 0
            ? `সফলভাবে ${toBengaliDigits(added.masalas)}টি মাসআলা, ${toBengaliDigits(added.questions)}টি জিজ্ঞাসা ও ${toBengaliDigits(added.articles)}টি প্রবন্ধ যুক্ত হয়েছে।`
            : 'নামাজ, রোজা, হজ, যাকাত, পবিত্রতা, তালাক ও কুরবানির সকল সংকলিত বিষয়বস্তু ইতিমধ্যেই যুক্ত রয়েছে।',
      });
    } catch {
      setNotice({ type: 'error', text: 'বিষয়বস্তু লোড করা যায়নি।' });
    } finally {
      setBusyBulk(false);
    }
  };

  const handleClearAll = async () => {
    if (!isAdmin) return;
    setBusyBulk(true);
    setNotice(null);
    try {
      const removed = await clearAllMasalas();
      setConfirmClearAll(false);
      setNotice({
        type: 'success',
        text: `${toBengaliDigits(removed)}টি মাসআলা স্থায়ীভাবে মুছে ফেলা হয়েছে।`,
      });
    } catch {
      setNotice({ type: 'error', text: 'মাসআলা মুছতে সমস্যা হয়েছে।' });
    } finally {
      setBusyBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#AD823E]" />
            <span>বিষয়ভিত্তিক মাসআলা ব্যবস্থাপনা</span>
          </h2>
          <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] mt-0.5 tabular-nums-bn">
            মোট {toBengaliDigits(masalas.length)}টি মাসআলা (নামাজ, রোজা, হজ, যাকাত, পবিত্রতা, তালাক, কুরবানি)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> নতুন মাসআলা লিখুন
          </button>

          <button
            type="button"
            onClick={handleLoadTopicDefaults}
            disabled={busyBulk}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E] text-xs font-semibold hover:bg-[#EADBC0] cursor-pointer disabled:opacity-60"
          >
            <Database className="w-3.5 h-3.5" /> সংকলিত মাসআলা-জিজ্ঞাসা-প্রবন্ধ লোড
          </button>

          {isAdmin && masalas.length > 0 && (
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
                <Trash2 className="w-3.5 h-3.5" /> সব মাসআলা মুছুন
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

      {/* Add / Edit Masala Form */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-[#F0E7D8] dark:border-[#2E251B] pb-3">
            <h3 className="font-serif-bn font-bold text-base text-[#2D2216] dark:text-[#F4ECE0]">
              {form.id ? 'মাসআলা সম্পাদনা' : 'নতুন মাসআলা যোগ করুন'}
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
              <label className="block text-xs font-medium mb-1">মাসআলার শিরোনাম *</label>
              <input
                type="text"
                required
                maxLength={240}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: নামাজের ফরজ ১৩টি ও ওয়াজিব ১৪টি"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">ক্যাটাগরি *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">অধ্যায় / উপ-বিষয় *</label>
              <input
                type="text"
                required
                maxLength={120}
                value={form.subTopic}
                onChange={(e) => setForm({ ...form, subTopic: e.target.value })}
                placeholder="যেমন: ফরজ ও ওয়াজিব"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-medium mb-1">লেখকের নাম (ঐচ্ছিক)</label>
              <input
                type="text"
                maxLength={150}
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="যেমন: মাওলানা আব্দুর রহমান বা গবেষণা বিভাগ"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">সংক্ষিপ্ত সারমর্ম *</label>
            <input
              type="text"
              required
              maxLength={600}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="এক-দুই লাইনে মাসআলাটির মূল বক্তব্য..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              বিস্তারিত মাসআলা (### শিরোনাম এবং **বোল্ড** সমর্থিত) *
            </label>
            <textarea
              required
              rows={7}
              maxLength={30000}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="মাসআলার পয়েন্ট ও বিস্তারিত বিধান লিখুন..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">আরবি দলিল (ঐচ্ছিক)</label>
              <textarea
                rows={2}
                maxLength={4000}
                dir="rtl"
                value={form.arabicReference}
                onChange={(e) => setForm({ ...form, arabicReference: e.target.value })}
                placeholder="আরবি আয়াত, হাদিস বা ফিকহি ইবারত..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] font-arabic text-lg text-right"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">কুরআন, হাদিস ও ফিকহের সূত্র</label>
                <input
                  type="text"
                  maxLength={2000}
                  value={form.quranHadithRefs}
                  onChange={(e) => setForm({ ...form, quranHadithRefs: e.target.value })}
                  placeholder="যেমন: সহিহ বুখারি: হাদিস নং ৬৩১"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs font-medium mb-1">অবস্থা</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'published' | 'draft' })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
                  >
                    <option value="published">প্রকাশিত</option>
                    <option value="draft">খসড়া</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#F0E7D8] dark:border-[#2E251B]">
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
        </form>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9E8E7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="মাসআলার শিরোনাম বা উপ-বিষয় খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
          />
        </div>
        <select
          value={filterCatId}
          onChange={(e) => setFilterCatId(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
        >
          <option value="all">সকল ক্যাটাগরি ({toBengaliDigits(masalas.length)})</option>
          {categories.map((c) => {
            const count = masalas.filter((m) => m.categoryId === c.id).length;
            return (
              <option key={c.id} value={c.id}>
                {c.name} ({toBengaliDigits(count)})
              </option>
            );
          })}
        </select>
      </div>

      {/* List */}
      {filteredMasalas.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center text-sm text-[#6E5D4B] dark:text-[#B6A691]">
          কোনো মাসআলা পাওয়া যায়নি। নতুন মাসআলা যোগ করুন অথবা সংকলিত বিষয়বস্তু লোড করুন।
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMasalas.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E]">
                    {item.categoryName}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#FAF6EF] dark:bg-[#14100C] border border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6]">
                    {item.subTopic}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg ${
                      item.status === 'published'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {item.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}
                  </span>
                  {item.authorName && (
                    <span className="px-2 py-0.5 rounded-lg bg-[#FAF6EF] dark:bg-[#14100C] text-[#7C6A55] dark:text-[#B6A691]">
                      লেখক: {item.authorName}
                    </span>
                  )}
                </div>
                <h3 className="font-serif-bn font-bold text-base text-[#2D2216] dark:text-[#F4ECE0]">
                  {item.title}
                </h3>
                <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] line-clamp-1">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleStatus(item)}
                  title={item.status === 'published' ? 'খসড়া করুন' : 'প্রকাশ করুন'}
                  className="p-2 rounded-lg bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B] hover:border-[#AD823E] cursor-pointer"
                >
                  {item.status === 'published' ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-amber-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> সম্পাদনা
                </button>

                {isAdmin && (
                  confirmDeleteId === item.id ? (
                    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
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
                      onClick={() => setConfirmDeleteId(item.id)}
                      aria-label="মুছুন"
                      className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
