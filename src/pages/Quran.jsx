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
  FaUndoAlt, // skip back
  FaRedoAlt, // skip forward
  FaVolumeUp,
  FaTimes,
  FaCopy,
  FaInfoCircle,
} from 'react-icons/fa';

function Quran() {
  // Component states
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

  // Listen Mode: controlling the entire surah
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);

  // Audio player states
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1); // new: 0.5, 1, 1.5, 2

  // Full screen state for Reading Mode
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { theme } = useTheme();

  // Refs
  const mainContentRef = useRef(null);
  const audioAllRef = useRef(null);
  const readingContainerRef = useRef(null);
  const autoPlayRef = useRef(false);

  // Copy feedback message
  const [copyMessage, setCopyMessage] = useState('');

  // Tafsir open/close state for each verse
  // e.g. { '1': true, '2': false } means verse #1 is open, verse #2 is closed, etc.
  const [tafsirOpen, setTafsirOpen] = useState({});

  // List of reciters
  const reciters = [
    { id: 'alafasy', name: 'مشاري العفاسي' },
    { id: 'husary', name: 'محمود الحصري' },
    { id: 'minshawi', name: 'محمد المنشاوي' },
  ];

  // Additional reading fonts (to show "more reading choices")
  const readingFonts = [
    'Amiri',
    'Reem Kufi',
    'Lateef',
    'Scheherazade',
    'Noto Naskh Arabic',
    'KFGQPC Uthmanic Script',
  ];

  // Fetch all surahs on mount
  useEffect(() => {
    setError('');
    fetch('https://api.alquran.cloud/v1/surah')
      .then((res) => {
        if (!res.ok) throw new Error('فشل في جلب السور');
        return res.json();
      })
      .then((data) => setSurahs(data.data || []))
      .catch((err) => {
        console.error('خطأ في جلب السور:', err);
        setError('فشل تحميل السور. يرجى المحاولة لاحقاً.');
      });
  }, []);

  // Filter surahs by name
  const filteredSurahs = surahs.filter((surah) =>
    surah.name.includes(searchQuery)
  );

  // Fetch verses for a surah
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

  // When a surah is clicked
  const handleSurahClick = (surah) => {
    setSelectedSurah(surah);
    setPlayingAudio(null);
    setVerseFilter('');
    setCurrentPage(1);
    setIsPlayingAll(false);
    setListenMode(false);
    fetchVerses(surah.number);

    // Scroll to main content on small screens
    if (window.innerWidth < 768 && mainContentRef.current) {
      setTimeout(() => {
        mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  // Refetch verses if reciter changes
  useEffect(() => {
    if (selectedSurah) {
      setPlayingAudio(null);
      fetchVerses(selectedSurah.number);
    }
  }, [reciter, selectedSurah, fetchVerses]);

  // Listen Mode auto-play if triggered from Next/Prev Surah
  useEffect(() => {
    if (listenMode && selectedSurah && autoPlayRef.current && verses.length > 0) {
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
  }, [verses, listenMode, selectedSurah]);

  // Track audio progress & handle ended
  useEffect(() => {
    const audioEl = audioAllRef.current;
    if (!audioEl) return;

    // Set playbackRate whenever it changes
    audioEl.playbackRate = playbackRate;

    const handleTimeUpdate = () => {
      if (audioEl.duration) {
        setProgress((audioEl.currentTime / audioEl.duration) * 100);
      }
    };

    const handleEnded = () => {
      // Move to next verse if playing entire surah
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

  // Toggle reading/listen modes
  const toggleReadingMode = () => {
    setReadingMode((prev) => !prev);
    setListenMode(false);
    setCurrentPage(1);
  };

  const toggleListenMode = () => {
    setListenMode((prev) => !prev);
    setReadingMode(false);
    setIsPlayingAll(false);
  };

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [verseFilter, selectedSurah]);

  // Filter verses by text or verse number
  const filteredVerses = verses.filter(
    (verse) =>
      verse.text.includes(verseFilter) ||
      verse.numberInSurah.toString().includes(verseFilter)
  );

  const totalPages = Math.ceil(filteredVerses.length / versesPerPage);
  const paginatedVerses = readingMode
    ? filteredVerses.slice(
        (currentPage - 1) * versesPerPage,
        currentPage * versesPerPage
      )
    : filteredVerses;

  // Listen Mode: Play entire surah
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

  // Next/Previous Surah in Listen Mode
  const handleNextSurah = () => {
    if (!selectedSurah) return;
    stopPlayAll();
    const currentIndex = surahs.findIndex(
      (s) => s.number === selectedSurah.number
    );
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
    const currentIndex = surahs.findIndex(
      (s) => s.number === selectedSurah.number
    );
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

  // Listen Mode: progress bar seeking
  const handleProgressChange = (e) => {
    const newVal = e.target.value;
    if (audioAllRef.current && audioAllRef.current.duration) {
      const newTime = (newVal / 100) * audioAllRef.current.duration;
      audioAllRef.current.currentTime = newTime;
      setProgress(newVal);
    }
  };

  // Audio skip ±5 seconds
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

  // Fullscreen toggling for Reading Mode
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

  // Copy verse text
  const copyVerseText = (verseText) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(verseText).then(() => {
      setCopyMessage('تم نسخ الآية!');
      setTimeout(() => setCopyMessage(''), 2000);
    });
  };

  // Toggle tafsir open/close
  const toggleTafsir = (verseNumberInSurah) => {
    setTafsirOpen((prev) => ({
      ...prev,
      [verseNumberInSurah]: !prev[verseNumberInSurah],
    }));
  };

  // Placeholder for fetching real tafsir data if you have an API:
  // const fetchTafsir = async (verseNumberInSurah) => {
  //   // Example: call your tafsir endpoint here
  // };

  return (
    <div
      className={`min-h-screen p-4 md:p-8 bg-gradient-to-br ${
        theme === 'dark'
          ? 'from-gray-900 to-gray-800'
          : 'from-teal-50 to-blue-50'
      }`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar: Surah List & Search */}
        <aside
          className={`md:col-span-1 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg ${
            theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'
          }`}
        >
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
          {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}
          <ul className="max-h-[70vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
            {filteredSurahs.map((surah) => (
              <li key={surah.number}>
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
        </aside>

        {/* Main Content */}
        <section
          ref={mainContentRef}
          className={`md:col-span-2 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg ${
            theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'
          }`}
          dir={readingMode || listenMode ? 'rtl' : 'ltr'}
        >
          {selectedSurah ? (
            <>
              {/* Surah Header */}
              <div
                className={`mb-6 text-center border-b ${
                  theme === 'dark' ? 'border-gray-700' : 'border-teal-100'
                } pb-4`}
              >
                {readingMode ? (
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
                ) : (
                  <>
                    <h1
                      className={`text-3xl md:text-4xl font-bold ${
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
                )}
                {/* Mode Toggle Buttons */}
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

              {/* Content Display */}
              {listenMode ? (
                /* =====================================================
                   LISTEN MODE (Custom audio bar with skip, speed, etc.)
                ===================================================== */
                <div className="text-center">
                  <h2
                    className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                    } mb-4 font-amiri`}
                  >
                    {selectedSurah.name}
                  </h2>

                  {/* Reciter + Speed */}
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
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        السرعة:
                      </label>
                      <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="p-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="1">1x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                      </select>
                    </div>
                  </div>

                  {isPlayingAll ? (
                    <div className="flex flex-col items-center gap-4">
                      {/* Playback Controls */}
                      <div
                        className={`flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto p-4 ${
                          theme === 'dark'
                            ? 'bg-gray-700 text-gray-100'
                            : 'bg-gray-200 text-gray-700'
                        } rounded-lg`}
                      >
                        {/* Surah Nav Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={handlePreviousSurah}
                            disabled={selectedSurah.number <= 1}
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
                        </div>

                        {/* Skip / Play / Pause / Stop */}
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

                        {/* Progress Bar */}
                        <div className="flex-1 flex flex-col md:flex-row items-center gap-2">
                          <span>{Math.round(progress)}%</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleProgressChange}
                            className="flex-1 h-2 accent-teal-500"
                          />
                        </div>

                        {/* Extra icons (volume, etc.) - optional */}
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

                      {/* Display Current Verse Text */}
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
                    /* If not playing, show a simple button to play all */
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

                  {/* Hidden audio element */}
                  <audio ref={audioAllRef} style={{ display: 'none' }} />
                </div>
              ) : readingMode ? (
                /* =====================================================
                   READING MODE (simple colored background, no images)
                ===================================================== */
                <div
                  ref={readingContainerRef}
                  className={`relative ${
                    isFullScreen ? 'w-full h-screen p-8 overflow-auto' : ''
                  }`}
                >
                  {/* Reading Settings Panel */}
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
                      <span className="text-gray-700">{readingFontSize}px</span>
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
                  {/* Verse Filter */}
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
                          theme === 'dark' ? 'border-teal-400' : 'border-teal-500'
                        } rounded-full border-t-transparent`}
                      ></div>
                      <p
                        className={`mt-4 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        جاري تحميل الآيات...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* The reading container */}
                      <div
                        className="space-y-6 font-arabic p-6 bg-yellow-50 border border-yellow-300 shadow-lg rounded-lg"
                        style={{
                          fontSize: `${readingFontSize}px`,
                          color: 'black',
                          fontFamily: currentFontFamily,
                        }}
                      >
                        {paginatedVerses.length > 0 ? (
                          paginatedVerses.map((verse) => (
                            <div key={verse.numberInSurah} className="mb-4">
                              {/* Verse text */}
                              <p className="mb-1">
                                {verse.text}{' '}
                                <span className="text-base text-gray-500">
                                  ﴾{verse.numberInSurah}﴿
                                </span>
                              </p>

                              {/* Action buttons (copy, tafsir) */}
                              <div className="flex items-center gap-4 text-sm mt-1">
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
                              </div>

                              {/* Show/Hide tafsir (placeholder) */}
                              {tafsirOpen[verse.numberInSurah] && (
                                <div className="mt-2 p-3 border-l-4 border-teal-400 bg-gray-50 text-gray-700 rounded">
                                  {/* If you have a real tafsir, fetch it here. For now, placeholder: */}
                                  <p className="text-sm leading-relaxed">
                                    <strong>تفسير الآية {verse.numberInSurah}:</strong>{' '}
                                    <br />
                                    هنا يمكنك عرض التفسير الحقيقي من API آخر.
                                    هذا نص افتراضي للتوضيح فقط.
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p
                            className={`text-center py-12 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            لم يتم العثور على آيات.
                          </p>
                        )}
                      </div>
                      {/* Pagination Controls */}
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
                /* =====================================================
                   NORMAL MODE (Card-style with copy & tafsir)
                ===================================================== */
                <>
                  {/* Reciter Selector */}
                  <div
                    className={`mb-6 flex flex-col sm:flex-row items-center gap-4 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-teal-50'
                    } p-4 rounded-lg`}
                  >
                    <label
                      className={`${
                        theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                      } font-medium min-w-[100px]`}
                    >
                      القارئ:
                    </label>
                    <select
                      value={reciter}
                      onChange={(e) => setReciter(e.target.value)}
                      className={`w-full ${
                        theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white'
                      } border-2 ${
                        theme === 'dark' ? 'border-gray-600' : 'border-teal-100'
                      } rounded-xl p-3 focus:outline-none`}
                    >
                      {reciters.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Verse Filter */}
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
                          theme === 'dark' ? 'border-teal-400' : 'border-teal-500'
                        } rounded-full border-t-transparent`}
                      ></div>
                      <p
                        className={`mt-4 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        جاري تحميل الآيات...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                      {paginatedVerses.length > 0 ? (
                        paginatedVerses.map((verse) => (
                          <div
                            key={verse.numberInSurah}
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
                            {/* Verse text */}
                            <p
                              className={`text-right text-4xl leading-relaxed ${
                                theme === 'dark'
                                  ? 'text-gray-200'
                                  : 'text-gray-800'
                              } font-arabic font-selectable mb-2`}
                            >
                              {verse.text}
                            </p>

                            {/* Copy & Tafsir Buttons */}
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
                            </div>

                            {/* Show/Hide tafsir (placeholder text) */}
                            {tafsirOpen[verse.numberInSurah] && (
                              <div className="mt-2 p-3 border-l-4 border-teal-400 bg-gray-100 dark:bg-gray-600 dark:text-gray-100 rounded">
                                <p className="text-sm leading-relaxed">
                                  <strong>تفسير الآية {verse.numberInSurah}:</strong>{' '}
                                  <br />
                                  هذا نص افتراضي. يمكنك استبداله ببيانات حقيقية
                                  من واجهة برمجة تطبيقات التفسير.
                                </p>
                              </div>
                            )}

                            {/* Verse audio if playing */}
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
                        ))
                      ) : (
                        <p
                          className={`text-center py-12 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          لم يتم العثور على آيات.
                        </p>
                      )}
                    </div>
                  )}
                </>
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
      </div>

      {/* Copy Feedback Toast (simple) */}
      {copyMessage && (
        <div className="fixed bottom-4 right-4 bg-teal-600 text-white py-2 px-4 rounded shadow-lg transition-all">
          {copyMessage}
        </div>
      )}
    </div>
  );
}

export default Quran;
