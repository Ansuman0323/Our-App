import React from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';

export const GlobalLayout = () => {
    return (
        <div className="min-h-screen flex flex-col w-full bg-slate-50">
            {/* Future: Global Navigation Bar */}
            <header className="w-full h-16 border-b bg-white flex items-center px-4">
                <h1 className="text-xl font-bold">Together</h1>
            </header>

            <main className="flex-1 overflow-x-hidden relative">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="container mx-auto p-4"
                >
                    {/* Renders the current route's page */}
                    <Outlet />
                </motion.div>
            </main>

            {/* Future: Global Footer or Player */}
        </div>
    );
};