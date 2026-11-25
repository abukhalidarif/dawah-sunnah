import { useState } from "react";

export function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-8">
          অনুসন্ধান
        </h1>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="প্রশ্ন, প্রবন্ধ বা মাসআলা খুঁজুন..."
          className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white outline-none"
        />

        {query && (
          <p className="mt-5 text-gray-400">
            "{query}" এর জন্য অনুসন্ধান করা হচ্ছে।
          </p>
        )}
      </div>
    </main>
  );
}
