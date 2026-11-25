export function CategoryDetailPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">
          বিভাগের বিস্তারিত
        </h1>

        <p className="text-gray-300 leading-8">
          এখানে নির্বাচিত ইসলামী বিভাগের অধীনে
          প্রকাশিত প্রশ্নোত্তর ও প্রবন্ধ দেখা যাবে।
        </p>

        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold">
            সংশ্লিষ্ট বিষয়সমূহ
          </h2>
        </div>
      </div>
    </main>
  );
}
