import React from 'react';

export const ChatHeader = ({ partnerName, status, isTyping }) => {
    return (
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
                {/* Placeholder Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
                </div>

                <div>
                    <h2 className="font-bold text-slate-800 text-sm">{partnerName}</h2>

                    {/* Status Indicator */}
                    {isTyping ? (
                        <p className="text-xs text-indigo-500 font-medium animate-pulse">
                            typing...
                        </p>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                                className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-slate-300'
                                    }`}
                            ></span>
                            <p className="text-xs text-slate-500 capitalize">
                                {status || 'offline'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Extension Point: Future Video/Audio Call Buttons can go here */}
        </div>
    );
};