import { useState } from 'react';
import { Check, CheckCircle2, Clock, Copy, Download, Printer, Receipt, XCircle } from 'lucide-react';
import { DonationRecord } from '../types';
import { formatBengaliDate, toBengaliDigits } from '../lib/bengaliUtils';
import { useData } from '../contexts/DataContext';

const METHOD_LABELS: Record<DonationRecord['method'], string> = {
  bkash: 'বিকাশ (bKash)',
  nagad: 'নগদ (Nagad)',
  rocket: 'রকেট (Rocket)',
  bank: 'ব্যাংক ট্রান্সফার',
};

const STATUS_CONFIG: Record<
  DonationRecord['status'],
  { label: string; className: string; icon: typeof Clock }
> = {
  verified: {
    label: 'অনুমোদিত ও যাচাইকৃত',
    className:
      'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  pending: {
    label: 'যাচাইয়ের অপেক্ষায়',
    className:
      'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  rejected: {
    label: 'যাচাইয়ে বাতিল',
    className:
      'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
    icon: XCircle,
  },
};

export function DonationReceiptCard({ donation }: { donation: DonationRecord }) {
  const { siteSettings } = useData();
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const statusInfo = STATUS_CONFIG[donation.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const dateText = formatBengaliDate(donation.createdAt);

  const copyReceiptLink = async () => {
    const url = `${window.location.origin}/support?receipt=${encodeURIComponent(donation.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const downloadReceiptPng = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const w = 960;
      const h = 1120;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Cream background
      ctx.fillStyle = '#FAF6EF';
      ctx.fillRect(0, 0, w, h);

      // Outer golden card
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#D4B684';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(40, 40, w - 80, h - 80, 28);
      ctx.fill();
      ctx.stroke();

      // Golden header band
      const grad = ctx.createLinearGradient(40, 40, w - 40, 230);
      grad.addColorStop(0, '#BD934D');
      grad.addColorStop(1, '#986F2E');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(40, 40, w - 80, 190, [28, 28, 0, 0]);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px "Noto Serif Bengali", serif';
      ctx.fillText(siteSettings.siteNameBn || 'দাওয়াহ ও সুন্নাহ', w / 2, 118);

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '600 22px "Noto Serif Bengali", sans-serif';
      ctx.fillText('অনুদান রিসিট  |  OFFICIAL DONATION RECEIPT', w / 2, 165);
      ctx.font = '500 20px "Noto Serif Bengali", sans-serif';
      ctx.fillText(`রিসিট নং: ${donation.receiptNo}`, w / 2, 202);

      // Amount highlight box
      ctx.fillStyle = '#FAF6EF';
      ctx.strokeStyle = '#E8DFCE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(90, 265, w - 180, 130, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6E5D4B';
      ctx.font = '600 22px "Noto Serif Bengali", sans-serif';
      ctx.fillText('মোট অনুদানের পরিমাণ', w / 2, 310);

      ctx.fillStyle = '#9C712E';
      ctx.font = 'bold 48px "Noto Serif Bengali", serif';
      ctx.fillText(`৳ ${toBengaliDigits(donation.amount.toLocaleString('en-US'))}`, w / 2, 370);

      // Details table
      const rows: [string, string][] = [
        ['দাতার নাম', donation.donorName],
        ['পেমেন্ট মাধ্যম', METHOD_LABELS[donation.method] || donation.method],
        ['ট্রানজেকশন আইডি (TrxID)', donation.transactionId],
        ['অনুদানের খাত', donation.purpose || 'সাধারণ দ্বীনি সহযোগিতা'],
        ['প্রেরণের তারিখ', dateText],
        ['অবস্থান (Status)', statusInfo.label],
      ];

      let y = 455;
      for (const [label, value] of rows) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#6E5D4B';
        ctx.font = '500 23px "Noto Serif Bengali", sans-serif';
        ctx.fillText(label, 96, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#2D2216';
        ctx.font = 'bold 24px "Noto Serif Bengali", sans-serif';
        ctx.fillText(String(value).slice(0, 38), w - 96, y);

        ctx.strokeStyle = '#EFE6D5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(96, y + 22);
        ctx.lineTo(w - 96, y + 22);
        ctx.stroke();
        y += 74;
      }

      // Dua Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8F682B';
      ctx.font = 'bold 26px "Noto Serif Bengali", serif';
      ctx.fillText('জাজাকুমুল্লাহু খাইরান', w / 2, 955);

      ctx.fillStyle = '#5A4B3C';
      ctx.font = '500 21px "Noto Serif Bengali", sans-serif';
      ctx.fillText('আল্লাহ তাআলা আপনার দানকে কবুল করুন এবং উত্তম প্রতিদান দান করুন।', w / 2, 995);

      ctx.fillStyle = '#9E8E7A';
      ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${siteSettings.siteNameEn || 'Dawah & Sunnah'} • Verified Digital Receipt`, w / 2, 1040);

      const link = document.createElement('a');
      link.download = `receipt-${donation.receiptNo}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="official-donation-receipt"
      className="bg-white dark:bg-[#1C1711] border-2 border-[#D4B684] dark:border-[#6F5225] rounded-3xl overflow-hidden shadow-lg shadow-[#AD823E]/10"
    >
      {/* Receipt Header */}
      <div className="bg-gradient-to-r from-[#BC9149] to-[#986F2E] text-white px-6 py-6 text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
          <Receipt className="w-3.5 h-3.5" />
          <span>অনুদান রিসিট • OFFICIAL RECEIPT</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-brand-bn font-normal pt-1">
          {siteSettings.siteNameBn || 'দাওয়াহ ও সুন্নাহ'}
        </h3>
        <p className="text-xs text-white/90">
          রিসিট নম্বর: <span className="font-bold tracking-wider">{donation.receiptNo}</span>
        </p>
      </div>

      {/* Amount & Status Banner */}
      <div className="px-6 py-5 bg-[#FAF6EF] dark:bg-[#16120D] border-b border-[#E8DFCE] dark:border-[#2E251B] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">অনুদানের পরিমাণ</p>
          <p className="text-3xl font-bold text-[#9C712E] dark:text-[#D4A75E] tabular-nums-bn">
            ৳ {toBengaliDigits(donation.amount.toLocaleString('en-US'))}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${statusInfo.className}`}
        >
          <StatusIcon className="w-4 h-4 shrink-0" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="p-6 space-y-4">
        <dl className="divide-y divide-[#F0E7D8] dark:divide-[#2E251B] text-sm">
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-[#6E5D4B] dark:text-[#B6A691]">দাতার নাম</dt>
            <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] text-right">{donation.donorName}</dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-[#6E5D4B] dark:text-[#B6A691]">পেমেন্ট মাধ্যম</dt>
            <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] text-right">
              {METHOD_LABELS[donation.method] || donation.method}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-[#6E5D4B] dark:text-[#B6A691]">ট্রানজেকশন আইডি (TrxID)</dt>
            <dd className="font-mono font-bold text-[#8F682B] dark:text-[#D4A75E] text-right">
              {donation.transactionId}
            </dd>
          </div>
          {donation.senderLastDigits && (
            <div className="py-2.5 flex items-center justify-between gap-4">
              <dt className="text-[#6E5D4B] dark:text-[#B6A691]">প্রেরকের শেষ ডিজিট</dt>
              <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] text-right tabular-nums-bn">
                {donation.senderLastDigits}
              </dd>
            </div>
          )}
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-[#6E5D4B] dark:text-[#B6A691]">অনুদানের খাত</dt>
            <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] text-right">
              {donation.purpose || 'সাধারণ দ্বীনি সহযোগিতা'}
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-4">
            <dt className="text-[#6E5D4B] dark:text-[#B6A691]">তারিখ</dt>
            <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] text-right tabular-nums-bn">
              {dateText}
            </dd>
          </div>
        </dl>

        {/* Dua Footer */}
        <div className="bg-[#F5ECDB]/70 dark:bg-[#241C13] rounded-2xl p-4 text-center space-y-1">
          <p className="font-bold text-sm text-[#8F682B] dark:text-[#D4A75E]">জাজাকুমুল্লাহু খাইরান</p>
          <p className="text-xs text-[#5A4B3C] dark:text-[#CBBBA6]">
            আল্লাহ তাআলা আপনার দানকে সদকায়ে জারিয়াহ হিসেবে কবুল করুন এবং উত্তম প্রতিদান দান করুন।
          </p>
        </div>

        {/* Receipt Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 print:hidden">
          <button
            type="button"
            onClick={downloadReceiptPng}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'তৈরি হচ্ছে...' : 'রিসিট ডাউনলোড (PNG)'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-semibold text-[#2D2216] dark:text-[#F4ECE0] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#AD823E]" />
            <span>প্রিন্ট / PDF</span>
          </button>
          <button
            type="button"
            onClick={copyReceiptLink}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-semibold text-[#2D2216] dark:text-[#F4ECE0] transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#AD823E]" />}
            <span>{copiedLink ? 'লিংক কপি হয়েছে' : 'রিসিট লিংক কপি'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
