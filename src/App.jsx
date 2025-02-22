import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Quran from './pages/Quran';
import Hadith from './pages/Hadith';
import Tasbih from './pages/Tasbih';
import HijriCalendar from './pages/HijriCalendar';
import Books from './pages/Books';
import { useTheme } from './context/ThemeContext';

function App() {
  const { theme } = useTheme();

  return (
    <div
      className={
        theme === 'dark'
          ? 'bg-gray-900 text-white min-h-screen'
          : 'bg-white text-black min-h-screen'
      }
    >
      <Navbar />
      <main className="py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/hadith" element={<Hadith />} />
          <Route path="/tasbih" element={<Tasbih />} />
          <Route path="/calendar" element={<HijriCalendar />} />
          <Route path="/books" element={<Books />} />
        </Routes>
      </main>
      <footer
        className={`text-center py-12 ${
          theme === 'dark' ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <p className="text-sm">© 2025 Quran & Hadith App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
