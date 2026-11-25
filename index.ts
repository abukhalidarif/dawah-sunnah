export type RoleType = 'super_admin' | 'admin' | 'editor' | 'user';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserRoleDoc {
  uid: string;
  email: string;
  role: RoleType;
  assignedBy?: string;
  updatedAt?: any;
}

export interface AdminInvite {
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
  note?: string;
  assignedBy: string;
  assignedByEmail?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'both' | 'article' | 'question';
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Author {
  id: string;
  name: string;
  title?: string;
  slug: string;
  photoURL?: string;
  bio: string;
  qualifications: string;
  specialties?: string;
  totalPublications?: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  arabicQuote?: string;
  quranHadithRefs?: string;
  coverImage?: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  status: 'published' | 'draft';
  isFeatured: boolean;
  readingTimeMinutes: number;
  viewCount: number;
  publishedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface Question {
  id: string;
  title: string;
  slug: string;
  questionText: string;
  askerName: string;
  categoryId: string;
  categoryName: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  isFeatured: boolean;
  answerText?: string;
  arabicReferences?: string;
  quranHadithRefs?: string;
  authorId?: string;
  authorName?: string;
  viewCount: number;
  submittedByUid?: string;
  answeredAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface QuestionContact {
  questionId: string;
  contactInfo: string;
  submittedByUid?: string;
  createdAt?: any;
}

export interface BookmarkItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'article' | 'question';
  title: string;
  slug: string;
  categoryName?: string;
  createdAt?: any;
}

export interface ReadingHistoryItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'article' | 'question';
  title: string;
  slug: string;
  categoryName?: string;
  viewedAt?: any;
}

export interface MasalaItem {
  id: string;
  categoryId: string;
  categoryName: string;
  subTopic: string;
  title: string;
  summary: string;
  content: string;
  authorName?: string;
  arabicReference?: string;
  quranHadithRefs?: string;
  featured?: boolean;
  order: number;
  status: 'published' | 'draft';
  createdAt?: any;
  updatedAt?: any;
}

export interface QuickAccessCard {
  id: string;
  title: string;
  categorySlug: string;
  icon: string;
}

export interface SiteSettings {
  siteNameBn: string;
  siteNameEn: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  facebookUrl: string;
  telegramUrl: string;
  youtubeUrl: string;
  footerIntro: string;
  copyrightText: string;
  seoTitle: string;
  seoDescription: string;
  questionSubmissionEnabled: boolean;
  questionClosedTitle: string;
  questionClosedSubtitle: string;
  quickAccessCards: QuickAccessCard[];
  showPrayerSection: boolean;
  showQuickAccessSection: boolean;
  showQuestionsSection: boolean;
  showArticlesSection: boolean;
  showDuaSection: boolean;
  showCategoriesSection: boolean;
  showSupportSection: boolean;
  seeded?: boolean;
  duasInitialized?: boolean;
  duaQuickCardAdded?: boolean;
  topicsContentInitialized?: boolean;
  topicsAuthorsInitialized?: boolean;
  updatedAt?: any;
}

export interface PrayerSettings {
  defaultCityId: string;
  defaultCityName: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  calculationMethod: 'islamic_foundation_bd' | 'karachi' | 'mwl' | 'umm_al_qura';
  asrJuristic: 'hanafi' | 'shafii';
  ramadanMode: boolean;
  fajrAdjustment: number;
  maghribAdjustment: number;
  updatedAt?: any;
}

export interface DonationSettings {
  badgeText: string;
  missionTitle: string;
  missionDescription: string;
  whySupportTitle: string;
  whySupportPoints: string[];
  bkashNumber: string;
  bkashType: string;
  nagadNumber: string;
  nagadType: string;
  rocketNumber: string;
  bankName: string;
  bankBranch: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  instructions: string;
  updatedAt?: any;
}

export interface PagesSettings {
  aboutTitle: string;
  aboutContent: string;
  contactTitle: string;
  contactContent: string;
  privacyTitle: string;
  privacyContent: string;
  termsTitle: string;
  termsContent: string;
  updatedAt?: any;
}

export interface SiteStats {
  totalVisits: number;
  updatedAt?: any;
}

export interface DonationRecord {
  id: string;
  receiptNo: string;
  donorName: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  transactionId: string;
  senderLastDigits?: string;
  purpose?: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedByUid?: string;
  verifiedBy?: string;
  verifiedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}
