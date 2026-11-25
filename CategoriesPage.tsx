import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { toBengaliDigits } from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

export function CategoriesPage() {
  const { categories, publishedMasalas, publishedArticles, publishedQuestions } = useData();
  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.order - b.order),
    [categories]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead
        title="মাসায়েল ক্যাটাগরি"
        description="বিষয়ভিত্তিক ইসলামী মাসআলা, আকিদা, ইবাদত, মুয়ামালাত ও পারিবারিক জীবনের ক্যাটাগরি সমূহ।"
      />

      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <h1 className="text-3xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          মাসায়েল ও জ্ঞান ক্যাটাগরি
        </h1>
        <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691]">
          আপনার প্রয়োজনীয় বিষয় নির্বাচন করে কুরআন ও সুন্নাহ ভিত্তিক প্রবন্ধ ও প্রশ্নোত্তর পড়ুন
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeCategories.map((cat) => {
          const mCount = publishedMasalas.filter((m) => m.categoryId === cat.id).length;
          const qCount = publishedQuestions.filter((q) => q.categoryId === cat.id).length;
          const aCount = publishedArticles.filter((a) => a.categoryId === cat.id).length;
          return (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 hover:border-[#AD823E]/60 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E]">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9E8E7A] group-hover:text-[#AD823E] group-hover:translate-x-0.5 transition-all" />
                </div>
                <h2 className="text-lg font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] group-hover:text-[#AD823E]">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691] line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#F0E7D8] dark:border-[#2E251B] flex flex-wrap items-center gap-2.5 text-xs text-[#7C6A55] dark:text-[#9E8E7A] tabular-nums-bn">
                <span>মাসআলা: {toBengaliDigits(mCount)}</span>
                <span aria-hidden="true">·</span>
                <span>প্রশ্ন: {toBengaliDigits(qCount)}</span>
                <span aria-hidden="true">·</span>
                <span>প্রবন্ধ: {toBengaliDigits(aCount)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
