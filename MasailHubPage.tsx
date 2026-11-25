import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, HelpCircle, Scale, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { MUSLIM_BANGLA_TOPICS } from '../data/islamicTopicsData';
import { QuickAccessIcon } from '../components/QuickAccessIcons';
import { MasalaCard } from '../components/MasalaCard';
import { QuestionCard } from '../components/QuestionCard';
import { ArticleCard } from '../components/ArticleCard';
import { SeoHead } from '../components/SeoHead';
import { normalizeSearchText, toBengaliDigits } from '../lib/bengaliUtils';

type HubTab = 'masala' | 'questions' | 'articles';

export function MasailHubPage() {
  const { publishedMasalas, publishedQuestions, publishedArticles } = useData();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(MUSLIM_BANGLA_TOPICS[0].categoryId);
  const [activeTab, setActiveTab] = useState<HubTab>('masala');
  const [searchTerm, setSearchTerm] = useState('');

  const activeTopic = useMemo(
    () =>
      MUSLIM_BANGLA_TOPICS.find((t) => t.categoryId === selectedCategoryId) ||
      MUSLIM_BANGLA_TOPICS[0],
    [selectedCategoryId]
  );

  const normalizedQuery = normalizeSearchText(searchTerm);

  const topicMasalas = useMemo(() => {
    return publishedMasalas.filter((m) => {
      if (m.categoryId !== activeTopic.categoryId) return false;
      if (!normalizedQuery) return true;
      return normalizeSearchText(
        `${m.title} ${m.summary} ${m.subTopic} ${m.authorName || ''} ${m.content} ${m.arabicReference || ''}`
      ).includes(normalizedQuery);
    });
  }, [publishedMasalas, activeTopic.categoryId, normalizedQuery]);

  const topicQuestions = useMemo(() => {
    return publishedQuestions.filter((q) => {
      if (q.categoryId !== activeTopic.categoryId) return false;
      if (!normalizedQuery) return true;
      return normalizeSearchText(
        `${q.title} ${q.questionText} ${q.answerText || ''} ${q.arabicReferences || ''}`
      ).includes(normalizedQuery);
    });
  }, [publishedQuestions, activeTopic.categoryId, normalizedQuery]);

  const topicArticles = useMemo(() => {
    return publishedArticles.filter((a) => {
      if (a.categoryId !== activeTopic.categoryId) return false;
      if (!normalizedQuery) return true;
      return normalizeSearchText(
        `${a.title} ${a.excerpt} ${a.content} ${a.arabicQuote || ''}`
      ).includes(normalizedQuery);
    });
  }, [publishedArticles, activeTopic.categoryId, normalizedQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead
        title="মাসআলা, জিজ্ঞাসা ও প্রবন্ধ — বিষয়ভিত্তিক দ্বীনি গাইড"
        description="নামাজ, রোজা, হজ, যাকাত, পবিত্রতা, তালাক, কুরবানি ও বিবাহ-শাদী বিষয়ে কুরআন ও সুন্নাহ ভিত্তিক পূর্ণাঙ্গ মাসআলা, জিজ্ঞাসা ও প্রবন্ধ।"
      />

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#F5ECDB] to-[#FAF6EF] dark:from-[#241C13] dark:to-[#17120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-7 sm:p-10 text-center space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
          <Scale className="w-4 h-4 text-[#AD823E]" />
          <span>কুরআন ও সুন্নাহ ভিত্তিক বিষয়ভিত্তিক জ্ঞানকোষ</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          মাসআলা, জিজ্ঞাসা ও প্রবন্ধ
        </h1>
        <p className="text-sm sm:text-base text-[#5A4B3C] dark:text-[#CBBBA6] max-w-2xl mx-auto">
          নামাজ, রোজা, হজ, যাকাত, পবিত্রতা, তালাক ও কুরবানিসহ জীবনের প্রতিটি জরুরি অধ্যায়ের সহজ মাসআলা, প্রশ্নোত্তর ও প্রবন্ধ।
        </p>
      </div>

      {/* Topic Selector Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {MUSLIM_BANGLA_TOPICS.map((topic) => {
          const isSelected = topic.categoryId === activeTopic.categoryId;
          const mCount = publishedMasalas.filter((m) => m.categoryId === topic.categoryId).length;
          const qCount = publishedQuestions.filter((q) => q.categoryId === topic.categoryId).length;
          const aCount = publishedArticles.filter((a) => a.categoryId === topic.categoryId).length;
          const total = mCount + qCount + aCount;

          return (
            <button
              key={topic.categoryId}
              type="button"
              onClick={() => {
                setSelectedCategoryId(topic.categoryId);
                setSearchTerm('');
              }}
              className={`group rounded-2xl p-3.5 border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-md -translate-y-0.5'
                  : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#2D2216] dark:text-[#F4ECE0] hover:border-[#AD823E]/60'
              }`}
            >
              <div className={isSelected ? 'brightness-0 invert' : ''}>
                <QuickAccessIcon icon={topic.icon} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold leading-tight">{topic.label}</p>
                <p
                  className={`text-[11px] tabular-nums-bn ${
                    isSelected ? 'text-white/90' : 'text-[#8B7862] dark:text-[#9E8E7A]'
                  }`}
                >
                  {toBengaliDigits(total)}টি বিষয়
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Active Topic Toolbar & 3 Tabs */}
      <section className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0E7D8] dark:border-[#2E251B] pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              {activeTopic.label}
            </h2>
            <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
              {activeTopic.subtitle}
            </p>
          </div>
          <Link
            to={`/categories/${activeTopic.slug}`}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#AD823E] dark:text-[#E2B96F] hover:underline shrink-0"
          >
            <span>পূর্ণাঙ্গ পাতা দেখুন</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 3 Muslim Bangla Tabs: মাসআলা · জিজ্ঞাসা · প্রবন্ধ */}
          <div className="grid grid-cols-3 sm:inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('masala')}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                activeTab === 'masala'
                  ? 'bg-[#AD823E] text-white border-[#AD823E]'
                  : 'bg-[#FAF6EF] dark:bg-[#14100C] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
              }`}
            >
              <Scale className="w-4 h-4 shrink-0" />
              <span>মাসআলা ({toBengaliDigits(topicMasalas.length)})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-[#AD823E] text-white border-[#AD823E]'
                  : 'bg-[#FAF6EF] dark:bg-[#14100C] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>জিজ্ঞাসা ({toBengaliDigits(topicQuestions.length)})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('articles')}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                activeTab === 'articles'
                  ? 'bg-[#AD823E] text-white border-[#AD823E]'
                  : 'bg-[#FAF6EF] dark:bg-[#14100C] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>প্রবন্ধ ({toBengaliDigits(topicArticles.length)})</span>
            </button>
          </div>

          <div className="relative md:w-72">
            <Search className="w-4 h-4 text-[#9E8E7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`${activeTopic.label} বিষয়ে খুঁজুন...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm focus:outline-none focus:border-[#AD823E]"
            />
          </div>
        </div>
      </section>

      {/* Content Area */}
      {activeTab === 'masala' && (
        <section className="space-y-4">
          {topicMasalas.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center text-sm text-[#6E5D4B] dark:text-[#B6A691]">
              এই বিষয়ে কোনো মাসআলা পাওয়া যায়নি।
            </div>
          ) : (
            topicMasalas.map((masala, idx) => (
              <MasalaCard key={masala.id} masala={masala} defaultExpanded={idx === 0} />
            ))
          )}
        </section>
      )}

      {activeTab === 'questions' && (
        <section className="space-y-4">
          {topicQuestions.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center space-y-3">
              <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                এই বিষয়ে এখনো কোনো জিজ্ঞাসা পাওয়া যায়নি।
              </p>
              <Link
                to="/ask"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#AD823E] text-white text-xs font-semibold"
              >
                নতুন প্রশ্ন করুন
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topicQuestions.map((q) => (
                <QuestionCard key={q.id} question={q} showPreview />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'articles' && (
        <section>
          {topicArticles.length === 0 ? (
            <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center text-sm text-[#6E5D4B] dark:text-[#B6A691]">
              এই বিষয়ে এখনো কোনো প্রবন্ধ পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topicArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
