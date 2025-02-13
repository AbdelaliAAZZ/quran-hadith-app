import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const HadithBooks = () => {
  const { theme } = useTheme();
  const [books, setBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    perPage: 10,
    lastPage: 1,
    total: 0,
  });

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://hadithapi.com/api/books?apiKey=$2y$10$f6vJfCrsGlfCE4Y15GNgNOGMLDh2aZeNYYw9wNlzF45imr9SMr1u&page=${currentPage}`,
          { mode: 'cors' }
        );
        if (!response.ok) throw new Error('فشل في جلب الكتب');
        const data = await response.json();
        setBooks(data.books);
        setPagination({
          perPage: data.pagination.perPage,
          lastPage: data.pagination.lastPage,
          total: data.pagination.total,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        جاري تحميل الكتب...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 border border-red-200 rounded p-4 text-center my-4">
        خطأ: {error}
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto my-8 px-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-lg`}>
      <h1 className="text-3xl font-bold mb-4">
        كتب الحديث ({pagination.total})
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:scale-105 transition-transform duration-200 cursor-pointer"
            onClick={() =>
              window.open(book.link, '_blank', 'noopener,noreferrer')
            }
          >
            <h2 className="text-xl font-semibold mb-2">
              {book.name}
            </h2>
            <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
              <i className="fas fa-user mr-2"></i>
              {book.author}
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
              <i className="fas fa-book mr-2"></i>
              {book.hadiths_count} حديث
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <i className="fas fa-link mr-2"></i>
              <a
                href={book.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              >
                عرض الكتاب
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8 space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          السابق
        </button>

        {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(
          (page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 border rounded transition-colors ${
                page === currentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.lastPage}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          التالي
        </button>
      </div>
    </div>
  );
};

export default HadithBooks;
