import React, { useState, useRef } from 'react';
import { FileDownloadHandler } from '../utils/FileDownloadHandler'; // NEW
import { PdfViewerModal } from './PdfViewerModal'; // NEW

// =====================================================================================
// SHARED HELPERS
// =====================================================================================

const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const FILE_TYPE_STYLES = {
    pdf: { label: 'PDF', tint: 'bg-red-50 text-red-600' },
    doc: { label: 'DOC', tint: 'bg-blue-50 text-blue-600' },
    docx: { label: 'DOC', tint: 'bg-blue-50 text-blue-600' },
    xls: { label: 'XLS', tint: 'bg-emerald-50 text-emerald-600' },
    xlsx: { label: 'XLS', tint: 'bg-emerald-50 text-emerald-600' },
    csv: { label: 'CSV', tint: 'bg-emerald-50 text-emerald-600' },
    ppt: { label: 'PPT', tint: 'bg-orange-50 text-orange-600' },
    pptx: { label: 'PPT', tint: 'bg-orange-50 text-orange-600' },
    zip: { label: 'ZIP', tint: 'bg-amber-50 text-amber-600' },
    rar: { label: 'RAR', tint: 'bg-amber-50 text-amber-600' },
    '7z': { label: '7Z', tint: 'bg-amber-50 text-amber-600' },
};
const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z']);

const getFileMeta = (fileName = '') => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const found = FILE_TYPE_STYLES[ext];
    if (found) return found;
    return { label: ext ? ext.toUpperCase().slice(0, 4) : 'FILE', tint: 'bg-indigo-50 text-indigo-600' };
};

// --- CIRCULAR PROGRESS RING (used for uploads) ---
const CircularProgress = ({ progress = 0, size = 40, trackClassName = 'stroke-white/25', barClassName = 'stroke-white' }) => {
    const strokeWidth = size <= 32 ? 3 : 3.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, progress));
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <svg width={size} height={size} className="-rotate-90 shrink-0">
            <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" className={trackClassName} />
            <circle
                cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`${barClassName} transition-[stroke-dashoffset] duration-300 ease-out`}
            />
        </svg>
    );
};

const RetryIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

// --- OVERLAY SHOWN ON TOP OF IMAGE/VIDEO WHILE UPLOADING OR ON FAILURE ---
const UploadStateOverlay = ({ isPending, isError, progress, onRetry }) => {
    if (!isPending && !isError) return null;

    return (
        <div
            className={`absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 transition-colors duration-300 ${isError ? 'bg-red-950/55' : 'bg-black/35'
                } backdrop-blur-[1.5px] animate-in fade-in duration-200`}
        >
            {isError ? (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRetry?.(); }}
                    className="flex flex-col items-center gap-1.5 group/retry focus:outline-none"
                >
                    <span className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg group-hover/retry:scale-110 group-active/retry:scale-95 transition-transform duration-200">
                        <RetryIcon />
                    </span>
                    <span className="text-[11px] font-semibold text-white bg-black/40 px-2 py-0.5 rounded-full">
                        Failed &middot; Tap to retry
                    </span>
                </button>
            ) : (
                <>
                    <div className="relative flex items-center justify-center">
                        <CircularProgress progress={progress ?? 0} size={44} />
                        <span className="absolute text-[10px] font-bold text-white">{Math.round(progress ?? 0)}%</span>
                    </div>
                    <span className="text-[11px] font-medium text-white/85">Uploading&hellip;</span>
                </>
            )}
        </div>
    );
};

// --- TIMESTAMP / STATUS PILL OVERLAID DIRECTLY ON MEDIA (caption-less image/video bubbles) ---
export const MediaMetaOverlay = ({ position = 'bottom', children }) => (
    <div className={`absolute ${position === 'top' ? 'top-2' : 'bottom-2'} right-2 z-[2] pointer-events-none animate-in fade-in duration-300`}>
        <span className="flex items-center gap-1 bg-black/45 backdrop-blur-sm text-white text-[10.5px] font-medium px-2 py-1 rounded-full shadow-sm leading-none">
            {children}
        </span>
    </div>
);

// =====================================================================================
// FULLSCREEN LIGHTBOX MODAL
// =====================================================================================
const FullscreenImageModal = ({ src, alt, onClose }) => {
    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 md:top-6 md:right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none z-10"
                aria-label="Close fullscreen image"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <img
                src={src}
                alt={alt || "Fullscreen attachment"}
                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300 drop-shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};

