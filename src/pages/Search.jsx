import { useLocation } from 'react-router-dom';

const Search = () => {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const query = queryParams.get('query');

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-teal-600 dark:text-teal-400">
          نتائج البحث
        </h1>
        <p className="text-center text-lg">
          تم البحث عن: <span className="font-semibold">{query}</span>
        </p>
       
      </div>
    </div>
  );
};

export default Search;
