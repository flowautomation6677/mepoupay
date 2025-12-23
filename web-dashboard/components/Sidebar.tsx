'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
    UserCircle
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const menuItems = [
        { name: 'Visão Geral', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Gastos & Extrato', icon: Receipt, href: '/dashboard/expenses' },
        { name: 'Planejamento', icon: Target, href: '/dashboard/planning' },
        { name: 'IA & Inteligência', icon: BrainCircuit, href: '/dashboard/ai' },
        { name: 'Relatórios', icon: FileText, href: '/dashboard/reports' },
        { name: 'Conta & Segurança', icon: ShieldCheck, href: '/dashboard/account' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-white/10 sticky top-0 z-50">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Me Poupey
                </span>
                <button onClick={() => setIsOpen(!isOpen)} className="text-white">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-white/10 
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo (Desktop) */}
                    <div className="hidden md:flex items-center justify-center h-16 border-b border-white/10">
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Me Poupey
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer User Profile */}
                    <div className="border-t border-white/10 p-4">
                        <div className="flex items-center gap-3 px-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                <UserCircle className="text-indigo-400 w-5 h-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">Minha Conta</p>
                                <p className="text-xs text-slate-500 truncate">Gerenciar</p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sair
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for Mobile */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                />
            )}
        </>
    );
}
