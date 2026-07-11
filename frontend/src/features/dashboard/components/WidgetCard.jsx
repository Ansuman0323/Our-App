import React from 'react';

export const WidgetCard = ({ title, icon, children, footer }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 aspect-square flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group">
            <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    {icon && <span>{icon}</span>}
                    {title}
                </h3>
                <div className="mt-2 text-sm text-slate-600">
                    {children}
                </div>
            </div>
            {footer && (
                <p className="text-sm text-slate-400 group-hover:text-indigo-500 transition-colors">
                    {footer}
                </p>
            )}
        </div>
    );
};