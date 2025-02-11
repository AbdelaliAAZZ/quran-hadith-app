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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg bg-opacity-90 dark:bg-opacity-95 p-6 sm:p-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-teal-800 dark:text-teal-200 mb-6 text-center font-amiri">
                  📖 Random Hadith
              </h2>

              {loading ? (
                  <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 dark:border-teal-400"></div>
                  </div>
              ) : error ? (
                  <div className="text-center p-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300">
                      Failed to load hadith. Please try again.
                  </div>
              ) : hadith ? (
                  <div className="space-y-6">
                      {/* Book Info */}
                      <div className="bg-teal-50/50 dark:bg-gray-700 rounded-xl p-4 sm:p-6 mb-4 border border-teal-100 dark:border-gray-600">
                          <h3 className="text-xl sm:text-2xl font-semibold text-teal-800 dark:text-teal-200 mb-2">
                              {hadith.headingEnglish}
                          </h3>
                          <p className="text-sm sm:text-base text-teal-600 dark:text-teal-400">
                              {hadith.book.bookName} - {hadith.chapter.chapterEnglish}
                          </p>
                      </div>

                      {/* Hadith Content */}
                      <div className="space-y-8">
                          <div className="bg-gray-50/50 dark:bg-gray-700 rounded-xl p-6 border-2 border-teal-100/50 dark:border-gray-600">
                              <div className="mb-6">
                                  <p className="text-right text-2xl sm:text-3xl leading-loose text-gray-800 dark:text-gray-200 font-arabic mb-6">
                                      {`"${hadith.hadithArabic}"`}
                                  </p>
                              </div>
                              
                              <div className="border-t border-teal-100 dark:border-gray-600 pt-6">
                                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light tracking-wide">
                                      {hadith.hadithEnglish}
                                  </p>
                              </div>

                              {hadith.reference && (
                                  <div className="mt-6 text-right">
                                      <span className="text-sm sm:text-base text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-gray-600 px-4 py-2 rounded-full inline-block">
                                          Reference: {hadith.reference}
                                      </span>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ) : null}

              <div className="mt-8 flex justify-center">
                  <button
                      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 
                      text-white font-medium py-3 px-8 rounded-xl shadow-md hover:shadow-lg 
                      transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      onClick={fetchRandomHadith}
                      disabled={loading}
                  >
                      {loading ? (
                          <span className="flex items-center justify-center">
                              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                              Loading...
                          </span>
                      ) : (
                          'New Hadith'
                      )}
                  </button>
              </div>
          </div>
      </div>
  );
}

export default Hadith;