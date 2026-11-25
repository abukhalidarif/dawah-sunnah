import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_DONATION_SETTINGS,
  DEFAULT_PAGES_SETTINGS,
  DEFAULT_PRAYER_SETTINGS,
  DEFAULT_SITE_SETTINGS,
} from '../data/defaultSeedData';
import { AUTHENTIC_DUAS, DuaItem } from '../data/duasData';
import {
  AUTHENTIC_MASALAS,
  AUTHENTIC_TOPIC_ARTICLES,
  AUTHENTIC_TOPIC_QUESTIONS,
} from '../data/islamicTopicsData';
import {
  Article,
  Author,
  BookmarkItem,
  Category,
  DonationSettings,
  MasalaItem,
  PagesSettings,
  PrayerSettings,
  Question,
  ReadingHistoryItem,
  SiteSettings,
  SiteStats,
} from '../types';
import { useAuth } from './AuthContext';
import { createSafeId } from '../lib/bengaliUtils';

interface DataContextValue {
  categories: Category[];
  authors: Author[];
  articles: Article[];
  publishedArticles: Article[];
  questions: Question[];
  publishedQuestions: Question[];
  masalas: MasalaItem[];
  publishedMasalas: MasalaItem[];
  duas: DuaItem[];
  siteSettings: SiteSettings;
  prayerSettings: PrayerSettings;
  donationSettings: DonationSettings;
  pagesSettings: PagesSettings;
  siteStats: SiteStats;
  bookmarks: BookmarkItem[];
  readingHistory: ReadingHistoryItem[];
  isDatabaseSeeded: boolean;
  loadingData: boolean;
  seedDatabase: (force?: boolean) => Promise<void>;
  clearAllContent: () => Promise<{ articles: number; questions: number; authors: number }>;
  restoreDefaultDuas: (force?: boolean) => Promise<number>;
  clearAllDuas: () => Promise<number>;
  restoreIslamicTopicsContent: (force?: boolean) => Promise<{ masalas: number; questions: number; articles: number }>;
  clearAllMasalas: () => Promise<number>;
  toggleBookmark: (item: {
    itemId: string;
    itemType: 'article' | 'question';
    title: string;
    slug: string;
    categoryName?: string;
  }) => Promise<boolean>;
  isBookmarked: (itemId: string) => boolean;
  recordReadingHistory: (item: {
    itemId: string;
    itemType: 'article' | 'question';
    title: string;
    slug: string;
    categoryName?: string;
  }) => Promise<void>;
  incrementArticleView: (articleId: string) => Promise<void>;
  incrementQuestionView: (questionId: string) => Promise<void>;
  submitPublicQuestion: (payload: {
    askerName: string;
    contactInfo?: string;
    categoryId: string;
    categoryName: string;
    title: string;
    questionText: string;
  }) => Promise<string>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isStaff, isAdmin } = useAuth();

  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbAuthors, setDbAuthors] = useState<Author[]>([]);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
  const [dbMasalas, setDbMasalas] = useState<MasalaItem[]>([]);
  const [dbDuas, setDbDuas] = useState<DuaItem[]>([]);
  const [dbSiteSettings, setDbSiteSettings] = useState<SiteSettings | null>(null);
  const [dbPrayerSettings, setDbPrayerSettings] = useState<PrayerSettings | null>(null);
  const [dbDonationSettings, setDbDonationSettings] = useState<DonationSettings | null>(null);
  const [dbPagesSettings, setDbPagesSettings] = useState<PagesSettings | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats>({ totalVisits: 1240 });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const hasAutoSeededRef = useRef(false);
  const hasInitializedDuasRef = useRef(false);
  const hasAddedDuaCardRef = useRef(false);
  const hasInitializedTopicsRef = useRef(false);
  const hasSyncedTopicAuthorsRef = useRef(false);
  const hasTrackedVisitRef = useRef(false);

  const isDatabaseSeeded = Boolean(dbSiteSettings?.seeded);

  // Public listeners: categories, authors, settings, stats
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        query(collection(db, 'categories'), orderBy('order', 'asc')),
        (snap) => {
          setDbCategories(snap.docs.map((d) => d.data() as Category));
        },
        (err) => console.warn('Categories listener:', err)
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'authors'),
        (snap) => {
          setDbAuthors(snap.docs.map((d) => d.data() as Author));
        },
        (err) => console.warn('Authors listener:', err)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'site'),
        (snap) => {
          if (snap.exists()) {
            setDbSiteSettings(snap.data() as SiteSettings);
          } else {
            setDbSiteSettings(null);
          }
          setLoadingData(false);
        },
        () => setLoadingData(false)
      )
    );

    unsubs.push(
      onSnapshot(doc(db, 'settings', 'prayer'), (snap) => {
        if (snap.exists()) setDbPrayerSettings(snap.data() as PrayerSettings);
      })
    );

    unsubs.push(
      onSnapshot(doc(db, 'settings', 'donations'), (snap) => {
        if (snap.exists()) setDbDonationSettings(snap.data() as DonationSettings);
      })
    );

    unsubs.push(
      onSnapshot(doc(db, 'settings', 'pages'), (snap) => {
        if (snap.exists()) setDbPagesSettings(snap.data() as PagesSettings);
      })
    );

    unsubs.push(
      onSnapshot(doc(db, 'stats', 'overview'), (snap) => {
        if (snap.exists()) setSiteStats(snap.data() as SiteStats);
      })
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'duas'),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as DuaItem);
          list.sort((a, b) => {
            const oa = typeof a.order === 'number' ? a.order : 9999;
            const ob = typeof b.order === 'number' ? b.order : 9999;
            if (oa !== ob) return oa - ob;
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return ta - tb;
          });
          setDbDuas(list);
        },
        (err) => console.warn('Duas listener:', err)
      )
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  // Articles & Questions listeners (Staff sees all including drafts/pending; public sees published only)
  useEffect(() => {
    const artQuery = isStaff
      ? query(collection(db, 'articles'))
      : query(collection(db, 'articles'), where('status', '==', 'published'));

    const qQuery = isStaff
      ? query(collection(db, 'questions'))
      : query(collection(db, 'questions'), where('status', '==', 'published'));

    const unsubArt = onSnapshot(
      artQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Article);
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
        setDbArticles(list);
      },
      (err) => console.warn('Articles listener:', err)
    );

    const unsubQ = onSnapshot(
      qQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Question);
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return tb - ta;
        });
        setDbQuestions(list);
      },
      (err) => console.warn('Questions listener:', err)
    );

    const mQuery = isStaff
      ? query(collection(db, 'masalas'))
      : query(collection(db, 'masalas'), where('status', '==', 'published'));

    const unsubM = onSnapshot(
      mQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as MasalaItem);
        list.sort((a, b) => {
          const oa = typeof a.order === 'number' ? a.order : 9999;
          const ob = typeof b.order === 'number' ? b.order : 9999;
          if (oa !== ob) return oa - ob;
          const ta = a.createdAt?.toMillis?.() || 0;
          const tb = b.createdAt?.toMillis?.() || 0;
          return ta - tb;
        });
        setDbMasalas(list);
      },
      (err) => console.warn('Masalas listener:', err)
    );

    return () => {
      unsubArt();
      unsubQ();
      unsubM();
    };
  }, [isStaff]);

  // User-specific Bookmarks & Reading History
  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setReadingHistory([]);
      return;
    }

    const unsubB = onSnapshot(
      collection(db, 'users', user.uid, 'bookmarks'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as BookmarkItem);
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setBookmarks(list);
      },
      (err) => console.warn('Bookmarks listener:', err)
    );

    const unsubH = onSnapshot(
      collection(db, 'users', user.uid, 'reading_history'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as ReadingHistoryItem);
        list.sort((a, b) => (b.viewedAt?.toMillis?.() || 0) - (a.viewedAt?.toMillis?.() || 0));
        setReadingHistory(list);
      },
      (err) => console.warn('History listener:', err)
    );

    return () => {
      unsubB();
      unsubH();
    };
  }, [user]);

  const seedDatabase = useCallback(async (force = false) => {
    if (!force && dbSiteSettings?.seeded) return;

    try {
      const [catSnap, siteSnap, prayerSnap, donationSnap, pagesSnap, statsSnap] =
        await Promise.all([
          getDocs(collection(db, 'categories')),
          getDoc(doc(db, 'settings', 'site')),
          getDoc(doc(db, 'settings', 'prayer')),
          getDoc(doc(db, 'settings', 'donations')),
          getDoc(doc(db, 'settings', 'pages')),
          getDoc(doc(db, 'stats', 'overview')),
        ]);

      const existingCats = new Map(catSnap.docs.map((d) => [d.id, d.data()]));

      // Only initialize categories (if empty or forced) & core site/prayer/donation/page settings.
      // Never auto-create sample articles, questions, or authors so admin stays in full control.
      const batch = writeBatch(db);
      let ops = 0;

      if (force || existingCats.size === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          const ref = doc(db, 'categories', cat.id);
          const existing = existingCats.get(cat.id);
          if (!existing) {
            batch.set(ref, {
              ...cat,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            ops++;
          } else if (force && existing.createdAt) {
            batch.set(ref, {
              ...cat,
              createdAt: existing.createdAt,
              updatedAt: serverTimestamp(),
            });
            ops++;
          }
        }
      }

      if (!siteSnap.exists()) {
        batch.set(doc(db, 'settings', 'site'), {
          ...DEFAULT_SITE_SETTINGS,
          seeded: true,
          updatedAt: serverTimestamp(),
        });
        ops++;
      } else if (!siteSnap.data()?.seeded) {
        batch.update(doc(db, 'settings', 'site'), {
          seeded: true,
          updatedAt: serverTimestamp(),
        });
        ops++;
      }

      if (!prayerSnap.exists()) {
        batch.set(doc(db, 'settings', 'prayer'), {
          ...DEFAULT_PRAYER_SETTINGS,
          updatedAt: serverTimestamp(),
        });
        ops++;
      }

      if (!donationSnap.exists()) {
        batch.set(doc(db, 'settings', 'donations'), {
          ...DEFAULT_DONATION_SETTINGS,
          updatedAt: serverTimestamp(),
        });
        ops++;
      }

      if (!pagesSnap.exists()) {
        batch.set(doc(db, 'settings', 'pages'), {
          ...DEFAULT_PAGES_SETTINGS,
          updatedAt: serverTimestamp(),
        });
        ops++;
      }

      if (!statsSnap.exists()) {
        batch.set(doc(db, 'stats', 'overview'), {
          totalVisits: 0,
          updatedAt: serverTimestamp(),
        });
        ops++;
      }

      if (ops > 0) {
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed_database');
    }
  }, [dbSiteSettings?.seeded]);

  const clearAllContent = useCallback(async () => {
    if (!isAdmin) {
      throw new Error('শুধুমাত্র অ্যাডমিন সকল কনটেন্ট মুছতে পারবেন।');
    }
    try {
      const [artSnap, qSnap, qContactSnap, authorSnap] = await Promise.all([
        getDocs(collection(db, 'articles')),
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'question_contacts')),
        getDocs(collection(db, 'authors')),
      ]);

      const refs = [
        ...artSnap.docs.map((d) => d.ref),
        ...qSnap.docs.map((d) => d.ref),
        ...qContactSnap.docs.map((d) => d.ref),
        ...authorSnap.docs.map((d) => d.ref),
      ];

      // Delete in Firestore batch chunks of up to 400
      for (let i = 0; i < refs.length; i += 400) {
        const chunk = refs.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      await setDoc(
        doc(db, 'settings', 'site'),
        { topicsContentInitialized: true, updatedAt: serverTimestamp() },
        { merge: true }
      );

      return {
        articles: artSnap.size,
        questions: qSnap.size,
        authors: authorSnap.size,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'clear_all_content');
    }
  }, [isAdmin]);

  const restoreDefaultDuas = useCallback(
    async (force = false) => {
      if (!isStaff) {
        throw new Error('দুআ সংকলন যোগ করার অনুমতি নেই।');
      }
      try {
        const [duaSnap, siteSnap] = await Promise.all([
          getDocs(collection(db, 'duas')),
          getDoc(doc(db, 'settings', 'site')),
        ]);
        const existingMap = new Map(duaSnap.docs.map((d) => [d.id, d.data()]));
        const batch = writeBatch(db);
        let addedOrUpdated = 0;

        AUTHENTIC_DUAS.forEach((dua, idx) => {
          const existing = existingMap.get(dua.id);
          const payload = {
            id: dua.id,
            occasion: dua.occasion,
            occasionLabel: dua.occasionLabel,
            title: dua.title,
            arabic: dua.arabic,
            pronunciation: dua.pronunciation || '',
            translation: dua.translation,
            reference: dua.reference,
            virtue: dua.virtue || '',
            targetCount: dua.targetCount,
            featured: Boolean(dua.featured),
            order: idx + 1,
          };
          if (!existing) {
            batch.set(doc(db, 'duas', dua.id), {
              ...payload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            addedOrUpdated++;
          } else if (force) {
            batch.set(doc(db, 'duas', dua.id), {
              ...payload,
              createdAt: existing.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            addedOrUpdated++;
          }
        });

        if (isAdmin) {
          if (!siteSnap.exists()) {
            batch.set(doc(db, 'settings', 'site'), {
              ...DEFAULT_SITE_SETTINGS,
              seeded: true,
              duasInitialized: true,
              updatedAt: serverTimestamp(),
            });
          } else if (!siteSnap.data()?.duasInitialized) {
            batch.set(
              doc(db, 'settings', 'site'),
              { duasInitialized: true, updatedAt: serverTimestamp() },
              { merge: true }
            );
          }
        }

        await batch.commit();
        return addedOrUpdated;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'duas');
      }
    },
    [isStaff, isAdmin]
  );

  const clearAllDuas = useCallback(async () => {
    if (!isAdmin) {
      throw new Error('শুধুমাত্র অ্যাডমিন সকল দুআ মুছতে পারবেন।');
    }
    try {
      const [duaSnap, siteSnap] = await Promise.all([
        getDocs(collection(db, 'duas')),
        getDoc(doc(db, 'settings', 'site')),
      ]);
      const refs = duaSnap.docs.map((d) => d.ref);
      for (let i = 0; i < refs.length; i += 400) {
        const chunk = refs.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((ref) => batch.delete(ref));
        await batch.commit();
      }
      if (!siteSnap.exists()) {
        await setDoc(doc(db, 'settings', 'site'), {
          ...DEFAULT_SITE_SETTINGS,
          seeded: true,
          duasInitialized: true,
          updatedAt: serverTimestamp(),
        });
      } else if (!siteSnap.data()?.duasInitialized) {
        await setDoc(
          doc(db, 'settings', 'site'),
          { duasInitialized: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
      return duaSnap.size;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'clear_all_duas');
    }
  }, [isAdmin]);

  const restoreIslamicTopicsContent = useCallback(
    async (force = false) => {
      if (!isStaff) {
        throw new Error('মাসআলা ও বিষয়বস্তু যুক্ত করার অনুমতি নেই।');
      }
      try {
        const [catSnap, masalaSnap, qSnap, artSnap, siteSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'masalas')),
          getDocs(collection(db, 'questions')),
          getDocs(collection(db, 'articles')),
          getDoc(doc(db, 'settings', 'site')),
        ]);

        const existingCats = new Map(catSnap.docs.map((d) => [d.id, d.data()]));
        const existingMasalas = new Map(masalaSnap.docs.map((d) => [d.id, d.data()]));
        const existingQs = new Map(qSnap.docs.map((d) => [d.id, d.data()]));
        const existingArts = new Map(artSnap.docs.map((d) => [d.id, d.data()]));

        const batch = writeBatch(db);
        let masalaCount = 0;
        let qCount = 0;
        let artCount = 0;

        for (const cat of DEFAULT_CATEGORIES) {
          if (!existingCats.has(cat.id)) {
            batch.set(doc(db, 'categories', cat.id), {
              ...cat,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }

        for (const item of AUTHENTIC_MASALAS) {
          const existing = existingMasalas.get(item.id);
          if (!existing) {
            batch.set(doc(db, 'masalas', item.id), {
              ...item,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            masalaCount++;
          } else if (force) {
            batch.set(doc(db, 'masalas', item.id), {
              ...item,
              createdAt: existing.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            masalaCount++;
          }
        }

        for (const qItem of AUTHENTIC_TOPIC_QUESTIONS) {
          const existing = existingQs.get(qItem.id);
          if (!existing) {
            batch.set(doc(db, 'questions', qItem.id), {
              ...qItem,
              answeredAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            qCount++;
          } else if (force) {
            batch.set(doc(db, 'questions', qItem.id), {
              ...qItem,
              viewCount: typeof existing.viewCount === 'number' ? existing.viewCount : qItem.viewCount,
              answeredAt: existing.answeredAt || serverTimestamp(),
              createdAt: existing.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            qCount++;
          }
        }

        for (const artItem of AUTHENTIC_TOPIC_ARTICLES) {
          const existing = existingArts.get(artItem.id);
          if (!existing) {
            batch.set(doc(db, 'articles', artItem.id), {
              ...artItem,
              publishedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            artCount++;
          } else if (force) {
            batch.set(doc(db, 'articles', artItem.id), {
              ...artItem,
              viewCount: typeof existing.viewCount === 'number' ? existing.viewCount : artItem.viewCount,
              publishedAt: existing.publishedAt || serverTimestamp(),
              createdAt: existing.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            artCount++;
          }
        }

        if (isAdmin) {
          if (!siteSnap.exists()) {
            batch.set(doc(db, 'settings', 'site'), {
              ...DEFAULT_SITE_SETTINGS,
              seeded: true,
              topicsContentInitialized: true,
              topicsAuthorsInitialized: true,
              updatedAt: serverTimestamp(),
            });
          } else if (
            !siteSnap.data()?.topicsContentInitialized ||
            !siteSnap.data()?.topicsAuthorsInitialized
          ) {
            batch.set(
              doc(db, 'settings', 'site'),
              {
                topicsContentInitialized: true,
                topicsAuthorsInitialized: true,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        }

        await batch.commit();
        return { masalas: masalaCount, questions: qCount, articles: artCount };
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'islamic_topics');
      }
    },
    [isStaff, isAdmin]
  );

  const clearAllMasalas = useCallback(async () => {
    if (!isAdmin) {
      throw new Error('শুধুমাত্র অ্যাডমিন সকল মাসআলা মুছতে পারবেন।');
    }
    try {
      const [masalaSnap, siteSnap] = await Promise.all([
        getDocs(collection(db, 'masalas')),
        getDoc(doc(db, 'settings', 'site')),
      ]);
      const refs = masalaSnap.docs.map((d) => d.ref);
      for (let i = 0; i < refs.length; i += 400) {
        const chunk = refs.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((ref) => batch.delete(ref));
        await batch.commit();
      }
      if (!siteSnap.exists()) {
        await setDoc(doc(db, 'settings', 'site'), {
          ...DEFAULT_SITE_SETTINGS,
          seeded: true,
          topicsContentInitialized: true,
          updatedAt: serverTimestamp(),
        });
      } else if (!siteSnap.data()?.topicsContentInitialized) {
        await setDoc(
          doc(db, 'settings', 'site'),
          { topicsContentInitialized: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
      return masalaSnap.size;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'clear_all_masalas');
    }
  }, [isAdmin]);

  // Automatically initialize settings/categories ONLY once when database is completely unseeded
  useEffect(() => {
    if (!isAdmin || loadingData || hasAutoSeededRef.current) return;
    if (!dbSiteSettings?.seeded) {
      hasAutoSeededRef.current = true;
      seedDatabase(false).catch((e) => console.warn('Auto seed skipped:', e));
    }
  }, [isAdmin, loadingData, dbSiteSettings?.seeded, seedDatabase]);

  // Initialize curated Duas in Firestore once so admin edits/deletes persist permanently
  useEffect(() => {
    if (!isAdmin || loadingData || !dbSiteSettings?.seeded || hasInitializedDuasRef.current) return;
    if (!dbSiteSettings?.duasInitialized) {
      hasInitializedDuasRef.current = true;
      restoreDefaultDuas(false).catch((e) => console.warn('Duas init skipped:', e));
    }
  }, [isAdmin, loadingData, dbSiteSettings?.seeded, dbSiteSettings?.duasInitialized, restoreDefaultDuas]);

  // Initialize Muslim Bangla style Mas'ala, Jigyasa & Probondho once for core topics
  useEffect(() => {
    if (!isAdmin || loadingData || !dbSiteSettings?.seeded || hasInitializedTopicsRef.current) return;
    if (!dbSiteSettings?.topicsContentInitialized) {
      hasInitializedTopicsRef.current = true;
      restoreIslamicTopicsContent(false).catch((e) => console.warn('Topics init skipped:', e));
    }
  }, [isAdmin, loadingData, dbSiteSettings?.seeded, dbSiteSettings?.topicsContentInitialized, restoreIslamicTopicsContent]);

  // One-time safe backfill: populate authorName ONLY on already-existing curated docs (never re-creates deleted docs)
  useEffect(() => {
    if (
      !isAdmin ||
      loadingData ||
      !dbSiteSettings?.seeded ||
      !dbSiteSettings?.topicsContentInitialized ||
      dbSiteSettings?.topicsAuthorsInitialized ||
      hasSyncedTopicAuthorsRef.current
    ) {
      return;
    }
    hasSyncedTopicAuthorsRef.current = true;

    (async () => {
      try {
        const [masalaSnap, artSnap, qSnap] = await Promise.all([
          getDocs(collection(db, 'masalas')),
          getDocs(collection(db, 'articles')),
          getDocs(collection(db, 'questions')),
        ]);

        const masalaAuthorMap = new Map(
          AUTHENTIC_MASALAS.filter((m) => m.authorName).map((m) => [m.id, m.authorName!])
        );
        const articleAuthorMap = new Map(
          AUTHENTIC_TOPIC_ARTICLES.filter((a) => a.authorName).map((a) => [a.id, a.authorName])
        );
        const questionAuthorMap = new Map(
          AUTHENTIC_TOPIC_QUESTIONS.filter((q) => q.authorName).map((q) => [q.id, q.authorName!])
        );

        const batch = writeBatch(db);
        let ops = 0;

        for (const d of masalaSnap.docs) {
          const data = d.data();
          const curatedAuthor = masalaAuthorMap.get(d.id);
          if (curatedAuthor && (!data.authorName || !String(data.authorName).trim())) {
            batch.update(d.ref, { authorName: curatedAuthor, updatedAt: serverTimestamp() });
            ops++;
          }
        }

        for (const d of artSnap.docs) {
          const data = d.data();
          const curatedAuthor = articleAuthorMap.get(d.id);
          const currentAuthor = String(data.authorName || '').trim();
          if (curatedAuthor && (!currentAuthor || currentAuthor === 'দাওয়াহ ও সুন্নাহ')) {
            batch.update(d.ref, { authorName: curatedAuthor, updatedAt: serverTimestamp() });
            ops++;
          }
        }

        for (const d of qSnap.docs) {
          const data = d.data();
          const curatedAuthor = questionAuthorMap.get(d.id);
          if (curatedAuthor && (!data.authorName || !String(data.authorName).trim())) {
            batch.update(d.ref, { authorName: curatedAuthor, updatedAt: serverTimestamp() });
            ops++;
          }
        }

        batch.set(
          doc(db, 'settings', 'site'),
          { topicsAuthorsInitialized: true, updatedAt: serverTimestamp() },
          { merge: true }
        );
        if (ops >= 0) {
          await batch.commit();
        }
      } catch (e) {
        console.warn('Topic authors sync skipped:', e);
      }
    })();
  }, [
    isAdmin,
    loadingData,
    dbSiteSettings?.seeded,
    dbSiteSettings?.topicsContentInitialized,
    dbSiteSettings?.topicsAuthorsInitialized,
  ]);

  // Add Dua & Dhikr Quick Access card once for existing deployments
  useEffect(() => {
    if (!isAdmin || loadingData || !dbSiteSettings?.seeded || hasAddedDuaCardRef.current) return;
    if (!dbSiteSettings?.duaQuickCardAdded) {
      hasAddedDuaCardRef.current = true;
      const currentCards = dbSiteSettings.quickAccessCards || [];
      const alreadyHasDua = currentCards.some(
        (c) => c.icon === 'dua' || c.categorySlug === 'dua' || c.categorySlug === '/dua'
      );
      const nextCards = alreadyHasDua
        ? currentCards
        : [
            ...currentCards,
            { id: 'qa-dua', title: 'দুআ ও যিকির', categorySlug: 'dua', icon: 'dua' },
          ];
      setDoc(
        doc(db, 'settings', 'site'),
        {
          quickAccessCards: nextCards,
          duaQuickCardAdded: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((e) => console.warn('Dua card init skipped:', e));
    }
  }, [isAdmin, loadingData, dbSiteSettings]);

  // Track website visit once per browser session when stats doc exists
  useEffect(() => {
    if (!isDatabaseSeeded || hasTrackedVisitRef.current) return;
    hasTrackedVisitRef.current = true;
    const sessionKey = 'dawah_visit_tracked';
    if (typeof window !== 'undefined' && !window.sessionStorage.getItem(sessionKey)) {
      window.sessionStorage.setItem(sessionKey, '1');
      updateDoc(doc(db, 'stats', 'overview'), {
        totalVisits: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  }, [isDatabaseSeeded]);

  // Resolved values: once initialized in Firestore, always reflect live Firestore (no ghost fallbacks)
  const categories = useMemo(
    () => (isDatabaseSeeded ? dbCategories : (DEFAULT_CATEGORIES as Category[])),
    [isDatabaseSeeded, dbCategories]
  );

  const authors = useMemo(() => dbAuthors, [dbAuthors]);

  const articles = useMemo(() => {
    if (dbSiteSettings?.topicsContentInitialized) {
      if (dbSiteSettings?.topicsAuthorsInitialized) return dbArticles;
      const authorMap = new Map(AUTHENTIC_TOPIC_ARTICLES.map((a) => [a.id, a.authorName]));
      return dbArticles.map((a) => {
        const curated = authorMap.get(a.id);
        const curName = (a.authorName || '').trim();
        if (curated && (!curName || curName === 'দাওয়াহ ও সুন্নাহ')) {
          return { ...a, authorName: curated };
        }
        return a;
      });
    }
    const existingIds = new Set(dbArticles.map((a) => a.id));
    const extras = AUTHENTIC_TOPIC_ARTICLES.filter((a) => !existingIds.has(a.id)) as Article[];
    return [...dbArticles, ...extras];
  }, [dbSiteSettings?.topicsContentInitialized, dbSiteSettings?.topicsAuthorsInitialized, dbArticles]);

  const questions = useMemo(() => {
    if (dbSiteSettings?.topicsContentInitialized) {
      if (dbSiteSettings?.topicsAuthorsInitialized) return dbQuestions;
      const authorMap = new Map(AUTHENTIC_TOPIC_QUESTIONS.map((q) => [q.id, q.authorName]));
      return dbQuestions.map((q) => {
        const curated = authorMap.get(q.id);
        if (curated && !(q.authorName || '').trim()) {
          return { ...q, authorName: curated };
        }
        return q;
      });
    }
    const existingIds = new Set(dbQuestions.map((q) => q.id));
    const extras = AUTHENTIC_TOPIC_QUESTIONS.filter((q) => !existingIds.has(q.id)) as Question[];
    return [...dbQuestions, ...extras];
  }, [dbSiteSettings?.topicsContentInitialized, dbSiteSettings?.topicsAuthorsInitialized, dbQuestions]);

  const masalas = useMemo(() => {
    if (dbSiteSettings?.topicsContentInitialized) {
      if (dbSiteSettings?.topicsAuthorsInitialized) return dbMasalas;
      const authorMap = new Map(AUTHENTIC_MASALAS.map((m) => [m.id, m.authorName]));
      return dbMasalas.map((m) => {
        const curated = authorMap.get(m.id);
        if (curated && !(m.authorName || '').trim()) {
          return { ...m, authorName: curated };
        }
        return m;
      });
    }
    const existingIds = new Set(dbMasalas.map((m) => m.id));
    const extras = AUTHENTIC_MASALAS.filter((m) => !existingIds.has(m.id)) as MasalaItem[];
    return [...dbMasalas, ...extras].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  }, [dbSiteSettings?.topicsContentInitialized, dbSiteSettings?.topicsAuthorsInitialized, dbMasalas]);

  const publishedArticles = useMemo(
    () => articles.filter((a) => a.status === 'published'),
    [articles]
  );

  const publishedQuestions = useMemo(
    () => questions.filter((q) => q.status === 'published'),
    [questions]
  );

  const publishedMasalas = useMemo(
    () => masalas.filter((m) => m.status === 'published'),
    [masalas]
  );

  const duas = useMemo(() => {
    if (dbSiteSettings?.duasInitialized) return dbDuas;
    return dbDuas.length > 0 ? dbDuas : AUTHENTIC_DUAS;
  }, [dbSiteSettings?.duasInitialized, dbDuas]);

  const siteSettings: SiteSettings = useMemo(() => {
    const base = dbSiteSettings || (DEFAULT_SITE_SETTINGS as SiteSettings);
    if (dbSiteSettings && !dbSiteSettings.duaQuickCardAdded) {
      const cards = dbSiteSettings.quickAccessCards || [];
      const hasDua = cards.some(
        (c) => c.icon === 'dua' || c.categorySlug === 'dua' || c.categorySlug === '/dua'
      );
      if (!hasDua) {
        return {
          ...base,
          quickAccessCards: [
            ...cards,
            { id: 'qa-dua', title: 'দুআ ও যিকির', categorySlug: 'dua', icon: 'dua' },
          ],
        };
      }
    }
    return base;
  }, [dbSiteSettings]);

  const prayerSettings: PrayerSettings = useMemo(
    () => dbPrayerSettings || (DEFAULT_PRAYER_SETTINGS as PrayerSettings),
    [dbPrayerSettings]
  );

  const donationSettings: DonationSettings = useMemo(
    () => dbDonationSettings || (DEFAULT_DONATION_SETTINGS as DonationSettings),
    [dbDonationSettings]
  );

  const pagesSettings: PagesSettings = useMemo(
    () => dbPagesSettings || (DEFAULT_PAGES_SETTINGS as PagesSettings),
    [dbPagesSettings]
  );

  const isBookmarked = useCallback(
    (itemId: string) => bookmarks.some((b) => b.itemId === itemId),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (item: {
      itemId: string;
      itemType: 'article' | 'question';
      title: string;
      slug: string;
      categoryName?: string;
    }) => {
      if (!user) throw new Error('সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন।');
      const bookmarkId = `${item.itemType}-${item.itemId}`;
      const ref = doc(db, 'users', user.uid, 'bookmarks', bookmarkId);
      const existing = bookmarks.find((b) => b.itemId === item.itemId);
      try {
        if (existing) {
          await deleteDoc(ref);
          return false;
        } else {
          await setDoc(ref, {
            id: bookmarkId,
            userId: user.uid,
            itemId: item.itemId,
            itemType: item.itemType,
            title: item.title,
            slug: item.slug,
            categoryName: item.categoryName || '',
            createdAt: serverTimestamp(),
          });
          return true;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bookmarks/${bookmarkId}`);
      }
    },
    [user, bookmarks]
  );

  const recordReadingHistory = useCallback(
    async (item: {
      itemId: string;
      itemType: 'article' | 'question';
      title: string;
      slug: string;
      categoryName?: string;
    }) => {
      if (!user) return;
      const historyId = `${item.itemType}-${item.itemId}`;
      const ref = doc(db, 'users', user.uid, 'reading_history', historyId);
      try {
        await setDoc(ref, {
          id: historyId,
          userId: user.uid,
          itemId: item.itemId,
          itemType: item.itemType,
          title: item.title,
          slug: item.slug,
          categoryName: item.categoryName || '',
          viewedAt: serverTimestamp(),
        });
      } catch {
        // Silent fail on history tracking
      }
    },
    [user]
  );

  const incrementArticleView = useCallback(
    async (articleId: string) => {
      if (!isDatabaseSeeded) return;
      const key = `viewed_art_${articleId}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
      try {
        await updateDoc(doc(db, 'articles', articleId), {
          viewCount: increment(1),
        });
      } catch {
        // ignore
      }
    },
    [isDatabaseSeeded]
  );

  const incrementQuestionView = useCallback(
    async (questionId: string) => {
      if (!isDatabaseSeeded) return;
      const key = `viewed_q_${questionId}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
      try {
        await updateDoc(doc(db, 'questions', questionId), {
          viewCount: increment(1),
        });
      } catch {
        // ignore
      }
    },
    [isDatabaseSeeded]
  );

  const submitPublicQuestion = useCallback(
    async (payload: {
      askerName: string;
      contactInfo?: string;
      categoryId: string;
      categoryName: string;
      title: string;
      questionText: string;
    }) => {
      if (!siteSettings.questionSubmissionEnabled) {
        throw new Error(siteSettings.questionClosedTitle || 'প্রশ্ন জমা দেওয়া সাময়িকভাবে বন্ধ রয়েছে।');
      }
      if (!isDatabaseSeeded) {
        throw new Error('ডেটাবেস এখনো আরম্ভ করা হয়নি। অনুগ্রহ করে অ্যাডমিন প্যানেলে লগইন করে প্রাথমিক ডেটা সেটআপ করুন।');
      }
      const qId = createSafeId('q');
      const slug = `${qId}`;
      const batch = writeBatch(db);
      const qData: Record<string, any> = {
        id: qId,
        title: payload.title.trim(),
        slug,
        questionText: payload.questionText.trim(),
        askerName: payload.askerName.trim(),
        categoryId: payload.categoryId,
        categoryName: payload.categoryName,
        status: 'pending',
        isFeatured: false,
        answerText: '',
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (user?.uid) {
        qData.submittedByUid = user.uid;
      }
      batch.set(doc(db, 'questions', qId), qData);

      if (payload.contactInfo && payload.contactInfo.trim()) {
        const contactData: Record<string, any> = {
          questionId: qId,
          contactInfo: payload.contactInfo.trim(),
          createdAt: serverTimestamp(),
        };
        if (user?.uid) {
          contactData.submittedByUid = user.uid;
        }
        batch.set(doc(db, 'question_contacts', qId), contactData);
      }

      try {
        await batch.commit();
        return qId;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `questions/${qId}`);
      }
    },
    [siteSettings, isDatabaseSeeded, user]
  );

  return (
    <DataContext.Provider
      value={{
        categories,
        authors,
        articles,
        publishedArticles,
        questions,
        publishedQuestions,
        masalas,
        publishedMasalas,
        duas,
        siteSettings,
        prayerSettings,
        donationSettings,
        pagesSettings,
        siteStats,
        bookmarks,
        readingHistory,
        isDatabaseSeeded,
        loadingData,
        seedDatabase,
        clearAllContent,
        restoreDefaultDuas,
        clearAllDuas,
        restoreIslamicTopicsContent,
        clearAllMasalas,
        toggleBookmark,
        isBookmarked,
        recordReadingHistory,
        incrementArticleView,
        incrementQuestionView,
        submitPublicQuestion,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
