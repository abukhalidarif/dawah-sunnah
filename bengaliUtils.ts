const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)] ?? d);
}

export function toEnglishDigits(value: string): string {
  return String(value).replace(/[০-৯]/g, (ch) => {
    const idx = BENGALI_DIGITS.indexOf(ch);
    return idx >= 0 ? String(idx) : ch;
  });
}

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const ENGLISH_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const WEEKDAYS_BN = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const WEEKDAYS_SHORT_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
export const WEEKDAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ARABIC_WEEKDAYS_BN = [
  'ইয়াওমুল আহাদ',
  'ইয়াওমুল ইছনাইন',
  'ইয়াওমুছ ছুলাছা',
  'ইয়াওমুল আরবিয়া',
  'ইয়াওমুল খামীস',
  'ইয়াওমুল জুমুআহ',
  'ইয়াওমুস সাবত',
];

export const BANGLA_MONTHS = [
  'বৈশাখ',
  'জ্যৈষ্ঠ',
  'আষাঢ়',
  'শ্রাবণ',
  'ভাদ্র',
  'আশ্বিন',
  'কার্তিক',
  'অগ্রহায়ণ',
  'পৌষ',
  'মাঘ',
  'ফাল্গুন',
  'চৈত্র',
];

export const BANGLA_SEASONS = [
  'গ্রীষ্মকাল',
  'গ্রীষ্মকাল',
  'বর্ষাকাল',
  'বর্ষাকাল',
  'শরৎকাল',
  'শরৎকাল',
  'হেমন্তকাল',
  'হেমন্তকাল',
  'শীতকাল',
  'শীতকাল',
  'বসন্তকাল',
  'বসন্তকাল',
];

export interface BanglaCalendarInfo {
  day: number;
  monthIndex: number;
  monthName: string;
  year: number;
  season: string;
  weekdayBn: string;
  arabicWeekdayBn: string;
  formatted: string;
}

export function getBanglaCalendarDateBn(date: Date = new Date()): BanglaCalendarInfo {
  const gYear = date.getFullYear();
  const localNoon = new Date(gYear, date.getMonth(), date.getDate(), 12, 0, 0);
  const pahelaBaishakhCurrent = new Date(gYear, 3, 14, 12, 0, 0); // April 14

  let banglaYear: number;
  let yearStart: Date;
  let falgunGregorianYear: number;

  if (localNoon.getTime() >= pahelaBaishakhCurrent.getTime()) {
    banglaYear = gYear - 593;
    yearStart = pahelaBaishakhCurrent;
    falgunGregorianYear = gYear + 1;
  } else {
    banglaYear = gYear - 594;
    yearStart = new Date(gYear - 1, 3, 14, 12, 0, 0);
    falgunGregorianYear = gYear;
  }

  const isLeap =
    (falgunGregorianYear % 4 === 0 && falgunGregorianYear % 100 !== 0) ||
    falgunGregorianYear % 400 === 0;

  // Revised Bangladesh Bangla Academy Calendar (2019) month lengths
  const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap ? 30 : 29, 30];

  let daysElapsed = Math.round((localNoon.getTime() - yearStart.getTime()) / 86400000);
  let monthIndex = 0;
  for (let i = 0; i < 12; i++) {
    if (daysElapsed < monthLengths[i]) {
      monthIndex = i;
      break;
    }
    daysElapsed -= monthLengths[i];
  }

  const day = daysElapsed + 1;
  const monthName = BANGLA_MONTHS[monthIndex];
  const season = BANGLA_SEASONS[monthIndex];
  const weekdayIdx = localNoon.getDay();
  const weekdayBn = WEEKDAYS_BN[weekdayIdx];
  const arabicWeekdayBn = ARABIC_WEEKDAYS_BN[weekdayIdx];

  return {
    day,
    monthIndex,
    monthName,
    year: banglaYear,
    season,
    weekdayBn,
    arabicWeekdayBn,
    formatted: `${weekdayBn}, ${toBengaliDigits(day)} ${monthName} ${toBengaliDigits(banglaYear)} বঙ্গাব্দ, ${season}`,
  };
}

export const HIJRI_MONTHS = [
  'মুহাররম',
  'সফর',
  'রবিউল আউয়াল',
  'রবিউস সানি',
  'জুমাদাল উলা',
  'জুমাদাস সানি',
  'রজব',
  'শাবান',
  'রমজান',
  'শাওয়াল',
  'জিলকদ',
  'জিলহজ',
];

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Ula',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul Qadah',
  'Dhul Hijjah',
];

export const HIJRI_MONTHS_AR = [
  'مُحَرَّم',
  'صَفَر',
  'رَبِيع الأَوَّل',
  'رَبِيع الثَّانِي',
  'جُمَادَى الأُولَى',
  'جُمَادَى الآخِرَة',
  'رَجَب',
  'شَعْبَان',
  'رَمَضَان',
  'شَوَّال',
  'ذُو القَعْدَة',
  'ذُو الحِجَّة',
];

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)] ?? d);
}

