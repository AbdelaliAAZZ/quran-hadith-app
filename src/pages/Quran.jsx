import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FaHeart,
  FaArrowUp,
  FaCopy,
  FaInfoCircle,
  FaShareAlt,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaSyncAlt,
  FaStarAndCrescent,
  FaRegCalendarCheck,
  FaBookOpen
} from 'react-icons/fa';

import PdfViewer from './PdfViewer';
import madinaIcon from '../assets/madina-img.ico';
import makkahIcon from '../assets/makkah-img.ico';
import book1Pdf from '../assets/book1.pdf';

/** 
 * Pad surah/verse numbers to 3 digits for the everyayah folder structure.
 * Example: 1 => '001'; 23 => '023'
 */
function padNumber(num) {
  return num.toString().padStart(3, '0');
}

/** 
 * Build a verse-by-verse recitation URL from everyayah.com 
 * Example: https://everyayah.com/data/Alafasy_128kbps/001001.mp3
 */
function buildAudioUrl(reciterId, surahNumber, verseNumber) {
  const surahStr = padNumber(surahNumber);
  const verseStr = padNumber(verseNumber);
  return `https://everyayah.com/data/${reciterId}/${surahStr}${verseStr}.mp3`;
}

/** 
 * Fetch tafsir from spa5k's GitHub-based API (Arabic).
 * We'll use Ibn Kathir (ar-tafsir-ibn-kathir) as an example edition.
 */
