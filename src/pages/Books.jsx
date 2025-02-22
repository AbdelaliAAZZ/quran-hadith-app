// Books.jsx
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaEye, FaDownload, FaSearch, FaFilter } from 'react-icons/fa';
import PdfViewer from './PdfViewer';

// Import local assets
import ibnKathirPdf from '../assets/book1.pdf';
import alJalalaynPdf from '../assets/quran2.pdf';
import quranImage from '../assets/quranimage.png';
import quran2Image from '../assets/quran2image.png';

const books = [
  { 
    id: '1', 
    title: 'تفسير ابن كثير', 
    author: 'ابن كثير', 
    pdfPath: ibnKathirPdf, 
    coverImage: quranImage,
    category: 'التفسير',
    year: 2023,
    pages: 450,
    fileSize: '15MB'
  },
  { 
    id: '2', 
    title: 'تفسير الجلالين', 
    author: 'الجلالين', 
    pdfPath: alJalalaynPdf, 
    coverImage: quran2Image,
    category: 'التفسير',
    year: 2022,
    pages: 380,
    fileSize: '12MB'
  },
];

const Books = () => {
  const { theme } = useTheme();
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [filteredBooks, setFilteredBooks] = useState(books);

  useEffect(() => {
    const results = books.filter(book => {
      const matchesSearch = book.title.includes(searchQuery) || 
                          book.author.includes(searchQuery);
      const matchesCategory = selectedCategory === 'الكل' || 
                            book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredBooks(results);
  }, [searchQuery, selectedCategory]);

  const categories = ['الكل', 'التفسير', 'الفقه', 'الحديث'];

  const handleDownload = (pdfPath, title) => {
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-teal-600 dark:text-teal-400">
          مكتبة التفسير
        </h1>

        {/* Search and Filter Section */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن كتاب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-12 pl-4 py-3 rounded-lg shadow-sm ${
                theme === 'dark' 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-white text-gray-800 border-gray-200'
              } border focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center gap-4">
            <FaFilter className="text-gray-500 dark:text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category
                      ? 'bg-teal-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`group relative rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col h-full p-6">
                <div className="flex-grow">
                  <div className="w-full h-48 md:h-56 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden relative">
                    <img
                      src={book.coverImage}
                      alt={`غلاف ${book.title}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <span className="text-white text-sm font-medium">
                        {book.category}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      {book.title}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                      {book.author}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{book.year}</span>
                      <div className="flex gap-2">
                        <span>{book.pages} صفحة</span>
                        <span>•</span>
                        <span>{book.fileSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setSelectedBook(book)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  >
                    <FaEye className="text-lg" />
                    <span>عرض</span>
                  </button>
                  <button
                    onClick={() => handleDownload(book.pdfPath, book.title)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <FaDownload className="text-lg" />
                    <span>تحميل</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory !== 'الكل' 
              ? `لا توجد نتائج للبحث "${searchQuery}" في ${selectedCategory}`
              : 'لا توجد كتب متاحة حالياً'}
          </div>
        )}

        {selectedBook && (
          <PdfViewer 
            file={selectedBook.pdfPath} 
            onClose={() => setSelectedBook(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default Books;