const HIJRI_OFFSET_STORAGE_KEY = 'dawah_hijri_offset_days';
export const HIJRI_OFFSET_EVENT = 'dawah-hijri-offset-changed';
// বাংলাদেশ ও দক্ষিণ এশিয়ায় সাধারণত সৌদি আরব (উম্মুল কুরা) থেকে ১ দিন পরে চাঁদ দেখা যায়
export const DEFAULT_HIJRI_OFFSET_DAYS = -1;

export function getHijriOffsetDays(): number {
  if (typeof window === 'undefined') return DEFAULT_HIJRI_OFFSET_DAYS;
  try {
    const raw = window.localStorage.getItem(HIJRI_OFFSET_STORAGE_KEY);
    if (raw === null) return DEFAULT_HIJRI_OFFSET_DAYS;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= -2 && parsed <= 2) {
      return parsed;
    }
  } catch {
    // Ignore storage read error
  }
  return DEFAULT_HIJRI_OFFSET_DAYS;
}

export function setHijriOffsetDays(offset: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(-2, Math.min(2, Math.round(offset)));
  try {
    window.localStorage.setItem(HIJRI_OFFSET_STORAGE_KEY, String(clamped));
    window.dispatchEvent(new CustomEvent(HIJRI_OFFSET_EVENT, { detail: clamped }));
  } catch {
    // Ignore storage write error
  }
}

export function formatBengaliDate(input: any): string {
  let date: Date;
  if (!input) {
    date = new Date();
  } else if (typeof input?.toDate === 'function') {
    date = input.toDate();
  } else if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'number' || typeof input === 'string') {
    date = new Date(input);
  } else {
    date = new Date();
  }
  if (Number.isNaN(date.getTime())) {
    date = new Date();
  }
  const day = toBengaliDigits(date.getDate());
  const month = BENGALI_MONTHS[date.getMonth()];
  const year = toBengaliDigits(date.getFullYear());
  return `${day} ${month}, ${year}`;
}

