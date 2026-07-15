import React from 'react';

export const MessageBottomSheet = ({ message, isMine, onClose, onAction }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl pb-safe shadow-2xl animate-in slide-in-from-bottom-full duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                <div className="flex flex-col pb-4 px-2">
                    {onAction('renderItems')}
                </div>
            </div>
        </div>
    );
};