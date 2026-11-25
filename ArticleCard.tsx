import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Eye, PenLine } from 'lucide-react';
import { Article } from '../types';
import { formatBengaliDate, toBengaliDigits } from '../lib/bengaliUtils';

export function ArticleCard({ article }: { article: Article }) {
  const [imgError, setImgError] = useState(false);

  // Exclude any legacy AI-generated local asset paths
  const customImage =
    article.coverImage && !article.coverImage.includes('/src/assets/images/')
      ? article.coverImage
      : '';

  return (
    <article className="group bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#AD823E]/50 transition-all duration-200 flex flex-col">
      <Link to={`/articles/${article.slug}`} className="block relative overflow-hidden">
        {customImage && !imgError ? (
          <div className="aspect-[16/10] bg-[#F5ECDB] dark:bg-[#241C13] overflow-hidden">
            <img
              src={customImage}
              alt={article.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="relative h-36 bg-gradient-to-br from-[#F5ECDB] via-[#EFE1C6] to-[#E7D1A9] dark:from-[#2B2114] dark:via-[#231A10] dark:to-[#1B140C] p-5 flex flex-col justify-between overflow-hidden border-b border-[#E8DFCE] dark:border-[#2E251B]">
            <svg
              className="pointer-events-none absolute right-[-16px] bottom-[-16px] w-32 h-32 opacity-20"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M50 5L62 38L95 50L62 62L50 95L38 62L5 50L38 38Z"
                stroke="#AD823E"
                strokeWidth="2"
              />
              <circle cx="50" cy="50" r="22" stroke="#8F682B" strokeWidth="1.5" />
            </svg>

            <div className="relative flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-[#1C1711]/80 text-[11px] font-semibold text-[#8F682B] dark:text-[#D4A75E]">
                {article.categoryName}
              </span>
              <span className="w-8 h-8 rounded-lg bg-white/75 dark:bg-[#1C1711]/75 flex items-center justify-center text-[#AD823E]">
                <BookOpen className="w-4 h-4" />
              </span>
            </div>

            {article.arabicQuote ? (
              <p
                dir="rtl"
                className="relative font-arabic text-base text-[#5A4B3C] dark:text-[#E2B96F] line-clamp-1 text-right"
              >
                {article.arabicQuote}
              </p>
            ) : (
              <p className="relative text-xs font-medium text-[#7C6A55] dark:text-[#B6A691]">
                কুরআন ও সুন্নাহ ভিত্তিক প্রবন্ধ
              </p>
            )}
          </div>
        )}
      </Link>

      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#8F682B] dark:text-[#D4A75E] font-medium">
            <span>{article.categoryName}</span>
            <span aria-hidden="true" className="text-[#9E8E7A]">·</span>
            <span className="text-[#7C6A55] dark:text-[#9E8E7A] font-normal">
              {formatBengaliDate(article.publishedAt || article.createdAt)}
            </span>
            <span aria-hidden="true" className="text-[#9E8E7A]">·</span>
            <span className="text-[#7C6A55] dark:text-[#9E8E7A] font-normal tabular-nums-bn">
              {toBengaliDigits(article.readingTimeMinutes)} মিনিট পাঠ
            </span>
          </div>

          <Link to={`/articles/${article.slug}`} className="block">
            <h3 className="text-lg sm:text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] group-hover:text-[#AD823E] dark:group-hover:text-[#D4A75E] transition-colors leading-snug line-clamp-2">
              {article.title}
            </h3>
          </Link>

          <p className="text-sm text-[#5A4B3C] dark:text-[#B6A691] leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        </div>

        <div className="pt-4 border-t border-[#F0E7D8] dark:border-[#2E251B] flex items-center justify-between gap-3 text-xs text-[#6E5D4B] dark:text-[#B6A691]">
          <span className="inline-flex items-center gap-1.5 truncate">
            <PenLine className="w-3.5 h-3.5 text-[#AD823E] shrink-0" />
            <span className="truncate">{article.authorName}</span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1 tabular-nums-bn">
              <Eye className="w-3.5 h-3.5" />
              {toBengaliDigits(article.viewCount || 0)}
            </span>
            <Link
              to={`/articles/${article.slug}`}
              className="inline-flex items-center gap-0.5 font-semibold text-[#AD823E] dark:text-[#D4A75E] hover:underline"
            >
              <span>পড়ুন</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
