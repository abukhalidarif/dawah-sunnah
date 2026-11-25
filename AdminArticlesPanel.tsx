import React, { useState } from 'react';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Check, Edit3, Eye, EyeOff, Plus, Trash2, Upload, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { createSafeId, createSlug, estimateReadingTimeMinutes, toBengaliDigits } from '../../lib/bengaliUtils';
import { uploadImageAsset } from '../../lib/imageUpload';
import { Article } from '../../types';

export function AdminArticlesPanel() {
  const { articles, categories, siteSettings, isDatabaseSeeded, seedDatabase } = useData();
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditing({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      arabicQuote: '',
      quranHadithRefs: '',
      coverImage: '',
      categoryId: categories[0]?.id || '',
      authorId: user?.uid || 'dawah-admin',
      authorName: profile?.displayName || siteSettings.siteNameBn || 'দাওয়াহ ও সুন্নাহ',
      status: 'draft',
      isFeatured: false,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const url = await uploadImageAsset(file, 'articles');
      setEditing({ ...editing, coverImage: url });
    } catch (err: any) {
      setNotice(err?.message || 'ছবি আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!isDatabaseSeeded) {
      await seedDatabase(false);
    }
    const cat = categories.find((c) => c.id === editing.categoryId) || categories[0];
    if (!cat) {
      setNotice('প্রথমে অন্তত একটি ক্যাটাগরি থাকতে হবে।');
      return;
    }

    setSaving(true);
    setNotice(null);
    const id = editing.id || createSafeId('art');
    const slug = editing.slug?.trim() || createSlug(editing.title || 'article', id.slice(-4));
    const readingTimeMinutes = estimateReadingTimeMinutes(editing.content || '');
    const status = editing.status === 'published' ? 'published' : 'draft';
    const resolvedAuthorId =
      editing.authorId && /^[a-zA-Z0-9_-]+$/.test(editing.authorId)
        ? editing.authorId
        : user?.uid && /^[a-zA-Z0-9_-]+$/.test(user.uid)
        ? user.uid
        : 'dawah-admin';
    const resolvedAuthorName =
      (editing.authorName || profile?.displayName || siteSettings.siteNameBn || 'দাওয়াহ ও সুন্নাহ').trim();

    const payload: Record<string, any> = {
      id,
      title: (editing.title || '').trim(),
      slug,
      excerpt: (editing.excerpt || '').trim(),
      content: (editing.content || '').trim(),
      arabicQuote: (editing.arabicQuote || '').trim(),
      quranHadithRefs: (editing.quranHadithRefs || '').trim(),
      coverImage: (editing.coverImage || '').trim(),
      categoryId: cat.id,
      categoryName: cat.name,
      authorId: resolvedAuthorId,
      authorName: resolvedAuthorName,
      status,
      isFeatured: Boolean(editing.isFeatured),
      readingTimeMinutes,
      viewCount: editing.viewCount || 0,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editing.id) {
        if (status === 'published' && !editing.publishedAt) {
          payload.publishedAt = serverTimestamp();
        }
        await updateDoc(doc(db, 'articles', id), payload);
        setNotice('প্রবন্ধ হালনাগাদ করা হয়েছে।');
      } else {
        payload.createdAt = serverTimestamp();
        if (status === 'published') payload.publishedAt = serverTimestamp();
        await setDoc(doc(db, 'articles', id), payload);
        setNotice('নতুন প্রবন্ধ সংরক্ষিত হয়েছে।');
      }
      setEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `articles/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (article: Article) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'articles', article.id), {
        status: nextStatus,
        ...(nextStatus === 'published' ? { publishedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `articles/${article.id}`);
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      await deleteDoc(doc(db, 'articles', articleId));
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `articles/${articleId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            প্রবন্ধ ব্যবস্থাপনা ({toBengaliDigits(articles.length)})
          </h2>
          <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
            নতুন প্রবন্ধ প্রকাশ, খসড়া সংরক্ষণ, ছবি আপলোড ও সম্পাদনা করুন
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs sm:text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> নতুন প্রবন্ধ লিখুন
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-xs sm:text-sm text-[#8F682B] dark:text-[#D4A75E]">
          {notice}
        </div>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-[#F0E7D8] dark:border-[#2E251B] pb-3">
            <h3 className="font-serif-bn font-bold text-lg text-[#2D2216] dark:text-[#F4ECE0]">
              {editing.id ? 'প্রবন্ধ সম্পাদনা' : 'নতুন প্রবন্ধ তৈরি'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} className="text-[#6E5D4B] hover:text-[#2D2216]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">প্রবন্ধের শিরোনাম *</label>
              <input
                type="text"
                required
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">ক্যাটাগরি *</label>
              <select
                value={editing.categoryId || ''}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">লেখকের নাম *</label>
              <input
                type="text"
                required
                maxLength={150}
                value={editing.authorName || ''}
                onChange={(e) => setEditing({ ...editing, authorName: e.target.value })}
                placeholder="যেমন: মাওলানা মুহাম্মাদ খাইরুল ইসলাম"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">সংক্ষিপ্ত বিবরণ (Excerpt) *</label>
              <textarea
                rows={2}
                required
                value={editing.excerpt || ''}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">মূল প্রবন্ধ (শিরোনামের জন্য ### ব্যবহার করুন) *</label>
              <textarea
                rows={8}
                required
                minLength={10}
                value={editing.content || ''}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">আরবি আয়াত / হাদিস উদ্ধৃতি (ঐচ্ছিক)</label>
              <textarea
                rows={3}
                dir="rtl"
                value={editing.arabicQuote || ''}
                onChange={(e) => setEditing({ ...editing, arabicQuote: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-base font-arabic"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">কুরআন ও হাদিস তথ্যসূত্র</label>
              <textarea
                rows={3}
                value={editing.quranHadithRefs || ''}
                onChange={(e) => setEditing({ ...editing, quranHadithRefs: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">কভার ছবি URL বা আপলোড</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={editing.coverImage || ''}
                  onChange={(e) => setEditing({ ...editing, coverImage: e.target.value })}
                  placeholder="কভার ছবির লিংক (ঐচ্ছিক) বা আপলোড করুন"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
                />
                <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E] text-xs font-semibold cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:col-span-2 pt-1">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.status === 'published'}
                  onChange={(e) => setEditing({ ...editing, status: e.target.checked ? 'published' : 'draft' })}
                  className="rounded accent-[#AD823E]"
                />
                <span>সরাসরি প্রকাশ করুন (Published)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isFeatured)}
                  onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                  className="rounded accent-[#AD823E]"
                />
                <span>ফিচার্ড প্রবন্ধ (হোমপেজে দেখাবে)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-xl border border-[#E8DFCE] dark:border-[#2E251B] text-xs font-semibold"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs sm:text-sm font-semibold"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Articles Table */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF6EF] dark:bg-[#16120D] border-b border-[#E8DFCE] dark:border-[#2E251B] text-xs text-[#6E5D4B] dark:text-[#B6A691]">
              <tr>
                <th className="py-3 px-4">শিরোনাম</th>
                <th className="py-3 px-4">লেখক</th>
                <th className="py-3 px-4">ক্যাটাগরি</th>
                <th className="py-3 px-4">অবস্থা</th>
                <th className="py-3 px-4 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E7D8] dark:divide-[#2E251B]">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-[#FAF6EF]/50 dark:hover:bg-[#16120D]/50">
                  <td className="py-3 px-4 font-medium text-[#2D2216] dark:text-[#F4ECE0] max-w-xs truncate">
                    {art.title}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#6E5D4B] dark:text-[#B6A691] whitespace-nowrap">
                    {art.authorName || '—'}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#6E5D4B] dark:text-[#B6A691] whitespace-nowrap">
                    {art.categoryName}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-semibold ${
                        art.status === 'published'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {art.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => togglePublish(art)}
                        title={art.status === 'published' ? 'খসড়া করুন' : 'প্রকাশ করুন'}
                        className="p-1.5 rounded-lg hover:bg-[#F5ECDB] dark:hover:bg-[#2B2114] text-[#8F682B]"
                      >
                        {art.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(art)}
                        title="সম্পাদনা"
                        className="p-1.5 rounded-lg hover:bg-[#F5ECDB] dark:hover:bg-[#2B2114] text-[#AD823E]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {confirmDeleteId === art.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(art.id)}
                            className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold"
                          >
                            নিশ্চিত
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg border border-[#E8DFCE] dark:border-[#2E251B] text-[11px]"
                          >
                            না
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(art.id)}
                          title="মুছুন"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
