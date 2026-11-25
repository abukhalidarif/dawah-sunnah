export function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <section className="max-w-5xl mx-auto text-center py-20">
        <h1 className="text-4xl font-bold mb-4">
          দাওয়াহ ও সুন্নাহ
        </h1>

        <p className="text-gray-300 text-lg mb-8">
          কুরআন ও সুন্নাহর আলোকে বিশুদ্ধ ইসলামী জ্ঞানচর্চা।
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            "ইসলামী প্রশ্নোত্তর",
            "ইসলামী প্রবন্ধ",
            "মাসআলা ও মাসায়েল",
          ].map((item) => (
            <div
              key={item}
              className="bg-gray-900 border border-gray-800 rounded-xl p-8"
            >
              <h2 className="text-xl font-semibold">{item}</h2>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
