import { useState, useEffect } from 'react';
import { GiPrayerBeads } from 'react-icons/gi';

const defaultDhikrList = [
  {
    id: 1,
    label: 'سبحان الله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-8 h-8 text-teal-500" />,
  },
  {
    id: 2,
    label: 'الحمد لله',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-8 h-8 text-teal-500" />,
  },
  {
    id: 3,
    label: 'الله أكبر',
    count: 0,
    target: 33,
    icon: <GiPrayerBeads className="w-8 h-8 text-teal-500" />,
  },
];

function Tasbih() {
  const [dhikrList, setDhikrList] = useState(defaultDhikrList);

  // On mount, load saved counters and merge with default icons/labels
  useEffect(() => {
    const saved = localStorage.getItem('tasbihData');
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = defaultDhikrList.map((item) => {
        const savedItem = parsed.find((x) => x.id === item.id);
        return savedItem
          ? { ...item, count: savedItem.count, target: savedItem.target }
          : item;
      });
      setDhikrList(merged);
    }
  }, []);

  // Save only id, count, and target to local storage whenever dhikrList changes
  useEffect(() => {
    const toStore = dhikrList.map(({ id, count, target }) => ({ id, count, target }));
    localStorage.setItem('tasbihData', JSON.stringify(toStore));
  }, [dhikrList]);

  // Increment a single dhikr counter
  const handleDhikrIncrement = (id) => {
    setDhikrList((prevList) =>
      prevList.map((dhikr) => {
        if (dhikr.id === id) {
          const newCount = dhikr.count + 1;
          if (newCount === dhikr.target) {
            alert(`لقد وصلت إلى العدد المطلوب (${dhikr.target}) لـ: ${dhikr.label}`);
          }
          return { ...dhikr, count: newCount };
        }
        return dhikr;
      })
    );
  };

  // Reset a single dhikr
  const resetDhikr = (id) => {
    setDhikrList((prevList) =>
      prevList.map((dhikr) => (dhikr.id === id ? { ...dhikr, count: 0 } : dhikr))
    );
  };

  // Change the target count for a dhikr
  const handleTargetChange = (id, newTarget) => {
    setDhikrList((prevList) =>
      prevList.map((dhikr) =>
        dhikr.id === id ? { ...dhikr, target: newTarget } : dhikr
      )
    );
  };

  // Reset all counters
  const resetAll = () => {
    setDhikrList((prevList) =>
      prevList.map((dhikr) => ({ ...dhikr, count: 0 }))
    );
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-teal-700 dark:text-teal-300 font-amiri animate-pulse">
        السبحة الإلكترونية
      </h1>

      <div className="max-w-3xl w-full space-y-6">
        {dhikrList.map((dhikr) => {
          const progress = dhikr.target > 0
            ? Math.min((dhikr.count / dhikr.target) * 100, 100)
            : 0;
          return (
            <div
              key={dhikr.id}
              className="p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 transform transition-all hover:scale-105 hover:shadow-2xl animate-slide-up"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-full">
                    {dhikr.icon}
                  </div>
                  <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {dhikr.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">الهدف:</label>
                  <input
                    type="number"
                    className="w-20 p-1 border rounded dark:bg-gray-700 dark:text-gray-200 text-center"
                    value={dhikr.target}
                    onChange={(e) =>
                      handleTargetChange(dhikr.id, parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center">
                <p className="text-lg text-gray-800 dark:text-gray-200 mb-3 sm:mb-0">
                  العداد: {dhikr.count} / {dhikr.target}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDhikrIncrement(dhikr.id)}
                    className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-transform active:scale-95"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => resetDhikr(dhikr.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-transform active:scale-95"
                  >
                    تصفير
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={resetAll}
          className="w-full px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-transform active:scale-95"
        >
          إعادة تعيين جميع الأذكار
        </button>
      </div>
    </div>
  );
}

export default Tasbih;
