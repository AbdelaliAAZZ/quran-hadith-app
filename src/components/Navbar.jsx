import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { useTheme } from '../context/ThemeContext';
import { 
  FaExclamationTriangle, 
  FaMoon, 
  FaSun, 
  FaMosque, 
  FaQuoteLeft, 
  FaCalendarAlt, 
  FaBookOpen 
} from 'react-icons/fa';
import { GiPrayerBeads } from 'react-icons/gi';
import logo from '../assets/muslim.png';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Listen to scroll events for a blurred background effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const SERVICE_ID = 'service_1vazxgr';
  const ADMIN_TEMPLATE = 'template_4erx1vp';
  const USER_REPLY_TEMPLATE = 'template_5mhf49d';
  const PUBLIC_KEY = 'XXRK4kg3nQWZEdb4t';

  const formRef = useRef();

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportEmail || !reportMessage) {
      setToastMessage('يرجى تعبئة جميع الحقول');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    emailjs.sendForm(SERVICE_ID, ADMIN_TEMPLATE, formRef.current, PUBLIC_KEY)
      .then(() => {
        return emailjs.send(
          SERVICE_ID,
          USER_REPLY_TEMPLATE,
          {
            to_email: reportEmail,
            user_email: reportEmail,
            report_content: reportMessage,
            submission_date: new Date().toLocaleString('ar-EG')
          },
          PUBLIC_KEY
        );
      })
      .then(() => {
        setToastMessage('تم إرسال التقرير بنجاح');
        setTimeout(() => setToastMessage(''), 3000);
      })
      .catch((error) => {
        console.error('Email error:', error);
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

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} ${isScrolled ? 'backdrop-blur-md bg-opacity-90' : 'bg-opacity-50'} shadow-lg`} dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center">
                <img src={logo} alt="Logo" className="h-10 w-auto" />
              </Link>
            </div>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/quran" className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                القرآن الكريم
              </Link>
              <Link to="/hadith" className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                الحديث الشريف
              </Link>
              <Link to="/tasbih" className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                السبحة
              </Link>
              <Link to="/calendar" className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                التقويم
              </Link>
              <Link to="/adkar" className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                الأذكار
              </Link>
              <Link to="/books" className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                الكتب
              </Link>
              {/* New link to Quran Image Generator */}
              <Link to="/quran-image" className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                مولد الصورة القرآنية
              </Link>
              <button onClick={() => setShowReportIssue(true)} className="nav-link text-teal-700 dark:text-teal-300 px-3 py-2 transition-all duration-300">
                الإبلاغ عن مشكلة
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-transform duration-300">
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </div>
            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center space-x-2">
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-transform duration-300">
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
              <button onClick={() => setIsOpen(prev => !prev)} className="inline-flex items-center justify-center p-2 rounded-md text-teal-700 dark:text-teal-300 transition-transform duration-300">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden fixed inset-0 bg-white dark:bg-gray-800 z-40 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center">
                <img src={logo} alt="Logo" className="h-10 w-auto" />
              </Link>
              <button onClick={() => setIsOpen(false)} className="p-2">
                <svg className="h-6 w-6 text-teal-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col flex-grow overflow-y-auto">
              <Link to="/quran" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <FaMosque className="mr-3 text-teal-700" />
                <span className="text-lg text-teal-700">القرآن الكريم</span>
              </Link>
              <Link to="/hadith" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <FaQuoteLeft className="mr-3 text-teal-700" />
                <span className="text-lg text-teal-700">الحديث الشريف</span>
              </Link>
              <Link to="/tasbih" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <GiPrayerBeads className="mr-3 text-teal-700 w-6 h-6" />
                <span className="text-lg text-teal-700">السبحة</span>
              </Link>
              <Link to="/calendar" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <FaCalendarAlt className="mr-3 text-teal-700" />
                <span className="text-lg text-teal-700">التقويم</span>
              </Link>
              <Link to="/adkar" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <GiPrayerBeads className="mr-3 text-teal-700 w-6 h-6" />
                <span className="text-lg text-teal-700">الأذكار</span>
              </Link>
              <Link to="/books" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <FaBookOpen className="mr-3 text-teal-700" />
                <span className="text-lg text-teal-700">الكتب</span>
              </Link>
              <Link to="/quran-image" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <FaMosque className="mr-3 text-teal-700" />
                <span className="text-lg text-teal-700">مولد الصورة القرآنية</span>
              </Link>
              <button onClick={() => { setShowReportIssue(true); setIsOpen(false); }} className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <FaExclamationTriangle className="mr-3 text-teal-700" />
                <span className="text-lg text-teal-700">الإبلاغ عن مشكلة</span>
              </button>
            </div>
          </div>
        )}
      </nav>

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
              <input type="hidden" name="timestamp" value={new Date().toLocaleString('ar-EG')} />
              <input type="hidden" name="user_counter" value="1" />
              <div className="flex justify-between">
                <button type="button" onClick={() => setShowReportIssue(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 transition-colors duration-300">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors duration-300">
                  إرسال التقرير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 left-4 bg-teal-600 text-white py-2 px-4 rounded shadow-lg animate-slide-up">
          {toastMessage}
        </div>
      )}
    </>
  );
}

export default Navbar;
