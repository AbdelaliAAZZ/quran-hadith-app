import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  FaPlay,
  FaPause,
  FaStop,
  FaForward,
  FaBackward,
  FaBook,
  FaHeadphones,
  FaExpand,
  FaCompress,
  FaPlus,
  FaMinus,
  FaUndoAlt,
  FaRedoAlt,
  FaVolumeUp,
  FaTimes,
  FaTachometerAlt,
  FaBookmark,
  FaArrowUp,
  FaCopy,
  FaInfoCircle,
  FaShareAlt,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
} from 'react-icons/fa';

// 1) React-PDF imports
import { Document, Page, pdfjs } from 'react-pdf';
// Configure PDF worker using pdfjs-dist’s built worker (fixes the cdn error):
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

// 2) Import your PDF from src/assets
import quranPDF from '../assets/quran.pdf';

function Quran() {
  // ------------------ STATE ------------------
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reciter, setReciter] = useState('alafasy');
  const [error, setError] = useState('');
  const [playingAudio, setPlayingAudio] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [readingMode, setReadingMode] = useState(false);
  const [listenMode, setListenMode] = useState(false);
  const [verseFilter, setVerseFilter] = useState('');

  // Pagination in Reading Mode
  const [currentPage, setCurrentPage] = useState(1);
  const versesPerPage = 10;

  // Reading Mode font settings
  const [readingFontSize, setReadingFontSize] = useState(24);
  const [tempFontFamily, setTempFontFamily] = useState('Amiri');
  const [currentFontFamily, setCurrentFontFamily] = useState('Amiri');

  // Listen Mode: controlling entire surah/juz
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);

  // Audio player states
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // Speed control
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Reading Option: only 'surah' or 'juz'
  const [readingOption, setReadingOption] = useState('surah');
  const [selectedJuz, setSelectedJuz] = useState(1);

  // Full screen state for Reading Mode
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Feedback message (for copy, tafsir toggle, favourites, share)
  const [copyMessage, setCopyMessage] = useState('');

  // Favourite verses and active tab state
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('quran');

  // Tafsir toggle state – tracks which verse’s tafsir is open
  const [tafsirOpen, setTafsirOpen] = useState({});

  // Sharing states
  const [shareVerse, setShareVerse] = useState(null);
  const [shareType, setShareType] = useState('text'); // 'text' or 'audio'
  const [chosenReader, setChosenReader] = useState('alafasy');

  // 3) PDF READER VIEW State
  const [showAllQuran, setShowAllQuran] = useState(false);
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);

  // For PDF: handle onLoadSuccess
  const onDocumentLoadSuccess = ({ numPages }) => {
    setPdfNumPages(numPages);
    setPdfPageNumber(1);
  };
  const goToPrevPdfPage = () => {
    setPdfPageNumber((prev) => Math.max(prev - 1, 1));
  };
  const goToNextPdfPage = () => {
    setPdfPageNumber((prev) => Math.min(prev + 1, pdfNumPages || 1));
  };

  const { theme } = useTheme();

  // Refs
  const mainContentRef = useRef(null);
  const audioAllRef = useRef(null);
  const readingContainerRef = useRef(null);
  const autoPlayRef = useRef(false);

  // Hardcoded reciters list
  const reciters = [
    { id: 'alafasy', name: 'مشاري العفاسي' },
    { id: 'husary', name: 'محمود الحصري' },
    { id: 'minshawi', name: 'محمد المنشاوي' },
  ];

  // Additional reading fonts
  const readingFonts = [
    'Amiri',
    'Reem Kufi',
    'Lateef',
    'Scheherazade',
    'Noto Naskh Arabic',
    'KFGQPC Uthmanic Script',
  ];

  // ------------------ LOAD BOOKMARKS FROM LOCALSTORAGE ------------------
  useEffect(() => {
    const storedFavs = localStorage.getItem('quranBookmarks');
    if (storedFavs) {
      setBookmarks(JSON.parse(storedFavs));
    }
  }, []);

  // ------------------ FETCH SURAH DATA ------------------
  useEffect(() => {
    setError('');
    fetch('https://api.alquran.cloud/v1/surah')
      .then((res) => {
        if (!res.ok) throw new Error('فشل في جلب السور');
        return res.json();
      })
      .then((data) => {
        const surahsData = data.data || [];
        setSurahs(surahsData);
      })
      .catch((err) => {
        console.error('خطأ في جلب السور:', err);
        setError('فشل تحميل السور. يرجى المحاولة لاحقاً.');
      });
  }, []);

  // Default surah = Al-Fatiha if none selected
  useEffect(() => {
    if (surahs.length > 0 && !selectedSurah) {
      const defaultSurah = surahs.find((s) => s.number === 1);
      if (defaultSurah) {
        setSelectedSurah(defaultSurah);
      }
    }
  }, [surahs, selectedSurah]);

  // Filter surahs by name
  const filteredSurahs = surahs.filter((surah) =>
    surah.name.includes(searchQuery)
  );

  // ------------------ FETCH VERSES ------------------
  const fetchVerses = useCallback(
    async (surahNumber) => {
      setLoading(true);
      setError('');
      let fetchedVerses = [];
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.${reciter}`
        );
        if (!response.ok) throw new Error('فشل في جلب الآيات');
        const data = await response.json();
        fetchedVerses = data.data?.ayahs || [];
        setVerses(fetchedVerses);
      } catch (err) {
        console.error('خطأ في جلب الآيات:', err);
        setError(
          'فشل تحميل الآيات. يرجى التحقق من الاتصال أو تجربة قارئ آخر.'
        );
        setVerses([]);
      } finally {
        setLoading(false);
      }
      return fetchedVerses;
    },
    [reciter]
  );

  // Fetch Juz data
  const fetchJuz = async (juzNumber) => {
    setLoading(true);
    setError('');
    let fetchedVerses = [];
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/juz/${juzNumber}`);
      if (!response.ok) throw new Error('فشل في جلب الجزء');
      const data = await response.json();
      fetchedVerses = data.data?.ayahs || [];
      setVerses(fetchedVerses);
    } catch (err) {
      console.error('خطأ في جلب الجزء:', err);
      setError('فشل تحميل الجزء. يرجى المحاولة لاحقاً.');
      setVerses([]);
    } finally {
      setLoading(false);
    }
    return fetchedVerses;
  };

  // ------------------ MODE & SELECTION LOGIC ------------------
  const handleSurahClick = (surah) => {
    if (readingOption !== 'surah') return;
    setSelectedSurah(surah);
    setPlayingAudio(null);
    setVerseFilter('');
    setCurrentPage(1);
    setIsPlayingAll(false);
    setListenMode(false);
    fetchVerses(surah.number);
    if (mainContentRef.current) {
      setTimeout(() => {
        mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  useEffect(() => {
    if (readingOption === 'surah' && selectedSurah) {
      setPlayingAudio(null);
      fetchVerses(selectedSurah.number);
    }
  }, [reciter, selectedSurah, fetchVerses, readingOption]);

  useEffect(() => {
    if (readingOption === 'juz') {
      fetchJuz(selectedJuz);
    }
  }, [readingOption, selectedJuz]);

  // ------------------ AUTO-PLAY LOGIC FOR LISTEN MODE ------------------
  useEffect(() => {
    if (listenMode && verses.length > 0 && autoPlayRef.current) {
      setIsPlayingAll(true);
      setIsPaused(false);
      setCurrentPlayingIndex(0);
      setProgress(0);
      if (audioAllRef.current) {
        audioAllRef.current.src = verses[0].audio;
        audioAllRef.current.currentTime = 0;
        audioAllRef.current.play();
      }
      autoPlayRef.current = false;
    }
  }, [verses, listenMode, readingOption]);

  // ------------------ AUDIO TRACKING ------------------
  useEffect(() => {
    const audioEl = audioAllRef.current;
    if (!audioEl) return;
    audioEl.playbackRate = playbackRate;

    const handleTimeUpdate = () => {
      if (audioEl.duration) {
        const current = audioEl.currentTime;
        setProgress((current / audioEl.duration) * 100);
        setElapsedTime(Math.floor(current / 60));
        setRemainingTime(Math.ceil((audioEl.duration - current) / 60));
      }
    };

    const handleEnded = () => {
      if (currentPlayingIndex < verses.length - 1 && isPlayingAll) {
        const nextIndex = currentPlayingIndex + 1;
        setCurrentPlayingIndex(nextIndex);
        setProgress(0);
        if (audioAllRef.current) {
          audioAllRef.current.src = verses[nextIndex].audio;
          audioAllRef.current.currentTime = 0;
          audioAllRef.current.play();
        }
      } else {
        setIsPlayingAll(false);
      }
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('ended', handleEnded);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('ended', handleEnded);
    };
  }, [currentPlayingIndex, verses, isPlayingAll, playbackRate]);

  // ------------------ MODE TOGGLES ------------------
  const toggleReadingMode = () => {
    setReadingMode((prev) => !prev);
    setListenMode(false);
    setCurrentPage(1);
  };

  // Updated toggleListenMode to set autoPlayRef if turning on listen mode
  const toggleListenMode = () => {
    const newListenMode = !listenMode;
    setListenMode(newListenMode);
    setReadingMode(false);
    setIsPlayingAll(false);
    if (newListenMode) {
      autoPlayRef.current = true;
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [verseFilter, selectedSurah, readingOption]);

  // Filter verses for searching
  const filteredVerses = verses.filter(
    (verse) =>
      verse.text.includes(verseFilter) ||
      verse.numberInSurah.toString().includes(verseFilter)
  );

  // Pagination
  const totalPages = Math.ceil(filteredVerses.length / versesPerPage);
  const paginatedVerses = readingMode
    ? filteredVerses.slice(
        (currentPage - 1) * versesPerPage,
        currentPage * versesPerPage
      )
    : filteredVerses;

  // ------------------ LISTEN MODE CONTROLS ------------------
  const playAllSurah = () => {
    if (!verses.length) return;
    stopPlayAll();
    setIsPlayingAll(true);
    setIsPaused(false);
    setCurrentPlayingIndex(0);
    setProgress(0);
    if (audioAllRef.current) {
      audioAllRef.current.src = verses[0].audio;
      audioAllRef.current.currentTime = 0;
      audioAllRef.current.play();
    }
  };

  const togglePauseResume = () => {
    if (!audioAllRef.current) return;
    if (isPaused) {
      audioAllRef.current.play();
      setIsPaused(false);
    } else {
      audioAllRef.current.pause();
      setIsPaused(true);
    }
  };

  const stopPlayAll = () => {
    if (audioAllRef.current) {
      audioAllRef.current.pause();
      audioAllRef.current.currentTime = 0;
    }
    setIsPlayingAll(false);
    setIsPaused(false);
    setCurrentPlayingIndex(0);
    setProgress(0);
  };

  const handleNextSurah = () => {
    if (!selectedSurah) return;
    stopPlayAll();
    const currentIndex = surahs.findIndex((s) => s.number === selectedSurah.number);
    if (currentIndex >= 0 && currentIndex < surahs.length - 1) {
      const nextSurah = surahs[currentIndex + 1];
      autoPlayRef.current = true;
      setSelectedSurah(nextSurah);
      setPlayingAudio(null);
      setVerseFilter('');
      setCurrentPage(1);
      setIsPlayingAll(false);
      setIsPaused(false);
      setProgress(0);
      setListenMode(true);
    }
  };

  const handlePreviousSurah = () => {
    if (!selectedSurah) return;
    stopPlayAll();
    const currentIndex = surahs.findIndex((s) => s.number === selectedSurah.number);
    if (currentIndex > 0) {
      const prevSurah = surahs[currentIndex - 1];
      autoPlayRef.current = true;
      setSelectedSurah(prevSurah);
      setPlayingAudio(null);
      setVerseFilter('');
      setCurrentPage(1);
      setIsPlayingAll(false);
      setIsPaused(false);
      setProgress(0);
      setListenMode(true);
    }
  };

  const currentSurahIndex = selectedSurah
    ? surahs.findIndex((s) => s.number === selectedSurah.number)
    : -1;
  const isLastSurah = currentSurahIndex === surahs.length - 1;

  const handleProgressChange = (e) => {
    const newVal = e.target.value;
    if (audioAllRef.current && audioAllRef.current.duration) {
      const newTime = (newVal / 100) * audioAllRef.current.duration;
      audioAllRef.current.currentTime = newTime;
      setProgress(newVal);
    }
  };

  const skipForward5 = () => {
    if (!audioAllRef.current) return;
    audioAllRef.current.currentTime += 5;
  };

  const skipBackward5 = () => {
    if (!audioAllRef.current) return;
    audioAllRef.current.currentTime = Math.max(
      audioAllRef.current.currentTime - 5,
      0
    );
  };

  // ------------------ FULLSCREEN ------------------
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (readingContainerRef.current) {
        readingContainerRef.current.requestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (document.fullscreenElement === readingContainerRef.current) {
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // ------------------ COPY & TAFSIR FUNCTIONS ------------------
  const copyVerseText = (verseText) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(verseText).then(() => {
      setCopyMessage('تم نسخ الآية!');
      setTimeout(() => setCopyMessage(''), 2000);
    });
  };

  const toggleTafsir = (verseNumberInSurah) => {
    setTafsirOpen((prev) => ({
      ...prev,
      [verseNumberInSurah]: !prev[verseNumberInSurah],
    }));
  };

  // ------------------ FAVOURITE FUNCTIONS ------------------
  const bookmarkVerse = (verse) => {
    // Use a more unique key for bookmarks to avoid duplicates:
    const bookmarkKey = `${verse.number}-${verse.numberInSurah}`;
    const existing = bookmarks.find((b) => `${b.number}-${b.numberInSurah}` === bookmarkKey);
    if (!existing) {
      const newBookmarks = [...bookmarks, verse];
      setBookmarks(newBookmarks);
      localStorage.setItem('quranBookmarks', JSON.stringify(newBookmarks));
      setCopyMessage('الآية تمت الإضافة إلى المفضلة!');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const removeFavourite = (verse) => {
    const bookmarkKey = `${verse.number}-${verse.numberInSurah}`;
    const updated = bookmarks.filter(
      (b) => `${b.number}-${b.numberInSurah}` !== bookmarkKey
    );
    setBookmarks(updated);
    localStorage.setItem('quranBookmarks', JSON.stringify(updated));
  };

  // ------------------ SHARE FUNCTIONALITY ------------------
  const handleShare = (platform) => {
    if (!shareVerse) return;
    let text = encodeURIComponent(shareVerse.text);
    if (shareType === 'audio') {
      let audioURL = shareVerse.audio;
      // Replace the current reciter in the URL with the chosen one if needed
      if (audioURL && reciter !== chosenReader) {
        audioURL = audioURL.replace(reciter, chosenReader);
      }
      text = encodeURIComponent(
        `🔊 استمع للآية بصوت ${
          reciters.find((r) => r.id === chosenReader)?.name
        }:\n${audioURL}`
      );
    }
    const currentUrl = encodeURIComponent(window.location.href);
    let url = '';
    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${text}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${text}`;
    } else if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${text}`;
    }
    window.open(url, '_blank');
    setShareVerse(null);
  };

  // ------------------ SCROLL TO TOP FUNCTION ------------------
  const scrollToTop = () => {
    if (readingContainerRef.current) {
      readingContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ------------------ PDF READER VIEW ------------------
  if (showAllQuran) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-4 bg-gray-200 dark:bg-gray-700">
          <button
            onClick={() => setShowAllQuran(false)}
            className="text-teal-600 dark:text-teal-200"
          >
            العودة إلى القرآن
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
          <Document
            file={quranPDF}
            onLoadSuccess={onDocumentLoadSuccess}
            loading="جاري تحميل ملف القرآن..."
          >
            <Page pageNumber={pdfPageNumber} />
          </Document>
          {pdfNumPages && (
            <p className="mt-2 text-gray-700 dark:text-gray-200">
              الصفحة {pdfPageNumber} من {pdfNumPages}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={goToPrevPdfPage}
              disabled={pdfPageNumber <= 1}
              className="px-3 py-1 bg-teal-500 text-white rounded disabled:opacity-50"
            >
              السابق
            </button>
            <button
              onClick={goToNextPdfPage}
              disabled={pdfNumPages && pdfPageNumber >= pdfNumPages}
              className="px-3 py-1 bg-teal-500 text-white rounded disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ MAIN RENDER ------------------
  return (
    <div
      className={`min-h-screen p-4 md:p-8 bg-gradient-to-br ${
        theme === 'dark'
          ? 'from-gray-900 to-gray-800'
          : 'from-teal-50 to-blue-50'
      }`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* SIDEBAR */}
        <aside
          className={`
            block md:col-span-1
            ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
            rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg
            ${theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'}
          `}
        >
          {/* Tabs for Quran & Favourites */}
          <div className="mb-4 flex justify-around">
            <button
              onClick={() => setActiveTab('quran')}
              className={`px-4 py-2 rounded ${
                activeTab === 'quran'
                  ? 'bg-teal-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              القرآن
            </button>
            <button
              onClick={() => setActiveTab('favourites')}
              className={`px-4 py-2 rounded ${
                activeTab === 'favourites'
                  ? 'bg-teal-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              المفضلة
            </button>
          </div>

          {/* Reading Option Toggle (only for Quran view) */}
          {activeTab === 'quran' && (
            <div className="mb-4">
              <label className="block text-lg font-bold mb-2 text-teal-800 dark:text-teal-200">
                خيارات القراءة:
              </label>
              <select
                value={readingOption}
                onChange={(e) => setReadingOption(e.target.value)}
                className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <option value="surah">حسب السورة</option>
                <option value="juz">حسب الجزء</option>
              </select>
              {readingOption === 'juz' && (
                <div className="mt-2">
                  <label className="block text-sm mb-1 text-teal-800 dark:text-teal-200">
                    اختر الجزء:
                  </label>
                  <select
                    value={selectedJuz}
                    onChange={(e) => setSelectedJuz(parseInt(e.target.value))}
                    className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                      <option key={`juz-${juz}`} value={juz}>
                        الجزء {juz}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={() => setShowAllQuran(true)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  قراءة القرآن بالكامل
                </button>
              </div>
            </div>
          )}

          {/* Surah list (only if readingOption is 'surah') */}
          {activeTab === 'quran' && readingOption === 'surah' && (
            <>
              <h2
                className={`text-2xl font-bold ${
                  theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                } mb-4 font-amiri`}
              >
                السور
              </h2>
              <input
                type="text"
                placeholder="بحث السور..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full mb-4 p-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-teal-200 text-gray-700'
                } focus:outline-none`}
              />
              {error && (
                <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              )}
              <ul className="max-h-[70vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                {filteredSurahs.map((surah) => (
                  <li key={`surah-${surah.number}`}>
                    <button
                      className={`w-full text-left py-3 px-4 rounded-lg transition-all duration-200 ${
                        selectedSurah?.number === surah.number
                          ? 'bg-teal-600 text-white shadow-md'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-800'
                      }`}
                      onClick={() => handleSurahClick(surah)}
                    >
                      <span className="font-medium">{surah.number}.</span>{' '}
                      {surah.name}
                    </button>
                  </li>
                ))}
                {filteredSurahs.length === 0 && (
                  <li
                    className={`text-center py-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    لم يتم العثور على سور.
                  </li>
                )}
              </ul>
            </>
          )}
        </aside>

        {/* MAIN CONTENT */}
        {activeTab === 'favourites' ? (
          // FAVOURITE VERSES VIEW (No share button)
          <section
            className={`md:col-span-2 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg`}
          >
            <div className="mb-6 text-center border-b border-teal-100 pb-4">
              <h1
                className={`text-4xl font-bold ${
                  theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                } mb-2 font-amiri`}
              >
                المفضلة
              </h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                آياتك المفضلة
              </p>
            </div>
            {bookmarks.length > 0 ? (
              <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                {bookmarks.map((verse) => {
                  const bookmarkKey = `${verse.number}-${verse.numberInSurah}`;
                  return (
                    <div
                      key={bookmarkKey}
                      className={`group relative ${
                        theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-50 hover:bg-teal-50'
                      } rounded-xl p-6 transition-colors`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className={`text-sm font-medium ${
                            theme === 'dark'
                              ? 'text-teal-200 bg-gray-600'
                              : 'text-teal-600 bg-teal-100'
                          } px-3 py-1 rounded-full`}
                        >
                          الآية {verse.numberInSurah}
                        </span>
                        {verse.audio && (
                          <button
                            onClick={() => {
                              if (playingAudio === verse.numberInSurah) {
                                setPlayingAudio(null);
                              } else {
                                setPlayingAudio(verse.numberInSurah);
                              }
                            }}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                          >
                            {playingAudio === verse.numberInSurah ? (
                              <FaPause className="w-5 h-5" />
                            ) : (
                              <FaPlay className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                      <p
                        className={`text-right text-4xl leading-loose ${
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        } font-arabic font-selectable mb-2`}
                      >
                        {verse.text}
                      </p>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <button
                          onClick={() => copyVerseText(verse.text)}
                          className="flex items-center gap-1 px-2 py-1 bg-teal-200 hover:bg-teal-300 text-teal-800 rounded"
                        >
                          <FaCopy />
                          نسخ
                        </button>
                        <button
                          onClick={() => toggleTafsir(verse.numberInSurah)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                        >
                          <FaInfoCircle />
                          تفسير
                        </button>
                        <button
                          onClick={() => removeFavourite(verse)}
                          className="flex items-center gap-1 px-2 py-1 bg-red-200 hover:bg-red-300 text-red-800 rounded"
                        >
                          <FaTimes />
                          إزالة من المفضلة
                        </button>
                      </div>
                      {verse.audio && playingAudio === verse.numberInSurah && (
                        <audio
                          autoPlay
                          onEnded={() => setPlayingAudio(null)}
                          className="absolute bottom-4 right-4 w-64"
                        >
                          <source src={verse.audio} type="audio/mpeg" />
                        </audio>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                className={`text-center py-12 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                لا توجد آيات مفضلة.
              </p>
            )}
          </section>
        ) : (
          // Quran Reading View (Card-style) – Always use RTL for Arabic
          <section
            ref={mainContentRef}
            className={`md:col-span-2 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg ${
              readingOption === 'juz' ? 'dir-rtl' : ''
            }`}
            dir="rtl"
          >
            {selectedSurah || readingOption === 'juz' ? (
              <>
                <div
                  className={`mb-6 text-center border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-teal-100'
                  } pb-4`}
                >
                  {readingOption === 'surah' ? (
                    selectedSurah && (
                      <>
                        <h1
                          className={`text-4xl font-bold ${
                            theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                          } mb-2 font-amiri`}
                        >
                          {selectedSurah.name}
                        </h1>
                        <p
                          className={`${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          عدد الآيات: {selectedSurah.numberOfAyahs} |{' '}
                          {selectedSurah.revelationType === 'Meccan'
                            ? 'مكية'
                            : 'مدنية'}
                        </p>
                      </>
                    )
                  ) : (
                    <>
                      <h1
                        className={`text-4xl font-bold ${
                          theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                        } mb-2 font-amiri`}
                      >
                        الجزء {selectedJuz}
                      </h1>
                      <p
                        className={`${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        قراءة حسب الجزء من القرآن
                      </p>
                    </>
                  )}
                  <div className="mt-4 flex justify-center gap-4">
                    <button
                      onClick={toggleReadingMode}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        readingMode
                          ? 'bg-teal-600 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                      }`}
                    >
                      <FaBook className="text-lg" />
                      {readingMode ? 'الخروج من وضع القراءة' : 'دخول وضع القراءة'}
                    </button>
                    <button
                      onClick={toggleListenMode}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        listenMode
                          ? 'bg-teal-600 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                      }`}
                    >
                      <FaHeadphones className="text-lg" />
                      {listenMode ? 'الخروج من وضع الاستماع' : 'دخول وضع الاستماع'}
                    </button>
                  </div>
                </div>

                {listenMode ? (
                  <div className="text-center relative">
                    <h2
                      className={`text-2xl font-bold ${
                        theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                      } mb-4 font-amiri`}
                    >
                      {readingOption === 'surah'
                        ? selectedSurah && selectedSurah.name
                        : `الجزء ${selectedJuz}`}
                    </h2>

                    <div className="mb-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          القارئ:
                        </label>
                        <select
                          value={reciter}
                          onChange={(e) => setReciter(e.target.value)}
                          className="p-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {reciters.map((r) => (
                            <option key={`reciter-${r.id}`} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowSpeedMenu((prev) => !prev)}
                          className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1"
                          title="تحكم السرعة"
                        >
                          <FaTachometerAlt />
                          السرعة
                        </button>
                        {showSpeedMenu && (
                          <div
                            className={`absolute top-[8rem] sm:top-[4.5rem] sm:right-[30%] md:right-[35%] lg:right-[40%]
                              bg-gray-700 text-white p-4 rounded shadow-md z-50 w-64`}
                          >
                            <h3 className="font-bold mb-2">Preset Speeds:</h3>
                            <div className="flex gap-2 flex-wrap mb-3">
                              {[0.25, 0.5, 1, 1.5, 2].map((spd) => (
                                <button
                                  key={`spd-${spd}`}
                                  onClick={() => setPlaybackRate(spd)}
                                  className={`px-3 py-1 rounded ${
                                    playbackRate === spd
                                      ? 'bg-red-600'
                                      : 'bg-gray-600 hover:bg-gray-500'
                                  }`}
                                >
                                  {spd}x
                                </button>
                              ))}
                            </div>
                            <h3 className="font-bold mb-1">
                              السرعة المخصصة: {playbackRate}x
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={() =>
                                  setPlaybackRate((prev) => Math.max(prev - 0.25, 0.25))
                                }
                                className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                              >
                                <FaMinus />
                              </button>
                              <button
                                onClick={() =>
                                  setPlaybackRate((prev) => Math.min(prev + 0.25, 2))
                                }
                                className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                              >
                                <FaPlus />
                              </button>
                            </div>
                            <input
                              type="range"
                              min="0.25"
                              max="2"
                              step="0.25"
                              value={playbackRate}
                              onChange={(e) =>
                                setPlaybackRate(parseFloat(e.target.value))
                              }
                              className="w-full accent-teal-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {isPlayingAll ? (
                      <div className="flex flex-col items-center gap-4">
                        <div
                          className={`flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto p-4 ${
                            theme === 'dark'
                              ? 'bg-gray-700 text-gray-100'
                              : 'bg-gray-200 text-gray-700'
                          } rounded-lg`}
                        >
                          <div className="flex gap-2">
                            {readingOption === 'surah' && (
                              <>
                                <button
                                  onClick={handlePreviousSurah}
                                  disabled={
                                    selectedSurah && selectedSurah.number <= 1
                                  }
                                  className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                                >
                                  <FaBackward />
                                </button>
                                <button
                                  onClick={handleNextSurah}
                                  disabled={isLastSurah}
                                  className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                                >
                                  <FaForward />
                                </button>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={skipBackward5}
                              className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white"
                            >
                              <FaUndoAlt />
                            </button>
                            <button
                              onClick={togglePauseResume}
                              className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white"
                            >
                              {isPaused ? <FaPlay /> : <FaPause />}
                            </button>
                            <button
                              onClick={skipForward5}
                              className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white"
                            >
                              <FaRedoAlt />
                            </button>
                            <button
                              onClick={stopPlayAll}
                              className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white"
                            >
                              <FaStop />
                            </button>
                          </div>

                          <div className="flex-1 flex flex-col md:flex-row items-center gap-2">
                            <span>
                              الوقت المنقضي: {elapsedTime} دقيقة | المتبقي:{' '}
                              {remainingTime} دقيقة
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={progress}
                              onChange={handleProgressChange}
                              className="flex-1 h-2 accent-teal-500"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white">
                              <FaVolumeUp />
                            </button>
                            <button
                              onClick={stopPlayAll}
                              className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>

                        <div
                          className={`mt-4 p-4 rounded-lg shadow-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-gray-100'
                              : 'bg-gray-100 border-gray-300 text-gray-700'
                          } w-full max-w-2xl mx-auto`}
                        >
                          <p
                            className="text-center font-arabic font-selectable"
                            style={{ fontSize: readingFontSize }}
                          >
                            {verses[currentPlayingIndex]?.text}
                          </p>
                        </div>
                        <p className="mt-2 text-gray-500">
                          الآية {currentPlayingIndex + 1} من {verses.length}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <p
                          className={`${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          } mb-2`}
                        >
                          اضغط على زر التشغيل للاستماع للسورة كاملة
                        </p>
                        <button
                          onClick={playAllSurah}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                        >
                          <FaPlay className="text-lg" />
                          تشغيل الكل
                        </button>
                      </div>
                    )}
                    <audio ref={audioAllRef} style={{ display: 'none' }} />
                    {listenMode && (
                      <p className="text-center text-gray-700 mt-2">
                        الوقت المنقضي: {elapsedTime} دقيقة | المتبقي: {remainingTime} دقيقة
                      </p>
                    )}
                  </div>
                ) : readingMode ? (
                  <div
                    ref={readingContainerRef}
                    className={`relative ${
                      isFullScreen ? 'w-full h-screen p-8 overflow-auto' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            setReadingFontSize((prev) => Math.max(prev - 2, 16))
                          }
                          className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <FaMinus />
                        </button>
                        <span className="text-gray-700">
                          {readingFontSize}px
                        </span>
                        <button
                          onClick={() => setReadingFontSize((prev) => prev + 2)}
                          className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-gray-700">نوع الخط:</label>
                        <select
                          value={tempFontFamily}
                          onChange={(e) => setTempFontFamily(e.target.value)}
                          className="p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {readingFonts.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setCurrentFontFamily(tempFontFamily)}
                          className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                        >
                          تطبيق الخط
                        </button>
                      </div>
                      <button
                        onClick={toggleFullScreen}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        {isFullScreen ? (
                          <>
                            <FaCompress className="text-lg" />
                            خروج من الشاشة الكاملة
                          </>
                        ) : (
                          <>
                            <FaExpand className="text-lg" />
                            شاشة كاملة
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mb-6">
                      <input
                        type="text"
                        placeholder="بحث في الآيات..."
                        value={verseFilter}
                        onChange={(e) => setVerseFilter(e.target.value)}
                        className={`w-full p-2 rounded-lg border ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-gray-200'
                            : 'bg-gray-50 border-teal-200 text-gray-700'
                        } focus:outline-none`}
                      />
                    </div>

                    {loading ? (
                      <div className="text-center py-12">
                        <div
                          className={`animate-spin inline-block w-8 h-8 border-4 ${
                            theme === 'dark'
                              ? 'border-teal-400'
                              : 'border-teal-500'
                          } rounded-full border-t-transparent`}
                        ></div>
                        <p
                          className={`mt-4 ${
                            theme === 'dark'
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          }`}
                        >
                          جاري تحميل الآيات...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div
                          className="space-y-6 font-arabic p-6 bg-yellow-50 border border-yellow-300 shadow-lg rounded-lg"
                          style={{
                            fontSize: `${readingFontSize}px`,
                            color: 'black',
                            fontFamily: currentFontFamily,
                          }}
                        >
                          {paginatedVerses.length > 0 ? (
                            paginatedVerses.map((verse) => {
                              // Combine number + numberInSurah for unique key
                              const verseKey = `${verse.number}-${verse.numberInSurah}`;
                              return (
                                <p key={verseKey} className="mb-4">
                                  {verse.text}{' '}
                                  <span className="text-base text-gray-500">
                                    ﴾{verse.numberInSurah}﴿
                                  </span>
                                </p>
                              );
                            })
                          ) : (
                            <p
                              className={`text-center py-12 ${
                                theme === 'dark'
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                              }`}
                            >
                              لم يتم العثور على آيات.
                            </p>
                          )}
                        </div>
                        <div className="mt-6 flex items-center justify-center space-x-4">
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-teal-500 text-white rounded disabled:opacity-50 hover:bg-teal-600 transition-colors"
                          >
                            السابق
                          </button>
                          <span className="text-gray-700">
                            الصفحة {currentPage} من {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-teal-500 text-white rounded disabled:opacity-50 hover:bg-teal-600 transition-colors"
                          >
                            التالي
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                    {loading ? (
                      <div className="text-center py-12">
                        <div
                          className={`animate-spin inline-block w-8 h-8 border-4 ${
                            theme === 'dark'
                              ? 'border-teal-400'
                              : 'border-teal-500'
                          } rounded-full border-t-transparent`}
                        ></div>
                        <p
                          className={`mt-4 ${
                            theme === 'dark'
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          }`}
                        >
                          جاري تحميل الآيات...
                        </p>
                      </div>
                    ) : (
                      <>
                        {paginatedVerses.length > 0 ? (
                          paginatedVerses.map((verse) => {
                            const verseKey = `${verse.number}-${verse.numberInSurah}`;
                            return (
                              <div
                                key={verseKey}
                                className={`group relative ${
                                  theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-50 hover:bg-teal-50'
                                } rounded-xl p-6 transition-colors`}
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <span
                                    className={`text-sm font-medium ${
                                      theme === 'dark'
                                        ? 'text-teal-200 bg-gray-600'
                                        : 'text-teal-600 bg-teal-100'
                                    } px-3 py-1 rounded-full`}
                                  >
                                    الآية {verse.numberInSurah}
                                  </span>
                                  {verse.audio && (
                                    <button
                                      onClick={() => {
                                        if (
                                          playingAudio === verse.numberInSurah
                                        ) {
                                          setPlayingAudio(null);
                                        } else {
                                          setPlayingAudio(verse.numberInSurah);
                                        }
                                      }}
                                      className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                                    >
                                      {playingAudio === verse.numberInSurah ? (
                                        <FaPause className="w-5 h-5" />
                                      ) : (
                                        <FaPlay className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <p
                                  className={`text-right text-4xl leading-loose ${
                                    theme === 'dark'
                                      ? 'text-gray-200'
                                      : 'text-gray-800'
                                  } font-arabic font-selectable mb-2`}
                                >
                                  {verse.text}
                                </p>
                                <div className="flex items-center gap-3 text-sm mt-1">
                                  <button
                                    onClick={() => copyVerseText(verse.text)}
                                    className="flex items-center gap-1 px-2 py-1 bg-teal-200 hover:bg-teal-300 text-teal-800 rounded"
                                  >
                                    <FaCopy />
                                    نسخ
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleTafsir(verse.numberInSurah)
                                    }
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                                  >
                                    <FaInfoCircle />
                                    تفسير
                                  </button>
                                  <button
                                    onClick={() => bookmarkVerse(verse)}
                                    className="flex items-center gap-1 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded"
                                  >
                                    <FaBookmark />
                                    مفضلة
                                  </button>
                                  <button
                                    onClick={() => setShareVerse(verse)}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded"
                                  >
                                    <FaShareAlt />
                                    مشاركة
                                  </button>
                                </div>
                                {tafsirOpen[verse.numberInSurah] && (
                                  <div
                                    className={`mt-2 p-3 border-l-4 border-teal-400 ${
                                      theme === 'dark'
                                        ? 'bg-gray-600 text-gray-100'
                                        : 'bg-gray-100 text-gray-700'
                                    } rounded`}
                                  >
                                    <p className="text-sm leading-relaxed">
                                      <strong>
                                        تفسير الآية {verse.numberInSurah}:
                                      </strong>
                                      <br />
                                      هذا نص افتراضي للتفسير. يمكنك استبداله ببيانات حقيقية من واجهة برمجة تطبيقات التفسير.
                                    </p>
                                  </div>
                                )}
                                {verse.audio &&
                                  playingAudio === verse.numberInSurah && (
                                    <audio
                                      autoPlay
                                      onEnded={() => setPlayingAudio(null)}
                                      className="absolute bottom-4 right-4 w-64"
                                    >
                                      <source
                                        src={verse.audio}
                                        type="audio/mpeg"
                                      />
                                    </audio>
                                  )}
                              </div>
                            );
                          })
                        ) : (
                          <p
                            className={`text-center py-12 ${
                              theme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-500'
                            }`}
                          >
                            لم يتم العثور على آيات.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div
                className={`text-center py-12 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                اختر سورة للبدء
              </div>
            )}
          </section>
        )}
      </div>

      {/* Scroll-to-top button for Reading Mode on mobile */}
      {readingMode && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 md:hidden"
          title="العودة للأعلى"
        >
          <FaArrowUp />
        </button>
      )}

      {/* Share Modal (only in card view) */}
      {shareVerse && activeTab !== 'favourites' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-center font-amiri">
              مشاركة الآية
            </h2>
            <p className="mb-4 text-center">{shareVerse.text}</p>
            <div className="flex justify-around gap-4 mb-4">
              <button
                onClick={() => setShareType('text')}
                className={`px-4 py-2 rounded ${
                  shareType === 'text' ? 'bg-teal-600 text-white' : 'bg-gray-300'
                }`}
              >
                مشاركة نص
              </button>
              <button
                onClick={() => setShareType('audio')}
                className={`px-4 py-2 rounded ${
                  shareType === 'audio' ? 'bg-teal-600 text-white' : 'bg-gray-300'
                }`}
              >
                مشاركة صوت
              </button>
            </div>
            {shareType === 'audio' && (
              <div className="mb-4">
                <label className="block text-sm mb-2">اختر القارئ:</label>
                <select
                  value={chosenReader}
                  onChange={(e) => setChosenReader(e.target.value)}
                  className="w-full p-2 rounded border"
                >
                  {reciters.map((reciter) => (
                    <option key={`share-reciter-${reciter.id}`} value={reciter.id}>
                      {reciter.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-around">
              <button
                onClick={() => handleShare('facebook')}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                <FaFacebook /> فيسبوك
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="px-3 py-2 bg-blue-400 text-white rounded"
              >
                <FaTwitter /> تويتر
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="px-3 py-2 bg-green-500 text-white rounded"
              >
                <FaWhatsapp /> واتساب
              </button>
            </div>
            <button
              onClick={() => setShareVerse(null)}
              className="mt-4 block mx-auto px-3 py-2 bg-gray-300 dark:bg-gray-600 rounded"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {copyMessage && (
        <div className="fixed bottom-4 right-4 bg-teal-600 text-white py-2 px-4 rounded shadow-lg transition-all">
          {copyMessage}
        </div>
      )}
    </div>
  );
}

export default Quran;
