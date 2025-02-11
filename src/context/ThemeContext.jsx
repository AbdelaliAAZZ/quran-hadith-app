import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('fontFamily') || 'font-amiri';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'text-base';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--main-font-family', fontFamily);
    root.style.setProperty('--main-font-size', fontSize);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('fontSize', fontSize);
  }, [fontFamily, fontSize]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme,
      fontFamily,
      setFontFamily,
      fontSize,
      setFontSize
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}