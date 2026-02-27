'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    ShieldAlert,
    FlaskConical,
    Database,
    Smartphone,
    Activity,
    DollarSign,
    Settings,
    LogOut,
    LucideIcon
} from 'lucide-react';
import { Title, Text } from "@tremor/react";

const MenuGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="mb-4">
        <Text className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</Text>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const MenuItem = ({ href, icon: Icon, label, onClick }: { href: string, icon: LucideIcon, label: string, onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(href + '/');

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-all duration-200 group ${isActive
                ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                }`}
        >
            <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'} />
            <span>{label}</span>
        </Link>
    );
};

export default function AdminSidebar({ isOpen = true, onClose }: Readonly<{ isOpen?: boolean, onClose?: () => void }>) {
    return (
        <aside className={`w-64 bg-white dark:bg-[#09090b] border-r border-slate-200 dark:border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            {/* Header */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-white/5">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-xl">🐷</span>
                </div>
                <div>
                    <Title className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">NEXUS</Title>
                    <Text className="text-xs text-slate-500">Admin Console</Text>
                </div>
            </div>

            {/* Scrollable Menu */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">

                <div className="space-y-1">
                    <MenuItem href="/admin" icon={LayoutDashboard} label="Visão Geral" onClick={onClose} />
                </div>

                <MenuGroup label="GESTÃO DE USUÁRIOS">
                    <MenuItem href="/admin/users" icon={Users} label="Todos os Usuários" onClick={onClose} />
                    <MenuItem href="/admin/subscription" icon={CreditCard} label="Assinaturas (Kirvano)" onClick={onClose} />
                    <MenuItem href="/admin/security" icon={ShieldAlert} label="Logs de Segurança" onClick={onClose} />
                </MenuGroup>

                <MenuGroup label="IA & INTELIGÊNCIA">
                    <MenuItem href="/admin/lab" icon={FlaskConical} label="Prompt A/B Testing" onClick={onClose} />
                    <MenuItem href="/admin/curation" icon={Database} label="Curadoria de Dados" onClick={onClose} />
                </MenuGroup>

                <MenuGroup label="INFRAESTRUTURA">
                    <MenuItem href="/admin/infrastructure/whatsapp" icon={Smartphone} label="The Bridge (Zap)" onClick={onClose} />
                    <MenuItem href="/admin/infrastructure/sre" icon={Activity} label="SRE (Saúde)" onClick={onClose} />
                    <MenuItem href="/admin/infrastructure/cfo" icon={DollarSign} label="CFO (Custos API)" onClick={onClose} />
                </MenuGroup>

                <MenuGroup label="CONFIGURAÇÕES">
                    <MenuItem href="/admin/settings" icon={Settings} label="Ajustes Globais" onClick={onClose} />
                </MenuGroup>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <Text className="text-slate-900 dark:text-white text-sm font-medium truncate">Admin Nexus</Text>
                        <Text className="text-xs text-slate-500 truncate">Super Admin</Text>
                    </div>
                    <LogOut size={16} className="text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-500 transition-colors" />
                </div>
            </div>
        </aside>
    );
}
