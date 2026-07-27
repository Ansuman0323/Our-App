import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ChatHeader = ({
    partnerName,
    status,
    isTyping,
    onStartCall,
    canStartCall = true
}) => {
    const navigate = useNavigate();

    return (
        <div
            className="bg-white/85 backdrop-blur-md backdrop-saturate-150 px-2 py-2.5 md:px-4 md:py-3 border-b border-slate-200/70 flex items-center justify-between shrink-0 z-20 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.04)] transition-all"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
        >

            {/* Left Side */}
            <div className="flex items-center gap-1 md:gap-2.5 min-w-0">
                <motion.button
                    type="button"
                    onClick={() => navigate(-1)}
                    whileTap={{ scale: 0.88 }}
                    className="flex items-center justify-center w-11 h-11 rounded-full text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    aria-label="Go back"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </motion.button>

                <div className="relative shrink-0">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white">
                        {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
                    </div>
                    {status === 'online' && !isTyping && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white animate-pulse" />
                    )}
                </div>

                <div className="flex flex-col justify-center min-w-0 pl-0.5">
                    <h2 className="font-bold text-slate-800 text-[15px] md:text-base tracking-tight leading-tight truncate">
                        {partnerName}
                    </h2>

                    {isTyping ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="flex items-center gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1 h-1 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1 h-1 rounded-full bg-indigo-600 animate-bounce" />
                            </span>
                            <span className="text-xs text-indigo-600 font-medium">
                                typing
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
            <div className="flex items-center gap-2 shrink-0">
                <motion.button
                    type="button"
                    onClick={onStartCall}
                    disabled={!canStartCall}
                    whileTap={canStartCall ? { scale: 0.92 } : undefined}
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-[0_1px_2px_rgba(79,70,229,0.2),0_4px_10px_rgba(79,70,229,0.18)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2"
                    aria-label="Start video call"
                    title="Start Video Call"
                >
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
                </motion.button>
            </div>
        </div>
    );
};