/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { SearchModal } from './components/SearchModal';
import { HomePage } from './pages/HomePage';
import { QuestionsPage } from './pages/QuestionsPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { AskQuestionPage } from './pages/AskQuestionPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { DuaDhikrPage } from './pages/DuaDhikrPage';
import { HijriCalendarPage } from './pages/HijriCalendarPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { MasailHubPage } from './pages/MasailHubPage';
import { SearchPage } from './pages/SearchPage';
import { SupportPage } from './pages/SupportPage';
import { StaticCmsPage } from './pages/StaticCmsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5ECDB] dark:bg-[#2B2114] text-[#AD823E] text-2xl font-bold font-serif-bn">
        ৪০৪
      </div>

      <h1 className="text-2xl sm:text-3xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
        পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
      </h1>

      <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691]">
        আপনি যে লিংকটিতে প্রবেশ করতে চাইছেন তা পরিবর্তিত হয়েছে অথবা বিদ্যমান নেই।
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>হোমপেজে ফিরে যান</span>
      </Link>
    </div>
  );
}

function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();

  const isAdminDashboard =
    pathname === '/admin' ||
    (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login'));

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  if (isAdminDashboard) {
    return (
      <>
        <ScrollToTopOnRouteChange />
        <Routes>
          <Route path="/admin/*" element={<AdminDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EF] dark:bg-[#120F0B] text-[#2D2216] dark:text-[#F4ECE0] transition-colors">
      <ScrollToTopOnRouteChange />
      <Header onOpenSearch={() => setSearchOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/questions/:slug" element={<QuestionDetailPage />} />
          <Route path="/ask" element={<AskQuestionPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          <Route path="/dua" element={<DuaDhikrPage />} />
          <Route path="/calendar" element={<HijriCalendarPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryDetailPage />} />
          <Route path="/masail" element={<MasailHubPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<StaticCmsPage pageKey="about" />} />
          <Route path="/contact" element={<StaticCmsPage pageKey="contact" />} />
          <Route path="/privacy" element={<StaticCmsPage pageKey="privacy" />} />
          <Route path="/terms" element={<StaticCmsPage pageKey="terms" />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      <MobileBottomNav />
      <ScrollToTopButton />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
