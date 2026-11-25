import { Link } from 'react-router-dom';
import { Eye, HelpCircle } from 'lucide-react';
import { Question } from '../types';
import { toBengaliDigits } from '../lib/bengaliUtils';

export function QuestionCard({ question, showPreview = false }: { question: Question; showPreview?: boolean }) {
  return (
    <Link
      to={`/questions/${question.slug}`}
      className="group block bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 sm:p-5 hover:border-[#AD823E]/60 hover:shadow-md transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 w-6 h-6 rounded-full bg-[#F5ECDB] dark:bg-[#2B2114] text-[#AD823E] flex items-center justify-center shrink-0">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-base sm:text-lg font-semibold text-[#2D2216] dark:text-[#F4ECE0] group-hover:text-[#AD823E] dark:group-hover:text-[#D4A75E] transition-colors leading-snug">
              {question.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7C6A55] dark:text-[#9E8E7A]">
              <span className="font-medium text-[#8F682B] dark:text-[#D4A75E]">
                {question.categoryName}
              </span>
              {question.authorName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{question.authorName}</span>
                </>
              )}
            </div>
            {showPreview && question.answerText && (
              <p className="text-sm text-[#5A4B3C] dark:text-[#B6A691] line-clamp-2 pt-1 leading-relaxed">
                {question.answerText.replace(/\n+/g, ' ')}
              </p>
            )}
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F5ECDB]/70 dark:bg-[#261E15] text-xs font-medium text-[#7C6A55] dark:text-[#CBBBA6] tabular-nums-bn shrink-0">
          <Eye className="w-3 h-3" />
          {toBengaliDigits(question.viewCount || 0)}
        </span>
      </div>
    </Link>
  );
}
