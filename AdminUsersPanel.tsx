import React, { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { Check, Copy, MailPlus, Shield, ShieldCheck, Trash2, UserCheck, Users } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { AdminInvite, RoleType, UserProfile, UserRoleDoc } from '../../types';
import { toBengaliDigits } from '../../lib/bengaliUtils';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function AdminUsersPanel() {
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, UserRoleDoc>>({});
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'admin' | 'editor'>('admin');
  const [inviteNote, setInviteNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmRemoveEmail, setConfirmRemoveEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const u1 = onSnapshot(
      collection(db, 'users'),
      (snap) => setUsers(snap.docs.map((d) => d.data() as UserProfile)),
      (err) => console.warn('Users list:', err)
    );
    const u2 = onSnapshot(
      collection(db, 'user_roles'),
      (snap) => {
        const map: Record<string, UserRoleDoc> = {};
        snap.docs.forEach((d) => {
          map[d.id] = d.data() as UserRoleDoc;
        });
        setRoles(map);
      },
      (err) => console.warn('Roles list:', err)
    );
    const u3 = onSnapshot(
      collection(db, 'admin_invites'),
      (snap) => setInvites(snap.docs.map((d) => d.data() as AdminInvite)),
      (err) => console.warn('Invites list:', err)
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center text-sm text-[#6E5D4B]">
        ইউজার ও ভূমিকা ব্যবস্থাপনার জন্য অ্যাডমিন বা সুপার অ্যাডমিন অনুমতি প্রয়োজন।
      </div>
    );
  }

  const assignRole = async (targetUser: UserProfile, newRole: RoleType) => {
    setNotice(null);
    const normalizedEmail = targetUser.email.trim().toLowerCase();
    try {
      await setDoc(doc(db, 'user_roles', targetUser.uid), {
        uid: targetUser.uid,
        email: normalizedEmail,
        role: newRole,
        assignedBy: currentUser?.uid || '',
        updatedAt: serverTimestamp(),
      });

      if (normalizedEmail && EMAIL_PATTERN.test(normalizedEmail)) {
        if (newRole === 'user') {
          await deleteDoc(doc(db, 'admin_invites', normalizedEmail)).catch(() => {});
        } else {
          const existingInv = invites.find((i) => i.email === normalizedEmail);
          await setDoc(doc(db, 'admin_invites', normalizedEmail), {
            email: normalizedEmail,
            role: newRole,
            note: existingInv?.note || targetUser.displayName || '',
            assignedBy: currentUser?.uid || '',
            assignedByEmail: currentUser?.email || '',
            createdAt: existingInv?.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      setNotice({
        type: 'success',
        text: `${targetUser.displayName}-এর ভূমিকা সফলভাবে হালনাগাদ হয়েছে।`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `user_roles/${targetUser.uid}`);
    }
  };

  const handleAddAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setNotice({ type: 'error', text: 'অনুগ্রহ করে একটি সঠিক ইমেইল / Gmail ঠিকানা লিখুন।' });
      return;
    }

    setSubmitting(true);
    try {
      const existingInv = invites.find((i) => i.email === cleanEmail);
      await setDoc(doc(db, 'admin_invites', cleanEmail), {
        email: cleanEmail,
        role: inviteRole,
        note: inviteNote.trim(),
        assignedBy: currentUser?.uid || '',
        assignedByEmail: currentUser?.email || '',
        createdAt: existingInv?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const matchingUser = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
      if (matchingUser) {
        await setDoc(doc(db, 'user_roles', matchingUser.uid), {
          uid: matchingUser.uid,
          email: cleanEmail,
          role: inviteRole,
          assignedBy: currentUser?.uid || '',
          updatedAt: serverTimestamp(),
        });
      }

      setInviteEmail('');
      setInviteNote('');
      setNotice({
        type: 'success',
        text: `${cleanEmail}-কে সফলভাবে ${
          inviteRole === 'super_admin'
            ? 'সুপার অ্যাডমিন'
            : inviteRole === 'admin'
            ? 'অ্যাডমিন'
            : 'এডিটর'
        } হিসেবে যুক্ত করা হয়েছে! তিনি Google দিয়ে লগইন করলেই অ্যাডমিন প্যানেলে প্রবেশ করতে পারবেন।`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admin_invites/${cleanEmail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvite = async (email: string) => {
    setNotice(null);
    try {
      await deleteDoc(doc(db, 'admin_invites', email));
      const matchingUser = users.find((u) => u.email.trim().toLowerCase() === email.toLowerCase());
      if (matchingUser && matchingUser.uid !== currentUser?.uid) {
        await setDoc(doc(db, 'user_roles', matchingUser.uid), {
          uid: matchingUser.uid,
          email: matchingUser.email.trim().toLowerCase(),
          role: 'user',
          assignedBy: currentUser?.uid || '',
          updatedAt: serverTimestamp(),
        });
      }
      setConfirmRemoveEmail(null);
      setNotice({ type: 'success', text: `${email}-এর অ্যাডমিন অনুমতি প্রত্যাহার করা হয়েছে।` });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admin_invites/${email}`);
    }
  };

  const copyAdminLoginLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/admin/login`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // ignore
    }
  };

  const roleBadgeLabel = (r: RoleType) =>
    r === 'super_admin'
      ? 'সুপার অ্যাডমিন'
      : r === 'admin'
      ? 'অ্যাডমিন'
      : r === 'editor'
      ? 'এডিটর'
      : 'সাধারণ ইউজার';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            ইউজার ও অ্যাডমিন নিয়োগ ({toBengaliDigits(users.length)})
          </h2>
          <p className="text-xs sm:text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            যেকোনো Gmail/ইমেইল ঠিকানায় অ্যাডমিন বা এডিটর দায়িত্ব দিন — তারা লগইন করলেই সরাসরি প্যানেল পাবেন
          </p>
        </div>

        <button
          type="button"
          onClick={copyAdminLoginLink}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] hover:border-[#AD823E] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E] transition-colors shrink-0"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copiedLink ? 'লগইন লিংক কপি হয়েছে' : 'অ্যাডমিন লগইন লিংক কপি করুন'}</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Grant Admin by Email Card */}
      <form
        onSubmit={handleAddAdminByEmail}
        className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F5ECDB] dark:bg-[#2B2114] text-[#AD823E] flex items-center justify-center">
            <MailPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-bn font-bold text-base text-[#2D2216] dark:text-[#F4ECE0]">
              নতুন কাউকে অ্যাডমিন বা এডিটর করুন
            </h3>
            <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
              তাঁর Gmail / ইমেইল ঠিকানা দিয়ে যুক্ত করুন (আগে একাউন্ট না থাকলেও কাজ করবে)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
              অ্যাডমিনের Gmail / ইমেইল *
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
              ভূমিকা (Role) *
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
            >
              <option value="admin">অ্যাডমিন (পূর্ণ নিয়ন্ত্রণ)</option>
              <option value="editor">এডিটর (প্রবন্ধ ও প্রশ্নোত্তর)</option>
              {isSuperAdmin && <option value="super_admin">সুপার অ্যাডমিন</option>}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-[#5A4B3C] dark:text-[#CBBBA6] mb-1">
              পরিচিতি / নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              maxLength={120}
              value={inviteNote}
              onChange={(e) => setInviteNote(e.target.value)}
              placeholder="যেমন: সহ-সম্পাদক"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-sm text-[#2D2216] dark:text-[#F4ECE0] focus:outline-none focus:border-[#AD823E]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'যুক্ত হচ্ছে...' : 'অ্যাডমিন হিসেবে যুক্ত করুন'}</span>
          </button>
        </div>
      </form>

      {/* Invited & Authorized Admins List */}
      {invites.length > 0 && (
        <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-[#FAF6EF] dark:bg-[#16120D] border-b border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-between">
            <h3 className="font-serif-bn font-bold text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#AD823E]" />
              <span>অনুমোদিত অ্যাডমিন ও এডিটর ({toBengaliDigits(invites.length)})</span>
            </h3>
          </div>
          <div className="divide-y divide-[#F0E7D8] dark:divide-[#2E251B]">
            {invites.map((inv) => {
              const matchedUser = users.find((u) => u.email.toLowerCase() === inv.email.toLowerCase());
              return (
                <div
                  key={inv.email}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-[#2D2216] dark:text-[#F4ECE0]">
                        {inv.email}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E]">
                        {roleBadgeLabel(inv.role)}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          matchedUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {matchedUser ? '• সক্রিয়' : '• প্রথম লগইনের অপেক্ষায়'}
                      </span>
                    </div>
                    {inv.note && (
                      <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">{inv.note}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {confirmRemoveEmail === inv.email ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.email)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                        >
                          অপসারণ নিশ্চিত
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveEmail(null)}
                          className="px-3 py-1.5 rounded-lg border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
                        >
                          বাতিল
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={inv.role === 'super_admin' && !isSuperAdmin}
                        onClick={() => setConfirmRemoveEmail(inv.email)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>অপসারণ</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Registered Users Table */}
      <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-[#FAF6EF] dark:bg-[#16120D] border-b border-[#E8DFCE] dark:border-[#2E251B]">
          <h3 className="font-serif-bn font-bold text-sm sm:text-base text-[#2D2216] dark:text-[#F4ECE0] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#AD823E]" />
            <span>নিবন্ধিত ইউজারসমূহ</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF6EF] dark:bg-[#16120D] border-b border-[#E8DFCE] dark:border-[#2E251B] text-xs text-[#6E5D4B] dark:text-[#B6A691]">
              <tr>
                <th className="py-3 px-4">নাম</th>
                <th className="py-3 px-4">ইমেইল</th>
                <th className="py-3 px-4">বর্তমান ভূমিকা</th>
                <th className="py-3 px-4 text-right">ভূমিকা পরিবর্তন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E7D8] dark:divide-[#2E251B]">
              {users.map((u) => {
                const currentRole = roles[u.uid]?.role || 'user';
                return (
                  <tr key={u.uid} className="hover:bg-[#FAF6EF]/50 dark:hover:bg-[#16120D]/50">
                    <td className="py-3 px-4 font-medium text-[#2D2216] dark:text-[#F4ECE0]">
                      {u.displayName}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#6E5D4B] dark:text-[#B6A691]">{u.email}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#AD823E]">
                      <span className="inline-flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {roleBadgeLabel(currentRole)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={currentRole}
                        disabled={currentRole === 'super_admin' && !isSuperAdmin}
                        onChange={(e) => assignRole(u, e.target.value as RoleType)}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF6EF] dark:bg-[#120F0B] border border-[#E8DFCE] dark:border-[#2E251B] text-xs focus:outline-none focus:border-[#AD823E]"
                      >
                        <option value="user">সাধারণ ইউজার</option>
                        <option value="editor">এডিটর</option>
                        <option value="admin">অ্যাডমিন</option>
                        {isSuperAdmin && <option value="super_admin">সুপার অ্যাডমিন</option>}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
