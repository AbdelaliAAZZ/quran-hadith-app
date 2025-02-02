import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import adkarData from '../data/adkar.json'; // Adjust the path based on your project structure

function Home() {
  const { theme } = useTheme();
  const [adkar, setAdkar] = useState(null); // Changed to store one random Adkar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  // Get the current time of day
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  // Load a random Adkar based on time of day
  const loadRandomAdkar = () => {
    try {
      const time = getTimeOfDay();
      setTimeOfDay(time);
      
      // Map time of day to JSON categories
      const categoryMap = {
        morning: "أذكار الصباح",
        afternoon: "أذكار الظهيرة", // Ensure this category exists in your JSON file if used
        evening: "أذكار المساء"
      };

      const categoryName = categoryMap[time];
      const filteredAdkar = adkarData[categoryName] || [];

      if (filteredAdkar.length > 0) {
        // Pick a random Adkar from the filtered list
        const randomAdkar = filteredAdkar[Math.floor(Math.random() * filteredAdkar.length)];
        setAdkar(randomAdkar);
      } else {
        setAdkar(null); // No Adkar found for the category
      }
      setError('');
    } catch (error) {
      console.error('Error loading Adkar:', error);
      setError('Failed to load Adkar. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRandomAdkar();
  }, []); // Empty dependency array to run once on page load

  const getTimeOfDayText = () => {
    switch (timeOfDay) {
      case 'morning':
        return "أذكار الصباح";
      case 'afternoon':
        return "أذكار الظهيرة";
      case 'evening':
        return "أذكار المساء";
      default:
        return "الأذكار";
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-gray-900 to-gray-800' : 'from-teal-50 to-blue-50'} p-8`}>
      <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg backdrop-blur-lg ${theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'} p-8 mt-12`}>
        <h1 className={`text-5xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-6 font-amiri text-center`}>
          Welcome to the Quran & Hadith App
        </h1>

        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-w-2xl mx-auto mb-8 text-center leading-relaxed`}>
          Explore the timeless wisdom of the Quran and the authentic teachings of Hadith through an elegant and intuitive interface.
        </p>

        {/* Adkar Section */}
        <div className="mt-12">
          <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-6 font-amiri text-center`}>
            {getTimeOfDayText()}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-t-2 ${theme === 'dark' ? 'border-teal-400' : 'border-teal-600'}`}></div>
            </div>
          ) : error ? (
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-100 text-red-700'}`}>
              {error}
            </div>
          ) : adkar ? (
            <div className="space-y-6">
              <div 
                className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-teal-50'} rounded-xl p-6 border ${theme === 'dark' ? 'border-gray-600' : 'border-teal-100'}`}
              >
                <p className="text-right text-3xl leading-relaxed text-gray-800 dark:text-gray-200 font-arabic mb-4">
                  {adkar.content}
                </p>
                {adkar.description && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    {adkar.description}
                  </p>
                )}
                {adkar.reference && (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Reference: {adkar.reference}
                  </p>
                )}
                {adkar.count && (
                  <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}>
                    Repeat: {adkar.count} times
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-teal-50 border-teal-100 text-teal-700'}`}>
              No Adkar available for the time of day.
            </div>
          )}
        </div>

         {/* Features Section */}
         <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-teal-50'} p-6 rounded-xl border ${theme === 'dark' ? 'border-gray-600' : 'border-teal-100'}`}>
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-4 font-amiri`}>
              Quran
            </h2>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Read and listen to the Holy Quran with multiple reciters and translations.
            </p>
          </div>

          <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-teal-50'} p-6 rounded-xl border ${theme === 'dark' ? 'border-gray-600' : 'border-teal-100'}`}>
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-4 font-amiri`}>
              Hadith
            </h2>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Discover authentic Hadiths from various collections with detailed references.
            </p>
          </div>
        </div>
      
    </div>
      </div>
   
  );
}

export default Home;
