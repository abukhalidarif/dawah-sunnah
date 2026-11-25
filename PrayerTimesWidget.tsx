import { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Clock,
  Compass,
  LocateFixed,
  Moon,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import {
  HIJRI_OFFSET_EVENT,
  getBanglaCalendarDateBn,
  getHijriDateBn,
  getHijriOffsetDays,
} from '../lib/bengaliUtils';
import { calculatePrayerTimes, PRAYER_CITIES } from '../lib/prayerTimes';

export function PrayerTimesWidget() {
  const { prayerSettings } = useData();
  const [selectedCityId, setSelectedCityId] = useState<string>(
    prayerSettings.defaultCityId || 'dhaka'
  );
  const [customCoords, setCustomCoords] = useState<{
    nameBn: string;
    latitude: number;
    longitude: number;
    timezoneOffset: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [hijriOffset, setHijriOffset] = useState<number>(() => getHijriOffsetDays());

  const rawId = useId().replace(/:/g, '');
  const arcGlowGradId = `arc-glow-${rawId}`;
  const arcStrokeId = `arc-stroke-${rawId}`;
  const domeRadialId = `dome-radial-${rawId}`;
  const mosqueFadeId = `mosque-fade-${rawId}`;

  useEffect(() => {
    setSelectedCityId(prayerSettings.defaultCityId || 'dhaka');
  }, [prayerSettings.defaultCityId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onOffsetChange = () => setHijriOffset(getHijriOffsetDays());
    window.addEventListener(HIJRI_OFFSET_EVENT, onOffsetChange);
    return () => window.removeEventListener(HIJRI_OFFSET_EVENT, onOffsetChange);
  }, []);

  const hijri = useMemo(() => getHijriDateBn(now, hijriOffset), [now, hijriOffset]);
  const banglaDate = useMemo(() => getBanglaCalendarDateBn(now), [now]);

  const activeLocation = useMemo(() => {
    if (customCoords) return customCoords;
    const city = PRAYER_CITIES.find((c) => c.id === selectedCityId);
    if (city) return city;
    return {
      nameBn: prayerSettings.defaultCityName || 'ঢাকা',
      latitude: prayerSettings.latitude,
      longitude: prayerSettings.longitude,
      timezoneOffset: prayerSettings.timezoneOffset,
    };
  }, [customCoords, selectedCityId, prayerSettings]);

  const computed = useMemo(
    () =>
      calculatePrayerTimes(
        prayerSettings,
        {
          latitude: activeLocation.latitude,
          longitude: activeLocation.longitude,
          timezoneOffset: activeLocation.timezoneOffset,
        },
        now
      ),
    [prayerSettings, activeLocation, now]
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('আপনার ব্রাউজারে লোকেশন সুবিধা সমর্থিত নয়।');
      return;
    }
    setLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let nearest = PRAYER_CITIES[0];
        let minDist = Infinity;
        for (const c of PRAYER_CITIES) {
          const d = Math.hypot(c.latitude - lat, c.longitude - lng);
          if (d < minDist) {
            minDist = d;
            nearest = c;
          }
        }
        const tzOffset = -new Date().getTimezoneOffset() / 60;
        const label =
          minDist < 1.5 ? `${nearest.nameBn} (আপনার অবস্থান)` : 'আপনার বর্তমান অবস্থান';
        setCustomCoords({
          nameBn: label,
          latitude: lat,
          longitude: lng,
          timezoneOffset: tzOffset,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGeoMessage('অবস্থান পাওয়া যায়নি। তালিকা থেকে আপনার শহর বেছে নিন।');
      },
      { timeout: 8000 }
    );
  };

  const getSlotIcon = (key: string) => {
    switch (key) {
      case 'fajr':
      case 'isha':
      case 'iftar':
        return Moon;
      case 'sunrise':
      case 'ishraq':
        return Sunrise;
      case 'maghrib':
        return Sunset;
      default:
        return Sun;
    }
  };

  // Quadratic Bezier curve in viewBox (0..1000 x 0..160) spanning the full Panel 2 stage:
  // P0=(30, 148), P1=(500, -104), P2=(970, 148) -> peak at t=0.5 is (500, 22) behind the top pill
  // De Casteljau exact sub-Bezier for the traveled arc (0..t)
  const t = Math.min(1, Math.max(0, computed.arcProgressPercent / 100));
  const q0x = 30 + (500 - 30) * t;
  const q0y = 148 + (-104 - 148) * t;
  const arcX = 30 + 940 * t;
  const arcY = 148 - 504 * t * (1 - t);
  const markerLeftPct = (arcX / 1000) * 100;
  const markerTopPct = (arcY / 160) * 100;

  return (
    <section className="py-12 lg:py-18 bg-gradient-to-b from-[#FAF6EF] via-[#F4EAD8]/60 to-[#FAF6EF] dark:from-[#120F0B] dark:via-[#19140E] dark:to-[#120F0B]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
            <Clock className="w-4 h-4" />
            <span>নামাজের সময়সূচি</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            আজকের ওয়াক্ত
          </h2>
          <p className="text-sm sm:text-base text-[#6E5D4B] dark:text-[#B6A691]">
            সালাতের সময় জেনে নিন এবং সময়মতো আদায় করুন
          </p>
        </div>

        {/* Location Selector Bar */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5 px-2.5 flex-1 min-w-0">
            <Compass className="w-5 h-5 text-[#AD823E] shrink-0" />
            <label htmlFor="prayer-city-select" className="sr-only">
              শহর নির্বাচন করুন
            </label>
            <select
              id="prayer-city-select"
              value={customCoords ? 'custom' : selectedCityId}
              onChange={(e) => {
                setCustomCoords(null);
                setSelectedCityId(e.target.value);
              }}
              className="w-full bg-transparent text-sm sm:text-base font-medium text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none cursor-pointer truncate"
            >
              {customCoords && <option value="custom">{customCoords.nameBn}</option>}
              {PRAYER_CITIES.map((city) => (
                <option key={city.id} value={city.id} className="bg-white dark:bg-[#1C1711]">
                  {city.nameBn}-এর সময় দেখাচ্ছে ({city.countryBn})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <LocateFixed className="w-4 h-4" />
            <span>{locating ? 'অবস্থান খুঁজছে...' : 'আমার অবস্থান দিন'}</span>
          </button>
        </div>

        {geoMessage && (
          <p className="text-center text-xs text-amber-700 dark:text-amber-400">{geoMessage}</p>
        )}

        {/* Original Warm Cream / Gold & Dark Espresso 3-Panel Dashboard */}
        <div className="rounded-3xl bg-[#F5ECDB]/75 dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] p-3 sm:p-4 space-y-3 shadow-xs">
          {/* Panel 1: Hijri + Arabic Weekday + Bangla Date Card */}
          <Link
            to="/calendar"
            title="পূর্ণাঙ্গ আরবি ও ইংরেজি ক্যালেন্ডার দেখুন"
            className="block rounded-2xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] px-4 py-4 text-center transition-colors shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 text-base sm:text-xl font-serif-bn font-bold text-[#8F682B] dark:text-[#E2B96F] leading-snug">
              <span>
                {hijri.formatted} হি. {banglaDate.arabicWeekdayBn}
              </span>
              {computed.isDaytime ? (
                <Sun className="w-5 h-5 text-[#AD823E] dark:text-[#E2B96F] shrink-0" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-[#AD823E] dark:text-[#F4E6C8] shrink-0"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M14.5 3.5a8.5 8.5 0 1 0 6 14.5 7 7 0 0 1-6-14.5Z" />
                </svg>
              )}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#6E5D4B] dark:text-[#CBBBA6] font-medium">
              {banglaDate.formatted}
            </p>
          </Link>

          {/* Panel 2: Compact Mosque Watermark + Parabolic Sun/Moon Arc Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] h-[142px] sm:h-[164px] shadow-2xs">
            {/* Subtle Wide Mosque Domes & Minarets Watermark Silhouette */}
            <svg
              viewBox="0 0 800 150"
              preserveAspectRatio="xMidYMax slice"
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-[112px] sm:h-[130px] opacity-[0.06] dark:opacity-[0.13]"
              aria-hidden="true"
            >
              <g fill="#AD823E">
                <rect x="0" y="140" width="800" height="10" />
                {/* Left Minaret */}
                <rect x="118" y="42" width="12" height="98" />
                <path d="M 114 42 Q 124 20 134 42 Z" />
                {/* Left Dome */}
                <path d="M 162 140 V 104 C 162 82 192 70 212 58 C 232 70 262 82 262 104 V 140 Z" />
                {/* Central Mosque Dome */}
                <path d="M 290 140 V 96 C 290 66 350 44 400 28 C 450 44 510 66 510 96 V 140 Z" />
                {/* Right Dome */}
                <path d="M 538 140 V 104 C 538 82 568 70 588 58 C 608 70 638 82 638 104 V 140 Z" />
                {/* Right Minaret */}
                <rect x="670" y="42" width="12" height="98" />
                <path d="M 666 42 Q 676 20 686 42 Z" />
              </g>
            </svg>

            {/* Parabolic Trajectory + Traveled Warm Glow Fill */}
            <svg
              viewBox="0 0 1000 160"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 w-full h-full z-0"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={domeRadialId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C99B49" stopOpacity="0.34" />
                  <stop offset="65%" stopColor="#AD823E" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#AD823E" stopOpacity="0" />
                </linearGradient>

                <linearGradient
                  id={mosqueFadeId}
                  gradientUnits="userSpaceOnUse"
                  x1="30"
                  y1="0"
                  x2={Math.max(40, arcX)}
                  y2="0"
                >
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="88%" stopColor="#FFFFFF" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>

                <mask id={arcGlowGradId}>
                  <rect x="0" y="0" width={arcX} height="160" fill={`url(#${mosqueFadeId})`} />
                </mask>

                <linearGradient id={arcStrokeId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C89F59" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#AD823E" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Soft shaded fill under traveled curve fading smoothly downward and at the leading edge */}
              {t > 0.005 && (
                <path
                  d={`M 30 148 Q ${q0x} ${q0y} ${arcX} ${arcY} L ${arcX} 160 L 30 160 Z`}
                  fill={`url(#${domeRadialId})`}
                  mask={`url(#${arcGlowGradId})`}
                />
              )}

              {/* Full dashed trajectory */}
              <path
                d="M 30 148 Q 500 -104 970 148"
                fill="none"
                stroke="currentColor"
                className="text-[#D8C7A8] dark:text-[#4D3D2B]"
                strokeWidth="2"
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
              />

              {/* Solid traveled arc ending right at the celestial marker */}
              {t > 0.005 && (
                <path
                  d={`M 30 148 Q ${q0x} ${q0y} ${arcX} ${arcY}`}
                  fill="none"
                  stroke={`url(#${arcStrokeId})`}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {/* Top Center Solar Midnight / Noon Pill right at the arch apex */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FAF6EF]/90 dark:bg-[#2A2015]/85 border border-[#E8DFCE] dark:border-[#3D2F20] text-xs font-semibold text-[#8F682B] dark:text-[#E2B96F] tabular-nums-bn backdrop-blur-xs whitespace-nowrap">
                {computed.isDaytime ? (
                  <Sun className="w-3.5 h-3.5 text-[#AD823E] dark:text-[#E2B96F]" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-[#AD823E] dark:text-[#E2B96F]" />
                )}
                <span>
                  {computed.isDaytime ? computed.solarNoonDisplayBn : computed.solarMidnightDisplayBn}
                </span>
              </div>
            </div>

            {/* 1:1 Unsquashed Circular Sun / Crescent Moon Marker directly on the curve */}
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: `${markerLeftPct}%`, top: `${markerTopPct}%` }}
              aria-hidden="true"
            >
              {computed.isDaytime ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#FDE047] via-[#F59E0B] to-[#AD823E] ring-2 ring-white/80 dark:ring-[#FDE68A]/50 shadow-[0_0_10px_rgba(173,130,62,0.5)]" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 sm:w-7 sm:h-7 text-[#AD823E] dark:text-[#FFF8EA] drop-shadow-[0_0_6px_rgba(173,130,62,0.45)] dark:drop-shadow-[0_0_8px_rgba(255,244,200,0.55)]"
                  fill="currentColor"
                >
                  <path d="M14.5 3.5a8.5 8.5 0 1 0 6 14.5 7 7 0 0 1-6-14.5Z" />
                </svg>
              )}
            </div>

            {/* Center Split Milestone Labels (no extra box, clean divider as in reference) */}
            <div className="pointer-events-none absolute inset-x-0 top-[56%] -translate-y-1/2 z-10 flex items-center justify-center px-3">
              <div className="flex items-center justify-center gap-3 sm:gap-5">
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-base font-semibold text-[#2D2216] dark:text-[#F4ECE0] tabular-nums-bn whitespace-nowrap">
                  <span>
                    {computed.isDaytime
                      ? `যোহর ${computed.dhuhrDisplayBn} মি.`
                      : `তাহাজ্জুদ শেষ ${computed.tahajjudEndDisplayBn} মি.`}
                  </span>
                  <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#AD823E] dark:text-[#E2B96F] shrink-0" />
                </div>

                <div
                  className="w-px h-6 sm:h-7 bg-[#D8C7A8] dark:bg-white/40 shrink-0"
                  aria-hidden="true"
                />

                <div className="text-xs sm:text-base font-semibold text-[#2D2216] dark:text-[#F4ECE0] tabular-nums-bn whitespace-nowrap">
                  {computed.isDaytime
                    ? `আসর ${computed.asrDisplayBn} মি.`
                    : `ফজর ${computed.fajrDisplayBn} মি.`}
                </div>
              </div>
            </div>

            {/* Bottom-Left Horizon Badge */}
            <div className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EF]/90 dark:bg-[#14100B]/80 border border-[#E8DFCE] dark:border-[#34291D] text-xs font-medium text-[#5A4B3C] dark:text-[#DFD2C0] tabular-nums-bn backdrop-blur-xs">
              {computed.isDaytime ? (
                <>
                  <Sunrise className="w-3.5 h-3.5 text-[#AD823E] dark:text-[#E2B96F]" />
                  <span>{computed.sunriseDisplayBn}</span>
                </>
              ) : (
                <>
                  <Sunset className="w-3.5 h-3.5 text-[#AD823E] dark:text-[#E2B96F]" />
                  <span>{computed.sunsetDisplayBn}</span>
                </>
              )}
            </div>

            {/* Bottom-Right Horizon Badge */}
            <div className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EF]/90 dark:bg-[#14100B]/80 border border-[#E8DFCE] dark:border-[#34291D] text-xs font-medium text-[#5A4B3C] dark:text-[#DFD2C0] tabular-nums-bn backdrop-blur-xs">
              {computed.isDaytime ? (
                <>
                  <Sunset className="w-3.5 h-3.5 text-[#AD823E] dark:text-[#E2B96F]" />
                  <span>{computed.sunsetDisplayBn}</span>
                </>
              ) : (
                <>
                  <Sunrise className="w-3.5 h-3.5 text-[#AD823E] dark:text-[#E2B96F]" />
                  <span>{computed.sunriseDisplayBn}</span>
                </>
              )}
            </div>
          </div>

          {/* Panel 3: Current Active Waqt Golden Progress Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#BC9149] to-[#A17632] text-white px-4 sm:px-6 py-4 space-y-3 shadow-md shadow-[#AD823E]/15">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base sm:text-xl font-serif-bn font-bold text-white">
                {computed.currentWaqt.labelBn}
              </h3>
              <span className="text-base sm:text-xl font-bold text-white tabular-nums-bn">
                {computed.currentWaqt.endTimePaddedBn}
              </span>
            </div>

            <div className="h-3.5 w-full rounded-full bg-black/20 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFF6E0] via-[#FDE8B0] to-white transition-all duration-500"
                style={{ width: `${computed.currentWaqt.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white/95">
                <span className="w-2 h-2 rounded-full bg-[#FFF3D6]" aria-hidden="true" />
                <span>চলমান</span>
              </span>
              <span className="font-semibold text-white tabular-nums-bn">
                {computed.currentWaqt.countdownBn}
              </span>
            </div>
          </div>
        </div>

        {/* 8 Prayer Time Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-3 sm:p-4 shadow-xs">
          {computed.slots.map((slot) => {
            const Icon = getSlotIcon(slot.key);
            const isCurrent = computed.currentWaqt.key === slot.key;
            return (
              <div
                key={slot.key}
                className={`rounded-xl p-3.5 text-center transition-colors border ${
                  isCurrent
                    ? 'bg-[#F5ECDB] dark:bg-[#2B2114] border-[#AD823E]/50 text-[#8F682B] dark:text-[#E2B96F]'
                    : 'bg-[#FAF6EF]/50 dark:bg-[#16120D] border-transparent text-[#2D2216] dark:text-[#F4ECE0]'
                }`}
              >
                <div className="flex justify-center mb-1.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isCurrent ? 'text-[#AD823E] dark:text-[#D4A75E]' : 'text-[#9E8E7A]'
                    }`}
                  />
                </div>
                <p className="text-xs sm:text-sm font-medium mb-0.5">{slot.labelBn}</p>
                <p className="text-sm sm:text-base font-bold tabular-nums-bn">
                  {slot.rangeDisplayBn || slot.timeDisplayBn}
                </p>
                {isCurrent && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-[#AD823E] dark:text-[#D4A75E]">
                    এখন চলছে
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
