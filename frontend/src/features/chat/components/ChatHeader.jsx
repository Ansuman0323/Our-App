import React from 'react';

export const ChatHeader = ({ partnerName, status, isTyping }) => {
    return (
        <div className="bg-white/90 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm transition-all">
            <div className="flex items-center gap-3.5 md:gap-4">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                    {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
                </div>

                <div className="flex flex-col justify-center">
                    <h2 className="font-bold text-slate-800 text-[15px] md:text-base tracking-tight leading-tight">
                        {partnerName}
                    </h2>

                    {isTyping ? (
                        <div className="flex items-center gap-1 mt-0.5 animate-in fade-in duration-300">
                            <span className="text-xs text-indigo-600 font-medium">typing</span>
                            <div className="flex gap-0.5 pt-1">
                                <span className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-0.5 animate-in fade-in transition-opacity duration-300">
                            <span
                                className={`w-2 h-2 rounded-full shadow-sm transition-colors duration-300 ${status === 'online' ? 'bg-green-500' : 'bg-slate-300'
                                    }`}
                            />
                            <p className="text-xs text-slate-500 font-medium capitalize">
                                {status || 'offline'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};