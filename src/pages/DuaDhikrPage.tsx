export function DuaDhikrPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">
          দোয়া ও যিকির
        </h1>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">
              সকাল-সন্ধ্যার যিকির
            </h2>
            <p className="text-gray-300">
              সকাল ও সন্ধ্যার মাসনূন যিকির।
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">
              দৈনন্দিন দোয়া
            </h2>
            <p className="text-gray-300">
              দৈনন্দিন জীবনের প্রয়োজনীয় দোয়া।
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
