import { useState, useEffect } from 'react';


function Hadith() {
  const [hadith, setHadith] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  
  const apiKey = encodeURIComponent('$2y$10$f6vJfCrsGlfCE4Y15GNgNOGMLDh2aZeNYYw9wNlzF45imr9SMr1u');

  const fetchRandomHadith = async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch(
        `https://corsproxy.io/?https://hadithapi.com/api/hadiths?apiKey=${apiKey}&limit=50`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.hadiths?.data?.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.hadiths.data.length);
        setHadith(data.hadiths.data[randomIndex]);
      } else {
        throw new Error("No hadiths found in response data");
      }
    } catch (err) {
      console.error("Error fetching hadith:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomHadith();
  }, []);

  // Custom copy handler with animated notification
  const handleCopy = async () => {
    if (hadith) {
      try {
        // Copy both Arabic and English texts (separated by a newline)
        const textToCopy = `${hadith.hadithArabic}\n\n${hadith.hadithEnglish}`;
        await navigator.clipboard.writeText(textToCopy);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg bg-opacity-90 dark:bg-opacity-95 p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-teal-800 dark:text-teal-200 mb-4 text-center font-amiri">
          📖 حديث عشوائي
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600 dark:border-teal-400"></div>
          </div>
        ) : error ? (
          <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300">
            فشل في تحميل الحديث. يرجى المحاولة مرة أخرى.
          </div>
        ) : hadith ? (
          <div className="space-y-4">
            {/* Heading, Book Info, and Reference */}
            <div className="text-center">
              {hadith.headingEnglish && (
                <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                  {hadith.headingEnglish}
                </h3>
              )}
              {hadith.book && hadith.chapter && (
                <p className="text-sm text-teal-600 dark:text-teal-400">
                  {hadith.book.bookName} - {hadith.chapter.chapterEnglish}
                </p>
              )}
              {hadith.reference && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  المرجع: {hadith.reference}
                </p>
              )}
            </div>

            {/* Hadith Texts */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-teal-100 dark:border-gray-600">
              <p className="text-right text-base leading-relaxed text-gray-800 dark:text-gray-200 font-arabic mb-2">
                {hadith.hadithArabic}
              </p>
              <p className="text-left text-base leading-relaxed text-gray-800 dark:text-gray-200">
                {hadith.hadithEnglish}
              </p>
            </div>
          </div>
        ) : null}

        {/* Custom animated copy notification */}
        {copySuccess && (
          <div className="fixed top-4 right-4 bg-teal-600 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
            تم النسخ!
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "جار التحميل..." : "نسخ الحديث"}
          </button>
          <button
            onClick={fetchRandomHadith}
            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "جار التحميل..." : "حديث جديد"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hadith;
