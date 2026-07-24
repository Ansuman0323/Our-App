import React from 'react';

export const ChatHeader = ({
    partnerName,
    status,
    isTyping,
    onStartCall,
    canStartCall = true
}) => {
    return (
        <div className="bg-white/90 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm transition-all">

            {/* Left Side */}
            <div className="flex items-center gap-3.5 md:gap-4">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                    {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
                </div>

                <div className="flex flex-col justify-center">
                    <h2 className="font-bold text-slate-800 text-[15px] md:text-base tracking-tight leading-tight">
                        {partnerName}
                    </h2>

                    {isTyping ? (
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-indigo-600 font-medium">
                                typing...
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                                className={`w-2 h-2 rounded-full ${status === 'online'
                                    ? 'bg-green-500'
                                    : 'bg-slate-300'
                                    }`}
                            />
                            <span className="text-xs text-slate-500 font-medium capitalize">
                                {status || 'offline'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onStartCall}
                    disabled={!canStartCall}
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    aria-label="Start video call"
                    title="Start Video Call"
                >
                    {/* Inline SVG replacing lucide-react Video */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                    >
                        <path d="m22 8-6 4 6 4V8Z" />
                        <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};