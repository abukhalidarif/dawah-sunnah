import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CheckCircle2, Clock, Eye, Phone, Trash2, X, XCircle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { DonationRecord } from '../../types';
import { formatBengaliDate, toBengaliDigits } from '../../lib/bengaliUtils';
import { DonationReceiptCard } from '../../components/DonationReceiptCard';

const METHOD_BADGE: Record<DonationRecord['method'], string> = {
  bkash: 'বিকাশ',
  nagad: 'নগদ',
  rocket: 'রকেট',
  bank: 'ব্যাংক',
};

export function AdminDonationsPanel() {
  const { user, isAdmin } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<DonationRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubD = onSnapshot(
      collection(db, 'donations'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as DonationRecord);
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setDonations(list);
      },
      (err) => console.warn('Donations listener:', err)
    );

    const unsubC = onSnapshot(
      collection(db, 'donation_contacts'),
      (snap) => {
        const map: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as { donationId?: string; contactInfo?: string };
          if (data.donationId && data.contactInfo) {
            map[data.donationId] = data.contactInfo;
          }
        });
        setContacts(map);
      },
      () => {}
    );

    return () => {
      unsubD();
      unsubC();
    };
  }, []);

  const totalVerifiedAmount = useMemo(
    () => donations.filter((d) => d.status === 'verified').reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    [donations]
  );

  const pendingCount = useMemo(() => donations.filter((d) => d.status === 'pending').length, [donations]);

  const filtered = useMemo(() => {
    if (filter === 'all') return donations;
    return donations.filter((d) => d.status === filter);
  }, [donations, filter]);

  const handleStatusUpdate = async (donation: DonationRecord, nextStatus: 'verified' | 'rejected') => {
    if (!user) return;
    setUpdatingId(donation.id);
    try {
      await updateDoc(doc(db, 'donations', donation.id), {
        status: nextStatus,
        verifiedBy: user.uid,
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `donations/${donation.id}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'donations', id));
      try {
        await deleteDoc(doc(db, 'donation_contacts', id));
      } catch {
        // contact doc may not exist
      }
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `donations/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0]">
            অনুদান ও রিসিট ব্যবস্থাপনা ({toBengaliDigits(donations.length)})
          </h2>
          <p className="text-xs text-[#6E5D4B] dark:text-[#B6A691]">
            দাতাদের প্রেরিত ট্রানজেকশন যাচাই করে অফিসিয়াল রিসিট অনুমোদন করুন
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
            <span className="text-emerald-700 dark:text-emerald-300">যাচাইকৃত মোট: </span>
            <span className="font-bold text-emerald-800 dark:text-emerald-200 tabular-nums-bn">
              ৳ {toBengaliDigits(totalVerifiedAmount.toLocaleString('en-US'))}
            </span>
          </div>
          {pendingCount > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200">
              অপেক্ষমাণ: {toBengaliDigits(pendingCount)}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'সকল' },
          { key: 'pending', label: 'অপেক্ষমাণ' },
          { key: 'verified', label: 'যাচাইকৃত' },
          { key: 'rejected', label: 'বাতিল' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filter === item.key
                ? 'bg-[#AD823E] text-white border-[#AD823E]'
                : 'bg-white dark:bg-[#1C1711] border-[#E8DFCE] dark:border-[#2E251B] text-[#5A4B3C] dark:text-[#CBBBA6]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Donations List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center text-sm text-[#6E5D4B] dark:text-[#B6A691]">
            এই বিভাগে এখনো কোনো অনুদানের তথ্য নেই।
          </div>
        ) : (
          filtered.map((don) => (
            <div
              key={don.id}
              className="bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-[#9C712E] dark:text-[#D4A75E] tabular-nums-bn">
                    ৳ {toBengaliDigits(don.amount.toLocaleString('en-US'))}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5ECDB] dark:bg-[#2B2114] text-[#8F682B] dark:text-[#D4A75E]">
                    {METHOD_BADGE[don.method] || don.method}
                  </span>
                  <span className="text-xs font-mono text-[#6E5D4B] dark:text-[#B6A691]">
                    {don.receiptNo}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      don.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                        : don.status === 'rejected'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                    }`}
                  >
                    {don.status === 'verified' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> যাচাইকৃত
                      </>
                    ) : don.status === 'rejected' ? (
                      <>
                        <XCircle className="w-3 h-3" /> বাতিল
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> অপেক্ষমাণ
                      </>
                    )}
                  </span>
                </div>

                <p className="text-sm font-semibold text-[#2D2216] dark:text-[#F4ECE0]">
                  দাতা: {don.donorName}
                  {don.purpose ? ` • খাত: ${don.purpose}` : ''}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E5D4B] dark:text-[#B6A691]">
                  <span>
                    TrxID: <strong className="font-mono text-[#2D2216] dark:text-[#F4ECE0]">{don.transactionId}</strong>
                  </span>
                  {don.senderLastDigits && <span>শেষ ডিজিট: {don.senderLastDigits}</span>}
                  {contacts[don.id] && (
                    <span className="inline-flex items-center gap-1 text-[#8F682B] dark:text-[#D4A75E]">
                      <Phone className="w-3 h-3" /> {contacts[don.id]}
                    </span>
                  )}
                  <span>তারিখ: {formatBengaliDate(don.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(don)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF6EF] dark:bg-[#261E15] border border-[#E8DFCE] dark:border-[#2E251B] text-xs font-semibold text-[#8F682B] dark:text-[#D4A75E]"
                >
                  <Eye className="w-3.5 h-3.5" /> রিসিট দেখুন
                </button>

                {don.status !== 'verified' && (
                  <button
                    type="button"
                    disabled={updatingId === don.id}
                    onClick={() => handleStatusUpdate(don, 'verified')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> অনুমোদন
                  </button>
                )}

                {don.status === 'pending' && (
                  <button
                    type="button"
                    disabled={updatingId === don.id}
                    onClick={() => handleStatusUpdate(don, 'rejected')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold"
                  >
                    বাতিল
                  </button>
                )}

                {isAdmin &&
                  (confirmDeleteId === don.id ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(don.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold"
                      >
                        নিশ্চিত
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 rounded-lg border border-[#E8DFCE] dark:border-[#2E251B] text-xs"
                      >
                        না
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(don.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl my-8">
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] flex items-center justify-center shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <DonationReceiptCard donation={selectedReceipt} />
          </div>
        </div>
      )}
    </div>
  );
}
