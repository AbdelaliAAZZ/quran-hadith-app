import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Quran from './pages/Quran';
import Hadith from './pages/Hadith';
import { useTheme } from './context/ThemeContext';

function App() {
  const { theme } = useTheme();

  return (
    <div className={theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quran" element={<Quran />} />
          <Route path="/hadith" element={<Hadith />} />
        </Routes>
      </main>
      <footer className={`text-center py-12 ${theme === 'dark' ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
        <p className="text-sm">&copy; 2025 Quran & Hadith App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
