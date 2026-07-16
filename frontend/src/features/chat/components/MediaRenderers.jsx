import React from 'react';

export const ImageMessage = ({ attachment, isDeleted }) => (
    <div className={`relative overflow-hidden rounded-xl ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
        <img
            src={attachment.url}
            alt={attachment.file_name || 'Image'}
            className="max-w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            loading="lazy"
        />
    </div>
);

export const VideoMessage = ({ attachment, isDeleted }) => (
    <div className={`relative overflow-hidden rounded-xl bg-black ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
        <video
            src={attachment.url}
            controls
            className="max-w-full h-auto max-h-[300px]"
            preload="metadata"
        />
    </div>
);

export const DocumentMessage = ({ attachment, isDeleted }) => (
    <a
        href={isDeleted ? '#' : attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 p-3 bg-black/5 hover:bg-black/10 transition-colors rounded-xl border border-slate-200/50 ${isDeleted ? 'pointer-events-none opacity-50' : ''}`}
    >
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        </div>
        <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-slate-800">{attachment.file_name || 'Document'}</span>
            {attachment.file_size > 0 && <span className="text-xs text-slate-500">{(attachment.file_size / 1024 / 1024).toFixed(1)} MB</span>}
        </div>
    </a>
);

export const AttachmentPreview = ({ file, onRemove }) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    return (
        <div className="flex items-center gap-3 p-2 mb-2 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                {isImage ? <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                    : isVideo ? <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        : <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button type="button" onClick={onRemove} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    );
};