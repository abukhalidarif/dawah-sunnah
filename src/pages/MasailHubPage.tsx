export function MasailHubPage() {
  const sections = [
    "তাহারাত ও পবিত্রতা",
    "নামাজ",
    "রোজা",
    "যাকাত",
    "হজ ও উমরা",
    "বিবাহ ও তালাক",
    "কুরবানি",
    "ক্রয়-বিক্রয়",
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-4">
          মাসআলা ও মাসায়েল
        </h1>

        <p className="text-gray-300 mb-8">
          প্রয়োজনীয় ইসলামী মাসআলা ও মাসায়েলের
          বিষয়ভিত্তিক সংগ্রহ।
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sections.map((section) => (
            <div
              key={section}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center"
            >
              {section}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
