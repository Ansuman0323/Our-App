import React from 'react';

export const MessageInfoModal = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Message Info</h3>

                <div className="space-y-4 text-[14px]">
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Message ID</span> <span className="font-medium font-mono text-slate-700">{message.id || message.client_message_id}</span></div>
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Sender</span> <span className="font-medium text-slate-700">{message.sender_name || 'You'}</span></div>
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Sent</span> <span className="font-medium text-slate-700">{new Date(message.created_at).toLocaleString()}</span></div>
                    <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Status</span> <span className="font-medium text-slate-700 capitalize">{message.status}</span></div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};