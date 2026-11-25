import { Mail, MapPin, Phone } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { RichTextRenderer } from '../components/RichTextRenderer';
import { SeoHead } from '../components/SeoHead';

interface StaticCmsPageProps {
  pageKey: 'about' | 'contact' | 'privacy' | 'terms';
}

export function StaticCmsPage({ pageKey }: StaticCmsPageProps) {
  const { pagesSettings, siteSettings } = useData();

  const map = {
    about: { title: pagesSettings.aboutTitle, content: pagesSettings.aboutContent },
    contact: { title: pagesSettings.contactTitle, content: pagesSettings.contactContent },
    privacy: { title: pagesSettings.privacyTitle, content: pagesSettings.privacyContent },
    terms: { title: pagesSettings.termsTitle, content: pagesSettings.termsContent },
  }[pageKey];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead title={map.title} description={map.content.slice(0, 155)} />

      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="pb-4 border-b border-[#F0E7D8] dark:border-[#2E251B]">
          <h1 className="text-2xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            {map.title}
          </h1>
        </div>

        <RichTextRenderer content={map.content} />

        {pageKey === 'contact' && (
          <div className="pt-6 border-t border-[#F0E7D8] dark:border-[#2E251B] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] space-y-1.5">
              <Mail className="w-5 h-5 text-[#AD823E]" />
              <p className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">ইমেইল</p>
              <a
                href={`mailto:${siteSettings.contactEmail}`}
                className="text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0] break-all hover:text-[#AD823E]"
              >
                {siteSettings.contactEmail}
              </a>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] space-y-1.5">
              <Phone className="w-5 h-5 text-[#AD823E]" />
              <p className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">ফোন</p>
              <p className="text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0]">
                {siteSettings.contactPhone}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] space-y-1.5">
              <MapPin className="w-5 h-5 text-[#AD823E]" />
              <p className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">ঠিকানা</p>
              <p className="text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0]">
                {siteSettings.contactAddress}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
