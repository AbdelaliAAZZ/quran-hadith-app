// PdfViewer.jsx (unchanged from your original version)
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const PdfViewer = ({ file, onClose }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="self-end p-4 text-red-500 hover:text-red-600 z-50 transition-colors"
        >
          <FaTimes size={28} />
        </button>

        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div className="flex-1 overflow-hidden">
            <Viewer
              fileUrl={file}
              plugins={[defaultLayoutPluginInstance]}
              localization={{
                scrollMode: {
                  horizontalScrolling: 'التمرير الأفقي',
                  verticalScrolling: 'التمرير الرأسي',
                },
                search: {
                  searchPlaceholder: 'ابحث في النص...',
                }
              }}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
};

PdfViewer.propTypes = {
  file: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PdfViewer;