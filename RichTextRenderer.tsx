import React from 'react';

export function RichTextRenderer({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter((b) => b.trim());

  return (
    <div className="space-y-4 text-[#2D2216] dark:text-[#E8DFCE] leading-[1.85] text-[15px] sm:text-base">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-lg sm:text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] pt-3"
            >
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="text-xl sm:text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] pt-4"
            >
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }

        // Check if block has multiple lines (e.g. numbered list or bullet list)
        const lines = trimmed.split('\n').map((l) => l.trim());
        const isArabicOnly = /^[\u0600-\u06FF\s\u064B-\u065F.,:;!?۝()]+$/.test(trimmed);
        if (isArabicOnly) {
          return (
            <p
              key={idx}
              dir="rtl"
              className="font-arabic text-xl sm:text-2xl text-right bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-xl p-4 text-[#2D2216] dark:text-[#F4ECE0]"
            >
              {trimmed}
            </p>
          );
        }

        if (lines.length > 1) {
          return (
            <div key={idx} className="space-y-2">
              {lines.map((line, lIdx) => (
                <p key={lIdx}>{renderInlineBold(line)}</p>
              ))}
            </div>
          );
        }

        return <p key={idx}>{renderInlineBold(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[#2D2216] dark:text-[#F4ECE0]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
