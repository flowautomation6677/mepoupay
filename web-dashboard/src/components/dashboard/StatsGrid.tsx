'use client'

import { ArrowUp, Target, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/utils/formatters'
import { Transaction } from '@/types/dashboard'

interface StatsGridProps {
    transactions: Transaction[]
    prevTransactions: Partial<Transaction>[]
    financialGoal: number
}

export default function StatsGrid({ transactions, prevTransactions, financialGoal }: StatsGridProps) {
    // Current Month Stats
    const income = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((acc, t) => acc + Number(t.amount), 0)

    const expense = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + Number(t.amount), 0)

    const balance = income - expense

    // Previous Month Stats
    const prevIncome = prevTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0)

    const prevExpense = prevTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + Number(t.amount || 0), 0)

    const prevBalance = prevIncome - prevExpense

    const balanceDiff = balance - prevBalance
    const balanceGrowth = prevBalance !== 0 ? (balanceDiff / Math.abs(prevBalance)) * 100 : 0
    const isPositiveGrowth = balanceDiff >= 0

    // Cashflow
    const commitmentRate = income > 0 ? (expense / income) * 100 : 0

    // Goal
    const goalValue = financialGoal > 0 ? financialGoal : 1; // Avoid division by zero
    const progress = Math.min((balance / goalValue) * 100, 100)
    const remaining = Math.max(goalValue - balance, 0)

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Zone 1: Balance & Health */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-white/5 backdrop-blur-md"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Saldo Disponível</p>
                        <h3 className="mt-2 text-3xl font-bold text-white tracking-tight">
                            {formatCurrency(balance)}
                        </h3>
                    </div>
                    <div className="rounded-full bg-emerald-500/20 p-3">
                        <Wallet className="h-6 w-6 text-emerald-400" />
                    </div>
                </div>

                <div className="mt-6 flex items-center space-x-3">
                    <div className={`flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${isPositiveGrowth ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isPositiveGrowth ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                        {Math.abs(balanceGrowth).toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-500">vs. mês anterior ({formatCurrency(prevBalance)})</p>
                </div>
            </motion.div>

            {/* Zone 2: Cashflow Monitor */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-white/5 backdrop-blur-md"
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Fluxo de Caixa</p>
                        <div className="mt-2 flex items-baseline space-x-2">
                            <span className="text-xl font-semibold text-emerald-400">+{formatCurrency(income)}</span>
                            <span className="text-sm text-slate-500">/</span>
                            <span className="text-xl font-semibold text-red-400">-{formatCurrency(expense)}</span>
                        </div>
                    </div>
                    <div className="rounded-full bg-blue-500/20 p-3">
                        <ArrowUp className="h-6 w-6 text-blue-400" />
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Taxa de Comprometimento</span>
                            <span className={commitmentRate > 80 ? 'text-red-400' : 'text-slate-300'}>{commitmentRate.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${commitmentRate > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(commitmentRate, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Zone 3: Gamified Goal */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-white/5 backdrop-blur-md"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Meta de Economia</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">
                            {Math.round(progress)}% <span className="text-sm font-normal text-slate-500">concluído</span>
                        </h3>
                    </div>
                    <div className="rounded-full bg-amber-500/20 p-3">
                        <Target className="h-6 w-6 text-amber-400" />
                    </div>
                </div>

                <div className="mt-6">
                    <div className="mb-2 flex justify-between text-xs text-slate-400">
                        <span>Faltam {formatCurrency(remaining)}</span>
                        <span>Meta: {formatCurrency(financialGoal)}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-3 text-xs text-amber-400/80 flex items-center">
                        <PiggyBank className="mr-1.5 h-3.5 w-3.5" />
                        Mantenha o foco para atingir sua meta!
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
