import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { WiSunrise, WiDaySunny, WiSunset, WiMoonAltFull } from 'react-icons/wi';

// --- Local Hijri-Gregorian Conversion Functions ---
// Convert Hijri date to Julian Day using a formula similar to Umm al-Qura
function hijriToJD(year, month, day) {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948440 -
    385
  );
}

// Convert Julian Day to Gregorian date
function jdToGregorian(jd) {
  let l = jd + 68569;
  let n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  let i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  let j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return { year, month, day };
}

// Local conversion: Hijri to Gregorian
function hijriToGregorianLocal(year, month, day) {
  const jd = hijriToJD(year, month, day);
  return jdToGregorian(jd);
}

// Generate Hijri calendar locally for a given Hijri year/month (assumes 30 days per month)
function generateCalendar(hYear, hMonth, hijriMonthNames) {
  const days = [];
  // For simplicity, assuming 30 days per Hijri month (adjust if needed)
  for (let d = 1; d <= 30; d++) {
    const gDate = hijriToGregorianLocal(hYear, hMonth, d);
    const jsDate = new Date(gDate.year, gDate.month - 1, gDate.day);
    days.push({
      hijri: { day: d, month: { ar: hijriMonthNames[hMonth - 1], number: hMonth }, year: hYear },
      gregorian: {
        day: gDate.day,
        month: gDate.month,
        year: gDate.year,
        date: `${gDate.day}-${gDate.month}-${gDate.year}`,
        jsDate,
      },
    });
  }
  return days;
}

