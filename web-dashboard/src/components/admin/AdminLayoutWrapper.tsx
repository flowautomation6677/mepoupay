'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayoutWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen((prev) => !prev);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-white dark:bg-[#09090b] border-b border-slate-200 dark:border-white/5 z-40 px-4 flex items-center h-16 justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-xl leading-none">🐷</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold tracking-tight">NEXUS</span>
                </div>
                <button
                    onClick={toggleMenu}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar with mobile state */}
            <AdminSidebar isOpen={isMobileMenuOpen} onClose={closeMenu} />

            {/* Overlay for mobile when sidebar is open */}
            {isMobileMenuOpen && (
                <button
                    type="button"
                    className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm z-40 md:hidden border-none outline-none appearance-none cursor-default"
                    onClick={closeMenu}
                    aria-label="Close mobile menu"
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 pt-20 md:pt-8 p-4 sm:p-8 min-h-screen max-w-[100vw]">
                {children}
            </main>
        </div>
    );
}
