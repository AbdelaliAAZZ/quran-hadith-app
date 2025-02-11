import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

function Quran() {
  // Component States
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reciter, setReciter] = useState('alafasy');
  const [error, setError] = useState('');
  const [playingAudio, setPlayingAudio] = useState(null); // For individual verse play in Normal Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [readingMode, setReadingMode] = useState(false);
  const [listenMode, setListenMode] = useState(false);
  const [verseFilter, setVerseFilter] = useState('');
  // Pagination for Reading Mode
  const [currentPage, setCurrentPage] = useState(1);
  const versesPerPage = 10;
  // Font controls (applied in Reading Mode and Listen Mode)
  const [readingFontSize, setReadingFontSize] = useState(24);
  const [readingFontStyle, setReadingFontStyle] = useState('Amiri');
  // State for Listen Mode (play all surah audio)
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  // New state for pause/resume functionality and progress tracking
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const { theme } = useTheme();

  // Refs for auto‑scroll and audio playlist
  const mainContentRef = useRef(null);
  const audioAllRef = useRef(null);
  // A flag to automatically start playback when the new surah’s verses load
  const autoPlayRef = useRef(false);

  // List of reciters
  const reciters = [
    { id: 'alafasy', name: 'Mishary Alafasy' },
    { id: 'husary', name: 'Mahmoud Al-Hussary' },
    { id: 'minshawi', name: 'Mohamed Al-Minshawi' },
  ];

  // Fetch all surahs on mount
  useEffect(() => {
    setError('');
    fetch('https://api.alquran.cloud/v1/surah')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch surahs');
        return res.json();
      })
      .then((data) => setSurahs(data.data || []))
      .catch((error) => {
        console.error('Error fetching surahs:', error);
        setError('Failed to load surahs. Please try again later.');
      });
  }, []);

  // Filter surahs by English or Arabic name
  const filteredSurahs = surahs.filter((surah) =>
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.name.includes(searchQuery)
  );

  // Fetch verses for a surah
  const fetchVerses = useCallback(async (surahNumber) => {
    setLoading(true);
    setError('');
    let fetchedVerses = [];
    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.${reciter}`
      );
      if (!response.ok) throw new Error('Failed to fetch verses');
      const data = await response.json();
      fetchedVerses = data.data?.ayahs || [];
      setVerses(fetchedVerses);
    } catch (error) {
      console.error('Error fetching verses:', error);
      setError(
        'Failed to load verses. Please check your connection or try another reciter.'
      );
      setVerses([]);
    } finally {
      setLoading(false);
    }
    return fetchedVerses;
  }, [reciter]);

  // Handle individual verse audio play in Normal Mode
  const handleAudioPlay = (verseNumber) => {
    if (playingAudio === verseNumber) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(verseNumber);
    }
  };

  // When a surah is clicked: clear filters, load verses, reset pagination, and scroll (on mobile)
  const handleSurahClick = (surah) => {
    setSelectedSurah(surah);
    setPlayingAudio(null);
    setVerseFilter('');
    setCurrentPage(1);
    setIsPlayingAll(false);
    setListenMode(false); // turn off listen mode if active
    fetchVerses(surah.number);
    // Auto‑scroll on mobile devices
    if (window.innerWidth < 768 && mainContentRef.current) {
      setTimeout(() => {
        mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  // Refetch verses if the reciter or selected surah changes
  useEffect(() => {
    if (selectedSurah) {
      setPlayingAudio(null);
      fetchVerses(selectedSurah.number);
    }
  }, [reciter, selectedSurah, fetchVerses]);

  // Auto‑play in Listen Mode when new verses load
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

  // Attach a timeupdate listener for the progress bar
  useEffect(() => {
    const audioEl = audioAllRef.current;
    if (audioEl) {
      const handleTimeUpdate = () => {
        if (audioEl.duration) {
          setProgress((audioEl.currentTime / audioEl.duration) * 100);
        }
      };
      audioEl.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  // Toggle Reading Mode
  const toggleReadingMode = () => {
    setReadingMode((prev) => !prev);
    setListenMode(false); // ensure listen mode is off
    setCurrentPage(1);
  };

  // Toggle Listen Mode
  const toggleListenMode = () => {
    setListenMode((prev) => !prev);
    setReadingMode(false); // ensure reading mode is off
    setIsPlayingAll(false);
  };

  // Reset pagination when the verse filter or surah changes
  useEffect(() => {
    setCurrentPage(1);
  }, [verseFilter, selectedSurah]);

  // Filter verses based on the verseFilter input
  const filteredVerses = verses.filter((verse) =>
    verse.text.includes(verseFilter) ||
    verse.numberInSurah.toString().includes(verseFilter)
  );

  // Pagination calculations for Reading Mode
  const totalPages = Math.ceil(filteredVerses.length / versesPerPage);
  const paginatedVerses = readingMode
    ? filteredVerses.slice((currentPage - 1) * versesPerPage, currentPage * versesPerPage)
    : filteredVerses;

  // Listen Mode: Play All Surah (sequential playback)
  const playAllSurah = () => {
    if (!verses.length) return;
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

  // Toggle Pause/Resume (retaining current position within the verse)
  const togglePauseResume = () => {
    if (audioAllRef.current) {
      if (isPaused) {
        audioAllRef.current.play();
        setIsPaused(false);
      } else {
        audioAllRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  // Stop playback completely and reset progress
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

  // Handle audio ended event: play next verse if available
  const handleAudioEnded = () => {
    if (currentPlayingIndex < verses.length - 1) {
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

  // Handle Next Surah: resets and starts playback at beginning of new surah
  const handleNextSurah = () => {
    if (!selectedSurah) return;
    const currentIndex = surahs.findIndex(s => s.number === selectedSurah.number);
    if (currentIndex >= 0 && currentIndex < surahs.length - 1) {
      const nextSurah = surahs[currentIndex + 1];
      autoPlayRef.current = true; // flag for auto‑play when verses load
      setSelectedSurah(nextSurah);
      setPlayingAudio(null);
      setVerseFilter('');
      setCurrentPage(1);
      setIsPlayingAll(false);
      setIsPaused(false);
      setProgress(0);
      setListenMode(true);
      // Verses will be fetched via useEffect on selectedSurah change.
    }
  };

  // Determine if the current surah is the last in the list
  const currentSurahIndex = selectedSurah ? surahs.findIndex(s => s.number === selectedSurah.number) : -1;
  const isLastSurah = currentSurahIndex === surahs.length - 1;

  // Allow seeking by dragging the progress bar
  const handleProgressChange = (e) => {
    const newVal = e.target.value;
    if (audioAllRef.current && audioAllRef.current.duration) {
      const newTime = (newVal / 100) * audioAllRef.current.duration;
      audioAllRef.current.currentTime = newTime;
      setProgress(newVal);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-gray-900 to-gray-800' : 'from-teal-50 to-blue-50'} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar: Surah List & Search */}
        <aside className={`md:col-span-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg ${theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'}`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-4 font-amiri`}>
            السور
          </h2>
          <input
            type="text"
            placeholder="Search Surahs / بحث السور..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full mb-4 p-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-teal-200 text-gray-700'} focus:outline-none`}
          />
          {error && (
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          )}
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
                  <span className="font-medium">{surah.number}.</span> {surah.englishName}
                  <span className={`block text-sm ${theme === 'dark' ? 'text-gray-400' : 'opacity-80'} mt-1`}>
                    {surah.name}
                  </span>
                </button>
              </li>
            ))}
            {filteredSurahs.length === 0 && (
              <li className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                No surahs found / لم يتم العثور على سور.
              </li>
            )}
          </ul>
        </aside>

        {/* Main Content */}
        <section
          ref={mainContentRef}
          className={`md:col-span-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg ${theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'}`}
          // In Reading or Listen Mode, use RTL for Arabic reading flow
          dir={(readingMode || listenMode) ? 'rtl' : 'ltr'}
        >
          {selectedSurah ? (
            <>
              {/* Surah Header */}
              <div className={`mb-6 text-center border-b ${theme === 'dark' ? 'border-gray-700' : 'border-teal-100'} pb-4`}>
                {readingMode ? (
                  <>
                    <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-2 font-amiri`}>
                      {selectedSurah.name}
                    </h1>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      عدد الآيات: {selectedSurah.numberOfAyahs}
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-2 font-amiri`}>
                      {selectedSurah.englishName}
                      <span className={`text-2xl md:text-3xl block mt-2 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}>
                        {selectedSurah.name}
                      </span>
                    </h1>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedSurah.englishNameTranslation} - {selectedSurah.numberOfAyahs} Verses
                    </p>
                  </>
                )}
                {/* Mode Toggles */}
                <div className="mt-4 flex justify-center gap-4">
                  <button
                    onClick={toggleReadingMode}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      readingMode
                        ? 'bg-teal-600 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    {readingMode ? 'Exit Reading Mode' : 'Enter Reading Mode'}
                  </button>
                  <button
                    onClick={toggleListenMode}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      listenMode
                        ? 'bg-teal-600 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    {listenMode ? 'Exit Listen Mode' : 'Enter Listen Mode'}
                  </button>
                </div>
              </div>

              {/* Conditionally Render Content Based on Mode */}
              {listenMode ? (
                // Listen Mode: Audio player for the entire surah with Spotify‑like controls
                <div className="text-center">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-4 font-amiri`}>
                    {selectedSurah.name}
                  </h2>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    Listen to the entire surah
                  </p>
                  {isPlayingAll ? (
                    <div className="flex flex-col items-center gap-4">
                      {/* Playback Controls */}
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={togglePauseResume}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
                        >
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={stopPlayAll}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg"
                        >
                          Stop
                        </button>
                        <button
                          onClick={handleNextSurah}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                          disabled={isLastSurah}
                          title={isLastSurah ? "No next surah available" : "Next Surah"}
                        >
                          Next Surah
                        </button>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full max-w-md">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progress}
                          onChange={handleProgressChange}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {Math.floor(audioAllRef.current?.currentTime || 0)}s / {Math.floor(audioAllRef.current?.duration || 0)}s
                        </p>
                      </div>
                      {/* Display Current Verse Text */}
                      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p
                          className="text-center font-arabic font-selectable"
                          style={{ fontSize: readingFontSize, fontFamily: readingFontStyle }}
                        >
                          {verses[currentPlayingIndex]?.text}
                        </p>
                      </div>
                      <p className="mt-2 text-gray-500">
                        Playing verse {currentPlayingIndex + 1} of {verses.length}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={playAllSurah}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg"
                    >
                      Play All
                    </button>
                  )}
                  <audio ref={audioAllRef} onEnded={handleAudioEnded} style={{ display: 'none' }} />
                </div>
              ) : readingMode ? (
                // Reading Mode: Book‑style view with pagination and font controls
                <>
                  {/* Font Size & Style Controls */}
                  <div className="flex flex-col items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-gray-500">Font Size:</label>
                      <input
                        type="range"
                        min="12"
                        max="36"
                        step="2"
                        value={readingFontSize}
                        onChange={(e) => setReadingFontSize(parseInt(e.target.value))}
                        className="w-40"
                      />
                      <span className="text-gray-500">{readingFontSize}px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-gray-500">Font Style:</label>
                      <select
                        value={readingFontStyle}
                        onChange={(e) => setReadingFontStyle(e.target.value)}
                        className="p-2 rounded-lg border"
                      >
                        {['Amiri', 'Lateef', 'Scheherazade', 'Noto Sans Arabic'].map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Verse Filter */}
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Search Ayah / بحث في الآيات..."
                      value={verseFilter}
                      onChange={(e) => setVerseFilter(e.target.value)}
                      className={`w-full p-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-teal-200 text-gray-700'} focus:outline-none`}
                    />
                  </div>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className={`animate-spin inline-block w-8 h-8 border-4 ${theme === 'dark' ? 'border-teal-400' : 'border-teal-500'} rounded-full border-t-transparent`}></div>
                      <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading verses...</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6 font-arabic" style={{ fontSize: `${readingFontSize}px`, fontFamily: readingFontStyle }} dir="rtl">
                        {paginatedVerses.length > 0 ? (
                          paginatedVerses.map((verse) => (
                            <p key={verse.numberInSurah}>
                              {verse.text}{' '}
                              <span className="text-base text-gray-500">﴾{verse.numberInSurah}﴿</span>
                            </p>
                          ))
                        ) : (
                          <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            No verses found / لم يتم العثور على آيات.
                          </p>
                        )}
                      </div>
                      {/* Pagination Controls */}
                      <div className="mt-6 flex items-center justify-center space-x-4">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-teal-500 text-white rounded disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-gray-500">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-teal-500 text-white rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                // Normal Mode: Card‑style view with individual verse audio controls
                <>
                  {/* Reciter Selector */}
                  <div className={`mb-6 flex flex-col sm:flex-row items-center gap-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-teal-50'} p-4 rounded-lg`}>
                    <label className={`${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} font-medium min-w-[100px]`}>Reciter:</label>
                    <select
                      value={reciter}
                      onChange={(e) => setReciter(e.target.value)}
                      className={`w-full ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white'} border-2 ${theme === 'dark' ? 'border-gray-600' : 'border-teal-100'} rounded-xl p-3 focus:outline-none`}
                    >
                      {reciters.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Verse Filter */}
                  <div className="mb-6">
                    <input
                      type="text"
                      placeholder="Search Ayah / بحث في الآيات..."
                      value={verseFilter}
                      onChange={(e) => setVerseFilter(e.target.value)}
                      className={`w-full p-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-teal-200 text-gray-700'} focus:outline-none`}
                    />
                  </div>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className={`animate-spin inline-block w-8 h-8 border-4 ${theme === 'dark' ? 'border-teal-400' : 'border-teal-500'} rounded-full border-t-transparent`}></div>
                      <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading verses...</p>
                    </div>
                  ) : (
                    <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                      {filteredVerses.length > 0 ? (
                        filteredVerses.map((verse) => (
                          <div
                            key={verse.numberInSurah}
                            className={`group relative ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-teal-50'} rounded-xl p-6 transition-colors`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-teal-200 bg-gray-600' : 'text-teal-600 bg-teal-100'} px-3 py-1 rounded-full`}>
                                Verse {verse.numberInSurah}
                              </span>
                              {verse.audio && (
                                <button
                                  onClick={() => handleAudioPlay(verse.numberInSurah)}
                                  className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                                >
                                  {playingAudio === verse.numberInSurah ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                            <p className={`text-right text-4xl leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-arabic font-selectable`}>
                              {verse.text}
                            </p>
                            {verse.audio && playingAudio === verse.numberInSurah && (
                              <audio autoPlay onEnded={() => setPlayingAudio(null)} className="absolute bottom-4 right-4 w-64">
                                <source src={verse.audio} type="audio/mpeg" />
                              </audio>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          No verses found / لم يتم العثور على آيات.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <svg className="w-16 h-16 mx-auto mb-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Select a Surah / اختر سورة للبدء
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Quran;
