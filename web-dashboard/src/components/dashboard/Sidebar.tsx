'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    Target,
    BrainCircuit,
    FileText,
    ShieldCheck,
    Menu,
    X,
    LogOut,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    Wallet
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
    { name: 'Visão Geral', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Gastos & Extrato', icon: Receipt, href: '/dashboard/transactions' },
    { name: 'Planejamento', icon: Target, href: '/dashboard/planning' },
    { name: 'Me Poupey AI', icon: BrainCircuit, href: '/dashboard/ai' },
    { name: 'Relatórios', icon: FileText, href: '/dashboard/reports' },
    { name: 'Minha Conta', icon: UserCircle, href: '/dashboard/account' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const sidebarVariants = {
        expanded: { width: "256px" },
        collapsed: { width: "80px" }
    };

    return (
        <>
            {/* Mobile Header Trigger */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-indigo-400" />
                    Me Poupey
                </span>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                >
                    <Menu />
                </button>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-white/10 md:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <span className="text-xl font-bold text-white flex items-center gap-2">
                                    <Wallet className="w-6 h-6 text-indigo-500" />
                                    Me Poupey
                                </span>
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                                >
                                    <X />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4 px-3">
                                <NavLinks pathname={pathname} items={menuItems} onClick={() => setIsMobileOpen(false)} />
                            </div>

                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sair da Conta
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                variants={sidebarVariants}
                animate={isCollapsed ? "collapsed" : "expanded"}
                className={cn(
                    "hidden md:flex flex-col h-screen sticky top-0 bg-slate-950 border-r border-white/10 z-40 transition-all duration-300",
                )}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-center border-b border-white/10 relative">
                    {!isCollapsed ? (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2"
                        >
                            <Wallet className="w-8 h-8 text-indigo-500" />
                            Me Poupey
                        </motion.span>
                    ) : (
                        <Wallet className="w-8 h-8 text-indigo-500" />
                    )}

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 text-slate-400 hover:text-white p-1 rounded-full shadow-lg"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                    <NavLinks pathname={pathname} items={menuItems} isCollapsed={isCollapsed} />
                </div>

                {/* User / Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors",
                            isCollapsed && "justify-center px-0"
                        )}
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span>Sair</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
}

function NavLinks({ pathname, items, onClick, isCollapsed = false }: { pathname: string, items: any[], onClick?: () => void, isCollapsed?: boolean }) {
    return (
        <>
            {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClick}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all group relative",
                            isActive
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white",
                            isCollapsed && "justify-center px-2"
                        )}
                        title={isCollapsed ? item.name : undefined}
                    >
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                        {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}

                        {/* Tooltip for collapsed mode */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                {item.name}
                            </div>
                        )}
                    </Link>
                );
            })}
        </>
    );
}