export function formatEnglishDate(date: Date = new Date()): string {
  return `${date.getDate()} ${ENGLISH_MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

export interface HijriDateInfo {
  day: number;
  monthIndex: number;
  monthName: string;
  monthNameEn: string;
  monthNameAr: string;
  year: number;
  formatted: string;
  formattedEn: string;
  formattedAr: string;
}

export function getHijriDateBn(
  date: Date = new Date(),
  overrideOffsetDays?: number
): HijriDateInfo {
  const offsetDays =
    typeof overrideOffsetDays === 'number' ? overrideOffsetDays : getHijriOffsetDays();
  // Anchor to local noon before shifting days to avoid UTC/DST rollover drift
  const localNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const adjustedDate = new Date(localNoon.getTime() + offsetDays * 86400000);

  let dayVal = 1;
  let monthVal = 1;
  let yearVal = 1448;

  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(adjustedDate);
    const parsedDay = Number(parts.find((p) => p.type === 'day')?.value);
    const parsedMonth = Number(parts.find((p) => p.type === 'month')?.value);
    const parsedYear = Number(parts.find((p) => p.type === 'year')?.value);
    if (
      Number.isFinite(parsedDay) &&
      Number.isFinite(parsedMonth) &&
      Number.isFinite(parsedYear) &&
      parsedYear > 1300
    ) {
      dayVal = parsedDay;
      monthVal = parsedMonth;
      yearVal = parsedYear;
    } else {
      throw new Error('Islamic calendar fallback');
    }
  } catch {
    // Fallback Kuwaiti tabular algorithm on local noon date
    const utcDay = Date.UTC(
      adjustedDate.getFullYear(),
      adjustedDate.getMonth(),
      adjustedDate.getDate()
    );
    const jd = Math.floor(utcDay / 86400000) + 2440588;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j =
      Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
      Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 =
      l2 -
      Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
      29;
    monthVal = Math.floor((24 * l3) / 709);
    dayVal = l3 - Math.floor((709 * monthVal) / 24);
    yearVal = 30 * n + j - 30;
  }

  const monthIndex = (monthVal - 1 + 12) % 12;
  const monthName = HIJRI_MONTHS[monthIndex];
  const monthNameEn = HIJRI_MONTHS_EN[monthIndex];
  const monthNameAr = HIJRI_MONTHS_AR[monthIndex];

  return {
    day: dayVal,
    monthIndex,
    monthName,
    monthNameEn,
    monthNameAr,
    year: yearVal,
    formatted: `${toBengaliDigits(dayVal)} ${monthName} ${toBengaliDigits(yearVal)}`,
    formattedEn: `${dayVal} ${monthNameEn} ${yearVal} AH`,
    formattedAr: `${toArabicDigits(dayVal)} ${monthNameAr} ${toArabicDigits(yearVal)} هـ`,
  };
}

export interface CalendarDayCell {
  gregorian: Date;
  hijri: HijriDateInfo;
  isToday: boolean;
  weekdayIndex: number;
  observanceBn?: string;
}

export function getIslamicObservanceBn(
  hijriMonthIndex: number,
  hijriDay: number,
  weekdayIndex: number
): string | undefined {
  // Specific major Hijri dates
  if (hijriMonthIndex === 0 && hijriDay === 1) return 'হিজরি নববর্ষ (১ মুহাররম)';
  if (hijriMonthIndex === 0 && hijriDay === 9) return 'তাসুআ (সুন্নাহ রোজা)';
  if (hijriMonthIndex === 0 && hijriDay === 10) return 'পবিত্র আশুরা (সুন্নাহ রোজা)';
  if (hijriMonthIndex === 7 && hijriDay === 15) return 'নিসফে শাবান';
  if (hijriMonthIndex === 8 && hijriDay === 1) return 'পবিত্র রমজান শুরু';
  if (hijriMonthIndex === 8 && hijriDay >= 21 && hijriDay <= 29 && hijriDay % 2 === 1) {
    return 'লাইলাতুল কদরের সম্ভাব্য রাত';
  }
  if (hijriMonthIndex === 9 && hijriDay === 1) return 'পবিত্র ঈদুল ফিতর';
  if (hijriMonthIndex === 11 && hijriDay >= 1 && hijriDay <= 8) return 'জিলহজের ফজিলতপূর্ণ দিন';
  if (hijriMonthIndex === 11 && hijriDay === 9) return 'আরাফার দিন (সুন্নাহ রোজা)';
  if (hijriMonthIndex === 11 && hijriDay === 10) return 'পবিত্র ঈদুল আযহা';
  if (hijriMonthIndex === 11 && hijriDay >= 11 && hijriDay <= 13) return 'আইয়ামে তাশরিক';
  // Ayyam al-Beed (except 13 Dhul Hijjah which is Tashriq above)
  if (hijriDay >= 13 && hijriDay <= 15 && hijriMonthIndex !== 8) {
    return 'আইয়ামে বীয (সুন্নাহ রোজা)';
  }
  if (weekdayIndex === 5) return 'পবিত্র জুমুআহ';
  if (weekdayIndex === 1) return 'সোমবার (সুন্নাহ রোজা)';
  if (weekdayIndex === 4) return 'বৃহস্পতিবার (সুন্নাহ রোজা)';
  return undefined;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getGregorianMonthDays(
  year: number,
  monthIndex: number,
  offsetDays: number
): CalendarDayCell[] {
  const today = new Date();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const result: CalendarDayCell[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const gDate = new Date(year, monthIndex, d, 12, 0, 0);
    const hijri = getHijriDateBn(gDate, offsetDays);
    const weekdayIndex = gDate.getDay();
    result.push({
      gregorian: gDate,
      hijri,
      isToday: isSameCalendarDay(gDate, today),
      weekdayIndex,
      observanceBn: getIslamicObservanceBn(hijri.monthIndex, hijri.day, weekdayIndex),
    });
  }
  return result;
}

export function getHijriMonthDays(
  hijriYear: number,
  hijriMonthIndex: number,
  offsetDays: number
): CalendarDayCell[] {
  const today = new Date();
  // Estimate approximate Julian/Epoch timestamp for 1st of Hijri month
  const approxDaysSinceEpoch = Math.round(
    (hijriYear - 1448) * 354.3667 + (hijriMonthIndex - 5) * 29.5306 + 20768
  );
  let cursor = new Date(1970, 0, 1 + approxDaysSinceEpoch, 12, 0, 0);

  // Align cursor to exact 1st day of (hijriYear, hijriMonthIndex)
  const targetSerial = hijriYear * 12 + hijriMonthIndex;
  for (let i = 0; i < 90; i++) {
    const h = getHijriDateBn(cursor, offsetDays);
    const currentSerial = h.year * 12 + h.monthIndex;
    if (currentSerial === targetSerial && h.day === 1) {
      break;
    }
    if (currentSerial < targetSerial) {
      cursor = new Date(cursor.getTime() + 86400000);
    } else if (currentSerial > targetSerial || h.day > 1) {
      cursor = new Date(cursor.getTime() - 86400000);
    }
  }

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 31; i++) {
    const gDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i, 12, 0, 0);
    const hijri = getHijriDateBn(gDate, offsetDays);
    if (hijri.year !== hijriYear || hijri.monthIndex !== hijriMonthIndex) {
      break;
    }
    const weekdayIndex = gDate.getDay();
    cells.push({
      gregorian: gDate,
      hijri,
      isToday: isSameCalendarDay(gDate, today),
      weekdayIndex,
      observanceBn: getIslamicObservanceBn(hijri.monthIndex, hijri.day, weekdayIndex),
    });
  }

  return cells;
}

export function createSlug(text: string, prefix?: string): string {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^\u0980-\u09FF\u0600-\u06FFa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const base = cleaned || 'item';
  return prefix ? `${prefix}-${base}` : base;
}

export function createSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function estimateReadingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 170));
}

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    // Remove Arabic tashkeel/diacritics for flexible Arabic searching
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim();
}
