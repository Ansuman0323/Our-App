import React from 'react';

export const MessageActionItem = ({ icon, label, onClick, variant = 'default' }) => {
    const colors = variant === 'danger'
        ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200';

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-4 py-3 min-h-[44px] transition-colors focus:outline-none focus:bg-slate-100 ${colors}`}
        >
            <span className="shrink-0 flex items-center justify-center w-5 h-5">{icon}</span>
            <span className="font-medium text-[15px]">{label}</span>
        </button>
    );
};