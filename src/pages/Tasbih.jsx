import { useState, useEffect } from 'react';

function Tasbih() {
  // We can store multiple “dhikr” counters in an array
  const [dhikrList, setDhikrList] = useState([
    { id: 1, label: 'سبحان الله', count: 0, target: 33 },
    { id: 2, label: 'الحمد لله', count: 0, target: 33 },
    { id: 3, label: 'الله أكبر', count: 0, target: 33 },
  ]);

  // On mount, load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('tasbihData');
    if (saved) {
      setDhikrList(JSON.parse(saved));
    }
  }, []);

  // Save to local storage whenever dhikrList changes
  useEffect(() => {
    localStorage.setItem('tasbihData', JSON.stringify(dhikrList));
  }, [dhikrList]);

  // Increment a single dhikr
  const handleDhikrIncrement = (id) => {
    setDhikrList((prevList) =>
      prevList.map((dhikr) => {
        if (dhikr.id === id) {
          const newCount = dhikr.count + 1;
          // If user hits the target
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

  // Change the target of a single dhikr
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
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-teal-700 dark:text-teal-300 font-amiri animate-pulse">
        السبحة الإلكترونية
      </h1>

      <div className="max-w-2xl w-full space-y-6">
        {dhikrList.map((dhikr) => {
          const progress = dhikr.target > 0
            ? Math.min((dhikr.count / dhikr.target) * 100, 100)
            : 0;

          return (
            <div
              key={dhikr.id}
              className="p-4 rounded shadow bg-white dark:bg-gray-800 animate-slide-up"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {dhikr.label}
                </span>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    الهدف:
                  </label>
                  <input
                    type="number"
                    className="w-20 p-1 border rounded dark:bg-gray-700 dark:text-gray-200 text-right"
                    value={dhikr.target}
                    onChange={(e) =>
                      handleTargetChange(dhikr.id, parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center">
                <p className="text-lg text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">
                  العداد: {dhikr.count}/{dhikr.target}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDhikrIncrement(dhikr.id)}
                    className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => resetDhikr(dhikr.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors mt-4 w-full"
        >
          إعادة تعيين جميع الأذكار
        </button>
      </div>
    </div>
  );
}

export default Tasbih;
