import React, { useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronUp, Copy, Scale, User } from 'lucide-react';
import { MasalaItem } from '../types';

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#2D2216] dark:text-[#F4ECE0]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function FormattedMasalaBody({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2.5 text-sm sm:text-[15px] leading-relaxed text-[#3E3124] dark:text-[#DDD0BE]">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) {
          return <div key={idx} className="h-1" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="pt-2 text-sm sm:text-base font-serif-bn font-bold text-[#8F682B] dark:text-[#E2B96F] border-b border-[#F0E7D8] dark:border-[#2E251B] pb-1"
            >
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#AD823E] shrink-0" />
              <p className="flex-1">{renderInlineBold(line.slice(2))}</p>
            </div>
          );
        }
        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
}

export function MasalaCard({
  masala,
  defaultExpanded = false,
}: {
  masala: MasalaItem;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const cleanBody = masala.content.replace(/###\s+/g, '').replace(/\*\*/g, '');
    const text = `${masala.title}\n(${masala.categoryName} — ${masala.subTopic})${
      masala.authorName ? `\nলেখক: ${masala.authorName}` : ''
    }\n\n${cleanBody}${
      masala.arabicReference ? `\n\nআরবি দলিল:\n${masala.arabicReference}` : ''
    }${masala.quranHadithRefs ? `\n\nসূত্র: ${masala.quranHadithRefs}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <article
      className={`bg-white dark:bg-[#1C1711] border rounded-2xl transition-colors shadow-2xs overflow-hidden ${
        expanded
          ? 'border-[#AD823E]/60 dark:border-[#6A4F26]'
          : 'border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E]/50'
      }`}
    >
      <div className="p-5 sm:p-6 space-y-3">
        {/* Top Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5ECDB] dark:bg-[#2B2114] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
              <Scale className="w-3.5 h-3.5 text-[#AD823E]" />
              <span>{masala.subTopic}</span>
            </span>
            <span className="text-xs font-medium text-[#7C6A55] dark:text-[#9E8E7A]">
              {masala.categoryName}
            </span>
            {masala.authorName && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8F682B] dark:text-[#D4A75E]">
                <User className="w-3 h-3 text-[#AD823E]" />
                <span>{masala.authorName}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#AD823E]" />}
            <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
          </button>
        </div>

        {/* Title & Summary */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="w-full text-left group space-y-1.5 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base sm:text-lg font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] group-hover:text-[#AD823E] dark:group-hover:text-[#E2B96F] transition-colors leading-snug">
              {masala.title}
            </h3>
            <span className="mt-0.5 w-7 h-7 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#8F682B] dark:text-[#D4A75E] shrink-0">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691] leading-relaxed">
            {masala.summary}
          </p>
        </button>

        {/* Expanded Body */}
        {expanded && (
          <div className="pt-3 border-t border-[#F0E7D8] dark:border-[#2E251B] space-y-4">
            <FormattedMasalaBody content={masala.content} />

            {masala.arabicReference && (
              <div
                dir="rtl"
                className="bg-[#FAF6EF] dark:bg-[#15110C] border border-[#EDE3D0] dark:border-[#2E251B] rounded-xl px-4 py-3 text-right"
              >
                <p className="font-arabic text-lg sm:text-xl text-[#2D2216] dark:text-[#F4ECE0] leading-[2.1] whitespace-pre-line">
                  {masala.arabicReference}
                </p>
              </div>
            )}

            {masala.quranHadithRefs && (
              <div className="flex items-start gap-2 pt-1 text-xs font-medium text-[#7C6A55] dark:text-[#A99883]">
                <BookOpen className="w-3.5 h-3.5 text-[#AD823E] shrink-0 mt-0.5" />
                <span>সূত্র: {masala.quranHadithRefs}</span>
              </div>
            )}
          </div>
        )}

        {!expanded && (
          <div className="flex items-center justify-between pt-1">
            {masala.quranHadithRefs ? (
              <span className="text-[11px] text-[#8B7862] dark:text-[#9E8E7A] truncate pr-3">
                সূত্র: {masala.quranHadithRefs}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs font-semibold text-[#AD823E] dark:text-[#E2B96F] hover:underline shrink-0 cursor-pointer"
            >
              বিস্তারিত মাসআলা পড়ুন →
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
