'use client'

import {
    ComposedChart, Line, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

import { Transaction } from '@/types/dashboard'

export default function ExpenseChart({ transactions }: Readonly<{ transactions: Transaction[] }>) {
    if (!transactions || transactions.length === 0) return null

    // --- PROCESSAMENTO DE DADOS (ZONA 2) ---
    // Group transactions by date
    // Create an object with all dates in the range
    // Then fill with transaction data
    // For simplicity, let's just group existing transactions first
    // Note: Ideally we should use the full date range like in StatsGrid

    const dailyGroups = transactions.reduce((acc: Record<string, { income: number; expense: number }>, t) => {
        const date = t.date.split('T')[0]
        if (!acc[date]) acc[date] = { income: 0, expense: 0 }

        if (t.type === 'INCOME') acc[date].income += t.amount
        else acc[date].expense += t.amount

        return acc
    }, {})

    // Converter para array e ordenar
    let currentBalance = 0;
    const sortedDates = Object.keys(dailyGroups).sort((a, b) => a.localeCompare(b));

    const chartData = sortedDates.map(date => {
        const dayIncome = dailyGroups[date].income
        const dayExpense = dailyGroups[date].expense
        const net = dayIncome - dayExpense
        currentBalance += net

        return {
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            receita: dayIncome, // Using same keys for viewing compatibility or update chart keys
            despesa: dayExpense * -1,
            net,
            saldo: currentBalance
        }
    });

    // --- PROCESSAMENTO DE DADOS (ZONA 3) ---
    // Top Categorias
    const catGroups = transactions
        .filter(t => t.type !== 'INCOME')
        .reduce((acc: Record<string, number>, t) => {
            if (!acc[t.category]) acc[t.category] = 0
            acc[t.category] += t.amount
            return acc
        }, {})

    const topCategories = Object.keys(catGroups)
        .map(cat => ({ name: cat, value: catGroups[cat] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    const totalExpenses = transactions.filter(t => t.type !== 'INCOME').reduce((acc, t) => acc + t.amount, 0)


    // Insight Simples (Mockado/Regra)
    const topCatName = topCategories[0]?.name || 'Nada'
    const topCatValue = topCategories[0]?.value || 0
    const topCatPercent = totalExpenses > 0 ? ((topCatValue / totalExpenses) * 100).toFixed(0) : 0

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* ZONA 2: MAIN CHART (Trader View) */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="col-span-1 md:col-span-2 rounded-[2rem] border border-border bg-card/50 p-6 shadow-xl backdrop-blur-md"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-card-foreground">Análise Temporal</h3>
                        <p className="text-sm text-muted-foreground">Fluxo Diário (Barras) e Acumulado (Linha)</p>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                                </linearGradient>
                                <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#475569"
                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--card-foreground))' }}
                                formatter={(value: number | undefined, name: string | undefined) => {
                                    if (value === undefined) return ['-', name];
                                    if (name === 'saldo') return [formatCurrency(value), 'Saldo Acumulado']
                                    if (name === 'receita') return [formatCurrency(value), 'Entradas']
                                    if (name === 'despesa') return [formatCurrency(Math.abs(value)), 'Saídas']
                                    return [value, name]
                                }}
                            />
                            <ReferenceLine y={0} stroke="#475569" />

                            {/* Barras de Receita (Pra cima) */}
                            <Bar dataKey="receita" fill="url(#gradReceita)" radius={[4, 4, 0, 0]} barSize={8} />

                            {/* Barras de Despesa (Pra baixo - valores negativos) */}
                            <Bar dataKey="despesa" fill="url(#gradDespesa)" radius={[0, 0, 4, 4]} barSize={8} />

                            {/* Linha de Tendência (Saldo) */}
                            <Line
                                type="monotone"
                                dataKey="saldo"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* ZONA 3: SIDEBAR (Drill-down + Widget) */}
            <div className="col-span-1 space-y-6">

                {/* 3A: Top Ofensores (Barras Horizontais) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-[2rem] border border-border bg-card/50 p-6 shadow-xl backdrop-blur-md"
                >
                    <h3 className="mb-4 text-lg font-bold text-card-foreground">Top Gastos</h3>
                    <div className="space-y-4">
                        {topCategories.map((cat, i) => (
                            <div key={cat.name} className="group">
                                <div className="mb-1 flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground group-hover:text-foreground transition">{cat.name}</span>
                                    <span className="text-muted-foreground">{formatCurrency(cat.value)}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(cat.value / topCategories[0].value) * 100}%` }} // Proporcional ao maior
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                        className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : 'bg-muted-foreground/30 group-hover:bg-primary transition-colors'}`}
                                    />
                                </div>
                            </div>
                        ))}
                        {topCategories.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Sem despesas registradas.</p>}
                    </div>
                </motion.div>

                {/* 3B: Widget Me Poupay AI */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-xl"
                >
                    <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-background/20 p-2 backdrop-blur-md">
                            <Zap size={20} className="text-yellow-300" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg">Me Poupay Insight</h4>
                            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/90 opacity-90">
                                {topCategories.length > 0
                                    ? `Atenção: A categoria '${topCatName}' representa ${topCatPercent}% das suas saídas neste período. Que tal rever esses gastos?`
                                    : 'Acompanhando seus gastos para gerar recomendações inteligentes.'}
                            </p>

                            <a
                                href="https://wa.me/55..."
                                target="_blank"
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-background/10 px-4 py-2 text-xs font-bold hover:bg-background/20 transition"
                            >
                                Conversar no Zap
                            </a>
                        </div>
                    </div>

                    {/* Background Detail */}
                    <div className="absolute -bottom-6 -right-6 text-white/5 rotate-12">
                        <Zap size={120} />
                    </div>
                </motion.div>

            </div>
        </div>
    )
}
