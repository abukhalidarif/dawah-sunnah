import { QuestionSubmitCard } from '../components/QuestionSubmitCard';
import { SeoHead } from '../components/SeoHead';

export function AskQuestionPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <SeoHead
        title="প্রশ্ন জিজ্ঞাসা করুন"
        description="আপনার দৈনন্দিন দ্বীনি ও ফিকহি প্রশ্ন আমাদের মুফতিয়ানে কেরামের নিকট জমা দিন।"
      />
      <QuestionSubmitCard />
    </div>
  );
}
