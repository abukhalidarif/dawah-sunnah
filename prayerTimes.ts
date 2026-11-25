import { PrayerSettings } from '../types';
import { toBengaliDigits } from './bengaliUtils';

export interface CityLocation {
  id: string;
  nameBn: string;
  countryBn: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number; // hours from UTC, e.g., 6 for Bangladesh
}

export const PRAYER_CITIES: CityLocation[] = [
  { id: 'dhaka', nameBn: 'ঢাকা', countryBn: 'বাংলাদেশ', latitude: 23.8103, longitude: 90.4125, timezoneOffset: 6 },
  { id: 'chattogram', nameBn: 'চট্টগ্রাম', countryBn: 'বাংলাদেশ', latitude: 22.3569, longitude: 91.7832, timezoneOffset: 6 },
  { id: 'sylhet', nameBn: 'সিলেট', countryBn: 'বাংলাদেশ', latitude: 24.8949, longitude: 91.8687, timezoneOffset: 6 },
  { id: 'rajshahi', nameBn: 'রাজশাহী', countryBn: 'বাংলাদেশ', latitude: 24.3745, longitude: 88.6042, timezoneOffset: 6 },
  { id: 'khulna', nameBn: 'খুলনা', countryBn: 'বাংলাদেশ', latitude: 22.8456, longitude: 89.5403, timezoneOffset: 6 },
  { id: 'barishal', nameBn: 'বরিশাল', countryBn: 'বাংলাদেশ', latitude: 22.701, longitude: 90.3535, timezoneOffset: 6 },
  { id: 'rangpur', nameBn: 'রংপুর', countryBn: 'বাংলাদেশ', latitude: 25.7439, longitude: 89.2752, timezoneOffset: 6 },
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', countryBn: 'বাংলাদেশ', latitude: 24.7471, longitude: 90.4203, timezoneOffset: 6 },
  { id: 'cumilla', nameBn: 'কুমিল্লা', countryBn: 'বাংলাদেশ', latitude: 23.4607, longitude: 91.1809, timezoneOffset: 6 },
  { id: 'makkah', nameBn: 'মক্কা মুকাররমা', countryBn: 'সৌদি আরব', latitude: 21.4225, longitude: 39.8262, timezoneOffset: 3 },
  { id: 'madinah', nameBn: 'মদিনা মুনাওয়ারা', countryBn: 'সৌদি আরব', latitude: 24.4672, longitude: 39.6112, timezoneOffset: 3 },
  { id: 'london', nameBn: 'লন্ডন', countryBn: 'যুক্তরাজ্য', latitude: 51.5072, longitude: -0.1276, timezoneOffset: 0 },
];

export interface WaqtSlot {
  key: 'fajr' | 'sunrise' | 'ishraq' | 'dhuhr' | 'asr' | 'maghrib' | 'iftar' | 'isha';
  labelBn: string;
  timeMinutes: number; // minutes from midnight (0..1440)
  endMinutes?: number;
  timeDisplayBn: string;
  rangeDisplayBn?: string;
}

