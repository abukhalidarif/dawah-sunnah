import { useState } from 'react';
import { BookOpen, Check, Copy, RotateCcw, Sparkles } from 'lucide-react';
import { DuaItem } from '../data/duasData';
import { toBengaliDigits } from '../lib/bengaliUtils';

export function DuaCard({ dua }: { dua: DuaItem }) {
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const isCompleted = count >= dua.targetCount;

  const handleCopy = async () => {
    const text = `${dua.title}\n\n${dua.arabic}\n\nউচ্চারণ: ${dua.pronunciation || ''}\n\nঅর্থ: ${dua.translation}\n\nসূত্র: ${dua.reference}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <article className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E]/60 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs transition-colors">
      <div className="space-y-4">
        {/* Top Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5ECDB] dark:bg-[#2B2114] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
            {dua.occasionLabel}
          </span>
          <span className="text-xs font-medium text-[#7C6A55] dark:text-[#B6A691] tabular-nums-bn">
            পাঠের সংখ্যা: {toBengaliDigits(dua.targetCount)} বার
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] leading-snug">
          {dua.title}
        </h3>

        {/* Arabic Box */}
        <div
          dir="rtl"
          className="bg-[#FAF6EF] dark:bg-[#15110C] border border-[#EDE3D0] dark:border-[#2E251B] rounded-2xl px-4 sm:px-5 py-4 text-right"
        >
          <p className="font-arabic text-2xl sm:text-[26px] text-[#2D2216] dark:text-[#F4ECE0] leading-[2.2]">
            {dua.arabic}
          </p>
        </div>

        {/* Pronunciation & Translation */}
        <div className="space-y-2.5 text-sm leading-relaxed">
          {dua.pronunciation && (
            <p className="text-[#6E5D4B] dark:text-[#CBBBA6]">
              <span className="font-semibold text-[#8F682B] dark:text-[#D4A75E]">উচ্চারণ: </span>
              {dua.pronunciation}
            </p>
          )}
          <p className="text-[#2D2216] dark:text-[#EFE6D8]">
            <span className="font-semibold text-[#8F682B] dark:text-[#D4A75E]">অর্থ: </span>
            {dua.translation}
          </p>
        </div>

        {/* Virtue if any */}
        {dua.virtue && (
          <div className="flex items-start gap-2 rounded-xl bg-[#FAF6EF]/80 dark:bg-[#241C13] border border-[#EFE6D5] dark:border-[#2E251B] px-3.5 py-2.5 text-xs text-[#5A4B3C] dark:text-[#CBBBA6]">
            <Sparkles className="w-4 h-4 text-[#AD823E] shrink-0 mt-0.5" />
            <span>{dua.virtue}</span>
          </div>
        )}
      </div>

      {/* Footer: Reference + Interactive Tasbih Counter & Copy */}
      <div className="pt-3 border-t border-[#F0E7D8] dark:border-[#2E251B] flex flex-wrap items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C6A55] dark:text-[#9E8E7A]">
          <BookOpen className="w-3.5 h-3.5 text-[#AD823E] shrink-0" />
          <span>{dua.reference}</span>
        </span>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-[#E8DFCE] dark:border-[#2E251B] bg-[#FAF6EF] dark:bg-[#14100C] overflow-hidden">
            <button
              type="button"
              onClick={() => setCount((c) => c + 1)}
              className={`px-3 py-1.5 text-xs font-semibold tabular-nums-bn transition-colors cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#8F682B] dark:text-[#D4A75E] hover:bg-[#F5ECDB] dark:hover:bg-[#2B2114]'
              }`}
              title="গণনা করতে ট্যাপ করুন"
            >
              {isCompleted
                ? `সম্পন্ন (${toBengaliDigits(count)}/${toBengaliDigits(dua.targetCount)}) ✓`
                : `গণনা: ${toBengaliDigits(count)}/${toBengaliDigits(dua.targetCount)}`}
            </button>
            {count > 0 && (
              <button
                type="button"
                onClick={() => setCount(0)}
                aria-label="গণনা রিসেট করুন"
                className="px-2 py-1.5 border-l border-[#E8DFCE] dark:border-[#2E251B] text-[#7C6A55] hover:text-[#2D2216] dark:hover:text-[#F4ECE0] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#AD823E]" />}
            <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
