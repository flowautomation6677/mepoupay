'use client'

import dynamic from 'next/dynamic'
import StatsGrid from '@/components/dashboard/StatsGrid'
import TransactionFeed from '@/components/dashboard/TransactionFeed'
import { formatPhoneNumber } from '@/utils/formatters'
import { DashboardData } from '@/types/dashboard'

// Lazy Load ExpenseChart
const ExpenseChart = dynamic(() => import('@/components/dashboard/ExpenseChart'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-100/10 rounded-3xl animate-pulse" />
})

export default function DashboardContent({ profile, transactions, prevTransactions }: Readonly<DashboardData>) {
    if (!profile) return null;

    return (
        <>
            {/* Bento Grid Principal (Zone 1: KPIs) */}
            <StatsGrid
                transactions={transactions}
                prevTransactions={prevTransactions}
                financialGoal={profile.financial_goal || 0}
                currentBalance={profile.balance}
            />

            {/* Gráficos Neon */}
            <ExpenseChart transactions={transactions} />

            {/* Feed e Widget Lateral (GridLayout) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <TransactionFeed transactions={transactions} />
                </div>

                <div className="md:col-span-1 space-y-6">
                    {/* Card de Conexão */}
                    <div className="rounded-[2rem] bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-600/20">
                        <h3 className="text-lg font-bold">Me Poupay AI</h3>
                        <p className="mt-2 text-indigo-100 text-sm opacity-90">
                            Seu assistente está conectado e monitorando seus gastos pelo número:
                        </p>
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                            <span className="font-mono text-sm tracking-wide">
                                {formatPhoneNumber(profile.whatsapp_numbers?.[0] || '')}
                            </span>
                        </div>
                        <a
                            href={`https://wa.me/${profile.whatsapp_numbers?.[0] || process.env.NEXT_PUBLIC_SUPPORT_PHONE || '5521984646902'}?text=Olá! Quero falar com o Me Poupay.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
                        >
                            Abrir no WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </>
    )
}
