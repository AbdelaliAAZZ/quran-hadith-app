// Home.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import adkarData from '../data/adkar.json';

function Home() {
  const { theme } = useTheme();
  const [currentAdkar, setCurrentAdkar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeCategory, setTimeCategory] = useState('');
  const [adkarIndex, setAdkarIndex] = useState(0);

  // Ramadan date check
  const isRamadan =
    new Date() >= new Date('2024-03-10') && new Date() <= new Date('2024-04-09');

  // Enhanced time categories mapping
  const getTimeCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  };

  // Get relevant categories based on time
  const getRelevantCategories = (time) => {
    const categoryMap = {
      morning: ['أذكار الصباح', 'تسابيح', 'أدعية قرآنية'],
      afternoon: ['أدعية قرآنية', 'تسابيح', 'أدعية الأنبياء'],
      evening: ['أذكار المساء', 'تسابيح', 'أدعية قرآنية'],
      night: ['أذكار النوم', 'تسابيح', 'أدعية قرآنية', 'أدعية الأنبياء']
    };
    return categoryMap[time] || [];
  };

  // Load relevant Adkar based on time
  const loadAdkar = () => {
    try {
      const time = getTimeCategory();
      setTimeCategory(time);
      const categories = getRelevantCategories(time);
      
      const filteredAdkar = categories.reduce((acc, category) => {
        const categoryData = adkarData[category] || [];
        return [...acc, ...categoryData];
      }, []);

      if (filteredAdkar.length > 0) {
        setCurrentAdkar(filteredAdkar[adkarIndex % filteredAdkar.length]);
      } else {
        setCurrentAdkar(null);
      }
      setError('');
    } catch (error) {
      console.error('Error loading Adkar:', error);
      setError('Failed to load Adkar. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextAdkar = () => {
    setAdkarIndex(prev => prev + 1);
    loadAdkar();
  };

  useEffect(() => {
    loadAdkar();
  }, []);

  const getCategoryTitle = () => {
    const titles = {
      morning: 'أذكار الصباح 🌄',
      afternoon: 'أدعية العصر 🌤',
      evening: 'أذكار المساء 🌙',
      night: 'أذكار النوم 🌌'
    };
    return titles[timeCategory] || 'الأذكار اليومية';
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${
        isRamadan
          ? theme === 'dark'
            ? 'from-green-900 to-teal-900'
            : 'from-green-100 to-teal-50'
          : theme === 'dark'
          ? 'from-gray-900 to-gray-800'
          : 'from-teal-50 to-blue-50'
      } p-4 sm:p-8`}
    >
      {/* Ramadan Banner */}
      {isRamadan && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-700 to-teal-700 text-center py-2 sm:py-3">
          <span className="text-xl sm:text-2xl text-gold-300 font-arabic">
            رمضان كريم
          </span>
          <span className="text-white text-sm sm:text-lg ml-2">
            - Ramadan Mubarak -
          </span>
        </div>
      )}

      <div
        className={`max-w-4xl mx-auto ${
          theme === 'dark' ? 'bg-gray-800/90' : 'bg-white/90'
        } rounded-2xl shadow-xl ${isRamadan ? 'ramadan-glow' : ''} backdrop-blur-lg p-4 sm:p-8 mt-16 relative`}
      >
        {/* Decorative Islamic Pattern */}
        <div
          className={`absolute inset-0 opacity-10 bg-repeat ${
            theme === 'dark' ? 'opacity-20' : ''
          }`}
          style={{ backgroundImage: 'url(islamic-pattern.svg)' }}
        />

        {/* Ramadan Icons */}
        {isRamadan && (
          <>
            <div className="absolute top-4 right-4 text-3xl animate-twinkle delay-100">
              🌙
            </div>
            <div className="absolute top-12 left-8 text-2xl animate-twinkle delay-300">
              🪔
            </div>
            <div className="absolute bottom-20 right-10 text-4xl animate-float">
              🌟
            </div>
          </>
        )}

        <h1
          className={`text-3xl sm:text-5xl font-bold ${
            theme === 'dark' ? 'text-teal-300' : 'text-teal-800'
          } mb-4 sm:mb-6 font-amiri text-center relative`}
        >
          <span className="ramadan-title">
            {isRamadan ? '🌸 القرآن والحديث 🌙' : 'القرآن والحديث'}
          </span>
        </h1>

        <p
          className={`text-base sm:text-xl ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          } max-w-2xl mx-auto mb-6 sm:mb-8 text-center leading-relaxed`}
        >
          {isRamadan
            ? 'رمضان مبارك! تصفح القرآن الكريم والأحاديث النبوية في هذا الشهر المبارك'
            : 'استكشف حكمة القرآن الكريم والأحاديث النبوية من خلال واجهة أنيقة'}
        </p>

        {/* Adkar Section */}
        <div className="mt-8 sm:mt-12 relative z-10">
          <h2
            className={`text-2xl sm:text-3xl font-bold ${
              theme === 'dark' ? 'text-teal-300' : 'text-teal-700'
            } mb-4 sm:mb-6 font-amiri text-center flex items-center justify-center`}
          >
            {getCategoryTitle()}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div
                className={`animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 ${
                  theme === 'dark' ? 'border-teal-400' : 'border-teal-600'
                }`}
              />
            </div>
          ) : error ? (
            <div
              className={`p-3 sm:p-4 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-red-900/20 border-red-800 text-red-300'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}
            >
              {error}
            </div>
          ) : currentAdkar ? (
            <div className="space-y-4 sm:space-y-6">
              <div
                className={`${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-teal-50/90'
                } rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 ${
                  theme === 'dark' ? 'border-teal-600/50' : 'border-teal-200'
                } shadow-lg transition-all hover:shadow-xl`}
              >
                <p className="text-right text-xl sm:text-2xl leading-loose text-gray-800 dark:text-gray-200 font-arabic mb-4 sm:mb-6 select-none">
                  {currentAdkar.content}
                </p>
                <div className="space-y-2 sm:space-y-4">
                  {currentAdkar.description && (
                    <p
                      className={`text-base italic ${
                        theme === 'dark' ? 'text-teal-200' : 'text-teal-700'
                      }`}
                    >
                      {currentAdkar.description}
                    </p>
                  )}
                  {currentAdkar.reference && (
                    <div
                      className={`text-xs sm:text-sm ${
                        theme === 'dark' ? 'text-teal-400' : 'text-teal-600'
                      } bg-opacity-20 p-2 sm:p-3 rounded-lg`}
                    >
                      📖 المرجع: {currentAdkar.reference}
                    </div>
                  )}
                  {currentAdkar.count && (
                    <div
                      className={`text-base ${
                        theme === 'dark' ? 'text-teal-400' : 'text-teal-700'
                      } flex items-center`}
                    >
                      <span className="mr-2">🕋</span>
                      التكرار: {currentAdkar.count} مرات
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleNextAdkar}
                className={`w-full py-2 sm:py-3 rounded-xl font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-teal-700 hover:bg-teal-600 text-white'
                    : 'bg-teal-100 hover:bg-teal-200 text-teal-800'
                }`}
              >
                أذكار جديدة
              </button>
            </div>
          ) : (
            <div
              className={`p-3 sm:p-4 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-teal-50 border-teal-100 text-teal-700'
              }`}
            >
              لا يوجد أذكار متاحة لهذا الوقت
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mt-8 sm:mt-12">
          <Link to="/quran" className="group">
            <div
              className={`${
                theme === 'dark' ? 'bg-gray-700/40' : 'bg-teal-50/90'
              } p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${
                theme === 'dark' ? 'border-teal-600/30' : 'border-teal-200'
              } transition-all group-hover:scale-[1.02] cursor-pointer`}
            >
              <h2
                className={`text-xl sm:text-2xl font-semibold ${
                  theme === 'dark' ? 'text-teal-300' : 'text-teal-800'
                } mb-2 sm:mb-4 font-amiri flex items-center`}
              >
                <span className="mr-2">📖</span>
                القرآن الكريم
              </h2>
              <p
                className={`${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                } leading-relaxed`}
              >
                اقرأ واستمع إلى القرآن الكريم مع العديد من القراء والتفاسير المتاحة.
              </p>
            </div>
          </Link>

          <Link to="/hadith" className="group">
            <div
              className={`${
                theme === 'dark' ? 'bg-gray-700/40' : 'bg-teal-50/90'
              } p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${
                theme === 'dark' ? 'border-teal-600/30' : 'border-teal-200'
              } transition-all group-hover:scale-[1.02] cursor-pointer`}
            >
              <h2
                className={`text-xl sm:text-2xl font-semibold ${
                  theme === 'dark' ? 'text-teal-300' : 'text-teal-800'
                } mb-2 sm:mb-4 font-amiri flex items-center`}
              >
                <span className="mr-2">🕌</span>
                الأحاديث النبوية
              </h2>
              <p
                className={`${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                } leading-relaxed`}
              >
                اكتشف الأحاديث الصحيحة مع مصادرها وشرحها.
              </p>
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-twinkle {
          animation: twinkle 2s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .ramadan-glow {
          box-shadow: ${isRamadan ? '0 0 20px rgba(76, 175, 80, 0.3)' : 'none'};
        }
        .ramadan-title {
          text-shadow: ${
            isRamadan && theme === 'dark' ? '0 0 8px rgba(255, 215, 0, 0.5)' : 'none'
          };
        }
      `}</style>
    </div>
  );
}

export default Home;