// =====================================================================================
// IMAGE RENDERER
// =====================================================================================
export const ImageMessage = React.memo(({ attachment, isDeleted, isPending, isError, progress, onRetry }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!attachment) return null;

    const canOpen = !isDeleted && !isPending && !isError && !hasError;

    return (
        <>
            <div
                className={`relative overflow-hidden bg-slate-100 ${isDeleted ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                style={{ minHeight: '160px' }}
            >
                {/* SKELETON LOADER */}
                {!isLoaded && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-200 animate-pulse">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                )}

                {/* BROKEN IMAGE FALLBACK */}
                {hasError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50">
                        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-medium">Image unavailable</span>
                    </div>
                ) : (
                    <img
                        src={attachment.url}
                        alt={attachment.file_name || 'Image'}
                        className={`w-full h-auto max-h-[360px] object-cover transition-all duration-500 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
                            } ${canOpen ? 'cursor-pointer active:brightness-95' : ''}`}
                        loading="lazy"
                        onLoad={() => setIsLoaded(true)}
                        onError={() => { setIsLoaded(true); setHasError(true); }}
                        onClick={() => canOpen && setIsModalOpen(true)}
                    />
                )}

                <UploadStateOverlay isPending={isPending} isError={isError} progress={progress} onRetry={onRetry} />
            </div>

            {isModalOpen && (
                <FullscreenImageModal
                    src={attachment.url}
                    alt={attachment.file_name}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
});

// =====================================================================================
// VIDEO RENDERER
// =====================================================================================
export const VideoMessage = React.memo(({ attachment, isDeleted, isPending, isError, progress, onRetry }) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const videoRef = useRef(null);

    if (!attachment) return null;

    const canPlay = !isDeleted && !isPending && !isError;

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (!canPlay || !videoRef.current) return;
        videoRef.current.play().catch(() => { });
    };

    return (
        <div className={`relative overflow-hidden bg-slate-900 flex items-center justify-center ${isDeleted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>

            {/* LOADING SKELETON (until metadata/frame is ready) */}
            {!isReady && !hasStarted && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 animate-pulse">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                </div>
            )}

            <video
                ref={videoRef}
                src={attachment.url}
                poster={attachment.thumbnail_url || undefined}
                controls={hasStarted}
                controlsList="nodownload"
                preload="metadata"
                playsInline
                onLoadedMetadata={() => setIsReady(true)}
                onPlay={() => setHasStarted(true)}
                className="w-full max-h-[360px] object-contain bg-black block"
            />

            {/* CENTERED PLAY BUTTON */}
            {!hasStarted && canPlay && (
                <button
                    type="button"
                    onClick={handlePlayClick}
                    className="absolute inset-0 flex items-center justify-center group/play focus:outline-none"
                    aria-label="Play video"
                >
                    <span className="w-14 h-14 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover/play:scale-110 group-active/play:scale-95 transition-transform duration-200">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"></path></svg>
                    </span>
                </button>
            )}

            <UploadStateOverlay isPending={isPending} isError={isError} progress={progress} onRetry={onRetry} />
        </div>
    );
});