export interface ComputedPrayerTimes {
  slots: WaqtSlot[];
  currentWaqt: {
    key: string;
    labelBn: string;
    rangeDisplayBn: string;
    endTimePaddedBn: string;
    nextWaqtLabelBn: string;
    countdownBn: string;
    progressPercent: number;
  };
  isDaytime: boolean;
  sunProgressPercent: number; // 0..100 from Fajr to Maghrib
  arcProgressPercent: number; // 0..100 across active sun/moon arc (sunrise->sunset or sunset->sunrise)
  sunriseDisplayBn: string;
  sunsetDisplayBn: string;
  tahajjudEndDisplayBn: string;
  fajrDisplayBn: string;
  dhuhrDisplayBn: string;
  asrDisplayBn: string;
  maghribDisplayBn: string;
  solarNoonDisplayBn: string;
  solarMidnightDisplayBn: string;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function julianDay(date: Date): number {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  const d = date.getDate();
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function sunPosition(jd: number): { decl: number; eqTime: number } {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(g * DEG2RAD) + 0.02 * Math.sin(2 * g * DEG2RAD)) % 360;
  const e = 23.439 - 0.00000036 * D;
  const RA =
    (Math.atan2(Math.cos(e * DEG2RAD) * Math.sin(L * DEG2RAD), Math.cos(L * DEG2RAD)) * RAD2DEG) / 15;
  const decl = Math.asin(Math.sin(e * DEG2RAD) * Math.sin(L * DEG2RAD)) * RAD2DEG;
  const qHours = ((q / 15) % 24 + 24) % 24;
  let eqTime = qHours - ((RA % 24 + 24) % 24);
  if (eqTime > 12) eqTime -= 24;
  if (eqTime < -12) eqTime += 24;
  return { decl, eqTime };
}

function hourAngle(lat: number, decl: number, angleDeg: number): number {
  const num = -Math.sin(angleDeg * DEG2RAD) - Math.sin(lat * DEG2RAD) * Math.sin(decl * DEG2RAD);
  const den = Math.cos(lat * DEG2RAD) * Math.cos(decl * DEG2RAD);
  const ratio = Math.min(1, Math.max(-1, num / den));
  return (Math.acos(ratio) * RAD2DEG) / 15;
}

function asrHourAngle(lat: number, decl: number, shadowFactor: number): number {
  const alt = Math.atan(1 / (shadowFactor + Math.tan(Math.abs(lat - decl) * DEG2RAD))) * RAD2DEG;
  return hourAngle(lat, decl, -alt);
}

function hoursToMinutes(hours: number): number {
  const normalized = ((hours % 24) + 24) % 24;
  return Math.round(normalized * 60);
}

export function formatMinutes12hBn(totalMinutes: number): string {
  const mNorm = ((totalMinutes % 1440) + 1440) % 1440;
  let h = Math.floor(mNorm / 60);
  const m = mNorm % 60;
  h = h % 12;
  if (h === 0) h = 12;
  return `${toBengaliDigits(h)}:${toBengaliDigits(String(m).padStart(2, '0'))}`;
}

export function formatMinutes12hPaddedBn(totalMinutes: number): string {
  const mNorm = ((totalMinutes % 1440) + 1440) % 1440;
  let h = Math.floor(mNorm / 60);
  const m = mNorm % 60;
  h = h % 12;
  if (h === 0) h = 12;
  return `${toBengaliDigits(String(h).padStart(2, '0'))}:${toBengaliDigits(String(m).padStart(2, '0'))}`;
}

function methodAngles(method: PrayerSettings['calculationMethod']): { fajr: number; isha: number } {
  switch (method) {
    case 'karachi':
    case 'islamic_foundation_bd':
      return { fajr: 18, isha: 18 };
    case 'umm_al_qura':
      return { fajr: 18.5, isha: 18.5 };
    case 'mwl':
    default:
      return { fajr: 18, isha: 17 };
  }
}

export function calculatePrayerTimes(
  settings: PrayerSettings,
  overrideLocation?: { latitude: number; longitude: number; timezoneOffset: number },
  now: Date = new Date()
): ComputedPrayerTimes {
  const lat = overrideLocation?.latitude ?? settings.latitude;
  const lng = overrideLocation?.longitude ?? settings.longitude;
  const tz = overrideLocation?.timezoneOffset ?? settings.timezoneOffset;

  const jd = julianDay(now);
  const { decl, eqTime } = sunPosition(jd);
  const solarNoon = 12 + tz - lng / 15 - eqTime;

  const { fajr: fajrAngle, isha: ishaAngle } = methodAngles(settings.calculationMethod);
  const fajrH = solarNoon - hourAngle(lat, decl, fajrAngle);
  const sunriseH = solarNoon - hourAngle(lat, decl, 0.833);
  const ishraqH = sunriseH + 0.25; // +15 minutes after sunrise
  const dhuhrH = solarNoon + 0.03; // +~2 minutes zenith safety
  const shadowFactor = settings.asrJuristic === 'shafii' ? 1 : 2; // Hanafi default = 2
  const asrH = solarNoon + asrHourAngle(lat, decl, shadowFactor);
  const maghribH = solarNoon + hourAngle(lat, decl, 0.833);
  const ishaH = solarNoon + hourAngle(lat, decl, ishaAngle);

  const fajrMin = hoursToMinutes(fajrH) + (settings.fajrAdjustment || 0);
  const tahajjudEndMin = fajrMin - 5;
  const sunriseMin = hoursToMinutes(sunriseH);
  const ishraqStartMin = hoursToMinutes(ishraqH);
  const dhuhrMin = hoursToMinutes(dhuhrH);
  const ishraqEndMin = dhuhrMin - 5;
  const asrMin = hoursToMinutes(asrH);
  const maghribMin = hoursToMinutes(maghribH) + (settings.maghribAdjustment || 0);
  const iftarMin = maghribMin + 3; // 3-minute safe margin
  const ishaMin = hoursToMinutes(ishaH);
  const solarNoonMin = hoursToMinutes(solarNoon);
  // Night midpoint between sunset (maghribMin) and sunrise (sunriseMin + 1440)
  const solarMidnightMin = Math.round((maghribMin + (sunriseMin + 1440)) / 2) % 1440;
  // Islamic night midpoint (Tahajjud last half begins around midnight; ensure safe wrap after midnight)
  const islamicMidnightMin = Math.round((maghribMin + (fajrMin + 1440)) / 2) % 1440;

  const slots: WaqtSlot[] = [
    { key: 'fajr', labelBn: 'ফজর', timeMinutes: fajrMin, timeDisplayBn: formatMinutes12hBn(fajrMin) },
    { key: 'sunrise', labelBn: 'সূর্যোদয়', timeMinutes: sunriseMin, timeDisplayBn: formatMinutes12hBn(sunriseMin) },
    {
      key: 'ishraq',
      labelBn: 'ইশরাক-চাশত',
      timeMinutes: ishraqStartMin,
      endMinutes: ishraqEndMin,
      timeDisplayBn: formatMinutes12hBn(ishraqStartMin),
      rangeDisplayBn: `${formatMinutes12hBn(ishraqStartMin)} — ${formatMinutes12hBn(ishraqEndMin)}`,
    },
    { key: 'dhuhr', labelBn: 'যোহর', timeMinutes: dhuhrMin, timeDisplayBn: formatMinutes12hBn(dhuhrMin) },
    { key: 'asr', labelBn: 'আসর', timeMinutes: asrMin, timeDisplayBn: formatMinutes12hBn(asrMin) },
    { key: 'maghrib', labelBn: 'মাগরিব', timeMinutes: maghribMin, timeDisplayBn: formatMinutes12hBn(maghribMin) },
    {
      key: 'iftar',
      labelBn: settings.ramadanMode ? 'ইফতার (রমজান)' : 'ইফতার',
      timeMinutes: iftarMin,
      timeDisplayBn: formatMinutes12hBn(iftarMin),
    },
    { key: 'isha', labelBn: 'ইশা', timeMinutes: ishaMin, timeDisplayBn: formatMinutes12hBn(ishaMin) },
  ];

  const nowMin = now.getHours() * 60 + now.getMinutes();

  let currentKey = 'isha';
  let currentLabel = 'ইশা';
  let currentStart = ishaMin;
  let currentEnd = fajrMin;
  let nextLabel = 'ফজর';

  if (nowMin >= fajrMin && nowMin < sunriseMin) {
    currentKey = 'fajr';
    currentLabel = 'ফজর';
    currentStart = fajrMin;
    currentEnd = sunriseMin;
    nextLabel = 'সূর্যোদয়';
  } else if (nowMin >= sunriseMin && nowMin < ishraqStartMin) {
    currentKey = 'sunrise';
    currentLabel = 'সূর্যোদয় (নিষিদ্ধ সময়)';
    currentStart = sunriseMin;
    currentEnd = ishraqStartMin;
    nextLabel = 'ইশরাক';
  } else if (nowMin >= ishraqStartMin && nowMin < dhuhrMin) {
    currentKey = 'ishraq';
    currentLabel = 'ইশরাক-চাশত';
    currentStart = ishraqStartMin;
    currentEnd = dhuhrMin;
    nextLabel = 'যোহর';
  } else if (nowMin >= dhuhrMin && nowMin < asrMin) {
    currentKey = 'dhuhr';
    currentLabel = 'যোহর';
    currentStart = dhuhrMin;
    currentEnd = asrMin;
    nextLabel = 'আসর';
  } else if (nowMin >= asrMin && nowMin < maghribMin) {
    currentKey = 'asr';
    currentLabel = 'আসর';
    currentStart = asrMin;
    currentEnd = maghribMin;
    nextLabel = 'মাগরিব';
  } else if (nowMin >= maghribMin && nowMin < ishaMin) {
    currentKey = 'maghrib';
    currentLabel = 'মাগরিব';
    currentStart = maghribMin;
    currentEnd = ishaMin;
    nextLabel = 'ইশা';
  } else if (nowMin >= 0 && nowMin < tahajjudEndMin) {
    // Late night Tahajjud / Sehri window after midnight until 5 min before Fajr
    currentKey = 'isha';
    currentLabel = 'তাহাজ্জুদ শেষ';
    currentStart = 0;
    currentEnd = tahajjudEndMin;
    nextLabel = 'ফজর';
  } else if (nowMin >= tahajjudEndMin && nowMin < fajrMin) {
    currentKey = 'fajr';
    currentLabel = 'ফজর প্রস্তুতি';
    currentStart = tahajjudEndMin;
    currentEnd = fajrMin;
    nextLabel = 'ফজর';
  } else {
    currentKey = 'isha';
    currentLabel = 'ইশা';
    currentStart = ishaMin;
    currentEnd = islamicMidnightMin < ishaMin ? islamicMidnightMin + 1440 : islamicMidnightMin;
    nextLabel = 'তাহাজ্জুদ';
  }

  let diffMin = currentEnd - nowMin;
  if (diffMin < 0) diffMin += 1440;
  const diffH = Math.floor(diffMin / 60);
  const diffM = diffMin % 60;
  const countdownBn =
    diffH > 0
      ? `${toBengaliDigits(diffH)} ঘণ্টা ${toBengaliDigits(diffM)} মিনিট বাকি`
      : `${toBengaliDigits(diffM)} মিনিট বাকি`;

  let durationMin = currentEnd - currentStart;
  if (durationMin <= 0) durationMin += 1440;
  let elapsedMin = nowMin - currentStart;
  if (elapsedMin < 0) elapsedMin += 1440;
  const progressPercent = Math.min(
    100,
    Math.max(4, Math.round((elapsedMin / Math.max(1, durationMin)) * 100))
  );

  let sunProgressPercent = 0;
  if (nowMin >= fajrMin && nowMin <= maghribMin) {
    sunProgressPercent = Math.round(((nowMin - fajrMin) / Math.max(1, maghribMin - fajrMin)) * 100);
  } else if (nowMin > maghribMin) {
    sunProgressPercent = 100;
  } else {
    sunProgressPercent = 0;
  }

  const isDaytime = nowMin >= sunriseMin && nowMin < maghribMin;
  let arcProgressPercent = 50;
  if (isDaytime) {
    arcProgressPercent = Math.min(
      100,
      Math.max(0, Math.round(((nowMin - sunriseMin) / Math.max(1, maghribMin - sunriseMin)) * 100))
    );
  } else {
    const nightDuration = sunriseMin + 1440 - maghribMin;
    const nightElapsed = nowMin >= maghribMin ? nowMin - maghribMin : nowMin + 1440 - maghribMin;
    arcProgressPercent = Math.min(
      100,
      Math.max(0, Math.round((nightElapsed / Math.max(1, nightDuration)) * 100))
    );
  }

  return {
    slots,
    currentWaqt: {
      key: currentKey,
      labelBn: currentLabel,
      rangeDisplayBn: `${formatMinutes12hBn(currentStart)} — ${formatMinutes12hBn(currentEnd)}`,
      endTimePaddedBn: formatMinutes12hPaddedBn(currentEnd),
      nextWaqtLabelBn: nextLabel,
      countdownBn,
      progressPercent,
    },
    isDaytime,
    sunProgressPercent,
    arcProgressPercent,
    sunriseDisplayBn: formatMinutes12hBn(sunriseMin),
    sunsetDisplayBn: formatMinutes12hBn(maghribMin),
    tahajjudEndDisplayBn: formatMinutes12hBn(tahajjudEndMin),
    fajrDisplayBn: formatMinutes12hBn(fajrMin),
    dhuhrDisplayBn: formatMinutes12hBn(dhuhrMin),
    asrDisplayBn: formatMinutes12hBn(asrMin),
    maghribDisplayBn: formatMinutes12hBn(maghribMin),
    solarNoonDisplayBn: formatMinutes12hBn(solarNoonMin),
    solarMidnightDisplayBn: formatMinutes12hBn(solarMidnightMin),
  };
}
