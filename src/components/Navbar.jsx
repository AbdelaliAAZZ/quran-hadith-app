import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { useTheme } from '../context/ThemeContext';
import { FaExclamationTriangle, FaMoon, FaSun } from 'react-icons/fa';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  // Remove settings state since we are not using settings anymore
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportCountry, setReportCountry] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Placeholders are added for inputs below

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // EmailJS configuration with your provided credentials
  const SERVICE_ID = 'service_1vazxgr';
  const TEMPLATE_ID = 'template_4erx1vp';
  const PUBLIC_KEY = 'XXRK4kg3nQWZEdb4t';
  
  const formRef = useRef();

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportEmail || !reportMessage || !reportCountry) {
      setToastMessage('يرجى تعبئة جميع الحقول');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY)
      .then((result) => {
        setToastMessage('تم إرسال التقرير بنجاح');
        setTimeout(() => setToastMessage(''), 3000);
      }, (error) => {
        setToastMessage('فشل إرسال التقرير');
        setTimeout(() => setToastMessage(''), 3000);
      });
    formRef.current.reset();
    setReportEmail('');
    setReportMessage('');
    setReportCountry('');
    setShowReportIssue(false);
  };

  return (
    <>
      {/* Inline styles for snake animation on hover */}
      <style>{`
        @keyframes snake {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 0; }
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
      `}</style>
      
      <nav className="bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-80 shadow-lg sticky top-0 z-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* قسم الشعار مع تأثير الثعبان عند المرور */}
            <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300 relative">
              <Link
                to="/"
                className="text-2xl font-bold text-teal-800 dark:text-teal-200 font-amiri group animate-snake"
              >
                القرآن والحديث
                <span className="inline-block ml-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 inline-block animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                </span>
              </Link>
            </div>

            {/* قائمة سطح المكتب */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/quran"
                className="relative text-teal-700 dark:text-teal-300 px-3 py-2 group transition-all duration-300"
              >
                القرآن الكريم
                <span className="absolute bottom-0 right-0 w-0 h-1 bg-teal-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link
                to="/hadith"
                className="relative text-teal-700 dark:text-teal-300 px-3 py-2 group transition-all duration-300"
              >
                الحديث الشريف
                <span className="absolute bottom-0 right-0 w-0 h-1 bg-teal-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {/* زر الإبلاغ عن مشكلة */}
              <button
                onClick={() => setShowReportIssue(true)}
                className="flex items-center text-teal-700 dark:text-teal-300 px-3 py-2 group transition-all duration-300"
              >
                <FaExclamationTriangle className="ml-2" />
                <span className="relative">
                  الإبلاغ عن مشكلة
                  <span className="absolute bottom-0 right-0 w-full h-0.5 bg-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </span>
              </button>

              {/* تبديل الثيم */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:rotate-180"
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </div>

            {/* زر قائمة الهاتف المحمول */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transform hover:scale-110 transition-all duration-300"
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-teal-700 dark:text-teal-300 transform hover:scale-110 transition-all duration-300"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* قائمة الهاتف المحمول */}
        {isOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-95 animate-slide-down">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/quran"
                className="block text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
              >
                القرآن
              </Link>
              <Link
                to="/hadith"
                className="block text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
              >
                الحديث
              </Link>
              <button
                onClick={() => setShowReportIssue(true)}
                className="flex items-center w-full text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
              >
                <FaExclamationTriangle className="ml-2" />
                الإبلاغ عن مشكلة
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Report Issue Modal with EmailJS */}
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
                  الدولة:
                </label>
                <input
                  type="text"
                  name="report_country"
                  value={reportCountry}
                  onChange={(e) => setReportCountry(e.target.value)}
                  placeholder="أدخل دولتك"
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
              {/* Hidden inputs for timestamp and user counter */}
              <input
                type="hidden"
                name="timestamp"
                value={new Date().toLocaleString("ar-EG")}
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
