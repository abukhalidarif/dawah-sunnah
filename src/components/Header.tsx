import { Link, useLocation } from 'react-router-dom';
import { Moon, Search, ShieldCheck, Sun, User } from 'lucide-react';
import { Logo } from './Logo';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isAdmin, isStaff, loading } = useAuth();
  const location = useLocation();
  const showAdminMenu = !loading && Boolean(user) && (isAdmin || isStaff);

  const navItems = [
    { label: 'হোম', path: '/' },
    { label: 'মাসআলা', path: '/masail' },
    { label: 'প্রশ্নোত্তর', path: '/questions' },
    { label: 'প্রবন্ধসমূহ', path: '/articles' },
    { label: 'দুআ ও যিকির', path: '/dua' },
    { label: 'ক্যালেন্ডার', path: '/calendar' },
    { label: 'ক্যাটাগরি', path: '/categories' },
    { label: 'সহযোগিতা', path: '/support' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF6EF]/95 dark:bg-[#16120D]/95 backdrop-blur-md border-b border-[#E8DFCE] dark:border-[#2E251B]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link
          to="/"
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AD823E] rounded-lg"
        >
          <Logo size="md" />
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-2.5 xl:px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#E2B96F] font-semibold'
                    : 'text-[#5A4B3C] dark:text-[#CBBBA6] hover:bg-[#F5ECDB]/60 dark:hover:bg-[#221A11] hover:text-[#2D2216] dark:hover:text-[#F4ECE0]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {showAdminMenu && (
            <Link
              to="/admin"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                isActive('/admin')
                  ? 'bg-[#AD823E] text-white shadow-xs'
                  : 'bg-[#F5ECDB] dark:bg-[#2B2114] border border-[#DFCCA8] dark:border-[#4B3921] text-[#8F682B] dark:text-[#E2B96F] hover:bg-[#ECDAB8]'
              }`}
              title="অ্যাডমিন প্যানেল"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>অ্যাডমিন</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showAdminMenu && (
            <Link
              to="/admin"
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#F5ECDB] dark:bg-[#2B2114] border border-[#DFCCA8] dark:border-[#4B3921] text-[#8F682B] dark:text-[#E2B96F] text-[11px] sm:text-xs font-semibold hover:bg-[#ECDAB8] transition-colors whitespace-nowrap shrink-0"
              title="অ্যাডমিন প্যানেল"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>অ্যাডমিন</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="অনুসন্ধান করুন"
            className={`${showAdminMenu ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10'} rounded-full bg-white dark:bg-[#221B14] border border-[#E8DFCE] dark:border-[#34291E] flex items-center justify-center text-[#5A4B3C] dark:text-[#CBBBA6] hover:text-[#AD823E] hover:border-[#AD823E] transition-colors shadow-2xs`}
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
            className={`${showAdminMenu ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10'} rounded-full bg-white dark:bg-[#221B14] border border-[#E8DFCE] dark:border-[#34291E] flex items-center justify-center text-[#5A4B3C] dark:text-[#CBBBA6] hover:text-[#AD823E] hover:border-[#AD823E] transition-colors shadow-2xs`}
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          <Link
            to="/profile"
            aria-label="প্রোফাইল বা লগইন"
            className={`${showAdminMenu ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10'} rounded-full bg-[#AD823E] hover:bg-[#956D30] text-white flex items-center justify-center transition-colors shadow-xs overflow-hidden`}
          >
            {user && (profile?.photoURL || user.photoURL) ? (
              <img
                src={profile?.photoURL || user.photoURL || ''}
                alt={profile?.displayName || 'প্রোফাইল'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-[18px] h-[18px]" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
