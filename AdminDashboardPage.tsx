import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  BookHeart,
  BookOpen,
  Clock,
  Database,
  FileText,
  Folder,
  Globe,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Scale,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { db } from '../../lib/firebase';
import { toBengaliDigits } from '../../lib/bengaliUtils';
import { AdminArticlesPanel } from './AdminArticlesPanel';
import { AdminQuestionsPanel } from './AdminQuestionsPanel';
import { AdminMasalasPanel } from './AdminMasalasPanel';
import { AdminDuasPanel } from './AdminDuasPanel';
import { AdminCategoriesPanel } from './AdminCategoriesAuthorsPanel';
import { AdminUsersPanel } from './AdminUsersPanel';
import { AdminDonationsPanel } from './AdminDonationsPanel';
import {
  AdminHomepagePanel,
  AdminPagesPanel,
  AdminPrayerPanel,
  AdminWebsiteDonationPanel,
} from './AdminSettingsPanels';
import { SeoHead } from '../../components/SeoHead';
import { AdminLoginPage } from '../AdminLoginPage';

type AdminTab =
  | 'overview'
  | 'masalas'
  | 'articles'
  | 'questions'
  | 'duas'
  | 'categories'
  | 'donations'
  | 'users'
  | 'homepage'
  | 'prayer'
  | 'website'
  | 'pages';

