import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { QuestionCard } from '../components/QuestionCard';
import { normalizeSearchText, toBengaliDigits } from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

export function QuestionsPage() {
  const { publishedQuestions, categories } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive && (c.type === 'both' || c.type === 'question')),
    [categories]
  );

  const filteredQuestions = useMemo(() => {
    const q = normalizeSearchText(searchTerm);
    const list = publishedQuestions.filter((item) => {
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) return false;
      if (!q) return true;
      return normalizeSearchText(
        `${item.title} ${item.questionText} ${item.answerText || ''} ${item.arabicReferences || ''} ${item.categoryName}`
      ).includes(q);
    });

    if (sortBy === 'popular') {
      return [...list].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    return list;
  }, [publishedQuestions, selectedCategoryId, searchTerm, sortBy]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead
        title="প্রশ্নোত্তর — দ্বীনি মাসায়েল"
        description="কুরআন ও সুন্নাহর আলোকে দৈনন্দিন জীবনের প্রয়োজনীয় ইসলামী মাসআলা ও প্রশ্নোত্তর।"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            ইসলামী প্রশ্নোত্তর
          </h1>
          <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691] mt-1">
            মোট {toBengaliDigits(filteredQuestions.length)}টি প্রকাশিত মাসআলা
          </p>
        </div>
        <Link
          to="/ask"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold transition-colors shadow-xs whitespace-nowrap shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
          <span>প্রশ্ন জিজ্ঞাসা করুন</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9E8E7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="প্রশ্ন বা মাসআলার বিষয় খুঁজুন..."
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
      </div>

      {/* Question List */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-medium text-[#2D2216] dark:text-[#F4ECE0]">
            কোনো প্রশ্ন পাওয়া যায়নি
          </p>
          <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            অনুসন্ধান শব্দ পরিবর্তন করে দেখুন অথবা নতুন প্রশ্ন জমা দিন।
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredQuestions.map((q) => (
            <QuestionCard key={q.id} question={q} showPreview />
          ))}
        </div>
      )}
    </div>
  );
}
