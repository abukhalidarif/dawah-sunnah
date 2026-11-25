import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, HelpCircle, Layers, Scale } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { QuestionCard } from '../components/QuestionCard';
import { ArticleCard } from '../components/ArticleCard';
import { MasalaCard } from '../components/MasalaCard';
import { QuickAccessIcon } from '../components/QuickAccessIcons';
import { MUSLIM_BANGLA_TOPICS } from '../data/islamicTopicsData';
import { toBengaliDigits } from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

type CategoryTab = 'masala' | 'questions' | 'articles' | 'all';

export function CategoryDetailPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, publishedMasalas, publishedQuestions, publishedArticles } = useData();

  const category = useMemo(
    () => categories.find((c) => c.slug === slug || c.id === slug),
    [categories, slug]
  );

  const catMasalas = useMemo(
    () => (category ? publishedMasalas.filter((m) => m.categoryId === category.id) : []),
    [publishedMasalas, category]
  );

  const catQuestions = useMemo(
    () => (category ? publishedQuestions.filter((q) => q.categoryId === category.id) : []),
    [publishedQuestions, category]
  );

  const catArticles = useMemo(
    () => (category ? publishedArticles.filter((a) => a.categoryId === category.id) : []),
    [publishedArticles, category]
  );

  const requestedTab = searchParams.get('tab') as CategoryTab | null;
  const defaultTab: CategoryTab =
    requestedTab && ['masala', 'questions', 'articles', 'all'].includes(requestedTab)
      ? requestedTab
      : catMasalas.length > 0
      ? 'masala'
      : 'all';

  const [tab, setTab] = useState<CategoryTab>(defaultTab);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string>('all');

  useEffect(() => {
    const nextTab: CategoryTab =
      requestedTab && ['masala', 'questions', 'articles', 'all'].includes(requestedTab)
        ? requestedTab
        : catMasalas.length > 0
        ? 'masala'
        : 'all';
    setTab(nextTab);
    setSelectedSubTopic('all');
  }, [slug, requestedTab, catMasalas.length]);

  const subTopics = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const m of catMasalas) {
      if (m.subTopic && !seen.has(m.subTopic)) {
        seen.add(m.subTopic);
        list.push(m.subTopic);
      }
    }
    return list;
  }, [catMasalas]);

  const filteredMasalas = useMemo(() => {
    if (selectedSubTopic === 'all') return catMasalas;
    return catMasalas.filter((m) => m.subTopic === selectedSubTopic);
  }, [catMasalas, selectedSubTopic]);

  const selectTab = (next: CategoryTab) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  if (!category) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          ক্যাটাগরি পাওয়া যায়নি
        </h1>
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD823E] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> সব ক্যাটাগরিতে ফিরে যান
        </Link>
      </div>
    );
  }

  const totalCount = catMasalas.length + catQuestions.length + catArticles.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
      <SeoHead title={category.name} description={category.description || category.name} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8F682B] dark:text-[#D4A75E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল ক্যাটাগরি</span>
        </Link>

        <Link
          to="/masail"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#AD823E] dark:text-[#E2B96F] hover:underline"
        >
          <Scale className="w-4 h-4" />
          <span>বিষয়ভিত্তিক মাসআলা হাব</span>
        </Link>
      </div>

      {/* Muslim Bangla Style Quick Topic Switcher Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {MUSLIM_BANGLA_TOPICS.map((topic) => {
          const isCurrent = category.id === topic.categoryId || category.slug === topic.slug;
          return (
            <Link
              key={topic.categoryId}
              to={`/categories/${topic.slug}`}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
                isCurrent
                  ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-xs'
                  : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]/60'
              }`}
            >
              <span className="scale-[0.55] -mx-2 -my-3 pointer-events-none">
                <QuickAccessIcon icon={topic.icon} />
              </span>
              <span>{topic.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Category Header + 3 Pillars Tabs (মাসআলা · জিজ্ঞাসা · প্রবন্ধ · সব) */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691] max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
          <Link
            to="/ask"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#14100C] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-semibold text-[#8F682B] dark:text-[#E2B96F] whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
            <span>এই বিষয়ে প্রশ্ন করুন</span>
          </Link>
        </div>

        {/* Segmented Tabs */}
        <div className="grid grid-cols-2 sm:inline-flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => selectTab('masala')}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              tab === 'masala'
                ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-2xs'
                : 'bg-[#FAF6EF] dark:bg-[#120F0B] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
            }`}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span>মাসআলা ({toBengaliDigits(catMasalas.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('questions')}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              tab === 'questions'
                ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-2xs'
                : 'bg-[#FAF6EF] dark:bg-[#120F0B] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>জিজ্ঞাসা ({toBengaliDigits(catQuestions.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('articles')}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              tab === 'articles'
                ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-2xs'
                : 'bg-[#FAF6EF] dark:bg-[#120F0B] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>প্রবন্ধ ({toBengaliDigits(catArticles.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('all')}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              tab === 'all'
                ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-2xs'
                : 'bg-[#FAF6EF] dark:bg-[#120F0B] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>সব ({toBengaliDigits(totalCount)})</span>
          </button>
        </div>
      </div>

      {/* Sub-topic Filter Chips inside Mas'ala view */}
      {(tab === 'masala' || tab === 'all') && subTopics.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedSubTopic('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              selectedSubTopic === 'all'
                ? 'bg-[#2D2216] dark:bg-[#E2B96F] text-white dark:text-[#16120D] border-transparent'
                : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B] dark:text-[#B6A691]'
            }`}
          >
            সকল অধ্যায় ({toBengaliDigits(catMasalas.length)})
          </button>
          {subTopics.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubTopic(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                selectedSubTopic === sub
                  ? 'bg-[#2D2216] dark:bg-[#E2B96F] text-white dark:text-[#16120D] border-transparent'
                  : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B] dark:text-[#B6A691]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Tab Contents */}
      {totalCount === 0 ? (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-medium text-[#2D2216] dark:text-[#F4ECE0]">
            এই ক্যাটাগরিতে এখনো কোনো বিষয় প্রকাশিত হয়নি
          </p>
          <Link
            to="/ask"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#AD823E] text-white text-sm font-medium"
          >
            এই বিষয়ে প্রশ্ন করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {(tab === 'masala' || tab === 'all') && (
            <section className="space-y-4">
              {tab === 'all' && catMasalas.length > 0 && (
                <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#AD823E]" />
                  <span>মাসআলা-মাসায়েল</span>
                </h2>
              )}
              {filteredMasalas.length === 0 && tab === 'masala' ? (
                <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center space-y-2">
                  <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                    এই ক্যাটাগরিতে এখনো কোনো মাসআলা যুক্ত করা হয়নি।
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMasalas.map((m, idx) => (
                    <MasalaCard
                      key={m.id}
                      masala={m}
                      defaultExpanded={tab === 'masala' && idx === 0}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {(tab === 'questions' || tab === 'all') && (
            <section className="space-y-4">
              {tab === 'all' && catQuestions.length > 0 && (
                <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#AD823E]" />
                  <span>জিজ্ঞাসা ও প্রশ্নোত্তর</span>
                </h2>
              )}
              {catQuestions.length === 0 && tab === 'questions' ? (
                <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center space-y-3">
                  <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                    এই বিষয়ে এখনো কোনো জিজ্ঞাসা প্রকাশিত হয়নি। আপনি চাইলে প্রশ্ন জিজ্ঞাসা করতে পারেন।
                  </p>
                  <Link
                    to="/ask"
                    className="inline-block px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold"
                  >
                    নতুন প্রশ্ন করুন
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {catQuestions.map((q) => (
                    <QuestionCard key={q.id} question={q} showPreview />
                  ))}
                </div>
              )}
            </section>
          )}

          {(tab === 'articles' || tab === 'all') && (
            <section className="space-y-4">
              {tab === 'all' && catArticles.length > 0 && (
                <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#AD823E]" />
                  <span>প্রবন্ধসমূহ</span>
                </h2>
              )}
              {catArticles.length === 0 && tab === 'articles' ? (
                <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center">
                  <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                    এই ক্যাটাগরিতে এখনো কোনো প্রবন্ধ প্রকাশিত হয়নি।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
