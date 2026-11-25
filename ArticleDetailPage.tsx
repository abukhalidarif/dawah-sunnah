import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Eye,
  PenLine,
  Share2,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { formatBengaliDate, toBengaliDigits } from '../lib/bengaliUtils';
import { RichTextRenderer } from '../components/RichTextRenderer';
import { ArticleCard } from '../components/ArticleCard';
import { SeoHead } from '../components/SeoHead';

export function ArticleDetailPage() {
  const { slug } = useParams();
  const {
    publishedArticles,
    isBookmarked,
    toggleBookmark,
    recordReadingHistory,
    incrementArticleView,
  } = useData();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [bookmarkMsg, setBookmarkMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const article = useMemo(
    () => publishedArticles.find((a) => a.slug === slug || a.id === slug),
    [publishedArticles, slug]
  );

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const sameCat = publishedArticles.filter(
      (a) => a.id !== article.id && a.categoryId === article.categoryId
    );
    const others = publishedArticles.filter(
      (a) => a.id !== article.id && a.categoryId !== article.categoryId
    );
    return [...sameCat, ...others].slice(0, 3);
  }, [publishedArticles, article]);

  useEffect(() => {
    if (!article) return;
    incrementArticleView(article.id);
    if (user) {
      recordReadingHistory({
        itemId: article.id,
        itemType: 'article',
        title: article.title,
        slug: article.slug,
        categoryName: article.categoryName,
      });
    }
  }, [article?.id, user?.uid]);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          প্রবন্ধটি পাওয়া যায়নি
        </h1>
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD823E] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> সব প্রবন্ধে ফিরে যান
        </Link>
      </div>
    );
  }

  const customCover =
    article.coverImage && !article.coverImage.includes('/src/assets/images/')
      ? article.coverImage
      : '';
  const saved = isBookmarked(article.id);

  const handleBookmark = async () => {
    try {
      const added = await toggleBookmark({
        itemId: article.id,
        itemType: 'article',
        title: article.title,
        slug: article.slug,
        categoryName: article.categoryName,
      });
      setBookmarkMsg(added ? 'সংরক্ষিত প্রবন্ধে যোগ হয়েছে' : 'সংরক্ষণ বাতিল করা হয়েছে');
      setTimeout(() => setBookmarkMsg(null), 2500);
    } catch (err: any) {
      setBookmarkMsg(err.message || 'সংরক্ষণ করতে লগইন করুন');
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10">
      <SeoHead title={article.title} description={article.excerpt} />

      <Link
        to="/articles"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8F682B] dark:text-[#D4A75E] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>সকল প্রবন্ধসমূহ</span>
      </Link>

      <article className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl overflow-hidden shadow-xs">
        {customCover && !imgError && (
          <div className="aspect-[16/9] max-h-[420px] w-full bg-[#F5ECDB] dark:bg-[#241C13] overflow-hidden">
            <img
              src={customCover}
              alt={article.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 sm:p-8 lg:p-12 space-y-6 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#7C6A55] dark:text-[#B6A691]">
            <span className="font-semibold text-[#AD823E] dark:text-[#D4A75E]">
              {article.categoryName}
            </span>
            {article.authorName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#5A4B3C] dark:text-[#D8C9B4]">
                  <PenLine className="w-3.5 h-3.5 text-[#AD823E]" />
                  {article.authorName}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatBengaliDate(article.publishedAt || article.createdAt)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums-bn">
              <Clock className="w-3.5 h-3.5" />
              {toBengaliDigits(article.readingTimeMinutes)} মিনিট পাঠ
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums-bn">
              <Eye className="w-3.5 h-3.5" />
              {toBengaliDigits(article.viewCount || 0)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] leading-snug">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-[#5A4B3C] dark:text-[#CBBBA6] leading-relaxed font-medium">
            {article.excerpt}
          </p>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-[#F0E7D8] dark:border-[#2E251B]">
            <div className="flex items-center gap-2.5">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm font-medium text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]"
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

          {article.arabicQuote && (
            <div className="bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-6 text-center">
              <p dir="rtl" className="font-arabic text-2xl sm:text-3xl text-[#2D2216] dark:text-[#F4ECE0]">
                {article.arabicQuote}
              </p>
            </div>
          )}

          <RichTextRenderer content={article.content} />

          {article.quranHadithRefs && (
            <div className="bg-[#F5ECDB]/60 dark:bg-[#241C13] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-[#AD823E] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] mb-1">
                  তথ্যসূত্র ও দলিল
                </h3>
                <p className="text-xs sm:text-sm text-[#5A4B3C] dark:text-[#CBBBA6] leading-relaxed">
                  {article.quranHadithRefs}
                </p>
              </div>
            </div>
          )}

        </div>
      </article>

      {relatedArticles.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            আরও পড়ুন
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((ra) => (
              <ArticleCard key={ra.id} article={ra} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
