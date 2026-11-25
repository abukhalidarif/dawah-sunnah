export function AskQuestionPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">
          প্রশ্ন করুন
        </h1>

        <form className="space-y-5">
          <input
            type="text"
            placeholder="আপনার নাম"
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700"
          />

          <input
            type="text"
            placeholder="প্রশ্নের বিষয়"
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700"
          />

          <textarea
            placeholder="আপনার প্রশ্ন লিখুন"
            rows={6}
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700"
          />

          <button
            type="button"
            className="bg-green-700 px-6 py-3 rounded-lg"
          >
            প্রশ্ন জমা দিন
          </button>
        </form>
      </div>
    </main>
  );
          }
