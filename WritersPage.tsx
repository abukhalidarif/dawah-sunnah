import { Link } from 'react-router-dom';
import { Award, BookOpen, UserCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { toBengaliDigits } from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

export function WritersPage() {
  const { authors, publishedArticles, publishedQuestions } = useData();
  const activeAuthors = authors.filter((a) => a.isActive);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead
        title="লেখক ও মুফতিবৃন্দ"
        description="দাওয়াহ ও সুন্নাহ প্ল্যাটফর্মের সম্মানিত আলেম, মুফতি ও ইসলামী গবেষকদের পরিচিতি।"
      />

      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <h1 className="text-3xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          লেখক ও মুফতিবৃন্দ
        </h1>
        <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691]">
          কুরআন ও সুন্নাহর আলোকে গবেষণা ও মাসআলা প্রদানে নিয়োজিত সম্মানিত আলেমে দ্বীনগণ
        </p>
      </div>

      {activeAuthors.length === 0 ? (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center space-y-2">
          <p className="text-base font-medium text-[#2D2216] dark:text-[#F4ECE0]">
            এখনো কোনো লেখক বা মুফতির প্রোফাইল যুক্ত করা হয়নি
          </p>
          <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            অ্যাডমিন প্যানেল থেকে নতুন লেখক যুক্ত করলে এখানে প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeAuthors.map((author) => {
            const artCount = publishedArticles.filter((a) => a.authorId === author.id).length;
            const qCount = publishedQuestions.filter((q) => q.authorId === author.id).length;
            const totalPub = Math.max(author.totalPublications || 0, artCount + qCount);
            const customPhoto =
              author.photoURL && !author.photoURL.includes('/src/assets/images/')
                ? author.photoURL
                : '';

            return (
              <Link
                key={author.id}
                to={`/writers/${author.id}`}
                className="group bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-xs hover:shadow-md hover:border-[#AD823E]/50 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {customPhoto ? (
                      <img
                        src={customPhoto}
                        alt={author.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-2xl object-cover border border-[#E8DFCE] dark:border-[#2E251B] shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E] shrink-0">
                        <UserCheck className="w-8 h-8" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] group-hover:text-[#AD823E] transition-colors">
                        {author.name}
                      </h2>
                      {author.title && (
                        <p className="text-xs sm:text-sm font-medium text-[#AD823E] dark:text-[#D4A75E] mt-0.5">
                          {author.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-[#6E5D4B] dark:text-[#B6A691]">
                    <Award className="w-4 h-4 text-[#AD823E] shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{author.qualifications}</p>
                  </div>

                  <p className="text-sm text-[#5A4B3C] dark:text-[#CBBBA6] leading-relaxed line-clamp-3">
                    {author.bio}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#F0E7D8] dark:border-[#2E251B] flex items-center justify-between text-xs text-[#6E5D4B] dark:text-[#B6A691]">
                  <span className="inline-flex items-center gap-1.5 tabular-nums-bn">
                    <BookOpen className="w-3.5 h-3.5 text-[#AD823E]" />
                    মোট প্রকাশনা: {toBengaliDigits(totalPub)}টি
                  </span>
                  <span className="font-semibold text-[#AD823E] dark:text-[#D4A75E] group-hover:underline">
                    প্রোফাইল দেখুন
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
