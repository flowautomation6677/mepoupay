'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    Target,
    BrainCircuit,
    FileText,
    Menu,
    X,
    LogOut,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    Wallet
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { ThemeToggle } from './ThemeToggle';

import { cn } from '@/lib/utils';

const menuItems = [
    { name: 'Visão Geral', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Gastos & Extrato', icon: Receipt, href: '/dashboard/transactions' },
    { name: 'Planejamento', icon: Target, href: '/dashboard/planning' },
    { name: 'Me Poupay AI', icon: BrainCircuit, href: '/dashboard/ai' },
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
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
                <span className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-primary" />
                    Me Poupay
                </span>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
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
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border md:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <span className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <Wallet className="w-6 h-6 text-primary" />
                                    Me Poupay
                                </span>
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
                                >
                                    <X />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4 px-3">
                                <NavLinks pathname={pathname} items={menuItems} onClick={() => setIsMobileOpen(false)} />
                            </div>

                            <div className="flex flex-col gap-2 p-4 border-t border-border">
                                <ThemeToggle />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
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
                    "hidden md:flex flex-col h-screen sticky top-0 bg-background border-r border-border z-40 transition-all duration-300",
                )}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-center border-b border-border relative">
                    {isCollapsed ? (
                        <Wallet className="w-8 h-8 text-primary" />
                    ) : (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-2xl font-bold text-foreground flex items-center gap-2"
                        >
                            <Wallet className="w-8 h-8 text-primary" />
                            Me Poupay
                        </motion.span>
                    )}

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-background border border-border text-muted-foreground hover:text-foreground p-1 rounded-full shadow-lg"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                    <NavLinks pathname={pathname} items={menuItems} isCollapsed={isCollapsed} />
                </div>

                {/* User / Logout */}
                <div className="flex flex-col gap-2 p-4 border-t border-border">
                    <ThemeToggle isCollapsed={isCollapsed} />
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors",
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

function NavLinks({ pathname, items, onClick, isCollapsed = false }: Readonly<{ pathname: string, items: { name: string, href: string, icon: React.ElementType }[], onClick?: () => void, isCollapsed?: boolean }>) {
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
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                            isCollapsed && "justify-center px-2"
                        )}
                        title={isCollapsed ? item.name : undefined}
                    >
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                        {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}

                        {/* Tooltip for collapsed mode */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground shadow-md text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                {item.name}
                            </div>
                        )}
                    </Link>
                );
            })}
        </>
    );
}
