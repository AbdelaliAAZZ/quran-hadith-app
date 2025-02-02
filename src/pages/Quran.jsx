import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
function Quran() {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reciter, setReciter] = useState('alafasy');
  const [error, setError] = useState('');
  const [playingAudio, setPlayingAudio] = useState(null);
  const { theme } = useTheme();

  // Expanded list of reciters
  const reciters = [
    { id: 'alafasy', name: 'Mishary Alafasy' },
    { id: 'husary', name: 'Mahmoud Al-Hussary' },
    { id: 'minshawi', name: 'Mohamed Al-Minshawi' },
   
  ];

  // Fetch surahs with error handling
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

  // Fetch verses with improved audio handling
  const fetchVerses = useCallback(async (surahNumber) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.${reciter}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch verses');
      
      const data = await response.json();
      setVerses(data.data?.ayahs || []);
    } catch (error) {
      console.error('Error fetching verses:', error);
      setError('Failed to load verses. Please check your connection or try another reciter.');
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [reciter]);

  // Handle audio play/pause
  const handleAudioPlay = (verseNumber) => {
    if (playingAudio === verseNumber) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(verseNumber);
    }
  };

  // Handle surah selection
  const handleSurahClick = (surah) => {
    setSelectedSurah(surah);
    setPlayingAudio(null);
    fetchVerses(surah.number);
  };

  // Handle reciter change
  useEffect(() => {
    if (selectedSurah) {
      setPlayingAudio(null);
      fetchVerses(selectedSurah.number);
    }
  }, [reciter, selectedSurah, fetchVerses]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-gray-900 to-gray-800' : 'from-teal-50 to-blue-50'} p-8`}>
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
    {/* Surah List */}
    <aside className={`md:w-1/3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg ${theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'}`}>
      <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-4 font-amiri`}>Surahs</h2>
      {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}
      <ul className="max-h-[70vh] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
        {surahs.map((surah) => (
          <li key={surah.number}>
            <button
              className={`w-full text-left py-3 px-4 rounded-lg transition-all duration-200 
                ${
                  selectedSurah?.number === surah.number
                    ? 'bg-teal-600 text-white shadow-md'
                    : `${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-800'}`
                }`}
              onClick={() => handleSurahClick(surah)}
            >
              <span className="font-medium">{surah.number}.</span> {surah.englishName}
              <span className={`block text-sm ${theme === 'dark' ? 'text-gray-400' : 'opacity-80'} mt-1`}>{surah.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>

    {/* Main Content */}
    <section className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 backdrop-blur-lg ${theme === 'dark' ? 'bg-opacity-90' : 'bg-opacity-80'}`}>
      {selectedSurah ? (
        <>
          {/* Surah Header */}
          <div className={`mb-8 text-center border-b ${theme === 'dark' ? 'border-gray-700' : 'border-teal-100'} pb-6`}>
            <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-teal-200' : 'text-teal-800'} mb-2 font-amiri`}>
              {selectedSurah.englishName}
              <span className={`text-3xl block mt-2 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}>
                {selectedSurah.name}
              </span>
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedSurah.englishNameTranslation} - {selectedSurah.numberOfAyahs} Verses
            </p>
          </div>

          {/* Reciter Selector */}
          <div className={`mb-8 flex flex-col sm:flex-row items-center gap-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-teal-50'} p-4 rounded-lg`}>
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

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-lg border ${theme === 'dark' ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-100 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* Verses List */}
          {loading ? (
            <div className="text-center py-12">
              <div className={`animate-spin inline-block w-8 h-8 border-4 ${theme === 'dark' ? 'border-teal-400' : 'border-teal-500'} rounded-full border-t-transparent`}></div>
              <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading verses...</p>
            </div>
          ) : (
            <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-200 scrollbar-track-transparent">
              {verses.length > 0 ? (
                verses.map((verse) => (
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
                        <p className={`text-right text-4xl leading-relaxed ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} font-arabic`}>
                      {verse.text}
                       </p>
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
                    !error && <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No verses found</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <svg className="w-16 h-16 mx-auto mb-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Select a Surah to begin
            </div>
          )}
        </section>
                    
      </div>
    </div>
  );
}

export default Quran;