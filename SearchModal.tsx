import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Folder, HelpCircle, Scale, Search, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { normalizeSearchText } from '../lib/bengaliUtils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { publishedMasalas, publishedQuestions, publishedArticles, categories } = useData();
  const [queryText, setQueryText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = normalizeSearchText(queryText);
    if (!q) return { masalas: [], questions: [], articles: [], categories: [] };

    return {
      masalas: publishedMasalas
        .filter((item) =>
          normalizeSearchText(
            `${item.title} ${item.subTopic} ${item.authorName || ''} ${item.summary} ${item.content} ${item.arabicReference || ''} ${item.quranHadithRefs || ''} ${item.categoryName}`
          ).includes(q)
        )
        .slice(0, 4),
      questions: publishedQuestions
        .filter((item) =>
          normalizeSearchText(
            `${item.title} ${item.questionText} ${item.answerText || ''} ${item.arabicReferences || ''} ${item.categoryName}`
          ).includes(q)
        )
        .slice(0, 4),
      articles: publishedArticles
        .filter((item) =>
          normalizeSearchText(
            `${item.title} ${item.excerpt} ${item.content} ${item.arabicQuote || ''} ${item.categoryName}`
          ).includes(q)
        )
        .slice(0, 4),
      categories: categories
        .filter((c) => c.isActive && normalizeSearchText(`${c.name} ${c.description || ''}`).includes(q))
        .slice(0, 4),
    };
  }, [queryText, publishedMasalas, publishedQuestions, publishedArticles, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    navigate(`/search?q=${encodeURIComponent(queryText.trim())}`);
  };

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E8DFCE] dark:border-[#2E251B]">
          <Search className="w-5 h-5 text-[#AD823E] shrink-0" />
          <input
            type="text"
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="মাসআলা, প্রবন্ধ বা আরবি রেফারেন্স খুঁজুন..."
            className="w-full bg-transparent text-base text-[#2D2216] dark:text-[#F4ECE0] placeholder:text-[#9E8E7A] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-8 h-8 rounded-lg hover:bg-[#FAF6EF] dark:hover:bg-[#2B2114] flex items-center justify-center text-[#6E5D4B]"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {!queryText.trim() ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                বাংলা বা আরবি ভাষায় যেকোনো বিষয় লিখে অনুসন্ধান করুন
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['নামাজ', 'যাকাত', 'বিবাহ', 'সুদ', 'তালাক'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQueryText(term)}
                    className="px-3 py-1 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] text-xs font-medium text-[#8F682B] dark:text-[#D4A75E] hover:bg-[#F5ECDB]"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {results.masalas.length === 0 &&
              results.questions.length === 0 &&
              results.articles.length === 0 &&
              results.categories.length === 0 ? (
                <p className="text-center py-6 text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                  “{queryText}” সম্পর্কিত কোনো ফলাফল পাওয়া যায়নি।
                </p>
              ) : (
                <div className="space-y-4">
                  {results.masalas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] mb-2 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5" /> মাসআলা
                      </p>
                      <div className="space-y-1.5">
                        {results.masalas.map((item) => {
                          const cat = categories.find((c) => c.id === item.categoryId);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                go(`/categories/${cat?.slug || 'namaz-salat'}?tab=masala`)
                              }
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6EF] dark:hover:bg-[#261E15] text-sm text-[#2D2216] dark:text-[#F4ECE0] flex items-center justify-between gap-2"
                            >
                              <span className="truncate">
                                {item.title}{' '}
                                <span className="text-xs text-[#8F682B] dark:text-[#D4A75E]">
                                  ({item.categoryName})
                                </span>
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#AD823E] shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {results.questions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] mb-2 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" /> জিজ্ঞাসা
                      </p>
                      <div className="space-y-1.5">
                        {results.questions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => go(`/questions/${item.slug}`)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6EF] dark:hover:bg-[#261E15] text-sm text-[#2D2216] dark:text-[#F4ECE0] flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{item.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#AD823E] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.articles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> প্রবন্ধসমূহ
                      </p>
                      <div className="space-y-1.5">
                        {results.articles.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => go(`/articles/${item.slug}`)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6EF] dark:hover:bg-[#261E15] text-sm text-[#2D2216] dark:text-[#F4ECE0] flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{item.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#AD823E] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.categories.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] mb-2 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5" /> ক্যাটাগরি
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {results.categories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => go(`/categories/${c.slug}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] text-xs font-medium text-[#2D2216] dark:text-[#F4ECE0] hover:border-[#AD823E] border border-[#E8DFCE] dark:border-[#362B1F]"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs font-semibold transition-colors"
                  >
                    সব ফলাফল দেখুন ({queryText})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
