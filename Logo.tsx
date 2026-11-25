import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showEnglish?: boolean;
}

export function Logo({ size = 'md', showEnglish = false }: LogoProps) {
  const { siteSettings } = useData();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [siteSettings.logoUrl]);

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-lg sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl',
  }[size];

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      {siteSettings.logoUrl && !imgError ? (
        <img
          src={siteSettings.logoUrl}
          alt={siteSettings.siteNameBn}
          onError={() => setImgError(true)}
          className={`${iconSizes} rounded-xl object-contain bg-white dark:bg-[#1C1711] p-0.5 border border-[#E8DFCE] dark:border-[#2E251B] shadow-2xs shrink-0`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`${iconSizes} rounded-xl bg-gradient-to-br from-[#BD934D] to-[#986F2E] flex items-center justify-center shadow-sm shadow-[#AD823E]/25 shrink-0`}
          aria-hidden="true"
        >
          {/* Original Islamic Mihrab + Open Book + Crescent Emblem for Dawah & Sunnah */}
          <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6 text-white">
            <path
              d="M18 4C12.5 7.5 8.5 12.2 8.5 18.5V30H27.5V18.5C27.5 12.2 23.5 7.5 18 4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              opacity="0.45"
            />
            <path
              d="M18 14.5C15.5 13 12.5 12.8 10.5 13.6V24.6C12.8 23.8 15.5 24 18 25.5C20.5 24 23.2 23.8 25.5 24.6V13.6C23.5 12.8 20.5 13 18 14.5Z"
              fill="currentColor"
              fillOpacity="0.92"
            />
            <path d="M18 14.5V25.5" stroke="#986F2E" strokeWidth="1.3" />
            <path
              d="M19.8 8.3C18.5 8.3 17.5 9.2 17.5 10.4C17.5 11.6 18.5 12.5 19.8 12.5C18.9 12.9 17.7 12.7 17 11.9C16.2 11 16.3 9.6 17.2 8.8C17.9 8.1 19 8 19.8 8.3Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
      <div className="flex flex-col leading-none">
        <span
          className={`${textSizes} font-brand-bn font-normal leading-[1.3] py-0.5 text-[#8F682B] dark:text-[#D4A75E] whitespace-nowrap`}
        >
          {siteSettings.siteNameBn}
        </span>
        {showEnglish && (
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#7C6A55] dark:text-[#B6A691] mt-1 whitespace-nowrap">
            {siteSettings.siteNameEn}
          </span>
        )}
      </div>
    </div>
  );
}
