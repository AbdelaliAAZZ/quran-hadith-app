// Adkar.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import adkarData from '../data/adkar.json';
import { useTheme } from '../context/ThemeContext';
import { GiPrayerBeads } from 'react-icons/gi';

const Adkar = () => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('أذكار الصباح');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAdkar, setCurrentAdkar] = useState([]);

  useEffect(() => {
    const categoryData = adkarData[selectedCategory] || [];
    const filtered = categoryData.filter(item =>
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setCurrentAdkar(filtered);
  }, [selectedCategory, searchQuery]);

  const categories = Object.keys(adkarData);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-teal-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="ابحث في الأذكار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full p-3 rounded-lg ${
              theme === 'dark'
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-white text-gray-800 border-gray-200'
            } border focus:outline-none focus:ring-2 focus:ring-teal-500`}
          />
        </div>

        {/* Adkar List */}
        <div className="space-y-6">
          <AnimatePresence>
            {currentAdkar.map((dikr, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-xl shadow-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <GiPrayerBeads className="w-8 h-8 text-teal-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      {dikr.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {dikr.count !== '01' && (
                          <span className={`px-3 py-1 rounded-full ${
                            theme === 'dark'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {dikr.count} مرة
                          </span>
                        )}
                        {dikr.reference && (
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {dikr.reference}
                          </span>
                        )}
                      </div>
                    </div>
                    {dikr.description && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {dikr.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Adkar;