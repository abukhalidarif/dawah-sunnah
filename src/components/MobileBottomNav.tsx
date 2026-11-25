import { Link, useLocation } from 'react-router-dom';
import { Folder, Heart, HelpCircle, Home, User } from 'lucide-react';

export function MobileBottomNav() {
  const location = useLocation();

  const items = [
    { label: 'হোম', path: '/', icon: Home },
    { label: 'প্রশ্নোত্তর', path: '/questions', icon: HelpCircle },
    { label: 'ক্যাটাগরি', path: '/categories', icon: Folder },
    { label: 'সহযোগিতা', path: '/support', icon: Heart },
    { label: 'প্রোফাইল', path: '/profile', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      aria-label="মোবাইল নেভিগেশন"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#18130D]/95 backdrop-blur-md border-t border-[#E8DFCE] dark:border-[#2E251B] shadow-[0_-4px_20px_-4px_rgba(45,34,22,0.08)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-xl mx-auto">
        {items.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-1 transition-colors min-h-[44px] ${
                active
                  ? 'text-[#AD823E] dark:text-[#D4A75E]'
                  : 'text-[#6E5D4B] dark:text-[#9E8E7A] hover:text-[#2D2216] dark:hover:text-[#F4ECE0]'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[#AD823E] dark:bg-[#D4A75E]" />
              )}
              <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.2 : 1.75} />
              <span className="text-[10px] font-medium leading-tight whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
