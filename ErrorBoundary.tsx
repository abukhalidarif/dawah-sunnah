import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে।' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] dark:bg-[#120F0B] px-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1C1711] border border-[#E8DFCE] dark:border-[#2E251B] rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#F5ECDB] dark:bg-[#2B2114] flex items-center justify-center text-[#AD823E] text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-serif-bn font-bold text-[#2D2216] dark:text-[#F4ECE0] mb-2">
              দুঃখিত, একটি সমস্যা হয়েছে
            </h2>
            <p className="text-sm text-[#6E5D4B] dark:text-[#B6A691] mb-6">
              পৃষ্ঠাটি লোড করতে সাময়িক ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-[#AD823E] hover:bg-[#956D30] text-white text-sm font-medium transition-colors"
            >
              পুনরায় লোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
