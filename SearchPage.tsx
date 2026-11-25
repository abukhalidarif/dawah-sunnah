import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { normalizeSearchText, toBengaliDigits } from '../lib/bengaliUtils';
import { QuestionCard } from '../components/QuestionCard';
import { ArticleCard } from '../components/ArticleCard';
import { MasalaCard } from '../components/MasalaCard';
import { SeoHead } from '../components/SeoHead';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [queryText, setQueryText] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'masalas' | 'questions' | 'articles' | 'categories'>('all');

  const { publishedMasalas, publishedQuestions, publishedArticles, categories } = useData();

  useEffect(() => {
    setQueryText(searchParams.get('q') || '');
  }, [searchParams]);

  const results = useMemo(() => {
    const q = normalizeSearchText(queryText);
    if (!q) {
      return {
        masalas: publishedMasalas.slice(0, 4),
        questions: publishedQuestions.slice(0, 6),
        articles: publishedArticles.slice(0, 3),
        categories: categories.filter((c) => c.isActive).slice(0, 8),
      };
    }
    return {
      masalas: publishedMasalas.filter((item) =>
        normalizeSearchText(
          `${item.title} ${item.subTopic} ${item.authorName || ''} ${item.summary} ${item.content} ${item.arabicReference || ''} ${item.quranHadithRefs || ''} ${item.categoryName}`
        ).includes(q)
      ),
      questions: publishedQuestions.filter((item) =>
        normalizeSearchText(
          `${item.title} ${item.questionText} ${item.answerText || ''} ${item.arabicReferences || ''} ${item.quranHadithRefs || ''} ${item.categoryName}`
        ).includes(q)
      ),
      articles: publishedArticles.filter((item) =>
        normalizeSearchText(
          `${item.title} ${item.excerpt} ${item.content} ${item.arabicQuote || ''} ${item.quranHadithRefs || ''} ${item.categoryName}`
        ).includes(q)
      ),
      categories: categories.filter(
        (c) => c.isActive && normalizeSearchText(`${c.name} ${c.description || ''}`).includes(q)
      ),
    };
  }, [queryText, publishedMasalas, publishedQuestions, publishedArticles, categories]);

  const totalMatches =
    results.masalas.length +
    results.questions.length +
    results.articles.length +
    results.categories.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead
        title={queryText ? `অনুসন্ধান: ${queryText}` : 'অনুসন্ধান করুন'}
        description="বাংলা এবং আরবি টেক্সটের মাধ্যমে মাসআলা, প্রশ্নোত্তর, প্রবন্ধ এবং ক্যাটাগরি খুঁজুন।"
      />

      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-serif-bn font-bold text-center text-[#2D2216] dark:text-[#F4ECE0]">
          অনুসন্ধান করুন
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearchParams(queryText.trim() ? { q: queryText.trim() } : {});
          }}
          className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-2 flex items-center gap-2 shadow-sm"
        >
          <Search className="w-5 h-5 text-[#AD823E] ml-2 shrink-0" />
          <input
            type="text"
            value={queryText}
            onChange={(e) => {
              setQueryText(e.target.value);
              setSearchParams(e.target.value.trim() ? { q: e.target.value } : {});
            }}
            placeholder="বাংলা বা আরবিতে মাসআলা, হাদিস বা প্রবন্ধ খুঁজুন..."
            className="w-full bg-transparent px-2 py-2 text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'all', label: `সব (${toBengaliDigits(totalMatches)})` },
            { id: 'masalas', label: `মাসআলা (${toBengaliDigits(results.masalas.length)})` },
            { id: 'questions', label: `জিজ্ঞাসা (${toBengaliDigits(results.questions.length)})` },
            { id: 'articles', label: `প্রবন্ধ (${toBengaliDigits(results.articles.length)})` },
            { id: 'categories', label: `ক্যাটাগরি (${toBengaliDigits(results.categories.length)})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === t.id
                  ? 'bg-[#AD823E] text-white'
                  : 'bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B] dark:text-[#B6A691]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {totalMatches === 0 ? (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center space-y-3">
          <p className="text-base font-medium text-[#2D2216] dark:text-[#F4ECE0]">
            কোনো ফলাফল পাওয়া যায়নি
          </p>
          <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            আপনি চাইলে সরাসরি আমাদের মুফতি বোর্ডের নিকট প্রশ্ন জমা দিতে পারেন।
          </p>
          <Link
            to="/ask"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#AD823E] text-white text-sm font-medium"
          >
            প্রশ্ন করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {(activeTab === 'all' || activeTab === 'masalas') && results.masalas.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                বিষয়ভিত্তিক মাসআলা
              </h2>
              <div className="space-y-3">
                {results.masalas.map((m) => (
                  <MasalaCard key={m.id} masala={m} />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'questions') && results.questions.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                জিজ্ঞাসা ও প্রশ্নোত্তর
              </h2>
              <div className="space-y-3">
                {results.questions.map((q) => (
                  <QuestionCard key={q.id} question={q} showPreview />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'articles') && results.articles.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                দ্বীনি প্রবন্ধসমূহ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'categories') && results.categories.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                ক্যাটাগরি
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {results.categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/categories/${c.slug}`}
                    className="p-4 rounded-2xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
