import { useMemo, useState } from 'react';
import { BookHeart, RotateCcw, Search, Sparkles } from 'lucide-react';
import { DUA_OCCASIONS, DuaOccasionId } from '../data/duasData';
import { useData } from '../contexts/DataContext';
import { DuaCard } from '../components/DuaCard';
import { SeoHead } from '../components/SeoHead';
import { toBengaliDigits } from '../lib/bengaliUtils';

const TASBIH_PRESETS = [
  { id: 'subhanallah', label: 'সুবহানাল্লাহ', arabic: 'سُبْحَانَ اللَّهِ', target: 33 },
  { id: 'alhamdulillah', label: 'আলহামদুলিল্লাহ', arabic: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { id: 'allahuakbar', label: 'আল্লাহু আকবার', arabic: 'اللَّهُ أَكْبَرُ', target: 34 },
  { id: 'istighfar', label: 'আস্তাগফিরুল্লাহ', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
];

export function DuaDhikrPage() {
  const { duas } = useData();
  const [selectedOccasion, setSelectedOccasion] = useState<'all' | DuaOccasionId>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTasbihId, setActiveTasbihId] = useState('subhanallah');
  const [tasbihCount, setTasbihCount] = useState(0);

  const activeTasbih = TASBIH_PRESETS.find((t) => t.id === activeTasbihId) || TASBIH_PRESETS[0];

  const filteredDuas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return duas.filter((dua) => {
      if (selectedOccasion !== 'all' && dua.occasion !== selectedOccasion) return false;
      if (!q) return true;
      return (
        dua.title.toLowerCase().includes(q) ||
        dua.translation.toLowerCase().includes(q) ||
        (dua.pronunciation || '').toLowerCase().includes(q) ||
        dua.occasionLabel.toLowerCase().includes(q) ||
        dua.reference.toLowerCase().includes(q)
      );
    });
  }, [duas, selectedOccasion, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
      <SeoHead
        title="দুআ ও যিকির"
        description="কুরআন ও সহিহ সুন্নাহ থেকে সংকলিত প্রতিদিনের মাসনূন দুআ ও যিকির — উপলক্ষ অনুযায়ী সাজানো।"
      />

      {/* Page Hero */}
      <div className="bg-gradient-to-br from-[#F5ECDB] to-[#FAF6EF] dark:from-[#241C13] dark:to-[#17120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-7 sm:p-10 text-center space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
          <BookHeart className="w-4 h-4 text-[#AD823E]" />
          <span>কুরআন ও সহিহ সুন্নাহ ভিত্তিক সংকলন</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          দুআ ও যিকির
        </h1>
        <p className="text-sm sm:text-base text-[#5A4B3C] dark:text-[#CBBBA6] max-w-2xl mx-auto">
          সকাল-সন্ধ্যা, ঘুম, নামাজ, সফর ও বিপদ-আপদসহ প্রতিদিনের প্রয়োজনীয় মাসনূন দুআ ও তাসবিহ—আরবি, উচ্চারণ, অর্থ ও বিশুদ্ধ সূত্রসহ।
        </p>
      </div>

      {/* Digital Tasbih Counter */}
      <section className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
              <Sparkles className="w-4 h-4 text-[#AD823E]" />
              <span>ডিজিটাল তাসবিহ কাউন্টার</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TASBIH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setActiveTasbihId(preset.id);
                    setTasbihCount(0);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    activeTasbihId === preset.id
                      ? 'bg-[#AD823E] text-white border-[#AD823E]'
                      : 'bg-[#FAF6EF] dark:bg-[#14100C] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 bg-[#FAF6EF] dark:bg-[#14100C] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl px-5 py-3.5">
            <div>
              <p className="font-arabic text-2xl text-[#8F682B] dark:text-[#D4A75E] leading-normal">
                {activeTasbih.arabic}
              </p>
              <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] tabular-nums-bn">
                {activeTasbih.label} • লক্ষ্য: {toBengaliDigits(activeTasbih.target)} বার
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTasbihCount((c) => c + 1)}
                className="min-w-[84px] px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#BC9149] to-[#986F2E] text-white text-lg font-bold tabular-nums-bn shadow-xs active:scale-95 transition-transform cursor-pointer"
              >
                {toBengaliDigits(tasbihCount)} +
              </button>
              <button
                type="button"
                onClick={() => setTasbihCount(0)}
                aria-label="তাসবিহ রিসেট"
                className="p-2.5 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B] hover:text-[#2D2216] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Occasion Filter Tabs */}
      <section className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-[#9E8E7A] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="দুআ, অর্থ বা উপলক্ষ লিখুন (যেমন: ঘুম, আজান, বিপদ, সফর)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-sm focus:outline-none focus:border-[#AD823E]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedOccasion('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              selectedOccasion === 'all'
                ? 'bg-[#AD823E] text-white border-[#AD823E]'
                : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
            }`}
          >
            সকল উপলক্ষ ({toBengaliDigits(duas.length)})
          </button>
          {DUA_OCCASIONS.map((occ) => {
            const count = duas.filter((d) => d.occasion === occ.id).length;
            return (
              <button
                key={occ.id}
                type="button"
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                  selectedOccasion === occ.id
                    ? 'bg-[#AD823E] text-white border-[#AD823E]'
                    : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
                }`}
              >
                {occ.label} ({toBengaliDigits(count)})
              </button>
            );
          })}
        </div>
      </section>

      {/* Duas Grid */}
      {filteredDuas.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-10 text-center text-sm text-[#6E5D4B] dark:text-[#B6A691]">
          আপনার অনুসন্ধান অনুযায়ী কোনো দুআ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredDuas.map((dua) => (
            <DuaCard key={dua.id} dua={dua} />
          ))}
        </div>
      )}
    </div>
  );
}
