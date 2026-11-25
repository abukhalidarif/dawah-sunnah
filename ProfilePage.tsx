import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  Camera,
  HelpCircle,
  History,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { uploadImageAsset } from '../lib/imageUpload';
import { formatBengaliDate, toBengaliDigits } from '../lib/bengaliUtils';
import { SeoHead } from '../components/SeoHead';

export function ProfilePage() {
  const {
    user,
    profile,
    role,
    isStaff,
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
    updateUserProfile,
  } = useAuth();
  const { bookmarks, readingHistory } = useData();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<'articles' | 'questions' | 'history' | 'edit'>('articles');
  const [editName, setEditName] = useState(profile?.displayName || user?.displayName || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editPhoto, setEditPhoto] = useState(profile?.photoURL || user?.photoURL || '');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setEditName(profile?.displayName || user?.displayName || '');
    setEditBio(profile?.bio || '');
    setEditPhoto(profile?.photoURL || user?.photoURL || '');
  }, [profile?.displayName, profile?.bio, profile?.photoURL, user?.displayName, user?.photoURL]);

  const savedArticles = bookmarks.filter((b) => b.itemType === 'article');
  const savedQuestions = bookmarks.filter((b) => b.itemType === 'question');

  const translateAuthError = (err: any) => {
    const code = err?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return 'ইমেইল/পাসওয়ার্ড লগইন সক্রিয় করতে Firebase Console > Authentication > Sign-in method থেকে Email/Password চালু করুন, অথবা Google দিয়ে লগইন করুন।';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
    }
    if (code === 'auth/email-already-in-use') {
      return 'এই ইমেইল দিয়ে ইতোমধ্যে অ্যাকাউন্ট খোলা হয়েছে।';
    }
    if (code === 'auth/weak-password') {
      return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
    }
    return err?.message || 'অথেনটিকেশন সম্পন্ন হয়নি। পুনরায় চেষ্টা করুন।';
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setBusy(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else if (authMode === 'register') {
        await registerWithEmail(name, email, password);
      } else {
        await resetPassword(email);
        setAuthInfo('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
      }
    } catch (err: any) {
      setAuthError(translateAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImageAsset(file, `avatars/${user?.uid || 'user'}`);
      setEditPhoto(url);
    } catch (err: any) {
      setSaveMsg(err?.message || 'ছবি আপলোড করা যায়নি');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);
    setBusy(true);
    try {
      await updateUserProfile({
        displayName: editName || profile?.displayName || user?.displayName || 'পাঠক',
        bio: editBio,
        photoURL: editPhoto,
      });
      setSaveMsg('প্রোফাইল সফলভাবে হালনাগাদ হয়েছে।');
    } catch (err: any) {
      setSaveMsg(err?.message || 'প্রোফাইল সংরক্ষণ করা যায়নি');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 lg:py-16">
        <SeoHead title="প্রোফাইল ও লগইন" description="আপনার প্রবন্ধ ও প্রশ্নোত্তর সংরক্ষণ করতে লগইন বা নিবন্ধন করুন।" />

        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E]">
              <UserIcon className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              {authMode === 'login'
                ? 'অ্যাকাউন্টে লগইন করুন'
                : authMode === 'register'
                ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
                : 'পাসওয়ার্ড পুনরুদ্ধার'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
              পছন্দের প্রবন্ধ ও মাসআলা সংরক্ষণ এবং পড়ার ইতিহাস দেখতে লগইন করুন
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="w-full py-3 px-4 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0] flex items-center justify-center gap-2.5 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
            </svg>
            <span>Google দিয়ে চালিয়ে যান</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E8DFCE] dark:border-[#2E251B] w-full" />
            <span className="px-3 text-xs text-[#9E8E7A] bg-white dark:bg-[#1C1711]">অথবা</span>
            <div className="border-t border-[#E8DFCE] dark:border-[#2E251B] w-full" />
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              {authError}
            </div>
          )}
          {authInfo && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
              {authInfo}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">আপনার নাম</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">ইমেইল</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>
            {authMode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {authMode === 'login' ? 'লগইন করুন' : authMode === 'register' ? 'নিবন্ধন করুন' : 'রিসেট লিংক পাঠান'}
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8F682B] dark:text-[#D4A75E] pt-2">
            {authMode === 'login' ? (
              <>
                <button type="button" onClick={() => setAuthMode('register')} className="hover:underline">
                  নতুন অ্যাকাউন্ট খুলুন
                </button>
                <button type="button" onClick={() => setAuthMode('reset')} className="hover:underline">
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setAuthMode('login')} className="hover:underline">
                লগইন পাতায় ফিরে যান
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
      <SeoHead title="আমার প্রোফাইল" />

      {/* User Header Card */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-4">
          {profile?.photoURL || user.photoURL ? (
            <img
              src={profile?.photoURL || user.photoURL || ''}
              alt={profile?.displayName || 'প্রোফাইল'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#E8DFCE]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E]">
              <UserIcon className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
              {profile?.displayName || user.displayName || 'পাঠক'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">{user.email}</p>
            {profile?.bio && (
              <p className="text-xs text-[#7C6A55] dark:text-[#9E8E7A] mt-1">{profile.bio}</p>
            )}
            <p className="text-xs font-semibold text-[#AD823E] dark:text-[#D4A75E] mt-1">
              ভূমিকা: {role === 'super_admin' ? 'সুপার অ্যাডমিন' : role === 'admin' ? 'অ্যাডমিন' : role === 'editor' ? 'এডিটর' : 'পাঠক'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isStaff && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs sm:text-sm font-semibold"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>অ্যাডমিন ড্যাশবোর্ড</span>
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs sm:text-sm font-medium text-[#6E5D4B] dark:text-[#CBBBA6] hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'articles', label: `সংরক্ষিত প্রবন্ধ (${toBengaliDigits(savedArticles.length)})`, icon: BookOpen },
          { id: 'questions', label: `প্রিয় প্রশ্নোত্তর (${toBengaliDigits(savedQuestions.length)})`, icon: HelpCircle },
          { id: 'history', label: `পড়ার ইতিহাস (${toBengaliDigits(readingHistory.length)})`, icon: History },
          { id: 'edit', label: 'প্রোফাইল সম্পাদনা', icon: UserIcon },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id as any);
                if (t.id === 'edit') {
                  setEditName(profile?.displayName || user.displayName || '');
                  setEditBio(profile?.bio || '');
                  setEditPhoto(profile?.photoURL || user.photoURL || '');
                }
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === t.id
                  ? 'bg-[#AD823E] text-white'
                  : 'bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] text-[#6E5D4B] dark:text-[#B6A691]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-6 shadow-xs">
        {activeTab === 'articles' && (
          <div className="space-y-3">
            {savedArticles.length === 0 ? (
              <p className="text-center py-8 text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                আপনি এখনো কোনো প্রবন্ধ সংরক্ষণ করেননি।
              </p>
            ) : (
              savedArticles.map((b) => (
                <Link
                  key={b.id}
                  to={`/articles/${b.slug}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF6EF] dark:bg-[#16120D] hover:border-[#AD823E] border border-[#E8DFCE] dark:border-[#2E251B]"
                >
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0]">{b.title}</p>
                    <p className="text-xs text-[#7C6A55] dark:text-[#9E8E7A] mt-0.5">{b.categoryName}</p>
                  </div>
                  <Bookmark className="w-4 h-4 text-[#AD823E] shrink-0" />
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-3">
            {savedQuestions.length === 0 ? (
              <p className="text-center py-8 text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                আপনি এখনো কোনো প্রশ্নোত্তর প্রিয় তালিকায় যোগ করেননি।
              </p>
            ) : (
              savedQuestions.map((b) => (
                <Link
                  key={b.id}
                  to={`/questions/${b.slug}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF6EF] dark:bg-[#16120D] hover:border-[#AD823E] border border-[#E8DFCE] dark:border-[#2E251B]"
                >
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0]">{b.title}</p>
                    <p className="text-xs text-[#7C6A55] dark:text-[#9E8E7A] mt-0.5">{b.categoryName}</p>
                  </div>
                  <Bookmark className="w-4 h-4 text-[#AD823E] shrink-0" />
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {readingHistory.length === 0 ? (
              <p className="text-center py-8 text-sm text-[#6E5D4B] dark:text-[#B6A691]">
                আপনার পড়ার ইতিহাস এখনো খালি।
              </p>
            ) : (
              readingHistory.map((h) => (
                <Link
                  key={h.id}
                  to={h.itemType === 'article' ? `/articles/${h.slug}` : `/questions/${h.slug}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF6EF] dark:bg-[#16120D] hover:border-[#AD823E] border border-[#E8DFCE] dark:border-[#2E251B]"
                >
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0]">{h.title}</p>
                    <p className="text-xs text-[#7C6A55] dark:text-[#9E8E7A] mt-0.5">
                      {h.itemType === 'article' ? 'প্রবন্ধ' : 'প্রশ্নোত্তর'} · {formatBengaliDate(h.viewedAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'edit' && (
          <form onSubmit={handleProfileSave} className="max-w-lg space-y-4">
            {saveMsg && (
              <div className="p-3 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-xs sm:text-sm text-[#8F682B] dark:text-[#D4A75E]">
                {saveMsg}
              </div>
            )}

            <div className="flex items-center gap-4">
              {editPhoto ? (
                <img
                  src={editPhoto}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E8DFCE]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#FAF6EF] dark:bg-[#120F0B] flex items-center justify-center text-[#AD823E]">
                  <UserIcon className="w-7 h-7" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] text-xs font-semibold cursor-pointer hover:border-[#AD823E]">
                <Camera className="w-4 h-4 text-[#AD823E]" />
                <span>{uploadingPhoto ? 'আপলোড হচ্ছে...' : 'প্রোফাইল ছবি পরিবর্তন'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">পূর্ণ নাম</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">সংক্ষিপ্ত পরিচিতি</label>
              <textarea
                rows={3}
                maxLength={400}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={busy || uploadingPhoto}
              className="px-6 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {busy ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
