
'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Wallet, CreditCard, PiggyBank } from 'lucide-react'

const MotionCard = motion.div

export default function StatsGrid({ transactions }: { transactions: any[] }) {
    if (!transactions) return null

    // Cálculos de Receita e Despesa
    const receitas = transactions
        .filter(t => t.tipo === 'receita')
        .reduce((acc, t) => acc + t.valor, 0)

    const despesas = transactions
        .filter(t => t.tipo !== 'receita') // Default 'despesa' or null
        .reduce((acc, t) => acc + t.valor, 0)

    const saldo = receitas - despesas
    const mediaDiaria = despesas / 30 // Média de gastos apenas

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Card Principal - Saldo Atual */}
            <MotionCard
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="col-span-1 md:col-span-2 relative overflow-hidden rounded-[2rem] border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-slate-900/50 p-8 shadow-2xl backdrop-blur-md"
            >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl"></div>

                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-indigo-300">Saldo Atual</p>
                        <h2 className="mt-2 text-4xl font-bold tracking-tight text-white neon-text-indigo">
                            {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h2>
                        <div className="mt-4 flex gap-4 text-xs">
                            <div className="flex items-center gap-1 text-emerald-400">
                                <TrendingUp size={12} />
                                <span>Entradas: {receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-400">
                                <TrendingUp size={12} className="rotate-180" />
                                <span>Saídas: {despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-indigo-500/20 p-3 text-indigo-400 ring-1 ring-white/10">
                        <Wallet size={32} />
                    </div>
                </div>
            </MotionCard>

            {/* Cards Secundários */}
            <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col justify-between rounded-[2rem] border border-white/5 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md hover:bg-slate-800/50 transition-colors"
            >
                <div className="mb-4 rounded-xl bg-orange-500/10 p-3 w-fit text-orange-400">
                    <CreditCard size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-400">Média de Gastos (Dia)</p>
                    <p className="text-2xl font-bold text-white">
                        {mediaDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </MotionCard>

            <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col justify-between rounded-[2rem] border border-white/5 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md hover:bg-slate-800/50 transition-colors"
            >
                <div className="mb-4 rounded-xl bg-emerald-500/10 p-3 w-fit text-emerald-400">
                    <PiggyBank size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-400">Economia Total</p>
                    <p className="text-2xl font-bold text-white neon-text-emerald">
                        {/* Simulação de economia baseada em 20% das receitas */}
                        {(receitas * 0.2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </MotionCard>
        </div>
    )
}
