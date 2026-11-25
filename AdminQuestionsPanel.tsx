import React, { useEffect, useMemo, useState } from 'react';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Ban, Check, CheckCircle2, Edit3, Plus, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { createSafeId, createSlug, toBengaliDigits } from '../../lib/bengaliUtils';
import { Question } from '../../types';

export function AdminQuestionsPanel() {
  const { questions, categories, siteSettings } = useData();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');
  const [editing, setEditing] = useState<Partial<Question> | null>(null);
  const [saving, setSaving] = useState(false);
  const [closedTitle, setClosedTitle] = useState(siteSettings.questionClosedTitle);
  const [closedSub, setClosedSub] = useState(siteSettings.questionClosedSubtitle);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setClosedTitle(siteSettings.questionClosedTitle);
    setClosedSub(siteSettings.questionClosedSubtitle);
  }, [siteSettings.questionClosedTitle, siteSettings.questionClosedSubtitle]);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return questions;
    return questions.filter((q) => q.status === filterStatus);
  }, [questions, filterStatus]);

  const toggleSubmissionSetting = async () => {
    try {
      await updateDoc(doc(db, 'settings', 'site'), {
        questionSubmissionEnabled: !siteSettings.questionSubmissionEnabled,
        questionClosedTitle: closedTitle,
        questionClosedSubtitle: closedSub,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site');
    }
  };

  const openNewQuestion = () => {
    setEditing({
      title: '',
      questionText: '',
      askerName: 'প্রশ্নকারী',
      categoryId: categories[0]?.id || '',
      authorId: '',
      status: 'published',
      isFeatured: false,
      answerText: '',
      arabicReferences: '',
      quranHadithRefs: '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const cat = categories.find((c) => c.id === editing.categoryId) || categories[0];
    if (!cat) return;

    setSaving(true);
    const id = editing.id || createSafeId('q');
    const slug = editing.slug || createSlug(editing.title || 'masala', id.slice(-4));
    const status = editing.status || 'published';

    const payload: Record<string, any> = {
      id,
      title: (editing.title || '').trim(),
      slug,
      questionText: (editing.questionText || '').trim(),
      askerName: (editing.askerName || 'প্রশ্নকারী').trim(),
      categoryId: cat.id,
      categoryName: cat.name,
      status,
      isFeatured: Boolean(editing.isFeatured),
      answerText: (editing.answerText || '').trim(),
      arabicReferences: (editing.arabicReferences || '').trim(),
      quranHadithRefs: (editing.quranHadithRefs || '').trim(),
      authorId: editing.authorId || '',
      authorName: editing.authorName || '',
      viewCount: editing.viewCount || 0,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editing.id) {
        if (status === 'published' && !editing.answeredAt) {
          payload.answeredAt = serverTimestamp();
        }
        await updateDoc(doc(db, 'questions', id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        if (status === 'published') payload.answeredAt = serverTimestamp();
        await setDoc(doc(db, 'questions', id), payload);
      }
      setEditing(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `questions/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (q: Question, status: Question['status']) => {
    try {
      await updateDoc(doc(db, 'questions', q.id), {
        status,
        ...(status === 'published' ? { answeredAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `questions/${q.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
      await deleteDoc(doc(db, 'question_contacts', id)).catch(() => {});
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Public Submission Toggle Banner */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif-bn font-bold text-base text-[#2D2216] dark:text-[#F4ECE0]">
              পাবলিক প্রশ্ন জমা নেওয়া নিয়ন্ত্রণ
            </h3>
            <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
              বর্তমান অবস্থা:{' '}
              <strong className={siteSettings.questionSubmissionEnabled ? 'text-emerald-600' : 'text-amber-600'}>
                {siteSettings.questionSubmissionEnabled ? 'চালু আছে' : 'সাময়িকভাবে বন্ধ আছে'}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={toggleSubmissionSetting}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              siteSettings.questionSubmissionEnabled
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {siteSettings.questionSubmissionEnabled ? (
              <>
                <ToggleRight className="w-5 h-5" />
                <span>সাময়িকভাবে বন্ধ করুন</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>পুনরায় চালু করুন</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F0E7D8] dark:border-[#2E251B]">
          <input
            type="text"
            value={closedTitle}
            onChange={(e) => setClosedTitle(e.target.value)}
            placeholder="বন্ধ অবস্থার শিরোনাম"
            className="px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
          />
          <input
            type="text"
            value={closedSub}
            onChange={(e) => setClosedSub(e.target.value)}
            placeholder="বন্ধ অবস্থার উপ-বার্তা"
            className="px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
          />
        </div>
      </div>

      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: `সব (${toBengaliDigits(questions.length)})` },
            { id: 'pending', label: `অপেক্ষমাণ (${toBengaliDigits(questions.filter((q) => q.status === 'pending').length)})` },
            { id: 'published', label: `প্রকাশিত (${toBengaliDigits(questions.filter((q) => q.status === 'published').length)})` },
            { id: 'rejected', label: `বাতিল (${toBengaliDigits(questions.filter((q) => q.status === 'rejected').length)})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterStatus(t.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                filterStatus === t.id
                  ? 'bg-[#AD823E] text-white'
                  : 'bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openNewQuestion}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> নতুন মাসআলা যোগ করুন
        </button>
      </div>

      {/* Answer / Edit Form */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E7D8] dark:border-[#2E251B]">
            <h3 className="font-serif-bn font-bold text-lg text-[#2D2216] dark:text-[#F4ECE0]">
              {editing.id ? 'প্রশ্নোত্তর সম্পাদনা ও উত্তর প্রদান' : 'নতুন প্রশ্নোত্তর'}
            </h3>
            <button type="button" onClick={() => setEditing(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">প্রশ্নের শিরোনাম *</label>
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
              <label className="block text-xs font-medium mb-1">লেখকের / উত্তরদাতার নাম (ঐচ্ছিক)</label>
              <input
                type="text"
                maxLength={150}
                value={editing.authorName || ''}
                onChange={(e) => setEditing({ ...editing, authorName: e.target.value })}
                placeholder="যেমন: মাওলানা মুহাম্মাদ খাইরুল ইসলাম"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">বিস্তারিত প্রশ্ন *</label>
              <textarea
                rows={3}
                required
                value={editing.questionText || ''}
                onChange={(e) => setEditing({ ...editing, questionText: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">শরয়ি উত্তর</label>
              <textarea
                rows={6}
                value={editing.answerText || ''}
                onChange={(e) => setEditing({ ...editing, answerText: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">আরবি রেফারেন্স (RTL)</label>
              <textarea
                rows={3}
                dir="rtl"
                value={editing.arabicReferences || ''}
                onChange={(e) => setEditing({ ...editing, arabicReferences: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-base font-arabic"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">কুরআন, হাদিস ও ফিকহ গ্রন্থসূত্র</label>
              <textarea
                rows={3}
                value={editing.quranHadithRefs || ''}
                onChange={(e) => setEditing({ ...editing, quranHadithRefs: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">অবস্থা</label>
              <select
                value={editing.status || 'pending'}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              >
                <option value="pending">অপেক্ষমাণ (Pending)</option>
                <option value="approved">অনুমোদিত (Approved)</option>
                <option value="published">প্রকাশিত (Published)</option>
                <option value="rejected">বাতিল (Rejected)</option>
              </select>
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isFeatured)}
                  onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                  className="accent-[#AD823E]"
                />
                <span>ফিচার্ড প্রশ্ন</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-[#E8DFCE] text-xs font-semibold">
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold"
            >
              <Check className="w-4 h-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-[#AD823E]">{q.categoryName}</span>
                {q.authorName && (
                  <>
                    <span>·</span>
                    <span>লেখক: {q.authorName}</span>
                  </>
                )}
                <span>·</span>
                <span>প্রশ্নকারী: {q.askerName}</span>
                <span>·</span>
                <span
                  className={`font-semibold ${
                    q.status === 'published'
                      ? 'text-emerald-600'
                      : q.status === 'pending'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {q.status === 'published'
                    ? 'প্রকাশিত'
                    : q.status === 'pending'
                    ? 'অপেক্ষমাণ'
                    : q.status === 'approved'
                    ? 'অনুমোদিত'
                    : 'বাতিল'}
                </span>
              </div>
              <h4 className="font-semibold text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0]">
                {q.title}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {q.status !== 'published' && (
                <button
                  type="button"
                  onClick={() => quickStatus(q, 'published')}
                  title="প্রকাশ করুন"
                  className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
              {q.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => quickStatus(q, 'rejected')}
                  title="প্রত্যাখ্যান করুন"
                  className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(q)}
                title="উত্তর লিখুন / সম্পাদনা"
                className="p-2 rounded-lg bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B]"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              {confirmDeleteId === q.id ? (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                  >
                    নিশ্চিত
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
                  >
                    না
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(q.id)}
                  title="মুছুন"
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600"
                >
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
