import { useState, useEffect } from 'react';

function Hadith() {
    const [hadith, setHadith] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Properly encode API key with $ symbols
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
        } catch (error) {
            console.error("Error fetching hadith:", error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRandomHadith();
    }, []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg backdrop-blur-lg bg-opacity-80 dark:bg-opacity-90 p-8">
        <h2 className="text-4xl font-bold text-teal-800 dark:text-teal-200 mb-8 text-center font-amiri">
          Random Hadith
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-center py-8">
            {error}
          </div>
        ) : hadith ? (
          <div className="space-y-6">
            <div className="bg-teal-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-semibold text-teal-800 dark:text-teal-200 mb-4">
                {hadith.headingEnglish}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {hadith.book.bookName} - {hadith.chapter.chapterEnglish}
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-teal-100 dark:border-gray-600">
                <p className="text-right text-3xl leading-relaxed text-gray-800 dark:text-gray-200 font-arabic mb-6">
                  {hadith.hadithArabic}
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {hadith.hadithEnglish}
                </p>
                {hadith.reference && (
                  <p className="text-sm text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-gray-600 px-4 py-2 rounded-full inline-block">
                    Reference: {hadith.reference}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <button
          className="mt-8 w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 
          text-white font-medium py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          onClick={fetchRandomHadith}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Another Hadith'}
        </button>
      </div>
    </div>
    );
}

export default Hadith;