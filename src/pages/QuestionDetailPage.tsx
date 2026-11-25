export function QuestionDetailPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">
          প্রশ্নের বিস্তারিত
        </h1>

        <p className="text-gray-300 leading-8">
          এখানে নির্বাচিত ইসলামী প্রশ্নের বিস্তারিত উত্তর
          প্রদর্শিত হবে।
        </p>

        <a
          href="/questions"
          className="inline-block mt-8 text-green-400"
        >
          ← সকল প্রশ্নে ফিরে যান
        </a>
      </div>
    </main>
  );
}
