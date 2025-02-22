import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaPrayingHands, FaTimes } from 'react-icons/fa';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'font-amiri');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'text-base');

  // Notification toast state
  const [showNotification, setShowNotification] = useState(true);
  const [notificationCountdown, setNotificationCountdown] = useState(5);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--main-font-family', fontFamily);
    root.style.setProperty('--main-font-size', fontSize);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('fontSize', fontSize);
  }, [fontFamily, fontSize]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let intervalId;
    if (showNotification) {
      intervalId = setInterval(() => {
        setNotificationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setShowNotification(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [showNotification]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontFamily, setFontFamily, fontSize, setFontSize }}>
      {children}
      {showNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-96 animate-slide-down text-center">
            <FaPrayingHands className="mx-auto mb-4 text-4xl text-teal-600" />
            <p className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
              اللهم صل وسلم على نبينا محمد
            </p>
            {/* Progress bar animated over 5 seconds */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-teal-600"
                style={{
                  width: `${(notificationCountdown / 5) * 100}%`,
                  transition: 'width 1s linear'
                }}
              ></div>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition"
            >
              <FaTimes className="mr-2" /> تخطي
            </button>
          </div>
          <style>{`
            @keyframes slideDown {
              from {
                transform: translateY(-20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            .animate-slide-down {
              animation: slideDown 0.5s ease-out;
            }
          `}</style>
        </div>
      )}
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
