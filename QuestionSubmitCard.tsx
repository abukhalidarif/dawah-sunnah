import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, CheckCircle2, FileText, HelpCircle, Send } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export function QuestionSubmitCard() {
  const { categories, siteSettings, submitPublicQuestion } = useData();
  const questionCategories = categories.filter(
    (c) => c.isActive && (c.type === 'both' || c.type === 'question')
  );

  const [askerName, setAskerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [categoryId, setCategoryId] = useState(questionCategories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const chosenCat =
      questionCategories.find((c) => c.id === categoryId) || questionCategories[0];
    if (!askerName.trim() || !title.trim() || !questionText.trim() || !chosenCat) {
      setErrorMsg('অনুগ্রহ করে নাম, ক্যাটাগরি, প্রশ্নের শিরোনাম এবং বিস্তারিত প্রশ্ন লিখুন।');
      return;
    }
    setSubmitting(true);
    try {
      const id = await submitPublicQuestion({
        askerName,
        contactInfo,
        categoryId: chosenCat.id,
        categoryName: chosenCat.name,
        title,
        questionText,
      });
      setSubmittedId(id);
      setAskerName('');
      setContactInfo('');
      setTitle('');
      setQuestionText('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'প্রশ্ন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          আপনার দ্বীনি প্রশ্নের উত্তর জানুন
        </h2>
        <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691]">
          ইসলামী শরীয়ত অনুযায়ী সঠিক দ্বীনি সমাধান পান
        </p>
      </div>

      {/* Guidance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 text-center shadow-xs">
          <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E]">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-[#2D2216] dark:text-[#F4ECE0] mb-1">
            স্পষ্ট প্রশ্ন
          </h3>
          <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            সঠিকভাবে বুঝিয়ে লিখুন
          </p>
        </div>

        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 text-center shadow-xs">
          <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E]">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-base text-[#2D2216] dark:text-[#F4ECE0] mb-1">
            বিস্তারিত তথ্য
          </h3>
          <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            প্রয়োজনীয় বিবরণ যোগ করুন
          </p>
        </div>
      </div>

      {/* Form or Temporarily Closed Message */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-6 sm:p-8 shadow-sm">
        {!siteSettings.questionSubmissionEnabled ? (
          <div className="py-10 px-4 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Ban className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              {siteSettings.questionClosedTitle || 'প্রশ্ন জমা দেওয়া সাময়িকভাবে বন্ধ রয়েছে'}
            </h3>
            <p className="text-sm sm:text-base font-medium text-[#AD823E] dark:text-[#D4A75E]">
              {siteSettings.questionClosedSubtitle || 'শীঘ্রই আবার চালু হবে — ইনশাআল্লাহ।'}
            </p>
            <div className="pt-4 border-t border-[#E8DFCE] dark:border-[#2E251B] max-w-md mx-auto">
              <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                আগের প্রশ্নগুলো দেখতে{' '}
                <Link
                  to="/questions"
                  className="text-[#AD823E] dark:text-[#D4A75E] underline underline-offset-4 font-semibold"
                >
                  প্রশ্ন বিভাগ
                </Link>{' '}
                ভিজিট করুন।
              </p>
            </div>
          </div>
        ) : submittedId ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              জাযাকাল্লাহু খাইরান! আপনার প্রশ্ন জমা হয়েছে
            </h3>
            <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691] max-w-md mx-auto">
              আমাদের সম্মানিত মুফতিয়ানে কেরাম প্রশ্নটি পর্যালোচনা করে কুরআন ও সুন্নাহর আলোকে উত্তর প্রকাশ করবেন।
            </p>
            <button
              type="button"
              onClick={() => setSubmittedId(null)}
              className="px-5 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-medium transition-colors"
            >
              আরেকটি প্রশ্ন করুন
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-lg font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                প্রশ্নের বিবরণ লিখুন
              </h3>
              <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                নিচের ফর্মটি পূরণ করে আপনার প্রশ্ন জমা দিন
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1.5">
                  আপনার নাম *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={askerName}
                  onChange={(e) => setAskerName(e.target.value)}
                  placeholder="যেমন: আব্দুল্লাহ আল মামুন"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1.5">
                  ইমেইল বা মোবাইল নম্বর (ঐচ্ছিক ও গোপনীয়)
                </label>
                <input
                  type="text"
                  maxLength={180}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="উত্তর পেলে জানানোর জন্য (গোপন থাকবে)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1.5">
                প্রশ্নের ক্যাটাগরি *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
              >
                {questionCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1.5">
                প্রশ্নের শিরোনাম *
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={250}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="সংক্ষিপ্ত ও স্পষ্ট শিরোনাম লিখুন"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1.5">
                প্রশ্নের বিস্তারিত বিবরণ *
              </label>
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="আপনার প্রশ্নের প্রেক্ষাপট ও বিস্তারিত বিবরণ পরিষ্কারভাবে লিখুন..."
                className="w-full px-4 py-3 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'জমা হচ্ছে...' : 'প্রশ্ন জমা দিন'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