async function fetchTafsirSpa5k(surahNumber, verseNumber) {
  try {
    const base = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';
    const edition = 'ar-tafsir-ibn-kathir'; // This could be changed to other editions if needed
    const url = `${base}/${edition}/${surahNumber}/${verseNumber}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch tafsir from spa5k');
    }
    const data = await response.json();
    if (!data.text) {
      return 'لا يتوفر تفسير لهذه الآية.';
    }
    return data.text;
  } catch (error) {
    console.error('Tafsir fetch error:', error);
    return 'حدث خطأ أثناء جلب التفسير.';
  }
}

/** 
 * Simple function to detect if verse has Sajda data from Al-Quran Cloud
 */
function isSajda(ayah) {
  if (!ayah.sajda) return false;
  // The API sometimes returns an object with .recommended / .obligatory, or a boolean.
  if (typeof ayah.sajda === 'object') {
    return ayah.sajda.recommended || ayah.sajda.obligatory;
  }
  return !!ayah.sajda; 
}

/** 
 * Example Tajweed parser for demonstration.
 * You might replace it with real Tajweed logic or an external library.
 */
function applyTajweed(text = '') {
  // Example: highlight madd letters (ا, و, ي) in red/bold:
  return text.replace(
    /([اوي])/g,
    '<span style="color: #d9534f; font-weight: bold;">$1</span>'
  );
}

function Quran() {
  const { theme } = useTheme();

  // ---------------- MAIN STATES ---------------
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAudio, setPlayingAudio] = useState(null);
  const [verseFilter, setVerseFilter] = useState('');

  // Surah / Juz reading
  const [readingOption, setReadingOption] = useState('surah');
  const [selectedJuz, setSelectedJuz] = useState(1);

  // Reading or listening mode
  const [readingMode, setReadingMode] = useState(false);
  const [listenMode, setListenMode] = useState(false);

  // Reading display
  const [currentPage, setCurrentPage] = useState(1);
  const versesPerPage = 10;
  const [readingFontSize, setReadingFontSize] = useState(24);
  const [tempFontFamily, setTempFontFamily] = useState('Amiri');
  const [currentFontFamily, setCurrentFontFamily] = useState('Amiri');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Listen mode states
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState(false);

  // Reciter states
  const [reciter, setReciter] = useState('Alafasy_128kbps');
  const [chosenReader, setChosenReader] = useState('Alafasy_128kbps');

  // Bookmarks (verse-based)
  const [bookmarks, setBookmarks] = useState([]);
  // Bookmarks for reading mode (page-based)
  const [readingBookmarks, setReadingBookmarks] = useState([]);

  const [copyMessage, setCopyMessage] = useState('');
  const [activeTab, setActiveTab] = useState('quran');
  const [tafsirOpen, setTafsirOpen] = useState({});
  const [tafsirData, setTafsirData] = useState({});
  const [shareVerse, setShareVerse] = useState(null);
  const [shareType, setShareType] = useState('text');

  // Tajweed
  const [enableTajweed, setEnableTajweed] = useState(false);

  // Sajda table
  const [showSajdaTable, setShowSajdaTable] = useState(false);

  // Khatam calculator
  const [readingGoalDays, setReadingGoalDays] = useState('');
  const [pagesPerDay, setPagesPerDay] = useState('');
  const [versesPerDay, setVersesPerDay] = useState('');

  // Refs
  const mainContentRef = useRef(null);
  const audioAllRef = useRef(null);
  const readingContainerRef = useRef(null);
  const verseRefs = useRef({});

  // Some known reciters on everyayah
  const recitersList = [
    { id: 'Alafasy_128kbps', name: 'مشاري العفاسي' },
    { id: 'Husary_128kbps', name: 'محمود الحصري' },
    { id: 'Minshawi_128kbps', name: 'محمد المنشاوي' }
  ];

  // ---------------- LOAD from localStorage ---------------
  useEffect(() => {
    const storedFavs = localStorage.getItem('quranBookmarks');
    if (storedFavs) {
      setBookmarks(JSON.parse(storedFavs));
    }
    const storedReadingBookmarks = localStorage.getItem('readingBookmarks');
    if (storedReadingBookmarks) {
      setReadingBookmarks(JSON.parse(storedReadingBookmarks));
    }
  }, []);

  // ---------------- FETCH Surahs from Al-Quran Cloud ---------------
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

  // Default Surah = Al-Fatiha if none selected
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

  // fetch verses from Al-Quran Cloud (by Surah)
  const fetchVerses = useCallback(
    async (surahNumber) => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/surah/${surahNumber}?edition=quran-uthmani`
        );
        if (!response.ok) throw new Error('فشل في جلب الآيات');
        const data = await response.json();
        const fetchedVerses = data.data?.ayahs || [];
        const updated = fetchedVerses.map((v) => ({
          ...v,
          audio: buildAudioUrl(reciter, surahNumber, v.numberInSurah)
        }));
        setVerses(updated);
      } catch (err) {
        console.error('خطأ في جلب الآيات:', err);
        setError('فشل تحميل الآيات. يرجى المحاولة لاحقاً.');
        setVerses([]);
      } finally {
        setLoading(false);
      }
    },
    [reciter]
  );

  // fetch verses from Al-Quran Cloud (by Juz)
  const fetchJuz = useCallback(
    async (juzNumber) => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`
        );
        if (!response.ok) throw new Error('فشل في جلب الجزء');
        const data = await response.json();
        const fetched = data.data?.ayahs || [];
        const updated = fetched.map((v) => ({
          ...v,
          audio: buildAudioUrl(reciter, v.surah.number, v.numberInSurah)
        }));
        setVerses(updated);
      } catch (err) {
        console.error('خطأ في جلب الجزء:', err);
        setError('فشل تحميل الجزء. يرجى المحاولة لاحقاً.');
        setVerses([]);
      } finally {
        setLoading(false);
      }
    },
    [reciter]
  );

  // If user picks Surah
  useEffect(() => {
    if (readingOption === 'surah' && selectedSurah) {
      fetchVerses(selectedSurah.number);
    }
  }, [reciter, selectedSurah, readingOption, fetchVerses]);

  // If user picks Juz
  useEffect(() => {
    if (readingOption === 'juz') {
      fetchJuz(selectedJuz);
    }
  }, [readingOption, selectedJuz, fetchJuz]);

  // If reciter changes while Surah is playing
  useEffect(() => {
    if (playingAudio !== null) {
      setPlayingAudio(null);
    }
    if (isPlayingAll) {
      stopPlayAll();
      setTimeout(() => {
        playAllSurah();
      }, 100);
    }
    // eslint-disable-next-line
  }, [reciter]);

  // Build refs for each verse
  useEffect(() => {
    const refsObj = {};
    verses.forEach((v) => {
      const key = `${v.number}-${v.numberInSurah}`;
      refsObj[key] = refsObj[key] || React.createRef();
    });
    verseRefs.current = refsObj;
  }, [verses]);

  // Surah click
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

  // Scroll to Sajda
  const scrollToSajda = (verse) => {
    const key = `${verse.number}-${verse.numberInSurah}`;
    const ref = verseRefs.current[key];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setShowSajdaTable(false);
  };

  // Filter verses by user input
  const filteredVersesData = verses.filter(
    (verse) =>
      verse.text.includes(verseFilter) ||
      verse.numberInSurah.toString().includes(verseFilter)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredVersesData.length / versesPerPage);
  const paginatedVerses = readingMode
    ? filteredVersesData.slice(
        (currentPage - 1) * versesPerPage,
        currentPage * versesPerPage
      )
    : filteredVersesData;

  // Listen mode: play entire Surah
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
      audioAllRef.current.play().catch((err) => console.error('Audio play error:', err));
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

  const togglePauseResume = () => {
    if (!audioAllRef.current) return;
    if (isPaused) {
      audioAllRef.current.play().catch((err) => console.error(err));
      setIsPaused(false);
    } else {
      audioAllRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleNextSurah = () => {
    if (!selectedSurah) return;
    stopPlayAll();
    const currentIndex = surahs.findIndex((s) => s.number === selectedSurah.number);
    if (currentIndex >= 0 && currentIndex < surahs.length - 1) {
      const nextSurah = surahs[currentIndex + 1];
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

  // Range slider for audio progress
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

  // track audio changes
  useEffect(() => {
    const audioEl = audioAllRef.current;
    if (!audioEl) return;
    audioEl.playbackRate = playbackRate;
    audioEl.volume = volume;

    const handleTimeUpdate = () => {
      if (audioEl.duration) {
        const current = audioEl.currentTime;
        setProgress((current / audioEl.duration) * 100);
        setElapsedTime(Math.floor(current / 60));
        setRemainingTime(Math.ceil((audioEl.duration - current) / 60));
      }
    };

    const handleEnded = () => {
      if (repeatMode) {
        audioEl.currentTime = 0;
        audioEl.play().catch((err) => console.error('Audio error:', err));
        return;
      }
      if (currentPlayingIndex < verses.length - 1 && isPlayingAll) {
        const nextIndex = currentPlayingIndex + 1;
        setCurrentPlayingIndex(nextIndex);
        setProgress(0);
        audioEl.src = verses[nextIndex].audio;
        audioEl.currentTime = 0;
        audioEl.play().catch((err) => console.error('Audio play error:', err));
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
  }, [currentPlayingIndex, verses, isPlayingAll, playbackRate, volume, repeatMode]);

  // Toggle reading & listening modes
  const toggleReadingMode = () => {
    setReadingMode((prev) => !prev);
    setListenMode(false);
    setCurrentPage(1);
  };

  const toggleListenMode = () => {
    setReadingMode(false);
    setIsPlayingAll(false);
    setListenMode((prev) => !prev);
  };

  // If verseFilter changes, go back to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [verseFilter, selectedSurah, readingOption]);

  // Fullscreen
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
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Copy verse
  const copyVerseText = (verseText) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(verseText).then(() => {
      setCopyMessage('تم نسخ الآية!');
      setTimeout(() => setCopyMessage(''), 2000);
    });
  };

  // Toggle tafsir
  const toggleTafsir = async (verseNumberInSurah, surahNumber) => {
    const key = `${surahNumber}-${verseNumberInSurah}`;
    setTafsirOpen((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
    if (!tafsirData[key]) {
      const tafsirText = await fetchTafsirSpa5k(surahNumber, verseNumberInSurah);
      setTafsirData((prevData) => ({
        ...prevData,
        [key]: tafsirText
      }));
    }
  };

  // Verse-based bookmark
  const bookmarkVerse = (verse) => {
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

  // Remove from verse-based favorites
  const removeFavourite = (verse) => {
    const bookmarkKey = `${verse.number}-${verse.numberInSurah}`;
    const updated = bookmarks.filter(
      (b) => `${b.number}-${b.numberInSurah}` !== bookmarkKey
    );
    setBookmarks(updated);
    localStorage.setItem('quranBookmarks', JSON.stringify(updated));
  };

  // Page-based reading bookmarks
  const addReadingBookmark = () => {
    const alreadyExists = readingBookmarks.find((b) => b.page === currentPage);
    if (!alreadyExists) {
      const newMark = { page: currentPage, date: new Date().toISOString() };
      const newList = [...readingBookmarks, newMark];
      setReadingBookmarks(newList);
      localStorage.setItem('readingBookmarks', JSON.stringify(newList));
      setCopyMessage(`تم حفظ الصفحة ${currentPage}!`);
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const goToReadingBookmark = (page) => {
    setCurrentPage(page);
    setCopyMessage(`تم الانتقال إلى الصفحة ${page}`);
    setTimeout(() => setCopyMessage(''), 2000);
  };

  // Share
  const handleShare = (platform) => {
    if (!shareVerse) return;
    let extraInfo = '';
    let revealType = '';
    if (selectedSurah) {
      revealType = selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';
      extraInfo = `📖 سورة ${selectedSurah.name} - آية ${shareVerse.numberInSurah} (${revealType})\n\n`;
    }
    let text = extraInfo + encodeURIComponent(shareVerse.text);

    if (shareType === 'audio') {
      let audioURL = shareVerse.audio;
      if (audioURL && reciter !== chosenReader) {
        audioURL = audioURL.replace(reciter, chosenReader);
      }
      text = encodeURIComponent(
        `${extraInfo}${shareVerse.text}\n\n🔊 استمع للآية بصوت ${
          recitersList.find((r) => r.id === chosenReader)?.name
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

  // Scroll to top (useful in reading mode)
  const scrollToTop = () => {
    if (readingContainerRef.current) {
      readingContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Show entire Quran PDF
  const [showAllQuran, setShowAllQuran] = useState(false);
  if (showAllQuran) {
    return <PdfViewer file={book1Pdf} onClose={() => setShowAllQuran(false)} />;
  }

  // Identify Sajda verses
  const sajdaVerses = verses.filter((v) => isSajda(v));

  // Khatam calculator
  const handleReadingPlan = () => {
    if (readingGoalDays && readingGoalDays > 0) {
      // Mushaf standard: 604 pages, 6236 verses
      const ppd = Math.ceil(604 / readingGoalDays);
      const vpd = Math.ceil(6236 / readingGoalDays);
      setPagesPerDay(ppd);
      setVersesPerDay(vpd);
    } else {
      setPagesPerDay('');
      setVersesPerDay('');
    }
  };

  // Render
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
          className={`block md:col-span-1 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } rounded-xl shadow-lg p-4 md:p-6 backdrop-blur-lg ${
            theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'
          }`}
        >
          {/* Tabs: Quran / Favorites */}
          <div className="mb-4 flex flex-wrap justify-around gap-2">
            <button
              onClick={() => setActiveTab('quran')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeTab === 'quran'
                  ? 'bg-teal-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              <FaBookOpen />
              القرآن
            </button>
            <button
              onClick={() => setActiveTab('favourites')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeTab === 'favourites'
                  ? 'bg-teal-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-teal-200 hover:bg-gray-600'
                  : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
              }`}
            >
              <FaHeart />
              المفضلة
            </button>
            {activeTab === 'quran' && (
              <button
                onClick={() => setShowSajdaTable(true)}
                className="px-4 py-2 rounded flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700"
              >
                <FaStarAndCrescent />
                سجدات
              </button>
            )}
          </div>

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
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 justify-center"
                >
                  <FaBook />
                  قراءة القرآن بالكامل (PDF)
                </button>
              </div>
            </div>
          )}

          {/* If readingOption is surah, show surah list */}
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
              <ul className="max-h-[50vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                {filteredSurahs.map((surah) => (
                  <li key={`surah-${surah.number}`}>
                    <button
                      className={`w-full text-left py-3 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        selectedSurah?.number === surah.number
                          ? 'bg-teal-600 text-white shadow-md'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-800'
                      }`}
                      onClick={() => handleSurahClick(surah)}
                    >
                      <span className="font-medium">{surah.number}.</span>
                      <span>{surah.name}</span>
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

          {/* Khatam Calculator */}
          {activeTab === 'quran' && (
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FaRegCalendarCheck
                  className={`text-2xl ${
                    theme === 'dark' ? 'text-teal-300' : 'text-teal-600'
                  }`}
                />
                <h3
                  className={`text-lg font-bold ${
                    theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                  }`}
                >
                  حساب الختمة
                </h3>
              </div>
              <label
                htmlFor="reading-days"
                className="block mb-1 text-sm text-gray-700 dark:text-gray-200"
              >
                عدد الأيام لختم القرآن:
              </label>
              <input
                id="reading-days"
                type="number"
                value={readingGoalDays}
                onChange={(e) => setReadingGoalDays(e.target.value)}
                className="w-full p-2 mb-2 rounded border dark:bg-gray-600 dark:text-gray-100"
              />
              <button
                onClick={handleReadingPlan}
                className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
              >
                <FaSyncAlt />
                احسب
              </button>
              {(pagesPerDay || versesPerDay) && (
                <div className="mt-4 text-gray-800 dark:text-gray-100">
                  <p>الصفحات يوميا: {pagesPerDay}</p>
                  <p>الآيات يوميا: {versesPerDay}</p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* MAIN CONTENT: either Favourites tab or Quran tab */}
        {activeTab === 'favourites' ? (
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
              <p
                className={`${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                آياتك المفضلة
              </p>
            </div>
            {bookmarks.length > 0 ? (
              <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                {bookmarks.map((verse) => {
                  const bookmarkKey = `${verse.number}-${verse.numberInSurah}`;
                  const surahNumber = verse.surah?.number || verse.number;
                  const tafKey = `${surahNumber}-${verse.numberInSurah}`;
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
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              theme === 'dark'
                                ? 'text-teal-200 bg-gray-600'
                                : 'text-teal-600 bg-teal-100'
                            } px-3 py-1 rounded-full`}
                          >
                            الآية {verse.numberInSurah}
                          </span>
                          {isSajda(verse) && (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                              <FaStarAndCrescent className="text-green-600" />
                              سجدة
                            </span>
                          )}
                        </div>
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
                        {enableTajweed ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: applyTajweed(verse.text)
                            }}
                          />
                        ) : (
                          verse.text
                        )}
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
                          onClick={() => toggleTafsir(verse.numberInSurah, surahNumber)}
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
                          إزالة
                        </button>
                      </div>
                      {tafsirOpen[tafKey] && (
                        <div
                          className={`mt-2 p-3 border-l-4 border-teal-400 ${
                            theme === 'dark'
                              ? 'bg-gray-600 text-gray-100'
                              : 'bg-gray-100 text-gray-700'
                          } rounded`}
                        >
                          <p className="text-sm leading-relaxed">
                            {tafsirData[tafKey] || 'جارٍ تحميل التفسير...'}
                          </p>
                        </div>
                      )}
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
                          {selectedSurah.revelationType === 'Meccan' ? (
                            <>
                              <img
                                src={makkahIcon}
                                alt="مكية"
                                className="w-6 h-6 inline-block mx-1"
                              />{' '}
                              مكية
                            </>
                          ) : (
                            <>
                              <img
                                src={madinaIcon}
                                alt="مدنية"
                                className="w-6 h-6 inline-block mx-1"
                              />{' '}
                              مدنية
                            </>
                          )}
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
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
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
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enableTajweed}
                        onChange={(e) => setEnableTajweed(e.target.checked)}
                        id="tajweed-toggle"
                      />
                      <label
                        htmlFor="tajweed-toggle"
                        className="text-sm text-teal-800 dark:text-teal-200"
                      >
                        تجويد
                      </label>
                    </div>
                  </div>
                </div>

                {/* If listening mode, show that block. If reading mode, show that block. Otherwise normal. */}
                {listenMode ? (
                  /* Listening mode block with skip, next surah, etc. */
                  <>
                    {/* Full listen mode code. We'll show the relevant UI so we keep references to skipForward5, etc. */}
                    <div className="text-center relative p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-lg">
                      <h2
                        className={`text-2xl font-bold mb-4 font-amiri ${
                          theme === 'dark' ? 'text-teal-200' : 'text-teal-800'
                        }`}
                      >
                        {readingOption === 'surah'
                          ? selectedSurah && selectedSurah.name
                          : `الجزء ${selectedJuz}`}
                      </h2>
                      <div className="mb-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                        {/* Reciter */}
                        <div className="flex items-center gap-2">
                          <FaHeadphones
                            className={`text-xl ${
                              theme === 'dark' ? 'text-teal-300' : 'text-teal-600'
                            }`}
                          />
                          <label className="text-sm">القارئ:</label>
                          <select
                            value={reciter}
                            onChange={(e) => setReciter(e.target.value)}
                            className="p-2 rounded-lg border bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-100"
                          >
                            {recitersList.map((r) => (
                              <option key={`reciter-${r.id}`} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Playback speed */}
                        <div className="flex items-center gap-2">
                          <FaTachometerAlt
                            className={`text-xl ${
                              theme === 'dark' ? 'text-teal-300' : 'text-teal-600'
                            }`}
                          />
                          <label className="text-sm">سرعة الصوت:</label>
                          <input
                            type="range"
                            min="0.25"
                            max="2"
                            step="0.25"
                            value={playbackRate}
                            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                            className="accent-teal-500"
                          />
                          <span className="text-sm">{playbackRate}x</span>
                        </div>
                        {/* Volume */}
                        <div className="flex items-center gap-2">
                          <FaVolumeUp
                            className={`text-xl ${
                              theme === 'dark' ? 'text-teal-300' : 'text-teal-600'
                            }`}
                          />
                          <label className="text-sm">الصوت:</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="accent-teal-500"
                          />
                          <span className="text-sm">{Math.round(volume * 100)}%</span>
                        </div>
                        {/* Repeat mode */}
                        <div className="flex items-center gap-2">
                          <FaSyncAlt
                            className={`text-xl ${
                              theme === 'dark' ? 'text-teal-300' : 'text-teal-600'
                            }`}
                          />
                          <button
                            onClick={() => setRepeatMode((prev) => !prev)}
                            className={`px-3 py-2 rounded ${
                              repeatMode
                                ? 'bg-red-600 text-white'
                                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-100'
                            }`}
                          >
                            {repeatMode ? 'تكرار: مفعل' : 'تكرار'}
                          </button>
                        </div>
                      </div>

                      {isPlayingAll ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-2xl mx-auto p-4 bg-white dark:bg-gray-600 bg-opacity-90 rounded-lg shadow-md">
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
                              <span className="text-gray-700 dark:text-gray-100">
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

                          <div className="mt-4 p-4 rounded-lg shadow-lg border bg-white dark:bg-gray-600 bg-opacity-90 w-full max-w-2xl mx-auto">
                            <p
                              className="text-center font-arabic font-selectable text-gray-800 dark:text-gray-100"
                              style={{ fontSize: readingFontSize }}
                              dangerouslySetInnerHTML={
                                enableTajweed
                                  ? {
                                      __html:
                                        applyTajweed(verses[currentPlayingIndex]?.text || '')
                                    }
                                  : { __html: verses[currentPlayingIndex]?.text || '' }
                              }
                            />
                          </div>
                          <p className="mt-2 text-gray-600 dark:text-gray-200">
                            الآية {currentPlayingIndex + 1} من {verses.length}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-gray-700 dark:text-gray-200 mb-2">
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
                        <p className="text-center text-gray-600 dark:text-gray-200 mt-2">
                          الوقت المنقضي: {elapsedTime} دقيقة | المتبقي: {remainingTime} دقيقة
                        </p>
                      )}
                    </div>
                  </>
                ) : readingMode ? (
                  // Reading mode
                  <div
                    ref={readingContainerRef}
                    className={`relative ${
                      isFullScreen ? 'w-full h-screen p-8 overflow-auto' : ''
                    }`}
                  >
                    {/* Show reading bookmarks at top */}
                    <div className="mb-6">
                      <button
                        onClick={addReadingBookmark}
                        className="flex items-center gap-2 px-3 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors mb-4"
                      >
                        <FaHeart />
                        حفظ الصفحة الحالية ({currentPage})
                      </button>
                      {readingBookmarks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {readingBookmarks.map((bm) => (
                            <button
                              key={bm.page}
                              onClick={() => goToReadingBookmark(bm.page)}
                              className="px-3 py-1 bg-teal-300 text-teal-800 rounded hover:bg-teal-400 transition-colors text-sm"
                            >
                              صفحة {bm.page}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* Decrease font */}
                        <button
                          onClick={() =>
                            setReadingFontSize((prev) => Math.max(prev - 2, 16))
                          }
                          className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <FaMinus />
                        </button>
                        <span className="text-gray-700 dark:text-gray-200">
                          {readingFontSize}px
                        </span>
                        {/* Increase font */}
                        <button
                          onClick={() => setReadingFontSize((prev) => prev + 2)}
                          className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-gray-700 dark:text-gray-200">نوع الخط:</label>
                        <select
                          value={tempFontFamily}
                          onChange={(e) => setTempFontFamily(e.target.value)}
                          className="p-2 rounded-lg border bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          <option value="Amiri">أميري</option>
                          <option value="Reem Kufi">ريـم كوفي</option>
                          <option value="Lateef">لطيف</option>
                          <option value="Scheherazade">شهرزاد</option>
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
                        />
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
                        <div
                          className="space-y-6 font-arabic p-6 bg-yellow-50 border border-yellow-300 shadow-lg rounded-lg"
                          style={{
                            fontSize: `${readingFontSize}px`,
                            color: 'black',
                            fontFamily: currentFontFamily
                          }}
                        >
                          {paginatedVerses.length > 0 ? (
                            paginatedVerses.map((verse) => {
                              const verseKey = `${verse.number}-${verse.numberInSurah}`;
                              return (
                                <p
                                  key={verseKey}
                                  className="mb-4"
                                  ref={verseRefs.current[verseKey]}
                                >
                                  {enableTajweed ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: applyTajweed(verse.text)
                                      }}
                                    />
                                  ) : (
                                    verse.text
                                  )}{' '}
                                  <span className="text-base text-gray-500">
                                    ﴾{verse.numberInSurah}﴿
                                  </span>
                                  {isSajda(verse) && (
                                    <span className="inline-flex items-center ml-2 px-2 py-1 bg-green-200 text-green-700 rounded">
                                      <FaStarAndCrescent className="mr-1" />
                                      سجدة
                                    </span>
                                  )}
                                </p>
                              );
                            })
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
                        <div className="mt-6 flex items-center justify-center space-x-4">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-teal-500 text-white rounded disabled:opacity-50 hover:bg-teal-600 transition-colors"
                          >
                            السابق
                          </button>
                          <span className="text-gray-700 dark:text-gray-200">
                            الصفحة {currentPage} من {totalPages}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
                  // Normal listing (no reading, no listening)
                  <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
                    {loading ? (
                      <div className="text-center py-12">
                        <div
                          className={`animate-spin inline-block w-8 h-8 border-4 ${
                            theme === 'dark'
                              ? 'border-teal-400'
                              : 'border-teal-500'
                          } rounded-full border-t-transparent`}
                        />
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
                        {paginatedVerses.length > 0 ? (
                          paginatedVerses.map((verse) => {
                            const verseKey = `${verse.number}-${verse.numberInSurah}`;
                            const surahNumber = verse.surah?.number || verse.number;
                            const tfKey = `${surahNumber}-${verse.numberInSurah}`;
                            return (
                              <div
                                key={verseKey}
                                ref={verseRefs.current[verseKey]}
                                className={`group relative ${
                                  theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-50 hover:bg-teal-50'
                                } rounded-xl p-6 transition-colors`}
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-sm font-medium ${
                                        theme === 'dark'
                                          ? 'text-teal-200 bg-gray-600'
                                          : 'text-teal-600 bg-teal-100'
                                      } px-3 py-1 rounded-full`}
                                    >
                                      الآية {verse.numberInSurah}
                                    </span>
                                    {isSajda(verse) && (
                                      <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                                        <FaStarAndCrescent className="mr-1" />
                                        سجدة
                                      </span>
                                    )}
                                  </div>
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
                                    theme === 'dark'
                                      ? 'text-gray-200'
                                      : 'text-gray-800'
                                  } font-arabic font-selectable mb-2`}
                                >
                                  {enableTajweed ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: applyTajweed(verse.text)
                                      }}
                                    />
                                  ) : (
                                    verse.text
                                  )}
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
                                    onClick={() => toggleTafsir(verse.numberInSurah, surahNumber)}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                                  >
                                    <FaInfoCircle />
                                    تفسير
                                  </button>
                                  <button
                                    onClick={() => bookmarkVerse(verse)}
                                    className="flex items-center gap-1 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded"
                                  >
                                    <FaHeart />
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
                                {tafsirOpen[tfKey] && (
                                  <div
                                    className={`mt-2 p-3 border-l-4 border-teal-400 ${
                                      theme === 'dark'
                                        ? 'bg-gray-600 text-gray-100'
                                        : 'bg-gray-100 text-gray-700'
                                    } rounded`}
                                  >
                                    <p className="text-sm leading-relaxed">
                                      {tafsirData[tfKey] || 'جارٍ تحميل التفسير...'}
                                    </p>
                                  </div>
                                )}
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
                          })
                        ) : (
                          <p
                            className={`text-center py-12 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
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
                <p>اختر سورة للبدء</p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Sajda Table Modal */}
      {showSajdaTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-amiri">آيات السجدة</h2>
              <button
                onClick={() => setShowSajdaTable(false)}
                className="text-red-500 hover:text-red-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr
                  className={`${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-100'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <th className="py-2 px-4 border-b">#</th>
                  <th className="py-2 px-4 border-b">السورة</th>
                  <th className="py-2 px-4 border-b">الآية</th>
                  <th className="py-2 px-4 border-b">اذهب</th>
                </tr>
              </thead>
              <tbody>
                {sajdaVerses.length > 0 ? (
                  sajdaVerses.map((verse, idx) => {
                    const key = `${verse.number}-${verse.numberInSurah}`;
                    return (
                      <tr
                        key={key}
                        className={`cursor-pointer hover:${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
                        }`}
                      >
                        <td className="py-2 px-4 border-b text-center">{idx + 1}</td>
                        <td className="py-2 px-4 border-b text-center">
                          {verse.surah?.name || 'سورة'}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          {verse.numberInSurah}
                        </td>
                        <td className="py-2 px-4 border-b text-center">
                          <button
                            onClick={() => scrollToSajda(verse)}
                            className={`px-3 py-1 rounded text-white ${
                              theme === 'dark'
                                ? 'bg-teal-600 hover:bg-teal-700'
                                : 'bg-teal-600 hover:bg-teal-700'
                            }`}
                          >
                            عرض
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      لا توجد آيات سجدة في هذه السورة/الجزء.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scroll-to-top button (Reading Mode on mobile) */}
      {readingMode && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 md:hidden"
          title="العودة للأعلى"
        >
          <FaArrowUp />
        </button>
      )}

      {/* Share Modal */}
      {shareVerse && activeTab !== 'favourites' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            } relative`}
          >
            <button
              onClick={() => setShareVerse(null)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-600"
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center font-amiri">
              مشاركة الآية
            </h2>
            <p className="mb-4 text-center">{shareVerse.text}</p>
            <div className="flex justify-around gap-4 mb-4">
              <button
                onClick={() => setShareType('text')}
                className={`px-4 py-2 rounded ${
                  shareType === 'text'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                مشاركة نص
              </button>
              <button
                onClick={() => setShareType('audio')}
                className={`px-4 py-2 rounded ${
                  shareType === 'audio'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 dark:text-gray-200'
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
                  className="w-full p-2 rounded border dark:bg-gray-700 dark:text-gray-200"
                >
                  {recitersList.map((r) => (
                    <option key={`share-reciter-${r.id}`} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-around">
              <button
                onClick={() => handleShare('facebook')}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaFacebook />
                فيسبوك
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="px-3 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors flex items-center gap-2"
              >
                <FaTwitter />
                تويتر
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <FaWhatsapp />
                واتساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {copyMessage && (
        <div className="fixed bottom-4 right-4 bg-teal-600 text-white py-2 px-4 rounded shadow-lg transition-all z-50">
          {copyMessage}
        </div>
      )}
    </div>
  );
}

export default Quran;
