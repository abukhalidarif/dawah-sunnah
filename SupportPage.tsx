import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Heart,
  PhoneCall,
  Receipt,
  Smartphone,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { createSafeId, formatBengaliDate, toBengaliDigits, toEnglishDigits } from '../lib/bengaliUtils';
import { DonationRecord } from '../types';
import { DonationReceiptCard } from '../components/DonationReceiptCard';
import { SeoHead } from '../components/SeoHead';

const MY_RECEIPTS_KEY = 'dawah_my_receipts';

function cleanPhoneNumber(raw?: string): string {
  return toEnglishDigits(raw || '').replace(/[^\d+]/g, '');
}

function generateReceiptNumber(): string {
  const yr = new Date().getFullYear();
  const rnd = Math.floor(100000 + Math.random() * 900000);
  return `DS-${yr}-${rnd}`;
}

export function SupportPage() {
  const { donationSettings } = useData();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bkashLaunchNote, setBkashLaunchNote] = useState<string | null>(null);

  // Donation & Receipt Form state
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [amount, setAmount] = useState('500');
  const [donorName, setDonorName] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderLastDigits, setSenderLastDigits] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [purpose, setPurpose] = useState('সাধারণ দ্বীনি সহযোগিতা');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Active & Saved Receipts
  const activeReceiptId = searchParams.get('receipt') || '';
  const [activeReceipt, setActiveReceipt] = useState<DonationRecord | null>(null);
  const [myReceiptIds, setMyReceiptIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(MY_RECEIPTS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [myAccountDonations, setMyAccountDonations] = useState<DonationRecord[]>([]);

  useEffect(() => {
    if (!donorName && (profile?.displayName || user?.displayName)) {
      setDonorName(profile?.displayName || user?.displayName || '');
    }
  }, [profile?.displayName, user?.displayName, donorName]);

  // Listen to currently viewed receipt by ID (live status updates when Admin verifies!)
  useEffect(() => {
    if (!activeReceiptId) {
      setActiveReceipt(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'donations', activeReceiptId),
      (snap) => {
        if (snap.exists()) {
          setActiveReceipt(snap.data() as DonationRecord);
        }
      },
      () => {}
    );
    return () => unsub();
  }, [activeReceiptId]);

  // Listen to logged-in user's submitted donations
  useEffect(() => {
    if (!user?.uid) {
      setMyAccountDonations([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, 'donations'), where('submittedByUid', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DonationRecord);
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setMyAccountDonations(list);
      },
      () => {}
    );
    return () => unsub();
  }, [user?.uid]);

  const cleanBkash = useMemo(() => cleanPhoneNumber(donationSettings.bkashNumber), [donationSettings.bkashNumber]);
  const cleanNagad = useMemo(() => cleanPhoneNumber(donationSettings.nagadNumber), [donationSettings.nagadNumber]);

  const copyValue = async (key: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleOpenBkash = async () => {
    if (cleanBkash) {
      await copyValue('bkash-launch', cleanBkash);
    }
    setBkashLaunchNote(
      `বিকাশ নম্বর (${cleanBkash || donationSettings.bkashNumber}) কপি হয়েছে। মোবাইল থেকে সরাসরি বিকাশ অ্যাপ খোলা হচ্ছে—অ্যাপ না থাকলে *২৪৭# ডায়াল করুন এবং টাকা পাঠানোর পর নিচের ফর্ম থেকে রিসিট নিন।`
    );

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isAndroid = ua.includes('android');

    if (isAndroid) {
      const fallback = encodeURIComponent(window.location.href);
      const a = document.createElement('a');
      a.href = `intent://#Intent;package=com.bKash.customerapp;scheme=bkash;S.browser_fallback_url=${fallback};end`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const jumpToReceiptForm = (selectedMethod: 'bkash' | 'nagad' | 'rocket' | 'bank') => {
    setMethod(selectedMethod);
    const el = document.getElementById('donation-receipt-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericAmount = Number(toEnglishDigits(amount).replace(/[^\d.]/g, ''));
    if (!numericAmount || numericAmount < 1) {
      setFormError('অনুগ্রহ করে অনুদানের সঠিক পরিমাণ (ন্যূনতম ৳১) লিখুন।');
      return;
    }
    if (!transactionId.trim() || transactionId.trim().length < 2) {
      setFormError('অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) অথবা রেফারেন্স নম্বর লিখুন।');
      return;
    }

    setSubmitting(true);
    const donationId = createSafeId('don');
    const receiptNo = generateReceiptNumber();
    const finalName = donorName.trim() || 'একজন শুভাকাঙ্ক্ষী';

    const payload: Record<string, any> = {
      id: donationId,
      receiptNo,
      donorName: finalName,
      amount: Math.round(numericAmount),
      method,
      transactionId: transactionId.trim().toUpperCase(),
      purpose: purpose.trim() || 'সাধারণ দ্বীনি সহযোগিতা',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (senderLastDigits.trim()) {
      payload.senderLastDigits = senderLastDigits.trim();
    }
    if (user?.uid) {
      payload.submittedByUid = user.uid;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'donations', donationId), payload);

    if (contactInfo.trim()) {
      const contactPayload: Record<string, any> = {
        donationId,
        contactInfo: contactInfo.trim(),
        createdAt: serverTimestamp(),
      };
      if (user?.uid) {
        contactPayload.submittedByUid = user.uid;
      }
      batch.set(doc(db, 'donation_contacts', donationId), contactPayload);
    }

    try {
      await batch.commit();

      const nextIds = [donationId, ...myReceiptIds.filter((id) => id !== donationId)].slice(0, 15);
      setMyReceiptIds(nextIds);
      try {
        localStorage.setItem(MY_RECEIPTS_KEY, JSON.stringify(nextIds));
      } catch {
        // ignore storage errors
      }

      // Immediately show receipt UI while live listener syncs
      setActiveReceipt({
        ...(payload as DonationRecord),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setSearchParams({ receipt: donationId });
      setTransactionId('');
      setSenderLastDigits('');

      setTimeout(() => {
        document.getElementById('official-donation-receipt')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `donations/${donationId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const activeRecipientNumber =
    method === 'bkash'
      ? cleanBkash || donationSettings.bkashNumber
      : method === 'nagad'
      ? cleanNagad || donationSettings.nagadNumber
      : donationSettings.accountNumber;

  const uniqueSavedIds = useMemo(() => {
    const accountIds = myAccountDonations.map((d) => d.id);
    return Array.from(new Set([...accountIds, ...myReceiptIds]));
  }, [myAccountDonations, myReceiptIds]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
      <SeoHead
        title="সহযোগিতা ও অনুদান রিসিট"
        description="দাওয়াহ ও সুন্নাহ প্ল্যাটফর্মের বিজ্ঞাপনমুক্ত ইসলামী জ্ঞান প্রচারে অংশগ্রহণ করুন এবং তাৎক্ষণিক রিসিট সংগ্রহ করুন।"
      />

      {/* Mission Hero */}
      <div className="bg-gradient-to-br from-[#F5ECDB] to-[#FAF6EF] dark:from-[#241C13] dark:to-[#17120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-7 sm:p-10 text-center space-y-4 shadow-xs print:hidden">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]">
          <Heart className="w-4 h-4 fill-[#AD823E] text-[#AD823E]" />
          <span>{donationSettings.badgeText || 'সহযোগিতা করুন'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] leading-snug">
          {donationSettings.missionTitle}
        </h1>
        <p className="text-sm sm:text-base text-[#5A4B3C] dark:text-[#CBBBA6] max-w-2xl mx-auto leading-relaxed">
          {donationSettings.missionDescription}
        </p>
      </div>

      {/* Live Official Receipt Display (when a receipt is generated or opened via link) */}
      {activeReceipt && (
        <section className="space-y-3">
          <div className="flex items-center justify-between print:hidden">
            <h2 className="text-xl sm:text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#AD823E]" />
              <span>আপনার অনুদান রিসিট</span>
            </h2>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] hover:underline"
            >
              রিসিট বন্ধ করুন
            </button>
          </div>
          <DonationReceiptCard donation={activeReceipt} />
        </section>
      )}

      {/* Why Support Is Needed */}
      <section className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs print:hidden">
        <h2 className="text-xl sm:text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          {donationSettings.whySupportTitle || 'কেন আপনার সহযোগিতা প্রয়োজন?'}
        </h2>
        <ul className="space-y-3">
          {(donationSettings.whySupportPoints || []).map((pt, i) => (
            <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-[#5A4B3C] dark:text-[#CBBBA6]">
              <CheckCircle2 className="w-5 h-5 text-[#AD823E] shrink-0 mt-0.5" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Mobile Banking & Bank Transfer Cards with Direct Payment Launch */}
      <section className="space-y-4 print:hidden">
        <h2 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          অনুদান পাঠানোর মাধ্যমসমূহ
        </h2>

        {bkashLaunchNote && (
          <div className="p-4 rounded-2xl bg-[#FDF2F6] dark:bg-[#2C1620] border border-[#F4C4D4] dark:border-[#5D243A] text-xs sm:text-sm text-[#8F1639] dark:text-[#F7B6CA] leading-relaxed">
            {bkashLaunchNote}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {donationSettings.bkashNumber && (
            <div className="bg-white dark:bg-[#1C1711] border-2 border-[#E2136E]/25 dark:border-[#E2136E]/35 rounded-2xl p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-bold text-base text-[#D12053]">
                  <Smartphone className="w-4 h-4" /> বিকাশ (bKash)
                </span>
                <button
                  type="button"
                  onClick={() => copyValue('bkash', cleanBkash || donationSettings.bkashNumber)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] text-[#8F682B] dark:text-[#D4A75E]"
                >
                  {copiedKey === 'bkash' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'bkash' ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
              <p className="text-xl font-bold text-[#2D2216] dark:text-[#F4ECE0] tracking-wide tabular-nums-bn">
                {donationSettings.bkashNumber}
              </p>
              <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">{donationSettings.bkashType}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenBkash}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#E2136E] hover:bg-[#C70F5F] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>বিকাশ অ্যাপে যান</span>
                </button>
                <a
                  href="tel:*247%23"
                  onClick={() => copyValue('bkash-ussd', cleanBkash || donationSettings.bkashNumber)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FDF2F6] dark:bg-[#2C1620] text-[#D12053] text-xs font-semibold border border-[#E2136E]/20"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>*২৪৭# ডায়াল</span>
                </a>
                <button
                  type="button"
                  onClick={() => jumpToReceiptForm('bkash')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>টাকা পাঠিয়েছি — রিসিট নিন</span>
                </button>
              </div>
            </div>
          )}

          {donationSettings.nagadNumber && (
            <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-bold text-base text-[#ED5D24]">
                  <Smartphone className="w-4 h-4" /> নগদ (Nagad)
                </span>
                <button
                  type="button"
                  onClick={() => copyValue('nagad', cleanNagad || donationSettings.nagadNumber)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] text-[#8F682B] dark:text-[#D4A75E]"
                >
                  {copiedKey === 'nagad' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'nagad' ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
              <p className="text-xl font-bold text-[#2D2216] dark:text-[#F4ECE0] tracking-wide tabular-nums-bn">
                {donationSettings.nagadNumber}
              </p>
              <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">{donationSettings.nagadType}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="tel:*167%23"
                  onClick={() => copyValue('nagad-ussd', cleanNagad || donationSettings.nagadNumber)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#ED5D24] hover:bg-[#D44E19] text-white text-xs font-semibold"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>*১৬৭# নগদ ডায়াল</span>
                </a>
                <button
                  type="button"
                  onClick={() => jumpToReceiptForm('nagad')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>টাকা পাঠিয়েছি — রিসিট নিন</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bank Details */}
        {donationSettings.accountNumber && (
          <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#AD823E]" />
                <h3 className="text-lg font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
                  ব্যাংক অ্যাকাউন্ট তথ্য
                </h3>
              </div>
              <button
                type="button"
                onClick={() => copyValue('bank', donationSettings.accountNumber)}
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] text-[#8F682B] dark:text-[#D4A75E]"
              >
                {copiedKey === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'bank' ? 'নম্বর কপি হয়েছে' : 'অ্যাকাউন্ট কপি'}</span>
              </button>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">ব্যাংকের নাম</dt>
                <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] mt-0.5">{donationSettings.bankName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">শাখা</dt>
                <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] mt-0.5">{donationSettings.bankBranch}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">হিসাবের নাম (Account Name)</dt>
                <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] mt-0.5">{donationSettings.accountName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">হিসাব নম্বর (Account Number)</dt>
                <dd className="font-bold text-[#AD823E] dark:text-[#D4A75E] mt-0.5 tabular-nums-bn">{donationSettings.accountNumber}</dd>
              </div>
              {donationSettings.routingNumber && (
                <div>
                  <dt className="text-xs text-[#7C6A55] dark:text-[#9E8E7A]">রাউটিং নম্বর</dt>
                  <dd className="font-semibold text-[#2D2216] dark:text-[#F4ECE0] mt-0.5 tabular-nums-bn">{donationSettings.routingNumber}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Instructions */}
        {donationSettings.instructions && (
          <div className="bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 text-sm text-[#5A4B3C] dark:text-[#CBBBA6] leading-relaxed">
            <span className="font-semibold text-[#8F682B] dark:text-[#D4A75E]">নির্দেশনা: </span>
            {donationSettings.instructions}
          </div>
        )}
      </section>

      {/* Interactive Payment + Instant Receipt Form */}
      <section
        id="donation-receipt-form"
        className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs print:hidden"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#AD823E]">
            <Receipt className="w-4 h-4" />
            <span>তাৎক্ষণিক ডিজিটাল রিসিট</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            অনুদান পাঠান ও রিসিট সংগ্রহ করুন
          </h2>
          <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            প্রথমে বিকাশ/নগদ/ব্যাংকে অনুদান পাঠিয়ে ট্রানজেকশন আইডি (TrxID) লিখে জমা দিলেই সাথে সাথে আপনার রিসিট তৈরি হয়ে যাবে।
          </p>
        </div>

        {/* Method Selection & Direct bKash Launch Bar */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6]">
            ১. পেমেন্ট মাধ্যম নির্বাচন করুন
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'bkash', label: 'বিকাশ (bKash)' },
              { id: 'nagad', label: 'নগদ (Nagad)' },
              { id: 'bank', label: 'ব্যাংক' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMethod(item.id as any)}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  method === item.id
                    ? 'bg-[#AD823E] text-white border-[#AD823E] shadow-xs'
                    : 'bg-[#FAF6EF] dark:bg-[#120F0B] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6] hover:border-[#AD823E]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {activeRecipientNumber && (
            <div className="p-4 rounded-2xl bg-[#FAF6EF] dark:bg-[#14100C] border border-[#E8DFCE] dark:border-[#2E251B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
                  {method === 'bank' ? 'ব্যাংক অ্যাকাউন্ট নম্বর' : 'প্রাপক নম্বর (Send Money / Payment করুন)'}
                </p>
                <p className="text-lg font-bold text-[#2D2216] dark:text-[#F4ECE0] tracking-wider tabular-nums-bn">
                  {activeRecipientNumber}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyValue('form-number', activeRecipientNumber)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] cursor-pointer"
                >
                  {copiedKey === 'form-number' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'form-number' ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
                </button>
                {method === 'bkash' && (
                  <button
                    type="button"
                    onClick={handleOpenBkash}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E2136E] hover:bg-[#C70F5F] text-white text-xs font-semibold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>বিকাশে গিয়ে টাকা দিন</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Receipt Confirmation Form */}
        <form onSubmit={handleSubmitDonation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] mb-2">
              ২. অনুদানের পরিমাণ (টাকা) *
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {['100', '500', '1000', '2000', '5000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    toEnglishDigits(amount) === preset
                      ? 'bg-[#F5ECDB] dark:bg-[#2B2114] border-[#AD823E] text-[#8F682B] dark:text-[#D4A75E]'
                      : 'bg-white dark:bg-[#120F0B] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6]'
                  }`}
                >
                  ৳ {toBengaliDigits(preset)}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="পরিমাণ লিখুন (যেমন: 500)"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm font-semibold focus:outline-none focus:border-[#AD823E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
                ট্রানজেকশন আইডি (TrxID / রেফারেন্স) *
              </label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="যেমন: BKA8X9K2P1"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm font-mono focus:outline-none focus:border-[#AD823E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
                আপনার নাম (রিসিটে প্রদর্শনের জন্য)
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="একজন শুভাকাঙ্ক্ষী"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm focus:outline-none focus:border-[#AD823E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
                যে নম্বর থেকে পাঠিয়েছেন তার শেষ ৪ ডিজিট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                maxLength={12}
                value={senderLastDigits}
                onChange={(e) => setSenderLastDigits(e.target.value)}
                placeholder="যেমন: 4249"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm focus:outline-none focus:border-[#AD823E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
                অনুদানের খাত
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm focus:outline-none focus:border-[#AD823E]"
              >
                <option value="সাধারণ দ্বীনি সহযোগিতা">সাধারণ দ্বীনি সহযোগিতা</option>
                <option value="সদকায়ে জারিয়াহ">সদকায়ে জারিয়াহ</option>
                <option value="ফতোয়া ও গবেষণা বিভাগ">ফতোয়া ও গবেষণা বিভাগ</option>
                <option value="সার্ভার ও ওয়েবসাইট পরিচালনা">সার্ভার ও ওয়েবসাইট পরিচালনা</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
                মোবাইল নম্বর / ইমেইল (ঐচ্ছিক — শুধুমাত্র অ্যাডমিন যাচাইয়ের জন্য গোপন থাকবে)
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="01XXXXXXXXX অথবা ইমেইল"
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm focus:outline-none focus:border-[#AD823E]"
              />
            </div>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            <Receipt className="w-4 h-4" />
            <span>{submitting ? 'রিসিট তৈরি হচ্ছে...' : 'তথ্য জমা দিয়ে রিসিট নিন'}</span>
          </button>
        </form>
      </section>

      {/* Previous Saved / Account Receipts */}
      {uniqueSavedIds.length > 0 && (
        <section className="space-y-3 print:hidden">
          <h3 className="text-lg font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            আপনার সংরক্ষিত রিসিটসমূহ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myAccountDonations.map((don) => (
              <button
                key={don.id}
                type="button"
                onClick={() => {
                  setSearchParams({ receipt: don.id });
                  document.getElementById('official-donation-receipt')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-left bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-bold text-sm text-[#9C712E] dark:text-[#D4A75E] tabular-nums-bn">
                    ৳ {toBengaliDigits(don.amount.toLocaleString('en-US'))} • {don.receiptNo}
                  </p>
                  <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] mt-0.5">
                    {don.transactionId} • {formatBengaliDate(don.createdAt)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#AD823E]">রিসিট দেখুন →</span>
              </button>
            ))}

            {myReceiptIds
              .filter((id) => !myAccountDonations.some((d) => d.id === id))
              .slice(0, 4)
              .map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSearchParams({ receipt: id })}
                  className="text-left bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-sm text-[#2D2216] dark:text-[#F4ECE0]">ডিজিটাল অনুদান রিসিট</p>
                    <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] font-mono truncate max-w-[180px]">{id}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#AD823E]">খুলুন →</span>
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
