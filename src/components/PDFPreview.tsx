import React from "react";
import { PDFViewer, DocumentProps } from "@react-pdf/renderer";

interface PDFPreviewProps {
  pdfDocument: React.ReactElement<DocumentProps>;
  isOpen: boolean;
  onClose: () => void;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({
  pdfDocument,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0  bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col'>
        <div className='p-4 border-b flex justify-between items-center'>
          <h2 className='text-xl font-semibold'>PDF Preview</h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
        <div className='flex-1 overflow-hidden'>
          <PDFViewer style={{ width: "100%", height: "100%" }}>
            {pdfDocument}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
