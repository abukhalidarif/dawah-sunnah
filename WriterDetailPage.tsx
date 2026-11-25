import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, UserCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ArticleCard } from '../components/ArticleCard';
import { QuestionCard } from '../components/QuestionCard';
import { toBengaliDigits } from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

export function WriterDetailPage() {
  const { id } = useParams();
  const { authors, publishedArticles, publishedQuestions } = useData();

  const author = useMemo(
    () => authors.find((a) => a.id === id || a.slug === id),
    [authors, id]
  );

  const authorArticles = useMemo(
    () => (author ? publishedArticles.filter((a) => a.authorId === author.id) : []),
    [publishedArticles, author]
  );

  const authorQuestions = useMemo(
    () => (author ? publishedQuestions.filter((q) => q.authorId === author.id) : []),
    [publishedQuestions, author]
  );

  if (!author) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          লেখক প্রোফাইল পাওয়া যায়নি
        </h1>
        <Link
          to="/writers"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD823E] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> লেখকবৃন্দের তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const customPhoto =
    author.photoURL && !author.photoURL.includes('/src/assets/images/')
      ? author.photoURL
      : '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10">
      <SeoHead title={author.name} description={author.bio} />

      <Link
        to="/writers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8F682B] dark:text-[#D4A75E] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>সকল লেখকবৃন্দ</span>
      </Link>

      {/* Author Profile Header */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col md:flex-row gap-7 items-start">
        {customPhoto ? (
          <img
            src={customPhoto}
            alt={author.name}
            referrerPolicy="no-referrer"
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border border-[#E8DFCE] dark:border-[#2E251B] shrink-0"
          />
        ) : (
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E] shrink-0">
            <UserCheck className="w-12 h-12" />
          </div>
        )}

        <div className="space-y-3 flex-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              {author.name}
            </h1>
            {author.title && (
              <p className="text-sm sm:text-base font-medium text-[#AD823E] dark:text-[#D4A75E] mt-1">
                {author.title}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            <Award className="w-4 h-4 text-[#AD823E] shrink-0 mt-0.5" />
            <span>{author.qualifications}</span>
          </div>

          <p className="text-sm sm:text-base text-[#5A4B3C] dark:text-[#CBBBA6] leading-relaxed">
            {author.bio}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs sm:text-sm font-medium text-[#8F682B] dark:text-[#D4A75E] tabular-nums-bn">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              প্রকাশিত প্রবন্ধ: {toBengaliDigits(authorArticles.length)}টি
            </span>
            <span>·</span>
            <span>প্রদত্ত উত্তর: {toBengaliDigits(authorQuestions.length)}টি</span>
          </div>
        </div>
      </div>

      {/* Author's Articles */}
      {authorArticles.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            প্রকাশিত প্রবন্ধসমূহ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Author's Answered Questions */}
      {authorQuestions.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            উত্তরকৃত মাসায়েল ও প্রশ্নোত্তর
          </h2>
          <div className="space-y-3">
            {authorQuestions.map((q) => (
              <QuestionCard key={q.id} question={q} showPreview />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
