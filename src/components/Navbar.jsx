import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme, fontFamily, setFontFamily, fontSize, setFontSize } = useTheme();
    const [showSettings, setShowSettings] = useState(false);

    const fontFamilies = [
        { id: 'font-amiri', name: 'Amiri (Default)' },
        { id: 'font-kufi', name: 'Kufi' },
        { id: 'font-sans', name: 'Sans Serif' },
        { id: 'font-serif', name: 'Serif' }
    ];

    const fontSizes = [
        { id: 'text-sm', name: 'Small' },
        { id: 'text-base', name: 'Medium' },
        { id: 'text-lg', name: 'Large' },
        { id: 'text-xl', name: 'Extra Large' }
    ];

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <nav className="bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-80 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-teal-800 dark:text-teal-200 font-amiri">
                            Quran & Hadith
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            to="/quran"
                            className="text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                            Quran
                        </Link>
                        <Link
                            to="/hadith"
                            className="text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                            Hadith
                        </Link>

                        {/* Settings Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>

                            {showSettings && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Font Family
                                        </label>
                                        <select
                                            value={fontFamily}
                                            onChange={(e) => setFontFamily(e.target.value)}
                                            className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-sm"
                                        >
                                            {fontFamilies.map((font) => (
                                                <option key={font.id} value={font.id}>{font.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Font Size
                                        </label>
                                        <select
                                            value={fontSize}
                                            onChange={(e) => setFontSize(e.target.value)}
                                            className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-sm"
                                        >
                                            {fontSizes.map((size) => (
                                                <option key={size.id} value={size.id}>{size.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                            {theme === 'dark' ? '🌞' : '🌙'}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center space-x-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                            {theme === 'dark' ? '🌞' : '🌙'}
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-teal-700 dark:text-teal-300"
                        >
                            <svg
                                className="h-6 w-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white dark:bg-gray-800 backdrop-blur-lg bg-opacity-95">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            to="/quran"
                            className="block text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium"
                        >
                            Quran
                        </Link>
                        <Link
                            to="/hadith"
                            className="block text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:bg-teal-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium"
                        >
                            Hadith
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;