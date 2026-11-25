import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Calendar,
  Check,
  Eye,
  PenLine,
  Share2,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { formatBengaliDate, toBengaliDigits } from '../lib/bengaliUtils';
import { RichTextRenderer } from '../components/RichTextRenderer';
import { QuestionCard } from '../components/QuestionCard';
import { SeoHead } from '../components/SeoHead';

export function QuestionDetailPage() {
  const { slug } = useParams();
  const {
    publishedQuestions,
    isBookmarked,
    toggleBookmark,
    recordReadingHistory,
    incrementQuestionView,
  } = useData();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [bookmarkMsg, setBookmarkMsg] = useState<string | null>(null);

  const question = useMemo(
    () => publishedQuestions.find((q) => q.slug === slug || q.id === slug),
    [publishedQuestions, slug]
  );

  const relatedQuestions = useMemo(() => {
    if (!question) return [];
    return publishedQuestions
      .filter((q) => q.id !== question.id && q.categoryId === question.categoryId)
      .slice(0, 3);
  }, [publishedQuestions, question]);

  useEffect(() => {
    if (!question) return;
    incrementQuestionView(question.id);
    if (user) {
      recordReadingHistory({
        itemId: question.id,
        itemType: 'question',
        title: question.title,
        slug: question.slug,
        categoryName: question.categoryName,
      });
    }
  }, [question?.id, user?.uid]);

  if (!question) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          প্রশ্নটি পাওয়া যায়নি
        </h1>
        <Link
          to="/questions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD823E] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> সব প্রশ্নে ফিরে যান
        </Link>
      </div>
    );
  }

  const saved = isBookmarked(question.id);

  const handleBookmark = async () => {
    try {
      const added = await toggleBookmark({
        itemId: question.id,
        itemType: 'question',
        title: question.title,
        slug: question.slug,
        categoryName: question.categoryName,
      });
      setBookmarkMsg(added ? 'প্রিয় প্রশ্ন তালিকায় সংরক্ষিত হয়েছে' : 'তালিকা থেকে সরানো হয়েছে');
      setTimeout(() => setBookmarkMsg(null), 2500);
    } catch (err: any) {
      setBookmarkMsg(err.message || 'সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন');
      setTimeout(() => setBookmarkMsg(null), 3000);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      <SeoHead
        title={question.title}
        description={question.questionText.slice(0, 155)}
      />

      <Link
        to="/questions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8F682B] dark:text-[#D4A75E] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>সকল প্রশ্নোত্তর</span>
      </Link>

      <article className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#7C6A55] dark:text-[#B6A691]">
          <span className="font-semibold text-[#AD823E] dark:text-[#D4A75E]">
            {question.categoryName}
          </span>
          {question.authorName && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#5A4B3C] dark:text-[#D8C9B4]">
                <PenLine className="w-3.5 h-3.5 text-[#AD823E]" />
                {question.authorName}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatBengaliDate(question.answeredAt || question.createdAt)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 tabular-nums-bn">
            <Eye className="w-3.5 h-3.5" />
            {toBengaliDigits(question.viewCount || 0)} বার পঠিত
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] leading-snug">
          {question.title}
        </h1>

        {/* Question Box */}
        <div className="bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#7C6A55] dark:text-[#9E8E7A]">
            <span className="font-semibold text-[#8F682B] dark:text-[#D4A75E]">প্রশ্ন:</span>
            <span>প্রশ্নকারী: {question.askerName}</span>
          </div>
          <p className="text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0] leading-relaxed whitespace-pre-line">
            {question.questionText}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-[#F0E7D8] dark:border-[#2E251B]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBookmark}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                saved
                  ? 'bg-[#AD823E] border-[#AD823E] text-white'
                  : 'bg-[#FAF6EF] dark:bg-[#16120D] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{saved ? 'সংরক্ষিত' : 'সংরক্ষণ করুন'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm font-medium text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'লিংক কপি হয়েছে' : 'শেয়ার করুন'}</span>
            </button>
          </div>

          {bookmarkMsg && (
            <span className="text-xs font-medium text-[#AD823E] dark:text-[#D4A75E]">
              {bookmarkMsg}
            </span>
          )}
        </div>

        {/* Scholarly Answer */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif-bn font-bold text-[#8F682B] dark:text-[#D4A75E]">
            উত্তর:
          </h2>
          {question.answerText ? (
            <RichTextRenderer content={question.answerText} />
          ) : (
            <p className="text-sm text-[#6E5D4B]">উত্তর প্রক্রিয়াধীন রয়েছে।</p>
          )}
        </div>

        {/* Arabic References (RTL) */}
        {question.arabicReferences && (
          <div className="bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-2">
            <h3 className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
              আরবি তথ্যসূত্র ও ইবারত:
            </h3>
            <p
              dir="rtl"
              className="font-arabic text-lg sm:text-xl text-right text-[#2D2216] dark:text-[#F4ECE0] whitespace-pre-line"
            >
              {question.arabicReferences}
            </p>
          </div>
        )}

        {/* Quran & Hadith Refs */}
        {question.quranHadithRefs && (
          <div className="bg-[#F5ECDB]/60 dark:bg-[#241C13] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[#AD823E] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] mb-1">
                কুরআন, হাদিস ও ফিকহি রেফারেন্স
              </h3>
              <p className="text-xs sm:text-sm text-[#5A4B3C] dark:text-[#CBBBA6] leading-relaxed">
                {question.quranHadithRefs}
              </p>
            </div>
          </div>
        )}

      </article>

      {/* Related Questions */}
      {relatedQuestions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            সংশ্লিষ্ট আরও প্রশ্নোত্তর
          </h2>
          <div className="space-y-3">
            {relatedQuestions.map((rq) => (
              <QuestionCard key={rq.id} question={rq} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