export function AdminDashboardPage() {
  const { user, role, isStaff, isAdmin, loading, logout } = useAuth();
  const {
    articles,
    questions,
    masalas,
    duas,
    categories,
    siteStats,
    isDatabaseSeeded,
    seedDatabase,
    clearAllContent,
  } = useData();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [userCount, setUserCount] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [seedNotice, setSeedNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => setUserCount(snap.size),
      () => {}
    );
    return () => unsub();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] dark:bg-[#120F0B]">
        <p className="text-sm text-[#6E5D4B]">অ্যাডমিন প্যানেল যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  if (!user || !isStaff) {
    return <AdminLoginPage />;
  }

  const publishedArtCount = articles.filter((a) => a.status === 'published').length;
  const draftArtCount = articles.filter((a) => a.status === 'draft').length;
  const pendingQCount = questions.filter((q) => q.status === 'pending').length;

  const navItems: { id: AdminTab; label: string; icon: any; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'masalas', label: 'মাসআলাসমূহ', icon: Scale },
    { id: 'articles', label: 'প্রবন্ধসমূহ', icon: BookOpen },
    { id: 'questions', label: 'প্রশ্নোত্তর', icon: HelpCircle },
    { id: 'duas', label: 'দুআ ও যিকির', icon: BookHeart },
    { id: 'categories', label: 'ক্যাটাগরি', icon: Folder },
    { id: 'donations', label: 'অনুদান ও রিসিট', icon: Receipt },
    { id: 'users', label: 'ইউজার ও অ্যাডমিন', icon: Users, adminOnly: true },
    { id: 'homepage', label: 'হোমপেজ', icon: Home, adminOnly: true },
    { id: 'prayer', label: 'নামাজের সময়', icon: Clock, adminOnly: true },
    { id: 'website', label: 'ওয়েবসাইট ও ডোনেশন', icon: Globe, adminOnly: true },
    { id: 'pages', label: 'তথ্য পেজসমূহ', icon: FileText, adminOnly: true },
  ];

  const handleSeed = async () => {
    setSeeding(true);
    setSeedNotice(null);
    try {
      await seedDatabase(true);
      setSeedNotice({ type: 'success', text: 'সেটিংস ও ক্যাটাগরি সফলভাবে প্রস্তুত ও হালনাগাদ হয়েছে।' });
    } catch {
      setSeedNotice({ type: 'error', text: 'সেটিংস সেটআপ সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' });
    } finally {
      setSeeding(false);
    }
  };

  const handleClearAllContent = async () => {
    setClearing(true);
    setSeedNotice(null);
    try {
      const removed = await clearAllContent();
      setConfirmClearAll(false);
      setSeedNotice({
        type: 'success',
        text: `পূর্বের ${toBengaliDigits(removed.articles)}টি প্রবন্ধ এবং ${toBengaliDigits(removed.questions)}টি প্রশ্নোত্তর স্থায়ীভাবে মুছে ফেলা হয়েছে। এখন আপনি নিজে সব লিখতে ও উত্তর দিতে পারবেন।`,
      });
    } catch {
      setSeedNotice({
        type: 'error',
        text: 'পূর্বের কনটেন্ট মুছতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-[#120F0B] flex flex-col lg:flex-row">
      <SeoHead title="অ্যাডমিন ড্যাশবোর্ড" />

      {/* Mobile Admin Bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1C1711] border-b border-[#E8DFCE] dark:border-[#2E251B] shadow-2xs">
        <span className="font-serif-bn font-bold text-[#8F682B] dark:text-[#D4A75E]">অ্যাডমিন ড্যাশবোর্ড</span>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="অ্যাডমিন মেনু খুলুন"
          aria-expanded={mobileMenuOpen}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-[#2D2216] dark:text-[#F4ECE0] active:scale-95 transition-transform"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 shrink-0 bg-white dark:bg-[#1C1711] border-r border-[#E8DFCE] dark:border-[#2E251B] p-4 space-y-6`}
      >
        <div className="px-2 space-y-1">
          <p className="font-brand-bn font-normal text-xl text-[#8F682B] dark:text-[#D4A75E]">
            দাওয়াহ ও সুন্নাহ
          </p>
          <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
            ভূমিকা: {role === 'super_admin' ? 'সুপার অ্যাডমিন' : role === 'admin' ? 'অ্যাডমিন' : 'এডিটর'}
          </p>
        </div>

        <nav className="space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#AD823E] text-white'
                      : 'text-[#5A4B3C] dark:text-[#CBBBA6] hover:bg-[#FAF6EF] dark:hover:bg-[#120F0B]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
        </nav>

        <div className="pt-4 border-t border-[#F0E7D8] dark:border-[#2E251B] space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#8F682B] hover:bg-[#FAF6EF] dark:hover:bg-[#120F0B]"
          >
            <Home className="w-4 h-4" /> ওয়েবসাইট দেখুন
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="w-4 h-4" /> লগআউট
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                  ড্যাশবোর্ড পরিসংখ্যান
                </h1>
                <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                  দাওয়াহ ও সুন্নাহ প্ল্যাটফর্মের সার্বিক তথ্য ও কার্যক্রম
                </p>
              </div>
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={seeding || clearing}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E] text-xs font-semibold hover:bg-[#EADBC0] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
                  >
                    <Database className="w-4 h-4 shrink-0" />
                    <span>
                      {seeding
                        ? 'প্রস্তুত হচ্ছে...'
                        : isDatabaseSeeded
                        ? 'সেটিংস ও ক্যাটাগরি আপডেট করুন'
                        : 'প্রাথমিক সেটিংস চালু করুন'}
                    </span>
                  </button>

                  {(articles.length > 0 || questions.length > 0) && (
                    confirmClearAll ? (
                      <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                        <button
                          type="button"
                          onClick={handleClearAllContent}
                          disabled={clearing}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                        >
                          {clearing ? 'মুছছে...' : 'হ্যাঁ, সব মুছে খালি করুন'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearAll(false)}
                          disabled={clearing}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1711] text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] cursor-pointer"
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        <span>পূর্বের সব প্রবন্ধ ও প্রশ্ন মুছুন</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {seedNotice && (
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm ${
                  seedNotice.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                }`}
              >
                {seedNotice.text}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {[
                { label: 'মোট মাসআলা', value: masalas.length, tab: 'masalas' as AdminTab },
                { label: 'মোট প্রবন্ধ', value: articles.length, tab: 'articles' as AdminTab },
                { label: 'প্রকাশিত প্রবন্ধ', value: publishedArtCount, tab: 'articles' as AdminTab },
                { label: 'খসড়া প্রবন্ধ', value: draftArtCount, tab: 'articles' as AdminTab },
                { label: 'মোট প্রশ্নোত্তর', value: questions.length, tab: 'questions' as AdminTab },
                { label: 'অপেক্ষমাণ প্রশ্ন', value: pendingQCount, tab: 'questions' as AdminTab },
                { label: 'দুআ ও যিকির', value: duas.length, tab: 'duas' as AdminTab },
                { label: 'মোট ক্যাটাগরি', value: categories.length, tab: 'categories' as AdminTab },
                ...(isAdmin ? [{ label: 'নিবন্ধিত ইউজার', value: userCount, tab: 'users' as AdminTab }] : []),
                { label: 'মোট ওয়েবসাইট ভিজিট', value: siteStats.totalVisits || 0, tab: null },
              ].map((stat, idx) =>
                stat.tab ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(stat.tab!)}
                    className="text-left bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] rounded-2xl p-5 space-y-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#AD823E] dark:text-[#D4A75E] tabular-nums-bn">
                      {toBengaliDigits(stat.value)}
                    </p>
                  </button>
                ) : (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-1 shadow-2xs"
                  >
                    <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[#AD823E] dark:text-[#D4A75E] tabular-nums-bn">
                      {toBengaliDigits(stat.value)}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Quick Pending Questions Alert */}
            {pendingQCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                    {toBengaliDigits(pendingQCount)}টি নতুন প্রশ্ন পর্যালোচনার অপেক্ষায় রয়েছে
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    প্রশ্নোত্তর বিভাগে গিয়ে উত্তর প্রদান ও প্রকাশ করুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold shrink-0"
                >
                  প্রশ্ন দেখুন
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'masalas' && <AdminMasalasPanel />}
        {activeTab === 'articles' && <AdminArticlesPanel />}
        {activeTab === 'questions' && <AdminQuestionsPanel />}
        {activeTab === 'duas' && <AdminDuasPanel />}
        {activeTab === 'categories' && <AdminCategoriesPanel />}
        {activeTab === 'donations' && <AdminDonationsPanel />}
        {activeTab === 'users' && <AdminUsersPanel />}
        {activeTab === 'homepage' && (
          <AdminHomepagePanel onOpenDuas={() => setActiveTab('duas')} />
        )}
        {activeTab === 'prayer' && <AdminPrayerPanel />}
        {activeTab === 'website' && <AdminWebsiteDonationPanel />}
        {activeTab === 'pages' && <AdminPagesPanel />}
      </main>
    </div>
  );
}
