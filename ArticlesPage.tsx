import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ArticleCard } from '../components/ArticleCard';
import { normalizeSearchText, toBengaliDigits } from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

export function ArticlesPage() {
  const { publishedArticles, categories } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive && (c.type === 'both' || c.type === 'article')),
    [categories]
  );

  const filteredArticles = useMemo(() => {
    const q = normalizeSearchText(searchTerm);
    const list = publishedArticles.filter((a) => {
      if (selectedCategoryId !== 'all' && a.categoryId !== selectedCategoryId) return false;
      if (!q) return true;
      return normalizeSearchText(
        `${a.title} ${a.excerpt} ${a.content} ${a.arabicQuote || ''} ${a.authorName} ${a.categoryName}`
      ).includes(q);
    });
    if (sortBy === 'popular') {
      return [...list].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    return list;
  }, [publishedArticles, selectedCategoryId, searchTerm, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead
        title="দ্বীনি প্রবন্ধসমূহ"
        description="কুরআন, হাদিস, সিরাত ও ফিকহ বিষয়ক প্রামাণ্য ইসলামী প্রবন্ধ ও গবেষণা।"
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            দ্বীনি জ্ঞানের ভান্ডার
          </h1>
          <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691] mt-1">
            মোট {toBengaliDigits(filteredArticles.length)}টি প্রকাশিত প্রবন্ধ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9E8E7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="প্রবন্ধের শিরোনাম বা বিষয় খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
          />
        </div>

        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
        >
          <option value="all">সকল ক্যাটাগরি</option>
          {activeCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="flex items-center p-1 bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setSortBy('latest')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sortBy === 'latest'
                ? 'bg-[#AD823E] text-white'
                : 'text-[#6E5D4B] dark:text-[#B6A691]'
            }`}
          >
            সর্বশেষ
          </button>
          <button
            type="button"
            onClick={() => setSortBy('popular')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              sortBy === 'popular'
                ? 'bg-[#AD823E] text-white'
                : 'text-[#6E5D4B] dark:text-[#B6A691]'
            }`}
          >
            জনপ্রিয়
          </button>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center">
          <p className="text-base font-medium text-[#2D2216] dark:text-[#F4ECE0]">
            কোনো প্রবন্ধ পাওয়া যায়নি
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