// =====================================================================================
// DOCUMENT RENDERER — modern card
// =====================================================================================
export const DocumentMessage = React.memo(({ attachment, isDeleted, isPending, isError, progress, onRetry }) => {
    const [downloadState, setDownloadState] = useState('idle');
    const [showPdfViewer, setShowPdfViewer] = useState(false); // NEW STATE

    if (!attachment) return null;

    const fileName = attachment.file_name || 'Document';
    const meta = getFileMeta(fileName);
    const sizeLabel = formatFileSize(attachment.file_size);
    const ext = (fileName.split('.').pop() || '').toLowerCase();

    // Determine if we should treat this as a PDF
    const isPdf = ext === 'pdf' || attachment.mime_type === 'application/pdf';
    const isArchive = ARCHIVE_EXTS.has(ext);
    const isLocked = isDeleted || isPending || isError;
    const hasOpened = downloadState === 'opened';

    const handleActivate = async () => {
        if (isLocked || !attachment.url) return;

        if (isPdf) {
            // Open in-app PDF Modal instead of downloading
            setShowPdfViewer(true);
            setDownloadState('opened');
        } else {
            // Offload logic to the abstracted handler for external files
            try {
                await FileDownloadHandler.openOrDownload(attachment);
                setDownloadState('opened');
            } catch (err) {
                setDownloadState('failed');
            }
        }
    };

    const iconSlot = isPending ? (
        <CircularProgress progress={progress ?? 0} size={30} trackClassName="stroke-indigo-200" barClassName="stroke-indigo-600" />
    ) : isError ? (
        <RetryIcon className="w-5 h-5" />
    ) : isArchive ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></svg>
    ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
    );

    const card = (
        <div
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${isError
                ? 'bg-red-50 border-red-200'
                : isDeleted
                    ? 'bg-black/5 border-transparent'
                    : 'bg-white/70 border-slate-200/70 hover:bg-white hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] active:shadow-sm'
                }`}
        >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isError ? 'bg-red-100 text-red-500' : meta.tint}`}>
                {iconSlot}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold truncate text-slate-800">{fileName}</p>
                <p className="text-[11.5px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`font-bold tracking-wide px-1.5 py-[1px] rounded ${isError ? 'bg-red-100 text-red-500' : meta.tint}`}>
                        {meta.label}
                    </span>
                    {sizeLabel && <span>{sizeLabel}</span>}
                    {isPending && <span className="text-indigo-500 font-semibold">Uploading&hellip; {Math.round(progress ?? 0)}%</span>}
                    {isError && <span className="text-red-500 font-semibold">Failed &middot; Tap to retry</span>}
                    {!isLocked && downloadState === 'failed' && (
                        <span className="text-red-500 font-semibold">Couldn&apos;t open &middot; Tap to try again</span>
                    )}
                </p>
            </div>

            {!isLocked && (
                <span className="relative w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                    <svg
                        className={`absolute w-4 h-4 transition-all duration-300 ease-out ${hasOpened ? 'opacity-0 scale-75 rotate-6' : 'opacity-100 scale-100 rotate-0'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M12 5v11m0 0l-4-4m4 4l4-4M5 19h14" />
                    </svg>
                    <svg
                        className={`absolute w-4 h-4 transition-all duration-300 ease-out ${hasOpened ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-6'} text-emerald-600`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <path d="M15 3h6v6" />
                        <path d="M10 14L21 3" />
                    </svg>
                </span>
            )}
        </div>
    );

    if (isError) {
        return (
            <button type="button" onClick={onRetry} className="w-full text-left">
                {card}
            </button>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={handleActivate}
                disabled={isLocked}
                aria-label={hasOpened ? `Open ${fileName}` : `Download ${fileName}`}
                title={hasOpened ? 'Open' : 'Download'}
                className={`block w-full text-left ${isLocked ? 'pointer-events-none' : ''}`}
            >
                {card}
            </button>

            {/* RENDER IN-APP PDF VIEWER IF TRIGGERED */}
            {showPdfViewer && (
                <PdfViewerModal
                    attachment={attachment}
                    onClose={() => setShowPdfViewer(false)}
                />
            )}
        </>
    );
});

// =====================================================================================
// COMPOSER UPLOAD PREVIEW (unchanged behavior — attachment picker in MessageInput)
// =====================================================================================
export const AttachmentPreview = React.memo(({ file, onRemove }) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    return (
        <div className="flex items-center gap-3 p-2 mb-2 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300/50">
                {isImage ? <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                    : isVideo ? <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        : <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button type="button" onClick={onRemove} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm hover:shadow transition-all focus:outline-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    );
});
// =====================================================================================
// GIF RENDERER
// =====================================================================================
export const GifMessage = React.memo(({ attachment, isDeleted, isPending, isError, onRetry }) => {
    if (!attachment) return null;

    return (
        <div className={`relative overflow-hidden bg-slate-100 ${isDeleted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <img
                src={attachment.url}
                alt={attachment.file_name || 'GIF'}
                className="w-full h-auto max-h-[360px] object-cover"
                loading="lazy"
            />
            <UploadStateOverlay isPending={isPending} isError={isError} progress={0} onRetry={onRetry} />

            {/* Small GIF badge in the corner to distinguish from static images */}
            <span className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white/10 pointer-events-none">
                GIF
            </span>
        </div>
    );
});

// =====================================================================================
// STICKER RENDERER
// =====================================================================================
export const StickerMessage = React.memo(({ attachment, isDeleted, isPending, isError, onRetry }) => {
    if (!attachment) return null;

    // Stickers have transparent backgrounds and max dimensions, they don't fill the bubble edge-to-edge
    return (
        <div className={`relative flex items-center justify-center p-2 ${isDeleted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <img
                src={attachment.url}
                alt={attachment.file_name || 'Sticker'}
                className="w-[140px] h-[140px] md:w-[160px] md:h-[160px] object-contain drop-shadow-md"
                loading="lazy"
            />
            <UploadStateOverlay isPending={isPending} isError={isError} progress={0} onRetry={onRetry} />
        </div>
    );
});

// =====================================================================================
// MAIN FACTORY ROUTER
// =====================================================================================
export const MediaRenderer = React.memo(({ type, attachment, isDeleted, isPending, isError, progress, onRetry }) => {
    if (!attachment) return null;

    const commonProps = { attachment, isDeleted, isPending, isError, progress, onRetry };

    switch (type) {
        case 'IMAGE': return <ImageMessage {...commonProps} />;
        case 'VIDEO': return <VideoMessage {...commonProps} />;
        case 'GIF': return <GifMessage {...commonProps} />;         // NEW
        case 'STICKER': return <StickerMessage {...commonProps} />; // NEW
        case 'FILE':
        case 'DOCUMENT': return <DocumentMessage {...commonProps} />;
        default: return <DocumentMessage {...commonProps} />;
    }
});
