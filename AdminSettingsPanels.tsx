import React, { useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { BookHeart, Check, Plus, Trash2, Upload } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { PRAYER_CITIES } from '../../lib/prayerTimes';
import { uploadImageAsset } from '../../lib/imageUpload';
import { toBengaliDigits } from '../../lib/bengaliUtils';
import { QuickAccessCard } from '../../types';

export function AdminHomepagePanel({ onOpenDuas }: { onOpenDuas?: () => void }) {
  const { siteSettings, duas } = useData();
  const [form, setForm] = useState(siteSettings);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(siteSettings);
  }, [siteSettings]);

  const saveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      await setDoc(
        doc(db, 'settings', 'site'),
        {
          ...form,
          showDuaSection: Boolean(form.showDuaSection),
          duaQuickCardAdded: true,
          seeded: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSavedMsg('হোমপেজ সেটিংস সংরক্ষিত হয়েছে।');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site');
    } finally {
      setSaving(false);
    }
  };

  const addQuickCard = () => {
    const newCard: QuickAccessCard = {
      id: `qa-${Date.now().toString(36)}`,
      title: 'নতুন কার্ড',
      categorySlug: 'namaz-salat',
      icon: 'salah',
    };
    setForm({ ...form, quickAccessCards: [...(form.quickAccessCards || []), newCard] });
  };

  return (
    <form onSubmit={saveHomepage} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          হোমপেজ ব্যবস্থাপনা
        </h2>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold">
          <Check className="w-4 h-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </button>
      </div>

      {savedMsg && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs">{savedMsg}</div>}

      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm">হিরো সেকশন</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1">হিরো শিরোনাম</label>
            <input type="text" value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">সার্চ প্লেসহোল্ডার</label>
            <input type="text" value={form.searchPlaceholder} onChange={(e) => setForm({ ...form, searchPlaceholder: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1">হিরো উপ-শিরোনাম</label>
            <input type="text" value={form.heroSubtitle} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
        </div>

        <div className="pt-3 border-t border-[#F0E7D8] dark:border-[#2E251B]">
          <h4 className="font-bold text-sm mb-3">সেকশন প্রদর্শন নিয়ন্ত্রণ</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              ['showQuickAccessSection', 'কুইক অ্যাক্সেস কার্ড'],
              ['showPrayerSection', 'আজকের ওয়াক্ত (নামাজ)'],
              ['showQuestionsSection', 'প্রশ্নোত্তর সেকশন'],
              ['showArticlesSection', 'দ্বীনি জ্ঞানের ভান্ডার'],
              ['showDuaSection', 'দুআ ও যিকির সেকশন'],
              ['showCategoriesSection', 'মাসায়েল ক্যাটাগরি'],
              ['showSupportSection', 'সহযোগিতা সেকশন'],
            ].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean((form as any)[key])}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="accent-[#AD823E]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access Cards Management */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">ইসলামিক কুইক অ্যাক্সেস কার্ডসমূহ</h3>
          <button type="button" onClick={addQuickCard} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F5ECDB] text-[#8F682B] text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" /> কার্ড যোগ করুন
          </button>
        </div>

        <div className="space-y-3">
          {(form.quickAccessCards || []).map((card, i) => (
            <div key={card.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-[#FAF6EF] dark:bg-[#120F0B] p-3 rounded-xl">
              <input
                type="text"
                value={card.title}
                onChange={(e) => {
                  const next = [...form.quickAccessCards];
                  next[i] = { ...card, title: e.target.value };
                  setForm({ ...form, quickAccessCards: next });
                }}
                placeholder="কার্ডের নাম"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
              />
              <input
                type="text"
                value={card.categorySlug}
                onChange={(e) => {
                  const next = [...form.quickAccessCards];
                  next[i] = { ...card, categorySlug: e.target.value };
                  setForm({ ...form, quickAccessCards: next });
                }}
                placeholder="ক্যাটাগরি স্লাগ"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
              />
              <select
                value={card.icon}
                onChange={(e) => {
                  const icon = e.target.value;
                  const next = [...form.quickAccessCards];
                  next[i] = {
                    ...card,
                    icon,
                    ...(icon === 'dua' && (!card.categorySlug || card.categorySlug === 'namaz-salat')
                      ? { categorySlug: 'dua' }
                      : {}),
                  };
                  setForm({ ...form, quickAccessCards: next });
                }}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
              >
                <option value="salah">নামাজ</option>
                <option value="roza">রোজা</option>
                <option value="hajj">হজ</option>
                <option value="zakat">যাকাত</option>
                <option value="taharat">পবিত্রতা</option>
                <option value="marriage">বিবাহ</option>
                <option value="talaq">তালাক</option>
                <option value="qurbani">কুরবানি</option>
                <option value="dua">দুআ ও যিকির</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, quickAccessCards: form.quickAccessCards.filter((_, idx) => idx !== i) });
                }}
                className="p-1.5 text-red-600 justify-self-end"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dua & Dhikr Quick Management Link */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-sm flex items-center gap-2 text-[#2D2216] dark:text-[#F4ECE0]">
            <BookHeart className="w-4 h-4 text-[#AD823E]" />
            <span>হোমপেজের দুআ ও যিকির ব্যবস্থাপনা</span>
          </h3>
          <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691] tabular-nums-bn">
            মোট {toBengaliDigits(duas.length)}টি দুআ সংরক্ষিত আছে (হোমপেজে বাছাইকৃত:{' '}
            {toBengaliDigits(duas.filter((d) => d.featured).length)}টি)। নতুন দুআ যোগ, সম্পাদনা ও
            মুছতে দুআ ও যিকির সেকশনে যান।
          </p>
        </div>
        {onOpenDuas && (
          <button
            type="button"
            onClick={onOpenDuas}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E] text-xs font-semibold hover:bg-[#EADBC0] shrink-0 cursor-pointer"
          >
            <BookHeart className="w-4 h-4" />
            <span>দুআ ও যিকির পরিচালনা করুন</span>
          </button>
        )}
      </div>
    </form>
  );
}

export function AdminPrayerPanel() {
  const { prayerSettings } = useData();
  const [form, setForm] = useState(prayerSettings);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(prayerSettings);
  }, [prayerSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      await setDoc(doc(db, 'settings', 'prayer'), { ...form, updatedAt: serverTimestamp() }, { merge: true });
      setSavedMsg('নামাজের সময়সূচি সেটিংস সংরক্ষিত হয়েছে।');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/prayer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          নামাজের সময়সূচি ব্যবস্থাপনা
        </h2>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold">
          <Check className="w-4 h-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </button>
      </div>
      {savedMsg && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs">{savedMsg}</div>}

      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">ডিফল্ট শহর</label>
          <select
            value={form.defaultCityId}
            onChange={(e) => {
              const city = PRAYER_CITIES.find((c) => c.id === e.target.value);
              if (city) {
                setForm({
                  ...form,
                  defaultCityId: city.id,
                  defaultCityName: city.nameBn,
                  latitude: city.latitude,
                  longitude: city.longitude,
                  timezoneOffset: city.timezoneOffset,
                });
              }
            }}
            className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
          >
            {PRAYER_CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.nameBn} ({c.countryBn})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">হিসাব পদ্ধতি (Calculation Method)</label>
          <select
            value={form.calculationMethod}
            onChange={(e) => setForm({ ...form, calculationMethod: e.target.value as any })}
            className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
          >
            <option value="islamic_foundation_bd">ইসলামিক ফাউন্ডেশন বাংলাদেশ (১৮° / ১৮°)</option>
            <option value="karachi">ইউনিভার্সিটি অব ইসলামিক সায়েন্সেস, করাচি</option>
            <option value="mwl">মুসলিম ওয়ার্ল্ড লীগ (MWL)</option>
            <option value="umm_al_qura">উম্মুল কুরা, মক্কা</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">আসর মাজহাব (জুরিস্টিক পদ্ধতি)</label>
          <select
            value={form.asrJuristic}
            onChange={(e) => setForm({ ...form, asrJuristic: e.target.value as any })}
            className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
          >
            <option value="hanafi">হানাফি (ছায়া দ্বিগুণ)</option>
            <option value="shafii">জুমহুর / শাফেয়ী (ছায়া একগুণ)</option>
          </select>
        </div>

        <div className="flex items-end pb-2">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.ramadanMode}
              onChange={(e) => setForm({ ...form, ramadanMode: e.target.checked })}
              className="accent-[#AD823E]"
            />
            <span>রমজান মোড (ইফতারের সময় বিশেষভাবে প্রদর্শন)</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">ফজর মিনিট সমন্বয় (+/-)</label>
          <input type="number" value={form.fajrAdjustment} onChange={(e) => setForm({ ...form, fajrAdjustment: Number(e.target.value) })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">মাগরিব মিনিট সমন্বয় (+/-)</label>
          <input type="number" value={form.maghribAdjustment} onChange={(e) => setForm({ ...form, maghribAdjustment: Number(e.target.value) })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
        </div>
      </div>
    </form>
  );
}

export function AdminWebsiteDonationPanel() {
  const { siteSettings, donationSettings } = useData();
  const [siteForm, setSiteForm] = useState(siteSettings);
  const [donForm, setDonForm] = useState(donationSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSiteForm(siteSettings);
  }, [siteSettings]);

  useEffect(() => {
    setDonForm(donationSettings);
  }, [donationSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingLogo(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const url = await uploadImageAsset(file, 'branding');
      const nextSite = { ...siteForm, logoUrl: url };
      setSiteForm(nextSite);
      await setDoc(
        doc(db, 'settings', 'site'),
        { ...nextSite, seeded: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSavedMsg('নতুন লোগো আপলোড ও সংরক্ষণ সম্পন্ন হয়েছে।');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'লোগো আপলোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const nextSite = { ...siteForm, logoUrl: '' };
      setSiteForm(nextSite);
      await setDoc(
        doc(db, 'settings', 'site'),
        { ...nextSite, seeded: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setSavedMsg('কাস্টম লোগো সরিয়ে ডিফল্ট ইসলামিক লোগো চালু করা হয়েছে।');
    } catch {
      setErrorMsg('লোগো পরিবর্তন সংরক্ষণ করা যায়নি।');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setErrorMsg(null);
    try {
      await setDoc(doc(db, 'settings', 'site'), { ...siteForm, seeded: true, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, 'settings', 'donations'), { ...donForm, updatedAt: serverTimestamp() }, { merge: true });
      setSavedMsg('ওয়েবসাইট ও ডোনেশন সেটিংস সফলভাবে সংরক্ষিত হয়েছে।');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/website_donations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          ওয়েবসাইট ও সহযোগিতা (Donation) সেটিংস
        </h2>
        <button type="submit" disabled={saving || uploadingLogo} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold disabled:opacity-60">
          <Check className="w-4 h-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সব সংরক্ষণ করুন'}
        </button>
      </div>
      {savedMsg && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">{savedMsg}</div>}
      {errorMsg && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">{errorMsg}</div>}

      {/* Website Identity & SEO */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm">ব্র্যান্ডিং, যোগাযোগ ও SEO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1">ওয়েবসাইটের বাংলা নাম</label>
            <input type="text" value={siteForm.siteNameBn} onChange={(e) => setSiteForm({ ...siteForm, siteNameBn: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">ইংরেজি নাম</label>
            <input type="text" value={siteForm.siteNameEn} onChange={(e) => setSiteForm({ ...siteForm, siteNameEn: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div className="sm:col-span-2 space-y-2.5">
            <label className="block text-xs font-medium">ওয়েবসাইটের লোগো (আপলোড করুন অথবা ছবির URL দিন)</label>
            <div className="flex flex-wrap items-center gap-3">
              {siteForm.logoUrl && (
                <div className="w-12 h-12 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] p-1 flex items-center justify-center shrink-0">
                  <img src={siteForm.logoUrl} alt="Logo Preview" className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                </div>
              )}
              <input
                type="text"
                value={siteForm.logoUrl || ''}
                onChange={(e) => setSiteForm({ ...siteForm, logoUrl: e.target.value })}
                placeholder="লোগো URL (খালি রাখলে ডিফল্ট ইসলামিক লোগো দেখাবে)"
                className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E] text-xs font-semibold cursor-pointer hover:bg-[#EADBC0] transition-colors">
                <Upload className="w-4 h-4" />
                <span>{uploadingLogo ? 'আপলোড হচ্ছে...' : 'লোগো আপলোড'}</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
              </label>
              {siteForm.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> মুছুন
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1">যোগাযোগ ইমেইল</label>
            <input type="email" value={siteForm.contactEmail} onChange={(e) => setSiteForm({ ...siteForm, contactEmail: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">যোগাযোগ ফোন</label>
            <input type="text" value={siteForm.contactPhone} onChange={(e) => setSiteForm({ ...siteForm, contactPhone: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">Facebook লিংক</label>
            <input type="text" value={siteForm.facebookUrl} onChange={(e) => setSiteForm({ ...siteForm, facebookUrl: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">Telegram লিংক</label>
            <input type="text" value={siteForm.telegramUrl} onChange={(e) => setSiteForm({ ...siteForm, telegramUrl: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1">ফুটার পরিচিতি (Footer Intro)</label>
            <textarea rows={2} value={siteForm.footerIntro} onChange={(e) => setSiteForm({ ...siteForm, footerIntro: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">SEO Meta Title</label>
            <input type="text" value={siteForm.seoTitle} onChange={(e) => setSiteForm({ ...siteForm, seoTitle: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">Copyright টেক্সট</label>
            <input type="text" value={siteForm.copyrightText} onChange={(e) => setSiteForm({ ...siteForm, copyrightText: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
        </div>
      </div>

      {/* Donation Settings */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm">সহযোগিতা / অনুদান (bKash, Nagad, Bank)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1">মিশন শিরোনাম</label>
            <input type="text" value={donForm.missionTitle} onChange={(e) => setDonForm({ ...donForm, missionTitle: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1">মিশন বিবরণ</label>
            <textarea rows={3} value={donForm.missionDescription} onChange={(e) => setDonForm({ ...donForm, missionDescription: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">বিকাশ নম্বর</label>
            <input type="text" value={donForm.bkashNumber} onChange={(e) => setDonForm({ ...donForm, bkashNumber: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">নগদ নম্বর</label>
            <input type="text" value={donForm.nagadNumber} onChange={(e) => setDonForm({ ...donForm, nagadNumber: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">ব্যাংকের নাম</label>
            <input type="text" value={donForm.bankName} onChange={(e) => setDonForm({ ...donForm, bankName: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">ব্যাংক অ্যাকাউন্ট নম্বর</label>
            <input type="text" value={donForm.accountNumber} onChange={(e) => setDonForm({ ...donForm, accountNumber: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">হিসাবের নাম (Account Name)</label>
            <input type="text" value={donForm.accountName} onChange={(e) => setDonForm({ ...donForm, accountName: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">শাখা (Branch)</label>
            <input type="text" value={donForm.bankBranch} onChange={(e) => setDonForm({ ...donForm, bankBranch: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs mb-1">অনুদান নির্দেশনা</label>
            <textarea rows={2} value={donForm.instructions} onChange={(e) => setDonForm({ ...donForm, instructions: e.target.value })} className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm" />
          </div>
        </div>
      </div>
    </form>
  );
}

export function AdminPagesPanel() {
  const { pagesSettings } = useData();
  const [form, setForm] = useState(pagesSettings);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(pagesSettings);
  }, [pagesSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      await setDoc(doc(db, 'settings', 'pages'), { ...form, updatedAt: serverTimestamp() }, { merge: true });
      setSavedMsg('সকল তথ্য পেজ সফলভাবে হালনাগাদ হয়েছে।');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/pages');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
          তথ্য পেজসমূহ (Pages Management)
        </h2>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#AD823E] text-white text-xs font-semibold">
          <Check className="w-4 h-4" /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </button>
      </div>
      {savedMsg && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs">{savedMsg}</div>}

      <div className="space-y-4">
        {[
          ['aboutTitle', 'aboutContent', 'আমাদের সম্পর্কে (About Us)'],
          ['contactTitle', 'contactContent', 'যোগাযোগ (Contact Us)'],
          ['privacyTitle', 'privacyContent', 'গোপনীয়তা নীতি (Privacy Policy)'],
          ['termsTitle', 'termsContent', 'শর্তাবলী (Terms & Conditions)'],
        ].map(([titleKey, bodyKey, label]) => (
          <div key={titleKey} className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-[#8F682B]">{label}</h3>
            <input
              type="text"
              value={(form as any)[titleKey]}
              onChange={(e) => setForm({ ...form, [titleKey]: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm font-semibold"
            />
            <textarea
              rows={5}
              value={(form as any)[bodyKey]}
              onChange={(e) => setForm({ ...form, [bodyKey]: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
            />
          </div>
        ))}
      </div>
    </form>
  );
}
