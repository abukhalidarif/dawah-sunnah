import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="উপরে যান"
      className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-30 w-11 h-11 rounded-full bg-[#AD823E] hover:bg-[#956D30] text-white shadow-lg shadow-[#AD823E]/30 flex items-center justify-center transition-transform active:scale-95"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
