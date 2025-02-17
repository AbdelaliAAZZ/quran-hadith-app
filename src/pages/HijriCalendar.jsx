import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const HijriCalendar = () => {
  const { theme } = useTheme();

  const [today] = useState(() => new Date());

  // Global States
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [countryName, setCountryName] = useState('');
  const [countryLogo, setCountryLogo] = useState('');
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
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState(null);

  // Conversion Tool States
  const [showConversionTool, setShowConversionTool] = useState(false);
  const [hijriInput, setHijriInput] = useState({ day: '', month: '', year: '' });
  const [convertedToGregorian, setConvertedToGregorian] = useState(null);
  const [gregorianInput, setGregorianInput] = useState('');
  const [convertedToHijri, setConvertedToHijri] = useState(null);

  // Static Arrays
  const hijriMonthNames = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 
    'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];
  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Helper: Parse "DD-MM-YYYY" into a Date object
  const parseGregorianDate = (dateStr) => {
    const parts = dateStr.split('-'); // [day, month, year]
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };

  // Fetch Country Name (Reverse Geocoding)
  const fetchCountryName = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      return data.address?.country || '';
    } catch (err) {
      console.error('خطأ في الاستعلام العكسي:', err);
      return '';
    }
  };

  // Fetch Prayer Times
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

  // Get User Location (with fallback)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          const country = await fetchCountryName(lat, lng);
          setCountryName(country);
          if (country === 'Saudi Arabia' || country === 'المملكة العربية السعودية') {
            setCountryLogo('https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Saudi_Arabia.svg/320px-Flag_of_Saudi_Arabia.svg.png');
          } else if (country === 'Egypt' || country === 'مصر') {
            setCountryLogo('https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_Egypt.svg');
          } else {
            setCountryLogo('');
          }
          fetchPrayerTimes({ lat, lng });
        },
        (error) => {
          console.error('خطأ في تحديد الموقع:', error);
          if (error.code !== error.PERMISSION_DENIED) {
            const fallback = { lat: 21.3891, lng: 39.8579 };
            setUserLocation(fallback);
            fetchCountryName(fallback.lat, fallback.lng).then((country) => {
              setCountryName(country);
            });
            fetchPrayerTimes(fallback);
          } else {
            setLocationError('يرجى تفعيل الموقع لعرض التقويم');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('الموقع غير مدعوم من متصفحك');
    }
  }, []);

  // Function: Set Calendar to Today's Hijri Date
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

  // On Mount: Set default calendar to today's Hijri date (run once)
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
  }, []);

  // Fetch Hijri Calendar Data
  const fetchHijriCalendar = async (hYear, hMonth) => {
    setLoadingCalendar(true);
    setCalendarError(null);
    try {
      const urlConv = `https://api.aladhan.com/v1/hToG?date=1-${hMonth}-${hYear}&method=4`;
      const resConv = await fetch(urlConv);
      const dataConv = await resConv.json();
      if (dataConv.code !== 200) throw new Error('Conversion error');
      const gDate = dataConv.data.gregorian;
      const gMonth = parseInt(gDate.month.number);
      const gYear = parseInt(gDate.year);

      const loc = userLocation || { lat: 21.3891, lng: 39.8579 };

      const urlCal1 = `https://api.aladhan.com/v1/hijriCalendar?latitude=${loc.lat}&longitude=${loc.lng}&method=4&month=${gMonth}&year=${gYear}`;
      const resCal1 = await fetch(urlCal1);
      const dataCal1 = await resCal1.json();

      let calendarCombined = [];
      if (dataCal1.code === 200) {
        calendarCombined = dataCal1.data;
      }

      let filtered = calendarCombined.filter((day) => {
        return (
          parseInt(day.date.hijri.month.number) === hMonth &&
          parseInt(day.date.hijri.year) === hYear
        );
      });

      if (filtered.length === 0) {
        filtered = calendarCombined;
      }

      filtered.sort((a, b) => {
        const dateA = parseGregorianDate(a.date.gregorian.date.split(' ')[0]);
        const dateB = parseGregorianDate(b.date.gregorian.date.split(' ')[0]);
        return dateA - dateB;
      });

      setCalendarData(filtered);
    } catch (error) {
      console.error(error);
      setCalendarError('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Re-fetch calendar when selectedHijriMonth/Year or userLocation changes
  useEffect(() => {
    if (selectedHijriYear && selectedHijriMonth && userLocation) {
      fetchHijriCalendar(selectedHijriYear, selectedHijriMonth);
    }
  }, [selectedHijriYear, selectedHijriMonth, userLocation]);

  // Calendar Navigation (Hijri)
  const goToPreviousHijriMonth = () => {
    if (selectedHijriMonth === 1) {
      setSelectedHijriMonth(12);
      setSelectedHijriYear((prev) => prev - 1);
      setSearchHijriMonth(12);
      setSearchHijriYear((prev) => prev - 1);
    } else {
      setSelectedHijriMonth((prev) => prev - 1);
      setSearchHijriMonth((prev) => prev - 1);
    }
  };

  const goToNextHijriMonth = () => {
    if (selectedHijriMonth === 12) {
      setSelectedHijriMonth(1);
      setSelectedHijriYear((prev) => prev + 1);
      setSearchHijriMonth(1);
      setSearchHijriYear((prev) => prev + 1);
    } else {
      setSelectedHijriMonth((prev) => prev + 1);
      setSearchHijriMonth((prev) => prev + 1);
    }
  };

  const handleSearch = () => {
    setSelectedHijriMonth(Number(searchHijriMonth));
    setSelectedHijriYear(Number(searchHijriYear));
    fetchHijriCalendar(Number(searchHijriYear), Number(searchHijriMonth));
  };

  // Calculate Calendar Grid Offset
  let offset = 0;
  if (calendarData.length > 0) {
    const firstDayGregorianStr = calendarData[0].date.gregorian.date.split(' ')[0];
    const firstDateObj = parseGregorianDate(firstDayGregorianStr);
    const dayOfWeek = firstDateObj.getDay();
    offset = (dayOfWeek + 1) % 7;
  }
  const totalCells = offset + calendarData.length;

  // Conversion Tool Functions
  const handleConvertHijriToGregorian = async () => {
    const { day, month, year } = hijriInput;
    if (!day || !month || !year) return;
    const url = `https://api.aladhan.com/v1/hToG?date=${day}-${month}-${year}&method=4`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200) {
        setConvertedToGregorian(data.data.gregorian);
      }
    } catch (e) {
      console.error(e);
    }
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

  return (
    <div
      dir="rtl"
      className={`p-4 max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
    >
      {locationError && <div className="text-center text-red-500 my-4">{locationError}</div>}

      {userLocation && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <div className="flex items-center justify-center">
              {countryLogo && (
                <img src={countryLogo} alt={countryName} className="w-12 h-12 object-contain" />
              )}
              <h1 className="text-3xl font-bold mr-2">التقويم الهجري</h1>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <button
                onClick={() => setShowPrayerTimes(!showPrayerTimes)}
                className={`px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500`}
              >
                {showPrayerTimes ? 'إخفاء مواقيت الصلاة' : 'عرض مواقيت الصلاة'}
              </button>
              <button
                onClick={() => setShowConversionTool(!showConversionTool)}
                className={`px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500`}
              >
                {showConversionTool ? 'إخفاء أداة التحويل' : 'عرض أداة التحويل'}
              </button>
            </div>
          </div>

          {showPrayerTimes && (
            <div className={`w-full max-w-md mx-auto p-4 rounded shadow-lg mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h2 className="text-xl font-semibold mb-2 text-center">مواقيت الصلاة</h2>
              {loadingPrayer ? (
                <p className="text-center">... جاري التحميل</p>
              ) : prayerError ? (
                <p className="text-center text-red-500">{prayerError}</p>
              ) : prayerTimes ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(prayerTimes).map(([prayer, time]) => (
                    <div key={prayer} className="p-2 bg-white dark:bg-gray-600 rounded shadow flex flex-col items-center">
                      <p className="font-semibold">{prayer}</p>
                      <p>{time}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {selectedHijriMonth && selectedHijriYear ? (
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
          ) : (
            <div className="text-center mb-6">جاري تحميل التقويم...</div>
          )}

          {loadingCalendar ? (
            <div className="text-center py-8">... جاري التحميل</div>
          ) : calendarError ? (
            <div className="text-center text-red-500 py-8">{calendarError}</div>
          ) : calendarData.length > 0 ? (
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
                    const isHighlighted = parseGregorianDate(dayData.date.gregorian.date.split(' ')[0]).toDateString() === today.toDateString();

                    return (
                      <div
                        key={index}
                        className={`p-2 border h-28 relative cursor-pointer rounded transition-transform duration-200 transform ${isHighlighted ? 'bg-teal-200 dark:bg-teal-700 hover:bg-teal-300 hover:scale-105' : theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-teal-100'}`}
                      >
                        <div className="text-xl font-bold text-center">{dayData.date.hijri.day}</div>
                        <div className="text-xs text-center">{dayData.date.hijri.month.ar}</div>
                        {dayData.date.hijri.holidays && dayData.date.hijri.holidays.length > 0 && (
                          <div className="text-[10px] text-red-500 truncate text-center">{dayData.date.hijri.holidays.join(', ')}</div>
                        )}
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
              <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">أداة التحويل بين التقويمين</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded bg-white dark:bg-gray-700">
                  <h3 className="text-xl font-semibold mb-2 text-center text-gray-800 dark:text-white">من هجري إلى ميلادي</h3>
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
                        <strong>التاريخ الميلادي:</strong> {convertedToGregorian.date} ({convertedToGregorian.weekday.en})
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded bg-white dark:bg-gray-700">
                  <h3 className="text-xl font-semibold mb-2 text-center text-gray-800 dark:text-white">من ميلادي إلى هجري</h3>
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
        </>
      )}
    </div>
  );
};

export default HijriCalendar;