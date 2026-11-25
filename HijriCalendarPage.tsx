import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  BENGALI_MONTHS,
  CalendarDayCell,
  ENGLISH_MONTHS,
  ENGLISH_MONTHS_SHORT,
  HIJRI_MONTHS,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_EN,
  HIJRI_OFFSET_EVENT,
  WEEKDAYS_BN,
  WEEKDAYS_SHORT_BN,
  WEEKDAYS_SHORT_EN,
  formatBengaliDate,
  formatEnglishDate,
  getGregorianMonthDays,
  getHijriDateBn,
  getHijriMonthDays,
  getHijriOffsetDays,
  setHijriOffsetDays,
  toArabicDigits,
  toBengaliDigits,
} from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

type CalendarMode = 'gregorian' | 'hijri';

const OFFSET_OPTIONS = [
  { value: -2, label: '-২ দিন' },
  { value: -1, label: '-১ দিন (বাংলাদেশ)' },
  { value: 0, label: '০ দিন (উম্মুল কুরা)' },
  { value: 1, label: '+১ দিন' },
  { value: 2, label: '+২ দিন' },
];

export function HijriCalendarPage() {
  const [offsetDays, setOffsetState] = useState<number>(() => getHijriOffsetDays());
  const [mode, setMode] = useState<CalendarMode>('gregorian');

  const today = useMemo(() => new Date(), []);
  const todayHijri = useMemo(() => getHijriDateBn(today, offsetDays), [today, offsetDays]);

  const [gregYear, setGregYear] = useState<number>(() => today.getFullYear());
  const [gregMonth, setGregMonth] = useState<number>(() => today.getMonth());

  const [hijriYear, setHijriYear] = useState<number>(() => todayHijri.year);
  const [hijriMonth, setHijriMonth] = useState<number>(() => todayHijri.monthIndex);

  const [selectedGregorianTs, setSelectedGregorianTs] = useState<number>(() =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0).getTime()
  );

  useEffect(() => {
    const syncOffset = () => {
      setOffsetState(getHijriOffsetDays());
    };
    window.addEventListener(HIJRI_OFFSET_EVENT, syncOffset);
    return () => window.removeEventListener(HIJRI_OFFSET_EVENT, syncOffset);
  }, []);

  const handleOffsetChange = (val: number) => {
    setHijriOffsetDays(val);
    setOffsetState(val);
  };

  const monthDays = useMemo<CalendarDayCell[]>(() => {
    if (mode === 'gregorian') {
      return getGregorianMonthDays(gregYear, gregMonth, offsetDays);
    }
    return getHijriMonthDays(hijriYear, hijriMonth, offsetDays);
  }, [mode, gregYear, gregMonth, hijriYear, hijriMonth, offsetDays]);

  const leadingEmptyCount = monthDays.length > 0 ? monthDays[0].weekdayIndex : 0;

  const selectedCell = useMemo<CalendarDayCell>(() => {
    const fromMonth = monthDays.find(
      (c) =>
        new Date(
          c.gregorian.getFullYear(),
          c.gregorian.getMonth(),
          c.gregorian.getDate(),
          12,
          0,
          0
        ).getTime() === selectedGregorianTs
    );
    if (fromMonth) return fromMonth;
    const g = new Date(selectedGregorianTs);
    const hijri = getHijriDateBn(g, offsetDays);
    const weekdayIndex = g.getDay();
    return {
      gregorian: g,
      hijri,
      isToday:
        g.getFullYear() === today.getFullYear() &&
        g.getMonth() === today.getMonth() &&
        g.getDate() === today.getDate(),
      weekdayIndex,
    };
  }, [monthDays, selectedGregorianTs, offsetDays, today]);

  const monthSpanSummary = useMemo(() => {
    if (monthDays.length === 0) return { primary: '', secondary: '' };
    const first = monthDays[0];
    const last = monthDays[monthDays.length - 1];

    if (mode === 'gregorian') {
      const h1 = first.hijri;
      const h2 = last.hijri;
      const hijriRange =
        h1.monthIndex === h2.monthIndex && h1.year === h2.year
          ? `${h1.monthName} ${toBengaliDigits(h1.year)} হিজরি`
          : h1.year === h2.year
            ? `${h1.monthName} – ${h2.monthName} ${toBengaliDigits(h1.year)} হিজরি`
            : `${h1.monthName} ${toBengaliDigits(h1.year)} – ${h2.monthName} ${toBengaliDigits(h2.year)} হিজরি`;

      const hijriRangeEn =
        h1.monthIndex === h2.monthIndex
          ? `${h1.monthNameEn} ${h1.year} AH`
          : `${h1.monthNameEn} – ${h2.monthNameEn} ${h2.year} AH`;

      return {
        primary: `${BENGALI_MONTHS[gregMonth]} ${toBengaliDigits(gregYear)} · ${ENGLISH_MONTHS[gregMonth]} ${gregYear}`,
        secondary: `${hijriRange} (${hijriRangeEn})`,
      };
    }

    const g1 = first.gregorian;
    const g2 = last.gregorian;
    const gregRangeBn =
      g1.getMonth() === g2.getMonth() && g1.getFullYear() === g2.getFullYear()
        ? `${toBengaliDigits(g1.getDate())}–${toBengaliDigits(g2.getDate())} ${BENGALI_MONTHS[g1.getMonth()]}, ${toBengaliDigits(g1.getFullYear())}`
        : `${toBengaliDigits(g1.getDate())} ${BENGALI_MONTHS[g1.getMonth()]} – ${toBengaliDigits(g2.getDate())} ${BENGALI_MONTHS[g2.getMonth()]}, ${toBengaliDigits(g2.getFullYear())}`;
    const gregRangeEn = `${g1.getDate()} ${ENGLISH_MONTHS_SHORT[g1.getMonth()]} – ${g2.getDate()} ${ENGLISH_MONTHS_SHORT[g2.getMonth()]} ${g2.getFullYear()}`;

    return {
      primary: `${HIJRI_MONTHS[hijriMonth]} ${toBengaliDigits(hijriYear)} হিজরি · ${HIJRI_MONTHS_EN[hijriMonth]} ${hijriYear} AH`,
      secondary: `${gregRangeBn} (${gregRangeEn})`,
    };
  }, [monthDays, mode, gregMonth, gregYear, hijriMonth, hijriYear]);

  const handlePrevMonth = () => {
    if (mode === 'gregorian') {
      if (gregMonth === 0) {
        setGregMonth(11);
        setGregYear((y) => y - 1);
      } else {
        setGregMonth((m) => m - 1);
      }
    } else {
      if (hijriMonth === 0) {
        setHijriMonth(11);
        setHijriYear((y) => y - 1);
      } else {
        setHijriMonth((m) => m - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (mode === 'gregorian') {
      if (gregMonth === 11) {
        setGregMonth(0);
        setGregYear((y) => y + 1);
      } else {
        setGregMonth((m) => m + 1);
      }
    } else {
      if (hijriMonth === 11) {
        setHijriMonth(0);
        setHijriYear((y) => y + 1);
      } else {
        setHijriMonth((m) => m + 1);
      }
    }
  };

  const handleJumpToday = () => {
    const now = new Date();
    const hNow = getHijriDateBn(now, offsetDays);
    setGregYear(now.getFullYear());
    setGregMonth(now.getMonth());
    setHijriYear(hNow.year);
    setHijriMonth(hNow.monthIndex);
    setSelectedGregorianTs(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).getTime()
    );
  };

  // Compute start Gregorian dates for all 12 Hijri months in current hijriYear
  const hijriYearOverview = useMemo(() => {
    return HIJRI_MONTHS.map((nameBn, mIdx) => {
      const days = getHijriMonthDays(hijriYear, mIdx, offsetDays);
      const firstDay = days[0];
      return {
        monthIndex: mIdx,
        nameBn,
        nameEn: HIJRI_MONTHS_EN[mIdx],
        nameAr: HIJRI_MONTHS_AR[mIdx],
        daysCount: days.length,
        startGregorian: firstDay?.gregorian,
      };
    });
  }, [hijriYear, offsetDays]);

  const notableDatesInHijriYear = useMemo(() => {
    const specs = [
      { monthIndex: 0, day: 1, title: 'হিজরি নববর্ষ', subtitle: '১ মুহাররম' },
      { monthIndex: 0, day: 10, title: 'পবিত্র আশুরা', subtitle: '১০ মুহাররম' },
      { monthIndex: 7, day: 15, title: 'নিসফে শাবান', subtitle: '১৫ শাবান' },
      { monthIndex: 8, day: 1, title: 'পবিত্র রমজান শুরু', subtitle: '১ রমজান' },
      { monthIndex: 9, day: 1, title: 'পবিত্র ঈদুল ফিতর', subtitle: '১ শাওয়াল' },
      { monthIndex: 11, day: 9, title: 'পবিত্র আরাফার দিন', subtitle: '৯ জিলহজ' },
      { monthIndex: 11, day: 10, title: 'পবিত্র ঈদুল আযহা', subtitle: '১০ জিলহজ' },
    ];
    return specs.map((spec) => {
      const days = getHijriMonthDays(hijriYear, spec.monthIndex, offsetDays);
      const match = days.find((d) => d.hijri.day === spec.day) || days[0];
      return {
        ...spec,
        gregorian: match?.gregorian,
      };
    });
  }, [hijriYear, offsetDays]);

  const yearSelectRange = useMemo(() => {
    const center = mode === 'gregorian' ? gregYear : hijriYear;
    const list: number[] = [];
    for (let y = center - 5; y <= center + 5; y++) list.push(y);
    return list;
  }, [mode, gregYear, hijriYear]);

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-[#120F0B]">
      <SeoHead
        title="হিজরি ও ইংরেজি ক্যালেন্ডার"
        description="বাংলাদেশ ও বৈশ্বিক চাঁদ দেখার ভিত্তিতে আরবি (হিজরি) এবং ইংরেজি তারিখের নির্ভুল সমন্বিত ক্যালেন্ডার।"
      />

      {/* Hero Header */}
      <section className="islamic-lattice-bg border-b border-[#E8DFCE] dark:border-[#2E251B] py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
              <CalendarIcon className="w-4 h-4" />
              <span>হিজরি ও গ্রেগরিয়ান বর্ষপঞ্জি</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              আরবি ও ইংরেজি ক্যালেন্ডার
            </h1>
            <p className="text-sm sm:text-base text-[#5A4B3C] dark:text-[#B6A691]">
              চাঁদ দেখা অনুযায়ী বাংলাদেশের জন্য সমন্বিত হিজরি তারিখ এবং ইংরেজি তারিখ একসাথে দেখুন
            </p>
          </div>

          {/* Today Dual-Date Card & Offset Control */}
          <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-2.5 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
                  <Moon className="w-4 h-4" />
                  <span>আজকের তারিখ</span>
                  <span aria-hidden="true">·</span>
                  <span>{WEEKDAYS_BN[today.getDay()]}</span>
                </div>

                <div className="space-y-1">
                  <p className="text-2xl sm:text-3xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                    {todayHijri.formatted} হিজরি
                  </p>
                  <p
                    dir="rtl"
                    className="font-arabic text-xl sm:text-2xl text-[#8F682B] dark:text-[#DFB267] leading-relaxed"
                  >
                    {todayHijri.formattedAr}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 text-sm text-[#5A4B3C] dark:text-[#CBBBA6] pt-1">
                  <span className="font-semibold">{formatBengaliDate(today)}</span>
                  <span aria-hidden="true">/</span>
                  <span className="font-medium tabular-nums">{formatEnglishDate(today)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-xs text-[#7D6C58] dark:text-[#9E8E7A]">
                    {todayHijri.formattedEn}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 lg:border-l lg:border-[#EDE4D4] dark:lg:border-[#2E251B] lg:pl-6 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                    হিজরি তারিখ সমন্বয় (চাঁদ দেখা অনুযায়ী)
                  </span>
                  {offsetDays !== -1 && (
                    <button
                      type="button"
                      onClick={() => handleOffsetChange(-1)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#AD823E] dark:text-[#D4A75E] hover:underline cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>বাংলাদেশ ডিফল্ট</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {OFFSET_OPTIONS.map((opt) => {
                    const active = offsetDays === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleOffsetChange(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#AD823E] text-white border-[#AD823E]'
                            : 'bg-[#FAF6EF] dark:bg-[#16120D] text-[#5A4B3C] dark:text-[#CBBBA6] border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] leading-relaxed text-[#6E5D4B] dark:text-[#9E8E7A]">
                  বাংলাদেশ ও দক্ষিণ এশিয়ায় সাধারণত সৌদি আরব (উম্মুল কুরা) থেকে ১ দিন পরে চাঁদ দেখা যায় বলে ডিফল্টভাবে -১ দিন সমন্বিত রয়েছে।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Calendar Grid Section */}
      <section className="py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Calendar Toolbar */}
          <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EDE4D4] dark:border-[#2E251B]">
              {/* Mode Switcher */}
              <div className="inline-flex p-1 rounded-2xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] self-start">
                <button
                  type="button"
                  onClick={() => setMode('gregorian')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    mode === 'gregorian'
                      ? 'bg-[#AD823E] text-white shadow-2xs'
                      : 'text-[#5A4B3C] dark:text-[#CBBBA6] hover:text-[#2D2216]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>ইংরেজি মাস (হিজরিসহ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('hijri')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    mode === 'hijri'
                      ? 'bg-[#AD823E] text-white shadow-2xs'
                      : 'text-[#5A4B3C] dark:text-[#CBBBA6] hover:text-[#2D2216]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>হিজরি মাস (ইংরেজিসহ)</span>
                </button>
              </div>

              {/* Month/Year Navigation Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="পূর্ববর্তী মাস"
                  className="w-10 h-10 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] flex items-center justify-center text-[#2D2216] dark:text-[#F4ECE0] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {mode === 'gregorian' ? (
                  <>
                    <select
                      aria-label="মাস নির্বাচন"
                      value={gregMonth}
                      onChange={(e) => setGregMonth(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
                    >
                      {BENGALI_MONTHS.map((mBn, idx) => (
                        <option key={mBn} value={idx}>
                          {mBn} ({ENGLISH_MONTHS[idx]})
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="বছর নির্বাচন"
                      value={gregYear}
                      onChange={(e) => setGregYear(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
                    >
                      {yearSelectRange.map((y) => (
                        <option key={y} value={y}>
                          {toBengaliDigits(y)} ({y})
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      aria-label="হিজরি মাস নির্বাচন"
                      value={hijriMonth}
                      onChange={(e) => setHijriMonth(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
                    >
                      {HIJRI_MONTHS.map((hBn, idx) => (
                        <option key={hBn} value={idx}>
                          {hBn} ({HIJRI_MONTHS_EN[idx]})
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="হিজরি বছর নির্বাচন"
                      value={hijriYear}
                      onChange={(e) => setHijriYear(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
                    >
                      {yearSelectRange.map((y) => (
                        <option key={y} value={y}>
                          {toBengaliDigits(y)} ({y} AH)
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="পরবর্তী মাস"
                  className="w-10 h-10 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] flex items-center justify-center text-[#2D2216] dark:text-[#F4ECE0] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="px-3.5 py-2 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] border border-[#DFCCA8] dark:border-[#4B3921] text-xs sm:text-sm font-semibold text-[#8F682B] dark:text-[#E2B96F] hover:bg-[#ECDAB8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  আজ
                </button>
              </div>
            </div>

            {/* Active Month Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                  {monthSpanSummary.primary}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#8F682B] dark:text-[#D4A75E] mt-0.5">
                  {monthSpanSummary.secondary}
                </p>
              </div>
              {mode === 'hijri' && (
                <p dir="rtl" className="font-arabic text-2xl text-[#8F682B] dark:text-[#DFB267]">
                  {HIJRI_MONTHS_AR[hijriMonth]} {toArabicDigits(hijriYear)} هـ
                </p>
              )}
            </div>

            {/* 7-Column Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {WEEKDAYS_SHORT_BN.map((dayBn, idx) => {
                const isFriday = idx === 5;
                return (
                  <div
                    key={dayBn}
                    className={`text-center py-2 rounded-xl text-xs font-bold ${
                      isFriday
                        ? 'bg-[#F5ECDB]/80 dark:bg-[#2B2114] text-[#8F682B] dark:text-[#E2B96F]'
                        : 'bg-[#FAF6EF] dark:bg-[#16120D] text-[#5A4B3C] dark:text-[#B6A691]'
                    }`}
                  >
                    <div>{dayBn}</div>
                    <div className="text-[10px] font-normal opacity-75 hidden sm:block">
                      {WEEKDAYS_SHORT_EN[idx]}
                    </div>
                  </div>
                );
              })}

              {/* Leading Empty Slots */}
              {Array.from({ length: leadingEmptyCount }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[66px] sm:min-h-[86px] rounded-2xl bg-[#FAF6EF]/40 dark:bg-[#14100B]/40"
                />
              ))}

              {/* Day Cells */}
              {monthDays.map((cell) => {
                const cellTs = new Date(
                  cell.gregorian.getFullYear(),
                  cell.gregorian.getMonth(),
                  cell.gregorian.getDate(),
                  12,
                  0,
                  0
                ).getTime();
                const isSelected = cellTs === selectedGregorianTs;
                const isFriday = cell.weekdayIndex === 5;
                const isMajorEvent =
                  (cell.hijri.monthIndex === 0 && (cell.hijri.day === 1 || cell.hijri.day === 10)) ||
                  (cell.hijri.monthIndex === 7 && cell.hijri.day === 15) ||
                  (cell.hijri.monthIndex === 8 && cell.hijri.day === 1) ||
                  (cell.hijri.monthIndex === 9 && cell.hijri.day === 1) ||
                  (cell.hijri.monthIndex === 11 && (cell.hijri.day === 9 || cell.hijri.day === 10));

                return (
                  <button
                    key={cellTs}
                    type="button"
                    onClick={() => setSelectedGregorianTs(cellTs)}
                    className={`relative min-h-[68px] sm:min-h-[90px] rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between text-left border transition-all cursor-pointer ${
                      cell.isToday
                        ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-sm'
                        : isSelected
                          ? 'bg-[#F5ECDB] dark:bg-[#2B2114] border-[#AD823E] text-[#2D2216] dark:text-[#F4ECE0] ring-2 ring-[#AD823E]/30'
                          : isFriday
                            ? 'bg-[#FAF6EF] dark:bg-[#19140E] border-[#E8DFCE] dark:border-[#34291E] hover:border-[#AD823E] text-[#2D2216] dark:text-[#F4ECE0]'
                            : 'bg-white dark:bg-[#16120D] border-[#EDE4D4] dark:border-[#2A2218] hover:border-[#AD823E]/70 text-[#2D2216] dark:text-[#F4ECE0]'
                    }`}
                  >
                    {/* Top row: Primary day number + Today/Event indicator */}
                    <div className="flex items-start justify-between gap-1 w-full">
                      {mode === 'gregorian' ? (
                        <div className="leading-none">
                          <span className="text-base sm:text-xl font-bold tabular-nums-bn">
                            {toBengaliDigits(cell.gregorian.getDate())}
                          </span>
                          <span
                            className={`ml-1 text-[10px] sm:text-xs font-medium tabular-nums ${
                              cell.isToday ? 'text-white/85' : 'text-[#8D7C68] dark:text-[#9E8E7A]'
                            }`}
                          >
                            {cell.gregorian.getDate()}
                          </span>
                        </div>
                      ) : (
                        <div className="leading-none">
                          <span className="text-base sm:text-xl font-bold tabular-nums-bn">
                            {toBengaliDigits(cell.hijri.day)}
                          </span>
                          <span
                            className={`ml-1 font-arabic text-xs sm:text-sm ${
                              cell.isToday ? 'text-white/90' : 'text-[#8F682B] dark:text-[#D4A75E]'
                            }`}
                          >
                            {toArabicDigits(cell.hijri.day)}
                          </span>
                        </div>
                      )}

                      {cell.isToday ? (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                          আজ
                        </span>
                      ) : isMajorEvent ? (
                        <span
                          title={cell.observanceBn}
                          className="w-2 h-2 rounded-full bg-[#AD823E] shrink-0 mt-1"
                        />
                      ) : null}
                    </div>

                    {/* Bottom row: Counterpart date (Hijri in Gregorian view, English in Hijri view) */}
                    <div className="w-full pt-1">
                      {mode === 'gregorian' ? (
                        <div
                          className={`text-[10px] sm:text-xs font-medium leading-tight truncate ${
                            cell.isToday
                              ? 'text-white/95'
                              : cell.hijri.day === 1
                                ? 'text-[#AD823E] dark:text-[#E2B96F] font-bold'
                                : 'text-[#8F682B] dark:text-[#D4A75E]'
                          }`}
                        >
                          <span>{toBengaliDigits(cell.hijri.day)}</span>
                          <span className="hidden sm:inline">
                            {cell.hijri.day === 1
                              ? ` ${cell.hijri.monthName}`
                              : ` ${cell.hijri.monthName.split(' ')[0]}`}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`text-[10px] sm:text-xs font-medium leading-tight truncate tabular-nums ${
                            cell.isToday ? 'text-white/95' : 'text-[#6E5D4B] dark:text-[#B6A691]'
                          }`}
                        >
                          {cell.gregorian.getDate()}{' '}
                          {ENGLISH_MONTHS_SHORT[cell.gregorian.getMonth()]}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
                  <span>নির্বাচিত দিনের বিবরণ</span>
                  <span aria-hidden="true">·</span>
                  <span>{WEEKDAYS_BN[selectedCell.weekdayIndex]}</span>
                  {selectedCell.isToday && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>আজ</span>
                    </>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                  {selectedCell.hijri.formatted} হিজরি
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#5A4B3C] dark:text-[#CBBBA6]">
                  <span className="font-arabic text-lg text-[#8F682B] dark:text-[#DFB267]" dir="rtl">
                    {selectedCell.hijri.formattedAr}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedCell.hijri.formattedEn}</span>
                </div>

                <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                  ইংরেজি তারিখ: <strong className="text-[#2D2216] dark:text-[#F4ECE0]">{formatBengaliDate(selectedCell.gregorian)}</strong> ({formatEnglishDate(selectedCell.gregorian)})
                </p>

                {selectedCell.observanceBn && (
                  <p className="inline-flex items-center gap-1.5 pt-1 text-xs sm:text-sm font-semibold text-[#8F682B] dark:text-[#DFB267]">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>বিশেষ আমল / তাৎপর্য: {selectedCell.observanceBn}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <Link
                  to="/dua"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>প্রতিদিনের দুআ ও যিকির</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 12 Hijri Months & Key Islamic Dates Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 12 Hijri Months Grid */}
            <div className="lg:col-span-7 bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EDE4D4] dark:border-[#2E251B]">
                <div>
                  <h3 className="text-lg sm:text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                    হিজরি {toBengaliDigits(hijriYear)} সালের ১২ মাস
                  </h3>
                  <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
                    যেকোনো মাসে ক্লিক করলে হিজরি ক্যালেন্ডারে সেই মাসটি খুলবে
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {hijriYearOverview.map((m) => {
                  const isCurrentSelected = mode === 'hijri' && hijriMonth === m.monthIndex;
                  return (
                    <button
                      key={m.monthIndex}
                      type="button"
                      onClick={() => {
                        setMode('hijri');
                        setHijriMonth(m.monthIndex);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                        isCurrentSelected
                          ? 'bg-[#F5ECDB] dark:bg-[#2B2114] border-[#AD823E]'
                          : 'bg-[#FAF6EF]/60 dark:bg-[#16120D] border-[#EDE4D4] dark:border-[#2E251B] hover:border-[#AD823E]/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-[#8F682B] dark:text-[#D4A75E] tabular-nums-bn">
                          {toBengaliDigits(m.monthIndex + 1)}
                        </span>
                        <span className="font-arabic text-sm text-[#8F682B] dark:text-[#DFB267]">
                          {m.nameAr}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#2D2216] dark:text-[#F4ECE0] mt-1 truncate">
                        {m.nameBn}
                      </p>
                      <p className="text-[11px] text-[#6E5D4B] dark:text-[#9E8E7A] truncate">
                        {m.nameEn}
                      </p>
                      {m.startGregorian && (
                        <p className="text-[10px] text-[#8D7C68] dark:text-[#9E8E7A] mt-1 tabular-nums">
                          শুরু: {m.startGregorian.getDate()}{' '}
                          {ENGLISH_MONTHS_SHORT[m.startGregorian.getMonth()]}{' '}
                          {m.startGregorian.getFullYear()}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key Islamic Dates in Selected Hijri Year */}
            <div className="lg:col-span-5 bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#EDE4D4] dark:border-[#2E251B]">
                <h3 className="text-lg sm:text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                  গুরুত্বপূর্ণ ইসলামী দিনসমূহ ({toBengaliDigits(hijriYear)})
                </h3>
                <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
                  চাঁদ দেখা সাপেক্ষে ইংরেজি সম্ভাব্য তারিখসহ
                </p>
              </div>

              <div className="divide-y divide-[#EDE4D4] dark:divide-[#2E251B]">
                {notableDatesInHijriYear.map((item) => (
                  <button
                    key={`${item.monthIndex}-${item.day}`}
                    type="button"
                    onClick={() => {
                      if (item.gregorian) {
                        setMode('hijri');
                        setHijriMonth(item.monthIndex);
                        setSelectedGregorianTs(item.gregorian.getTime());
                      }
                    }}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:text-[#AD823E] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#2D2216] dark:text-[#F4ECE0] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#8F682B] dark:text-[#D4A75E]">{item.subtitle}</p>
                    </div>
                    {item.gregorian && (
                      <div className="text-right shrink-0">
                        <p className="text-xs sm:text-sm font-semibold text-[#5A4B3C] dark:text-[#CBBBA6]">
                          {formatBengaliDate(item.gregorian)}
                        </p>
                        <p className="text-[11px] text-[#8D7C68] dark:text-[#9E8E7A] tabular-nums">
                          {item.gregorian.getDate()} {ENGLISH_MONTHS_SHORT[item.gregorian.getMonth()]}{' '}
                          {item.gregorian.getFullYear()}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
