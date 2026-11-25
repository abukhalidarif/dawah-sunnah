import { useEffect } from 'react';
import { useData } from '../contexts/DataContext';

interface SeoHeadProps {
  title?: string;
  description?: string;
}

export function SeoHead({ title, description }: SeoHeadProps) {
  const { siteSettings } = useData();
  const resolvedTitle = title
    ? `${title} | ${siteSettings.siteNameBn}`
    : siteSettings.seoTitle || `${siteSettings.siteNameBn} | ${siteSettings.siteNameEn}`;
  const resolvedDesc = description || siteSettings.seoDescription || siteSettings.heroSubtitle;

  useEffect(() => {
    document.title = resolvedTitle;
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', resolvedDesc);
    setMeta('meta[property="og:title"]', resolvedTitle);
    setMeta('meta[property="og:description"]', resolvedDesc);
    setMeta('meta[name="twitter:title"]', resolvedTitle);
    setMeta('meta[name="twitter:description"]', resolvedDesc);
  }, [resolvedTitle, resolvedDesc]);

  return null;
}
