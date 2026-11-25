import { Link } from 'react-router-dom';
import { Mail, Send, Youtube } from 'lucide-react';
import { Logo } from './Logo';
import { useData } from '../contexts/DataContext';

export function Footer() {
  const { siteSettings, categories } = useData();
  const activeCategories = categories.filter((c) => c.isActive).slice(0, 8);

  return (
    <footer className="bg-gradient-to-b from-[#F5ECDB]/70 to-[#EFE2CA]/80 dark:from-[#17120D] dark:to-[#120F0B] border-t border-[#E8DFCE] dark:border-[#2E251B] pt-14 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-[#DFD2BA] dark:border-[#2E251B]">
          {/* Brand & Introduction */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="inline-block">
              <Logo size="md" showEnglish />
            </Link>
            <p className="text-sm leading-relaxed text-[#5A4B3C] dark:text-[#B6A691]">
              {siteSettings.footerIntro}
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              {siteSettings.facebookUrl && (
                <a
                  href={siteSettings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#8F682B] dark:text-[#D4A75E] hover:bg-[#AD823E] hover:text-white transition-colors"
                >
                  <span className="font-bold text-base">f</span>
                </a>
              )}
              {siteSettings.telegramUrl && (
                <a
                  href={siteSettings.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#8F682B] dark:text-[#D4A75E] hover:bg-[#AD823E] hover:text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
              {siteSettings.youtubeUrl && (
                <a
                  href={siteSettings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#8F682B] dark:text-[#D4A75E] hover:bg-[#AD823E] hover:text-white transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {siteSettings.contactEmail && (
                <a
                  href={`mailto:${siteSettings.contactEmail}`}
                  aria-label="Email"
                  className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center text-[#8F682B] dark:text-[#D4A75E] hover:bg-[#AD823E] hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="font-serif-bn text-base font-bold text-[#2D2216] dark:text-[#F4ECE0] mb-4">
              গুরুত্বপূর্ণ লিংক
            </h3>
            <ul className="space-y-2.5 text-sm text-[#5A4B3C] dark:text-[#B6A691]">
              <li><Link to="/masail" className="hover:text-[#AD823E] transition-colors">বিষয়ভিত্তিক মাসআলা</Link></li>
              <li><Link to="/questions" className="hover:text-[#AD823E] transition-colors">সকল প্রশ্নোত্তর</Link></li>
              <li><Link to="/ask" className="hover:text-[#AD823E] transition-colors">প্রশ্ন জিজ্ঞাসা করুন</Link></li>
              <li><Link to="/articles" className="hover:text-[#AD823E] transition-colors">দ্বীনি প্রবন্ধসমূহ</Link></li>
              <li><Link to="/dua" className="hover:text-[#AD823E] transition-colors">দুআ ও যিকির</Link></li>
              <li><Link to="/calendar" className="hover:text-[#AD823E] transition-colors">হিজরি ও ইংরেজি ক্যালেন্ডার</Link></li>
              <li><Link to="/categories" className="hover:text-[#AD823E] transition-colors">সকল ক্যাটাগরি</Link></li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h3 className="font-serif-bn text-base font-bold text-[#2D2216] dark:text-[#F4ECE0] mb-4">
              প্রধান ক্যাটাগরি
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-[#5A4B3C] dark:text-[#B6A691]">
              {activeCategories.map((cat) => (
                <li key={cat.id} className="truncate">
                  <Link to={`/categories/${cat.slug}`} className="hover:text-[#AD823E] transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Other / Institutional Links */}
          <div>
            <h3 className="font-serif-bn text-base font-bold text-[#2D2216] dark:text-[#F4ECE0] mb-4">
              অন্যান্য তথ্য
            </h3>
            <ul className="space-y-2.5 text-sm text-[#5A4B3C] dark:text-[#B6A691]">
              <li><Link to="/about" className="hover:text-[#AD823E] transition-colors">আমাদের সম্পর্কে</Link></li>
              <li><Link to="/support" className="hover:text-[#AD823E] transition-colors">সহযোগিতা করুন</Link></li>
              <li><Link to="/contact" className="hover:text-[#AD823E] transition-colors">যোগাযোগ করুন</Link></li>
              <li><Link to="/privacy" className="hover:text-[#AD823E] transition-colors">প্রাইভেসি পলিসি</Link></li>
              <li><Link to="/terms" className="hover:text-[#AD823E] transition-colors">শর্তাবলী (Terms)</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#6E5D4B] dark:text-[#9E8E7A]">
          <p>{siteSettings.copyrightText || '© 2026 Dawah & Sunnah. All Rights Reserved.'}</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-[#AD823E] transition-colors">গোপনীয়তা নীতি</Link>
            <Link to="/terms" className="hover:text-[#AD823E] transition-colors">শর্তাবলী</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
