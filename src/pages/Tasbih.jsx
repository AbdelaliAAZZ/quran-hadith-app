import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { GiPrayerBeads } from 'react-icons/gi';
import { FaCheckCircle, FaArrowLeft, FaArrowRight, FaVolumeUp } from 'react-icons/fa';
import { MdOutlineRestartAlt, MdUndo } from 'react-icons/md';

const defaultDhikrList = [
  {
    id: 1,
    label: 'لا إله إلا الله',
    count: 0,
    target: 100,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 2,
    label: 'سبحان الله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 3,
    label: 'الحمد لله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 4,
    label: 'الله أكبر',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 5,
    label: 'لا حول ولا قوة إلا بالله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 6,
    label: 'أستغفر الله',
    count: 0,
    target: 100,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 7,
    label: 'سبحان الله العظيم',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 8,
    label: 'الحمد لله رب العالمين',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 9,
    label: 'لا إله إلا أنت سبحانك إني كنت من الظالمين',
    count: 0,
    target: 100,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
  {
    id: 10,
    label: 'سبحان الله وبحمده',
    count: 0,
    target: 100,
    icon: <GiPrayerBeads className="w-20 h-20 text-gray-600 dark:text-gray-300" />,
  },
];

const AnimatedNumber = ({ number }) => (
  <span className="inline-flex items-center">
    <AnimatePresence mode='wait'>
      <motion.span
        key={number}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="font-arabic"
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
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Load saved data from localStorage
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

  // Save data to localStorage when dhikrList changes
  useEffect(() => {
    const toStore = dhikrList.map(({ id, count, target }) => ({ id, count, target }));
    localStorage.setItem('tasbihData', JSON.stringify(toStore));
  }, [dhikrList]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Initialize speech synthesis and load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      console.log('Speech synthesis is supported');
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices);
        const arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
        const voiceToUse = arabicVoice || voices[0];
        setSelectedVoice(voiceToUse);
        console.log('Selected voice:', voiceToUse);
        if (voiceToUse) {
          console.log('Selected voice language:', voiceToUse.lang);
        }
      };

      loadVoices(); // Initial attempt to load voices
      window.speechSynthesis.onvoiceschanged = loadVoices; // Update when voices are available

      // Cleanup event listener
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      console.log('Speech synthesis is not supported');
    }
  }, []);

  const currentDhikr = dhikrList[currentIndex];

  // Function to speak the dhikr text
  const speakDhikr = (text) => {
    console.log('Attempting to speak:', text);
    if (selectedVoice) {
      console.log('Speaking with voice:', selectedVoice.name, 'lang:', selectedVoice.lang);
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.lang = 'ar'; // Explicitly set language to Arabic
      utterance.onerror = (event) => console.error('Speech synthesis error:', event);
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('Cannot speak: no voice selected');
    }
  };

  const handleDhikrIncrement = (id) => {
    setDhikrList(prevList =>
      prevList.map(dhikr => {
        if (dhikr.id === id) {
          const newCount = dhikr.count + 1;
          if (dhikr.target > 0 && newCount === dhikr.target) {
            setNotification({ message: `🎉 لقد وصلت إلى الهدف (${dhikr.target}) لـ: ${dhikr.label}` });
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
      prevList.map(dhikr => (dhikr.id === id ? { 
        ...dhikr, 
        target: Math.max(0, newTarget) 
      } : dhikr))
    );
  };

  const resetAll = () => {
    setDhikrList(prevList => prevList.map(dhikr => ({ ...dhikr, count: 0 })));
    setNotification({ message: "تم تصفير جميع العدادات" });
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? dhikrList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % dhikrList.length);
  };

  const progressPercentage = Math.min(
    (currentDhikr.count / currentDhikr.target) * 100 || 0,
    100
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
      {notification && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-xl flex items-center space-x-2"
        >
          <FaCheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{notification.message}</span>
        </motion.div>
      )}

      <header className="mt-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white font-arabic">
          الســـبحة الإلكترونية
        </h1>
      </header>

      <main className="flex flex-col items-center justify-center flex-grow w-full max-w-2xl">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-md">
          <div className="absolute inset-y-0 left-4 flex items-center">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FaArrowLeft className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="absolute inset-y-0 right-4 flex items-center">
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FaArrowRight className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <motion.div
              key={currentDhikr.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700"
            >
              {currentDhikr.icon}
            </motion.div>

            <div className="flex items-center justify-center space-x-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white font-arabic text-center">
                {currentDhikr.label}
              </h2>
              <button
                onClick={() => speakDhikr(currentDhikr.label)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="استمع إلى الذكر"
                aria-label="استمع إلى الذكر"
              >
                <FaVolumeUp className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="relative w-40 h-40 flex items-center justify-center">
              {currentDhikr.target > 0 && (
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="stroke-current text-gray-200 dark:text-gray-600"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    className="stroke-current text-gray-500"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${(2 * Math.PI * 45) * (progressPercentage / 100)} ${2 * Math.PI * 45}`}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              
              <div 
                className="text-6xl font-bold text-gray-800 dark:text-white cursor-pointer z-10"
                onClick={() => handleDhikrIncrement(currentDhikr.id)}
              >
                <AnimatedNumber number={currentDhikr.count} />
              </div>
            </div>

            {currentDhikr.target > 0 && (
              <div className="w-full space-y-6">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => handleTargetChange(currentDhikr.id, currentDhikr.target - 1)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-xl">−</span>
                  </button>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-300">الهدف</div>
                    <div className="text-xl font-medium text-gray-800 dark:text-white">
                      {currentDhikr.target}
                    </div>
                  </div>

                  <button
                    onClick={() => handleTargetChange(currentDhikr.id, currentDhikr.target + 1)}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-xl">+</span>
                  </button>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleUndo(currentDhikr.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <MdUndo className="w-5 h-5" />
                    <span>تراجع</span>
                  </button>

                  <button
                    onClick={() => resetDhikr(currentDhikr.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <MdOutlineRestartAlt className="w-5 h-5" />
                    <span>إعادة</span>
                  </button>

                  <button
                    onClick={resetAll}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <MdOutlineRestartAlt className="w-5 h-5" />
                    <span>الكل</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Tasbih;