import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Ban,
  BookOpen,
  Calendar,
  ChevronRight,
  Heart,
  HelpCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import {
  HIJRI_OFFSET_EVENT,
  formatBengaliDate,
  getHijriDateBn,
  getHijriOffsetDays,
  toBengaliDigits,
} from '../lib/bengaliUtils';
import { QuickAccessIcon } from '../components/QuickAccessIcons';
import { PrayerTimesWidget } from '../components/PrayerTimesWidget';
import { QuestionCard } from '../components/QuestionCard';
import { ArticleCard } from '../components/ArticleCard';
import { DuaCard } from '../components/DuaCard';
import { SeoHead } from '../components/SeoHead';
import { DUA_OCCASIONS, DuaOccasionId } from '../data/duasData';

export function HomePage() {
  const {
    siteSettings,
    donationSettings,
    categories,
    publishedMasalas,
    publishedQuestions,
    publishedArticles,
    duas,
  } = useData();

  const [heroSearch, setHeroSearch] = useState('');
  const [duaOccasion, setDuaOccasion] = useState<'all' | DuaOccasionId>('all');
  const [hijriOffset, setHijriOffset] = useState<number>(() => getHijriOffsetDays());
  const navigate = useNavigate();

  useEffect(() => {
    const onOffsetChange = () => setHijriOffset(getHijriOffsetDays());
    window.addEventListener(HIJRI_OFFSET_EVENT, onOffsetChange);
    return () => window.removeEventListener(HIJRI_OFFSET_EVENT, onOffsetChange);
  }, []);

  const hijri = useMemo(() => getHijriDateBn(new Date(), hijriOffset), [hijriOffset]);
  const gregorianBn = useMemo(() => formatBengaliDate(new Date()), []);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive).sort((a, b) => a.order - b.order),
    [categories]
  );

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of publishedMasalas) {
      map[m.categoryId] = (map[m.categoryId] || 0) + 1;
    }
    for (const q of publishedQuestions) {
      map[q.categoryId] = (map[q.categoryId] || 0) + 1;
    }
    for (const a of publishedArticles) {
      map[a.categoryId] = (map[a.categoryId] || 0) + 1;
    }
    return map;
  }, [publishedMasalas, publishedQuestions, publishedArticles]);

  const recentQuestions = useMemo(() => publishedQuestions.slice(0, 6), [publishedQuestions]);
  const featuredArticles = useMemo(() => {
    const featured = publishedArticles.filter((a) => a.isFeatured);
    return (featured.length > 0 ? featured : publishedArticles).slice(0, 3);
  }, [publishedArticles]);

  const homeDuas = useMemo(() => {
    if (duaOccasion === 'all') {
      const featured = duas.filter((d) => d.featured);
      return (featured.length > 0 ? featured : duas).slice(0, 4);
    }
    return duas.filter((d) => d.occasion === duaOccasion).slice(0, 4);
  }, [duas, duaOccasion]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
  };

  return (
    <div>
      <SeoHead />

      {/* 1. Hero Section & Islamic Quick Access Cards */}
      <section className="relative overflow-hidden islamic-lattice-bg pt-10 pb-14 lg:pt-16 lg:pb-20">
        {/* Subtle Islamic 8-point star SVG background decoration */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.045] dark:opacity-[0.05]" aria-hidden="true">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="islamic-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path
                  d="M40 0L49.5 30.5L80 40L49.5 49.5L40 80L30.5 49.5L0 40L30.5 30.5Z"
                  fill="none"
                  stroke="#AD823E"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-grid)" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-brand-bn font-normal leading-[1.35] py-1 text-[#9C712E] dark:text-[#DFB267] mb-3">
            {siteSettings.heroTitle || 'দাওয়াহ ও সুন্নাহ'}
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-[#5A4B3C] dark:text-[#CBBBA6] mb-7">
            {siteSettings.heroSubtitle ||
              'কুরআন ও সুন্নাহর আলোকে ইসলামী জ্ঞান অর্জনের নির্ভরযোগ্য মাধ্যম।'}
          </p>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-2xl mx-auto mb-5 bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-1.5 flex items-center gap-2 shadow-md shadow-[#AD823E]/10 focus-within:border-[#AD823E]"
          >
            <button
              type="submit"
              aria-label="খুঁজুন"
              className="w-11 h-11 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder={siteSettings.searchPlaceholder || 'মাসআলা খুঁজুন...'}
              className="w-full bg-transparent px-2 py-2 text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0] placeholder:text-[#9E8E7A] focus:outline-none"
            />
          </form>

          {/* Dual Hijri & Gregorian Date Display + Link to Full Calendar */}
          <div className="mb-10 flex flex-col items-center gap-2.5">
            <Link
              to="/calendar"
              title="পূর্ণাঙ্গ আরবি ও ইংরেজি ক্যালেন্ডার দেখুন"
              className="group inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 rounded-2xl bg-white/95 dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs sm:text-sm font-medium text-[#8F682B] dark:text-[#D4A75E] shadow-2xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#AD823E] shrink-0" />
              <span>{hijri.formatted}</span>
              <span aria-hidden="true" className="text-[#C8B490] dark:text-[#5B4B39]">·</span>
              <span>{gregorianBn}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#AD823E] opacity-75 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Islamic Quick Access Cards */}
          {siteSettings.showQuickAccessSection && (() => {
            const quickCards = siteSettings.quickAccessCards || [];
            const useThreeCol = quickCards.length === 6 || quickCards.length === 9;
            const isOddMobile = quickCards.length % 2 === 1;
            const getQuickCardLink = (card: { categorySlug: string; icon: string }) => {
              if (card.icon === 'dua' || card.categorySlug === 'dua' || card.categorySlug === '/dua') {
                return '/dua';
              }
              if (card.categorySlug.startsWith('/')) {
                return card.categorySlug;
              }
              return `/categories/${card.categorySlug}`;
            };

            return (
              <div className="space-y-5">
                <div
                  className={`grid grid-cols-2 ${
                    useThreeCol ? 'sm:grid-cols-3' : 'sm:grid-cols-4'
                  } gap-3.5 sm:gap-4 max-w-4xl mx-auto`}
                >
                  {quickCards.map((card, idx) => (
                    <Link
                      key={card.id}
                      to={getQuickCardLink(card)}
                      className={`group bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 shadow-xs hover:shadow-md hover:border-[#AD823E]/60 hover:-translate-y-0.5 transition-all duration-200 ${
                        isOddMobile && idx === quickCards.length - 1 ? 'col-span-2 sm:col-span-1' : ''
                      }`}
                    >
                      <QuickAccessIcon icon={card.icon} />
                      <span className="text-sm sm:text-base font-semibold text-[#8F682B] dark:text-[#DFB267] group-hover:text-[#AD823E]">
                        {card.title}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Link
                    to="/masail"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs sm:text-sm font-semibold text-[#8F682B] dark:text-[#E2B96F] shadow-2xs transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-[#AD823E]" />
                    <span>সকল বিষয়ের মাসআলা, জিজ্ঞাসা ও প্রবন্ধ একসাথে দেখুন</span>
                    <ChevronRight className="w-4 h-4 text-[#AD823E]" />
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 2. Prayer Times Section */}
      {siteSettings.showPrayerSection && <PrayerTimesWidget />}

      {/* 3. প্রশ্নোত্তর Section */}
      {siteSettings.showQuestionsSection && (
        <section className="py-14 lg:py-20 bg-white dark:bg-[#16120D] border-y border-[#F0E7D8] dark:border-[#2E251B]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2.5 mb-9">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
                <HelpCircle className="w-4 h-4" />
                <span>প্রশ্ন-উত্তর</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                দ্বীনি মাসায়েলের সমাধান জানুন
              </h2>
              <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691]">
                ইসলামী শরীয়ত অনুযায়ী সঠিক দ্বীনি উত্তর পান
              </p>
            </div>

            {recentQuestions.length === 0 ? (
              <div className="bg-[#FAF6EF] dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center mb-7">
                <p className="text-sm sm:text-base font-medium text-[#5A4B3C] dark:text-[#CBBBA6]">
                  এখনো কোনো প্রশ্নোত্তর প্রকাশিত হয়নি। আপনি নতুন প্রশ্ন জমা দিতে পারেন।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-7">
                {recentQuestions.map((question) => (
                  <QuestionCard key={question.id} question={question} showPreview />
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/questions"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#FAF6EF] dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-sm font-semibold text-[#8F682B] dark:text-[#D4A75E] transition-colors"
              >
                <span>সবগুলো প্রশ্ন দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/ask"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <HelpCircle className="w-4 h-4" />
                <span>নতুন প্রশ্ন করুন</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4. দ্বীনি জ্ঞানের ভান্ডার (Featured Islamic Articles) */}
      {siteSettings.showArticlesSection && (
        <section className="py-14 lg:py-20 bg-[#FAF6EF] dark:bg-[#120F0B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
                  <BookOpen className="w-4 h-4" />
                  <span>প্রবন্ধ ও গবেষণা</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                  দ্বীনি জ্ঞানের ভান্ডার
                </h2>
                <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691]">
                  ইসলামী শরীয়ত সম্পর্কে আরও জানুন
                </p>
              </div>
              <Link
                to="/articles"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#AD823E] dark:text-[#D4A75E] hover:underline whitespace-nowrap shrink-0"
              >
                <span>সকল প্রবন্ধ দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {featuredArticles.length === 0 ? (
              <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center">
                <p className="text-sm sm:text-base font-medium text-[#5A4B3C] dark:text-[#CBBBA6]">
                  এখনো কোনো প্রবন্ধ প্রকাশিত হয়নি। শীঘ্রই নতুন প্রবন্ধ যুক্ত করা হবে।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4.5 দুআ ও যিকির (Dua & Dhikr Section) */}
      {Boolean(siteSettings.showDuaSection) && (
        <section className="py-14 lg:py-20 bg-white dark:bg-[#16120D] border-t border-[#F0E7D8] dark:border-[#2E251B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
                  <Sparkles className="w-4 h-4" />
                  <span>কুরআন ও সুন্নাহর প্রতিদিনের আমল</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                  দুআ ও যিকির
                </h2>
                <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691]">
                  উপলক্ষ অনুযায়ী প্রতিদিনের বিশুদ্ধ মাসনূন দুআ, উচ্চারণ, অর্থ ও তাসবিহ
                </p>
              </div>
              <Link
                to="/dua"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#AD823E] dark:text-[#D4A75E] hover:underline whitespace-nowrap shrink-0"
              >
                <span>সকল দুআ ও যিকির দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-7">
              <button
                type="button"
                onClick={() => setDuaOccasion('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                  duaOccasion === 'all'
                    ? 'bg-[#AD823E] text-white border-[#AD823E]'
                    : 'bg-[#FAF6EF] dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
                }`}
              >
                সকল উপলক্ষ
              </button>
              {DUA_OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setDuaOccasion(occ.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                    duaOccasion === occ.id
                      ? 'bg-[#AD823E] text-white border-[#AD823E]'
                      : 'bg-[#FAF6EF] dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
                  }`}
                >
                  {occ.label}
                </button>
              ))}
            </div>

            {homeDuas.length === 0 ? (
              <div className="bg-[#FAF6EF] dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center mb-8">
                <p className="text-sm sm:text-base font-medium text-[#5A4B3C] dark:text-[#CBBBA6]">
                  এই উপলক্ষ্যে এখনো কোনো দুআ ও যিকির যুক্ত করা হয়নি।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                {homeDuas.map((dua) => (
                  <DuaCard key={dua.id} dua={dua} />
                ))}
              </div>
            )}

            <div className="text-center">
              <Link
                to="/dua"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#FAF6EF] dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-sm font-semibold text-[#8F682B] dark:text-[#D4A75E] transition-colors"
              >
                <span>সব দুআ ও ডিজিটাল তাসবিহ দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5. ক্যাটাগরি Section (মাসায়েল ক্যাটাগরি) */}
      {siteSettings.showCategoriesSection && (
        <section className="py-14 lg:py-20 bg-white dark:bg-[#16120D] border-t border-[#F0E7D8] dark:border-[#2E251B]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#FAF6EF]/70 dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-[#E8DFCE] dark:border-[#2E251B]">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                    মাসায়েল ক্যাটাগরি
                  </h2>
                  <div className="w-12 h-0.5 bg-[#AD823E] mt-2 rounded-full" />
                </div>
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#AD823E] dark:text-[#D4A75E] hover:underline"
                >
                  <span>সব ক্যাটাগরি</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-[#EDE4D4] dark:divide-[#2E251B]">
                {activeCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    className="group flex items-center justify-between py-3.5 border-b border-[#EDE4D4] dark:border-[#2E251B] hover:text-[#AD823E] transition-colors"
                  >
                    <span className="text-sm sm:text-base font-medium text-[#2D2216] dark:text-[#F4ECE0] group-hover:text-[#AD823E] dark:group-hover:text-[#D4A75E] truncate pr-3">
                      {cat.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#F5ECDB] dark:bg-[#2B2114] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] tabular-nums-bn shrink-0">
                      {toBengaliDigits(categoryCounts[cat.id] || 0)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. সহযোগিতা করুন (Support Section) */}
      {siteSettings.showSupportSection && (
        <section className="py-14 lg:py-20 bg-gradient-to-b from-[#F5ECDB]/60 to-[#FAF6EF] dark:from-[#19140E] dark:to-[#120F0B]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
              <Heart className="w-4 h-4 fill-[#AD823E] text-[#AD823E]" />
              <span>{donationSettings.badgeText || 'সহযোগিতা করুন'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] max-w-2xl mx-auto leading-snug">
              {donationSettings.missionTitle}
            </h2>

            <p className="text-sm sm:text-base text-[#5A4B3C] dark:text-[#B6A691] max-w-2xl mx-auto leading-relaxed">
              {donationSettings.missionDescription}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                to="/support"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2D2216] dark:bg-[#AD823E] hover:bg-[#1B140C] dark:hover:bg-[#956D30] text-white text-sm font-semibold transition-colors shadow-sm"
              >
                সাপোর্ট করুন
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-[#2D2216] dark:text-[#F4ECE0] text-sm font-semibold transition-colors"
              >
                আরও জানুন
              </Link>
            </div>

            <div className="pt-8 border-t border-[#E8DFCE] dark:border-[#2E251B] grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-11 h-11 mx-auto rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#AD823E]">
                  <Ban className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#2D2216] dark:text-[#F4ECE0]">বিজ্ঞাপনমুক্ত</h3>
                <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">কোনো বাণিজ্যিক উদ্দেশ্য নেই</p>
              </div>
              <div className="space-y-2">
                <div className="w-11 h-11 mx-auto rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#AD823E]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#2D2216] dark:text-[#F4ECE0]">সঠিক ও বিশুদ্ধ জ্ঞান</h3>
                <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">কুরআন ও সুন্নাহর নির্ভরযোগ্য দলিল</p>
              </div>
              <div className="space-y-2">
                <div className="w-11 h-11 mx-auto rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#AD823E]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#2D2216] dark:text-[#F4ECE0]">সদকায়ে জারিয়াহ</h3>
                <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">চিরস্থায়ী সওয়াব ও কল্যাণের মাধ্যম</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
