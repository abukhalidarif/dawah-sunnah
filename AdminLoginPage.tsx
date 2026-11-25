import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { SeoHead } from '../components/SeoHead';

export function AdminLoginPage() {
  const { user, isStaff, loading, signInWithGoogle, loginWithEmail, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && isStaff) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, isStaff, navigate]);

  const handleGoogleAdminLogin = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google লগইন ব্যর্থ হয়েছে।');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBusy(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setErrorMsg('অ্যাডমিন ইমেইল বা পাসওয়ার্ড সঠিক নয় অথবা Email/Password সক্রিয় নয়।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-[#120F0B] text-[#2D2216] dark:text-[#F4ECE0] flex items-center justify-center px-4 py-12">
      <SeoHead title="অ্যাডমিন লগইন" />

      <div className="max-w-md w-full bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-3xl p-7 sm:p-9 shadow-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#AD823E] dark:text-[#D4A75E]">
            <ShieldCheck className="w-4 h-4" />
            <span>সুরক্ষিত অ্যাডমিন প্যানেল প্রবেশ</span>
          </div>
          <h1 className="text-2xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            অ্যাডমিনিস্ট্রেটর লগইন
          </h1>
          <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            কেবল অনুমোদিত সুপার অ্যাডমিন, অ্যাডমিন এবং এডিটরগণ ড্যাশবোর্ডে প্রবেশ করতে পারবেন।
          </p>
        </div>

        {user && !isStaff && !loading && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold">
              আপনি ({user.email}) বর্তমানে অনুমোদিত অ্যাডমিন তালিকায় নেই।
            </p>
            <p>
              সুপার অ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করুন অথবা সুপার অ্যাডমিনের মাধ্যমে আপনার অ্যাকাউন্টে এডিটর/অ্যাডমিন ভূমিকা বরাদ্দ করুন।
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-1 px-3 py-1.5 rounded-lg bg-amber-700 text-white font-medium"
            >
              অন্য অ্যাকাউন্ট দিয়ে লগইন করুন
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleAdminLogin}
          disabled={busy}
          className="w-full py-3 px-4 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Lock className="w-4 h-4" />
          <span>Google অ্যাকাউন্ট দিয়ে অ্যাডমিন প্রবেশ</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#E8DFCE] dark:border-[#2E251B] w-full" />
          <span className="px-3 text-xs text-[#9E8E7A] bg-white dark:bg-[#1C1711]">অথবা</span>
          <div className="border-t border-[#E8DFCE] dark:border-[#2E251B] w-full" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3.5">
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
          <div>
            <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">পাসওয়ার্ড</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#16120D] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0]"
          >
            ইমেইল দিয়ে প্রবেশ করুন
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5D4B] dark:text-[#B6A691] hover:text-[#AD823E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মূল ওয়েবসাইটে ফিরে যান</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
