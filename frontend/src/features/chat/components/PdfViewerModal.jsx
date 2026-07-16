import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileDownloadHandler } from '../utils/FileDownloadHandler';
// Replace your existing imports with these:
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker securely via CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfViewerModal = ({ attachment, onClose }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isLoading, setIsLoading] = useState(true);

    // Keyboard support for desktop
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && pageNumber < numPages) setPageNumber(p => p + 1);
            if (e.key === 'ArrowLeft' && pageNumber > 1) setPageNumber(p => p - 1);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, pageNumber, numPages]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setIsLoading(false);
    };

    const handleDownload = () => {
        FileDownloadHandler.openOrDownload(attachment);
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 animate-in fade-in duration-200">
            {/* TOP APP BAR */}
            <div className="flex items-center justify-between px-4 h-14 bg-slate-900/90 backdrop-blur-md border-b border-white/10 shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none shrink-0"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-white font-medium text-[15px] truncate max-w-[200px] md:max-w-md">
                        {attachment.file_name || 'Document.pdf'}
                    </h2>
                </div>
                <button
                    onClick={handleDownload}
                    className="p-2 -mr-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none shrink-0"
                    aria-label="Download externally"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
            </div>

            {/* VIEWER AREA */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
                        <span className="text-slate-400 text-sm font-medium">Loading document...</span>
                    </div>
                )}

                <Document
                    file={attachment.url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={null} // Handled by custom state above
                    error={
                        <div className="text-red-400 flex flex-col items-center gap-2">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm">Failed to load PDF.</span>
                        </div>
                    }
                    className="flex flex-col items-center drop-shadow-2xl"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="transition-transform duration-200 ease-out"
                    />
                </Document>
            </div>

            {/* BOTTOM TOOLBAR */}
            {numPages > 0 && (
                <div className="h-16 bg-slate-900/90 backdrop-blur-md border-t border-white/10 shrink-0 flex items-center justify-between px-4 sm:px-8 z-10 pb-safe">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                        <button disabled={scale <= 0.5} onClick={() => setScale(s => s - 0.25)} className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 rounded-full hover:bg-white/10">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6" /></svg>
                        </button>
                        <span className="text-xs font-medium text-white/70 w-9 text-center">{Math.round(scale * 100)}%</span>
                        <button disabled={scale >= 2.5} onClick={() => setScale(s => s + 0.25)} className="p-1.5 text-white/80 hover:text-white disabled:opacity-30 rounded-full hover:bg-white/10">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6M7 10h6" /></svg>
                        </button>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center gap-3">
                        <button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)} className="p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-full hover:bg-white/10 bg-white/5 border border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-sm font-medium text-white/80 min-w-[3rem] text-center">
                            {pageNumber} / {numPages}
                        </span>
                        <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)} className="p-2 text-white/80 hover:text-white disabled:opacity-30 rounded-full hover:bg-white/10 bg-white/5 border border-white/5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};