import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { GiPrayerBeads } from 'react-icons/gi';
import { FaCheckCircle } from 'react-icons/fa';

const defaultDhikrList = [
  {
    id: 1,
    label: 'لا إله إلا الله',
    count: 0,
    target: 100,
    icon: <GiPrayerBeads className="w-20 h-20 text-teal-500" />,
  },
  {
    id: 2,
    label: 'سبحان الله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-teal-500" />,
  },
  {
    id: 3,
    label: 'الحمد لله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-teal-500" />,
  },
  {
    id: 4,
    label: 'الله أكبر',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-teal-500" />,
  },
  {
    id: 5,
    label: 'لا حول ولا قوة إلا بالله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-teal-500" />,
  },
];

// AnimatedNumber for smooth transitions
const AnimatedNumber = ({ number }) => (
  <span className="inline-flex items-center">
    <AnimatePresence exitBeforeEnter>
      <motion.span
        key={number}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {number}
      </motion.span>
    </AnimatePresence>
  </span>
);

AnimatedNumber.propTypes = {
  number: PropTypes.number.isRequired,
};

function Tasbih() {
  const [dhikrList, setDhikrList] = useState(defaultDhikrList);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notification, setNotification] = useState(null);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tasbihData');
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = defaultDhikrList.map(item => {
        const savedItem = parsed.find(x => x.id === item.id);
        return savedItem ? { ...item, count: savedItem.count, target: savedItem.target } : item;
      });
      setDhikrList(merged);
    }
  }, []);

  // Save updates to localStorage
  useEffect(() => {
    const toStore = dhikrList.map(({ id, count, target }) => ({ id, count, target }));
    localStorage.setItem('tasbihData', JSON.stringify(toStore));
  }, [dhikrList]);

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const currentDhikr = dhikrList[currentIndex];

  const handleDhikrIncrement = (id) => {
    setDhikrList(prevList =>
      prevList.map(dhikr => {
        if (dhikr.id === id) {
          const newCount = dhikr.count + 1;
          if (dhikr.target > 0 && newCount === dhikr.target) {
            setNotification({ message: `لقد وصلت إلى العدد المطلوب (${dhikr.target}) لـ: ${dhikr.label}` });
          }
          return { ...dhikr, count: newCount };
        }
        return dhikr;
      })
    );
  };

  const handleUndo = (id) => {
    setDhikrList(prevList =>
      prevList.map(dhikr => {
        if (dhikr.id === id && dhikr.count > 0) {
          return { ...dhikr, count: dhikr.count - 1 };
        }
        return dhikr;
      })
    );
  };

  const resetDhikr = (id) => {
    setDhikrList(prevList =>
      prevList.map(dhikr => (dhikr.id === id ? { ...dhikr, count: 0 } : dhikr))
    );
  };

  const handleTargetChange = (id, newTarget) => {
    setDhikrList(prevList =>
      prevList.map(dhikr => (dhikr.id === id ? { ...dhikr, target: newTarget } : dhikr))
    );
  };

  const resetAll = () => {
    setDhikrList(prevList => prevList.map(dhikr => ({ ...dhikr, count: 0 })));
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? dhikrList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % dhikrList.length);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
      {notification && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center">
          <FaCheckCircle className="w-6 h-6 mr-2" />
          <span className="text-lg">{notification.message}</span>
        </div>
      )}
      <header className="mt-4">
        <h1 className="text-4xl font-extrabold text-teal-700 dark:text-teal-300">السبحة الإلكترونية</h1>
      </header>
      <main className="flex flex-col items-center justify-center flex-grow w-full">
        {/* Dhikr Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center">
          <div className="mb-6">{currentDhikr.icon}</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">{currentDhikr.label}</h2>
          <div
            className="text-7xl font-extrabold text-teal-600 cursor-pointer select-none mb-6"
            onClick={() => handleDhikrIncrement(currentDhikr.id)}
          >
            <AnimatedNumber number={currentDhikr.count} />
          </div>
          {currentDhikr.target > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-center mb-2">
                <span className="text-xl text-gray-700 dark:text-gray-300">الهدف: {currentDhikr.target}</span>
              </div>
              <input
                type="number"
                value={currentDhikr.target}
                onChange={(e) =>
                  handleTargetChange(currentDhikr.id, parseInt(e.target.value) || 0)
                }
                className="w-24 p-2 text-center border rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-200 mb-2"
              />
              <div className="w-full h-3 bg-gray-300 dark:bg-gray-600 rounded-full">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${Math.min((currentDhikr.count / currentDhikr.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Navigation & Controls */}
      <div className="flex justify-around w-full max-w-md mt-8">
        <button onClick={handlePrevious} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-300">
          <span>السابق</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={() => handleUndo(currentDhikr.id)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h12M3 6h12M3 14h12" />
          </svg>
          <span>تراجع</span>
        </button>
        <button onClick={() => resetDhikr(currentDhikr.id)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16h16" />
          </svg>
          <span>تصفير</span>
        </button>
        <button onClick={handleNext} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-300">
          <span>التالي</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="mt-6">
        <button onClick={resetAll} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16h16" />
          </svg>
          <span className="text-xl">إعادة تعيين جميع الأذكار</span>
        </button>
      </div>
    </div>
  );
}

export default Tasbih;
