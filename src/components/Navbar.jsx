import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { FaExclamationTriangle, FaMoon, FaSun } from 'react-icons/fa';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, fontFamily, setFontFamily, fontSize, setFontSize } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportScreenshot, setReportScreenshot] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fontFamilies = [
    { id: 'font-amiri', name: 'أميري (افتراضي)' },
    { id: 'font-kufi', name: 'كوفي' },
    { id: 'font-sans', name: 'بدون سنس' },
    { id: 'font-serif', name: 'سيريف' }
  ];

  const fontSizes = [
    { id: 'text-sm', name: 'صغير' },
    { id: 'text-base', name: 'متوسط' },
    { id: 'text-lg', name: 'كبير' },
    { id: 'text-xl', name: 'كبير جداً' }
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    const body = `البريد الإلكتروني: ${reportEmail}\n\n${reportMessage}\n\n[ملاحظة: يرجى إرفاق لقطة الشاشة يدوياً في عميل البريد الإلكتروني.]`;
    const mailtoLink = `mailto:example@domain.com?subject=${encodeURIComponent('الإبلاغ عن مشكلة')}&body=${encodeURIComponent(body)}`;
    setToastMessage('تم إرسال التقرير بنجاح');
    setTimeout(() => {
      setReportMessage('');
      setReportEmail('');
      setReportScreenshot(null);
      setShowReportIssue(false);
      setToastMessage('');
      window.location.href = mailtoLink;
    }, 1000);
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-80 shadow-lg sticky top-0 z-50" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
              <Link
                to="/"
                className="text-2xl font-bold text-teal-800 dark:text-teal-200 font-amiri relative group"
              >
                القرآن والحديث
                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-teal-600 transition-all duration-300 group-hover:w-full"></span>
                <span className="inline-block ml-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 inline-block animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                    />
                  </svg>
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/quran"
                className="relative text-teal-700 dark:text-teal-300 px-3 py-2 group transition-all duration-300"
              >
                القرآن
                <span className="absolute bottom-0 right-0 w-0 h-1 bg-teal-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link
                to="/hadith"
                className="relative text-teal-700 dark:text-teal-300 px-3 py-2 group transition-all duration-300"
              >
                الحديث
                <span className="absolute bottom-0 right-0 w-0 h-1 bg-teal-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>

              {/* Report Button */}
              <button
                onClick={() => setShowReportIssue(true)}
                className="flex items-center text-teal-700 dark:text-teal-300 px-3 py-2 group animate-wiggle hover:animate-none"
              >
                <FaExclamationTriangle className="ml-2" />
                <span className="relative">
                  الإبلاغ عن مشكلة
                  <span className="absolute bottom-0 right-0 w-full h-0.5 bg-teal-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </span>
              </button>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:rotate-45"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 space-y-4 animate-slide-down">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                        نوع الخط
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-sm text-right"
                      >
                        {fontFamilies.map((font) => (
                          <option key={font.id} value={font.id}>{font.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-right">
                        حجم الخط
                      </label>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-sm text-right"
                      >
                        {fontSizes.map((size) => (
                          <option key={size.id} value={size.id}>{size.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:rotate-180"
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </div>

            {/* Mobile Menu Button */}
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
              <div className="mt-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium text-right"
                >
                  الإعدادات
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showSettings && (
                  <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                        نوع الخط
                      </label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-600 rounded-lg p-2 text-sm text-right"
                      >
                        {fontFamilies.map((font) => (
                          <option key={font.id} value={font.id}>{font.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                        حجم الخط
                      </label>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-600 rounded-lg p-2 text-sm text-right"
                      >
                        {fontSizes.map((size) => (
                          <option key={size.id} value={size.id}>{size.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full animate-pop-in">
            <h2 className="text-xl font-bold mb-4 text-center">الإبلاغ عن مشكلة</h2>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  البريد الإلكتروني:
                </label>
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none text-right"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  وصف المشكلة:
                </label>
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none text-right"
                  rows="4"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
                  إضافة لقطة شاشة (اختياري):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReportScreenshot(e.target.files[0])}
                  className="w-full text-sm text-gray-600 dark:text-gray-300"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  ملاحظة: يرجى إرفاق لقطة الشاشة يدوياً في عميل البريد الإلكتروني.
                </p>
              </div>
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