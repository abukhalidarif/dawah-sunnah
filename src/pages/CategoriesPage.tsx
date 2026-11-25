export function CategoriesPage() {
  const categories = [
    "আকাইদ ও বিশ্বাস",
    "ইবাদত",
    "নামাজ",
    "রোজা",
    "যাকাত",
    "হজ ও উমরা",
    "পারিবারিক জীবন",
    "লেনদেন",
    "আখলাক ও আদব",
    "সমসাময়িক মাসআলা",
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">
          ইসলামী বিষয়ভিত্তিক বিভাগ
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center"
            >
              {category}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
