import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { useTheme } from '../context/ThemeContext';
import { FaExclamationTriangle, FaMoon, FaSun } from 'react-icons/fa';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // EmailJS configuration
  const SERVICE_ID = 'service_1vazxgr';
  const TEMPLATE_ID = 'template_4erx1vp';
  const PUBLIC_KEY = 'XXRK4kg3nQWZEdb4t';

  const formRef = useRef();

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportEmail || !reportMessage) {
      setToastMessage('يرجى تعبئة جميع الحقول');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY)
      .then(() => {
        setToastMessage('تم إرسال التقرير بنجاح');
        setTimeout(() => setToastMessage(''), 3000);
      })
      .catch(() => {
        setToastMessage('فشل إرسال التقرير');
        setTimeout(() => setToastMessage(''), 3000);
      });
    formRef.current.reset();
    setReportEmail('');
    setReportMessage('');
    setShowReportIssue(false);
  };

  return (
    <>
      {/* Custom CSS Animations and Hover Effects */}
      <style>{`
        @keyframes snake {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-snake::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: #38b2ac;
          animation: snake 1.5s infinite;
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
        .animate-pop-in {
          animation: popIn 0.3s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
        .nav-link {
          position: relative;
          overflow: hidden;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: #38b2ac;
          transition: all 0.3s ease;
        }
        .nav-link:hover::after {
          left: 0;
          width: 100%;
        }
      `}</style>

      <nav
        className="bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-90 shadow-lg sticky top-0 z-50"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Snake Animation */}
            <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300 relative">
              <Link
                to="/"
                className="text-2xl font-bold text-teal-800 dark:text-teal-200 font-amiri group nav-link"
              >
                القرآن والحديث
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/quran"
                className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300"
              >
                القرآن الكريم
              </Link>

              <Link
                to="/hadith"
                className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300"
              >
                الحديث الشريف
              </Link>

              {/* TASBIH LINK */}
              <Link
                to="/tasbih"
                className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300"
              >
                السبحة
              </Link>

              {/* Report Issue Button */}
              <button
                onClick={() => setShowReportIssue(true)}
                className="flex items-center text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300"
              >
                <FaExclamationTriangle className="ml-2" />
                <span className="nav-link">الإبلاغ عن مشكلة</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-transform duration-300 transform hover:rotate-180"
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-transform duration-300 transform hover:scale-110"
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex items-center justify-center p-2 rounded-md text-teal-700 dark:text-teal-300 transition-transform duration-300 transform hover:scale-110"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-95 animate-slide-down">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/quran"
                className="block nav-link text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
              >
                القرآن الكريم
              </Link>
              <Link
                to="/hadith"
                className="block nav-link text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
              >
                الحديث الشريف
              </Link>
              <Link
                to="/tasbih"
                className="block nav-link text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
              >
                السبحة
              </Link>
              <button
                onClick={() => setShowReportIssue(true)}
                className="flex items-center w-full nav-link text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
              >
                <FaExclamationTriangle className="ml-2" />
                الإبلاغ عن مشكلة
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full animate-pop-in">
            <h2 className="text-xl font-bold mb-4 text-center">الإبلاغ عن مشكلة</h2>
            <form ref={formRef} onSubmit={handleReportSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  البريد الإلكتروني:
                </label>
                <input
                  type="email"
                  name="report_email"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none text-right"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  وصف المشكلة:
                </label>
                <textarea
                  name="message"
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="أدخل وصف المشكلة هنا"
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none text-right"
                  rows="4"
                  required
                />
              </div>
              <input
                type="hidden"
                name="timestamp"
                value={new Date().toLocaleString('ar-EG')}
              />
              <input
                type="hidden"
                name="user_counter"
                value="1"
              />
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowReportIssue(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 transition-colors duration-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors duration-300"
                >
                  إرسال التقرير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 bg-teal-600 text-white py-2 px-4 rounded shadow-lg animate-slide-up">
          {toastMessage}
        </div>
      )}
    </>
  );
}

export default Navbar;