const HijriCalendar = () => {
  const { theme } = useTheme();
  const [today] = useState(new Date());

  // Global States
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [countryName, setCountryName] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loadingPrayer, setLoadingPrayer] = useState(false);
  const [prayerError, setPrayerError] = useState(null);
  const [showPrayerTimes, setShowPrayerTimes] = useState(false);

  // Calendar States (Hijri-based)
  const [selectedHijriMonth, setSelectedHijriMonth] = useState(1);
  const [selectedHijriYear, setSelectedHijriYear] = useState(1444);
  const [searchHijriMonth, setSearchHijriMonth] = useState(1);
  const [searchHijriYear, setSearchHijriYear] = useState(1444);
  const [calendarData, setCalendarData] = useState([]);

  // Conversion Tool States
  const [showConversionTool, setShowConversionTool] = useState(false);
  const [hijriInput, setHijriInput] = useState({ day: '', month: '', year: '' });
  const [convertedToGregorian, setConvertedToGregorian] = useState(null);
  const [gregorianInput, setGregorianInput] = useState('');
  const [convertedToHijri, setConvertedToHijri] = useState(null);

  // Memoized Hijri Month Names
  const hijriMonthNames = useMemo(() => [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الآخر',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ], []);

  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Prayer Icons Mapping (using original design)
  const prayerIcons = {
    Fajr: <WiSunrise className="text-3xl" />,
    Sunrise: <WiSunrise className="text-3xl" />,
    Dhuhr: <WiDaySunny className="text-3xl" />,
    Asr: <WiDaySunny className="text-3xl" />,
    Maghrib: <WiSunset className="text-3xl" />,
    Isha: <WiMoonAltFull className="text-3xl" />,
  };

  // Fetch Country Name (Reverse Geocoding)
  const fetchCountryName = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      return data.address?.country || '';
    } catch (err) {
      console.error('Error in reverse geocoding:', err);
      return '';
    }
  };

  // Fetch Prayer Times using Aladhan API
  const fetchPrayerTimes = async (location) => {
    if (!location) return;
    setLoadingPrayer(true);
    setPrayerError(null);
    try {
      const { lat, lng } = location;
      const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === 200) {
        setPrayerTimes(data.data.timings);
      } else {
        setPrayerError('حدث خطأ أثناء جلب مواقيت الصلاة');
      }
    } catch (err) {
      console.error(err);
      setPrayerError('حدث خطأ أثناء جلب مواقيت الصلاة');
    } finally {
      setLoadingPrayer(false);
    }
  };

  // Activate location on demand with fallback if permission is denied
  const activateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          const country = await fetchCountryName(lat, lng);
          setCountryName(country);
          fetchPrayerTimes({ lat, lng });
        },
        (error) => {
          console.error('Location error:', error);
          // If permission denied, use fallback coordinates (e.g., Mecca)
          if (error.code === error.PERMISSION_DENIED) {
            const fallback = { lat: 21.3891, lng: 39.8579 };
            setUserLocation(fallback);
            fetchPrayerTimes(fallback);
          } else {
            setLocationError('يرجى تفعيل الموقع');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('الموقع غير مدعوم من المتصفح');
    }
  };

  // Set calendar to today's Hijri date using Aladhan conversion API
  const goToToday = async () => {
    const now = new Date();
    const url = `https://api.aladhan.com/v1/gToH?date=${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}&method=4`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200) {
        const hijri = data.data.hijri;
        const hijriMonth = parseInt(hijri.month.number);
        const hijriYear = parseInt(hijri.year);
        setSelectedHijriMonth(hijriMonth);
        setSelectedHijriYear(hijriYear);
        setSearchHijriMonth(hijriMonth);
        setSearchHijriYear(hijriYear);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // On mount, set default calendar to today's Hijri date (via Aladhan API)
  useEffect(() => {
    const getHijriToday = async () => {
      const url = `https://api.aladhan.com/v1/gToH?date=${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}&method=4`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === 200) {
          const hijri = data.data.hijri;
          const hijriMonth = parseInt(hijri.month.number);
          const hijriYear = parseInt(hijri.year);
          setSelectedHijriMonth(hijriMonth);
          setSelectedHijriYear(hijriYear);
          setSearchHijriMonth(hijriMonth);
          setSearchHijriYear(hijriYear);
        }
      } catch (e) {
        console.error(e);
      }
    };
    getHijriToday();
  }, [today]);

  // Generate calendar locally whenever the selected Hijri month/year changes
  useEffect(() => {
    const calData = generateCalendar(selectedHijriYear, selectedHijriMonth, hijriMonthNames);
    setCalendarData(calData);
  }, [selectedHijriYear, selectedHijriMonth, hijriMonthNames]);

  // Calendar Navigation
  const goToPreviousHijriMonth = () => {
    if (selectedHijriMonth === 1) {
      setSelectedHijriMonth(12);
      setSelectedHijriYear(prev => prev - 1);
      setSearchHijriMonth(12);
      setSearchHijriYear(prev => prev - 1);
    } else {
      setSelectedHijriMonth(prev => prev - 1);
      setSearchHijriMonth(prev => prev - 1);
    }
  };

  const goToNextHijriMonth = () => {
    if (selectedHijriMonth === 12) {
      setSelectedHijriMonth(1);
      setSelectedHijriYear(prev => prev + 1);
      setSearchHijriMonth(1);
      setSearchHijriYear(prev => prev + 1);
    } else {
      setSelectedHijriMonth(prev => prev + 1);
      setSearchHijriMonth(prev => prev + 1);
    }
  };

  const handleSearch = () => {
    setSelectedHijriMonth(Number(searchHijriMonth));
    setSelectedHijriYear(Number(searchHijriYear));
  };

  // Conversion Tool Functions
  const handleConvertHijriToGregorian = () => {
    const { day, month, year } = hijriInput;
    if (!day || !month || !year) return;
    const gDate = hijriToGregorianLocal(Number(year), Number(month), Number(day));
    setConvertedToGregorian({
      date: `${gDate.day}-${gDate.month}-${gDate.year}`,
      weekday: { en: '' }
    });
  };

  const handleConvertGregorianToHijri = async () => {
    if (!gregorianInput) return;
    const [year, month, day] = gregorianInput.split('-');
    const url = `https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}&method=4`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200) {
        setConvertedToHijri(data.data.hijri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate grid offset based on the first Gregorian date of the generated calendar
  let offset = 0;
  if (calendarData.length > 0) {
    const firstDay = calendarData[0].gregorian.jsDate;
    const dayOfWeek = firstDay.getFullYear() === today.getFullYear() &&
                      firstDay.getMonth() === today.getMonth() &&
                      firstDay.getDate() === today.getDate()
                      ? firstDay.getDay()
                      : firstDay.getDay();
    offset = (dayOfWeek + 1) % 7;
  }
  const totalCells = offset + calendarData.length;

  return (
    <div
      dir="rtl"
      className={`p-4 max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
    >
      {locationError && <div className="text-center text-red-500 my-4">{locationError}</div>}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div className="flex items-center justify-center">
          <h1 className="text-3xl font-bold mr-2">التقويم الهجري</h1>
          {countryName && <span className="text-lg">({countryName})</span>}
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button
            onClick={() => {
              if (!userLocation) activateLocation();
              setShowPrayerTimes(!showPrayerTimes);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            {showPrayerTimes ? 'إخفاء مواقيت الصلاة' : 'عرض مواقيت الصلاة'}
          </button>
          <button
            onClick={() => setShowConversionTool(!showConversionTool)}
            className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            {showConversionTool ? 'إخفاء أداة التحويل' : 'عرض أداة التحويل'}
          </button>
        </div>
      </div>

      {showPrayerTimes && (
        <div className={`w-full max-w-md mx-auto p-4 rounded shadow-lg mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h2 className="text-xl font-semibold mb-2 text-center">مواقيت الصلاة</h2>
          {!userLocation && (
            <div className="text-center my-4">
              <button onClick={activateLocation} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                تفعيل الموقع
              </button>
            </div>
          )}
          {loadingPrayer ? (
            <p className="text-center">... جاري التحميل</p>
          ) : prayerError ? (
            <p className="text-center text-red-500">{prayerError}</p>
          ) : prayerTimes ? (
            <div className="space-y-4">
              {Object.entries(prayerTimes).map(([prayer, time]) => (
                <div key={prayer} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded shadow">
                  <div className="flex items-center gap-2">
                    {prayerIcons[prayer] || <WiDaySunny className="text-3xl" />}
                    <span className="font-semibold">{prayer}</span>
                  </div>
                  <span>{time}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 mb-6">
        <button
          onClick={goToPreviousHijriMonth}
          className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          <FaArrowLeft /> السابق
        </button>
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-500 text-white dark:bg-blue-700 dark:text-white rounded hover:bg-blue-600 dark:hover:bg-blue-600"
        >
          اليوم
        </button>
        <div className="flex items-center gap-2">
          <select
            value={searchHijriMonth}
            onChange={(e) => setSearchHijriMonth(Number(e.target.value))}
            className="p-2 border bg-white text-black rounded dark:bg-gray-700 dark:text-white"
          >
            {hijriMonthNames.map((name, idx) => (
              <option key={idx} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={searchHijriYear}
            onChange={(e) => setSearchHijriYear(e.target.value)}
            className="p-2 border bg-white text-black rounded w-24 dark:bg-gray-700 dark:text-white"
            placeholder="السنة"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            بحث
          </button>
        </div>
        <button
          onClick={goToNextHijriMonth}
          className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          التالي <FaArrowRight />
        </button>
      </div>

      {calendarData.length > 0 ? (
        <>
          <div className="grid grid-cols-7 text-center font-semibold border-b pb-2">
            {weekDays.map((day, idx) => (
              <div key={idx} className="py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {Array.from({ length: totalCells }).map((_, index) => {
              if (index < offset) {
                return <div key={index} className="p-2 border h-28"></div>;
              } else {
                const dayIndex = index - offset;
                const dayData = calendarData[dayIndex];
                const jsDate = dayData.gregorian.jsDate;
                const isToday =
                  jsDate.getFullYear() === today.getFullYear() &&
                  jsDate.getMonth() === today.getMonth() &&
                  jsDate.getDate() === today.getDate();
                return (
                  <div
                    key={index}
                    className={`p-2 border h-28 relative cursor-pointer rounded transition-transform duration-200 transform ${
                      isToday
                        ? 'bg-yellow-300 dark:bg-yellow-600'
                        : theme === 'dark'
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-white hover:bg-teal-100'
                    }`}
                  >
                    <div className="text-xl font-bold text-center">{dayData.hijri.day}</div>
                    <div className="text-xs text-center">{dayData.hijri.month.ar}</div>
                  </div>
                );
              }
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8">لا توجد بيانات للتقويم</div>
      )}

      {showConversionTool && (
        <div className="mt-6 p-4 border rounded bg-gray-100 dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
            أداة التحويل بين التقويمين
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded bg-white dark:bg-gray-700">
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-800 dark:text-white">
                من هجري إلى ميلادي
              </h3>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="اليوم"
                  value={hijriInput.day}
                  onChange={(e) => setHijriInput({ ...hijriInput, day: e.target.value })}
                  className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                />
                <select
                  value={hijriInput.month}
                  onChange={(e) => setHijriInput({ ...hijriInput, month: e.target.value })}
                  className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">اختر الشهر</option>
                  {hijriMonthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="السنة"
                  value={hijriInput.year}
                  onChange={(e) => setHijriInput({ ...hijriInput, year: e.target.value })}
                  className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleConvertHijriToGregorian}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  تحويل
                </button>
                {convertedToGregorian && (
                  <div className="mt-2 text-center text-gray-800 dark:text-white">
                    <strong>التاريخ الميلادي:</strong> {convertedToGregorian.date}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border rounded bg-white dark:bg-gray-700">
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-800 dark:text-white">
                من ميلادي إلى هجري
              </h3>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={gregorianInput}
                  onChange={(e) => setGregorianInput(e.target.value)}
                  className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleConvertGregorianToHijri}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  تحويل
                </button>
                {convertedToHijri && (
                  <div className="mt-2 text-center text-gray-800 dark:text-white">
                    <strong>التاريخ الهجري:</strong> {convertedToHijri.day} {convertedToHijri.month.ar} {convertedToHijri.year}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HijriCalendar;
