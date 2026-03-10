'use client';

import { motion, Variants } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import { type ReportSummary } from './actions';
import { TrendingUp, Scissors, ArrowRight, PieChart as PieChartIcon } from 'lucide-react';
import { ReportsFilter } from './ReportsFilter';
import { ReportExport } from './ReportExport';

interface ReportsClientProps {
    data: ReportSummary;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function ReportsClient({ data }: ReportsClientProps) {
    // Formatters
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const isPositive = data.balance >= 0;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="p-4 md:p-10 min-h-full bg-background text-foreground w-full"
        >
            {/* Header / Filtros & Export */}
            <motion.div variants={itemVariants} className="mb-8 md:mb-10 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                    <ReportsFilter
                        currentMonth={data.currentMonth}
                        currentCategoryId={data.currentCategoryId}
                        categories={data.categories}
                    />
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                    <ReportExport
                        month={data.currentMonth}
                        categoryId={data.currentCategoryId}
                    />
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* LADO ESQUERDO (70%) - Tensão Tipográfica & Gráficos Principais */}
                <div className="lg:col-span-8 flex flex-col gap-12">

                    {/* Hero Typographic Section */}
                    <motion.section variants={itemVariants} className="flex flex-col gap-2">
                        <h2 className="text-muted-foreground font-mono text-sm uppercase tracking-widest mb-2">Visão Consolidada ({data.currentMonth})</h2>
                        <div className="flex flex-col md:flex-row items-baseline gap-2 md:gap-4 mt-2">
                            <h1 className={`text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatCurrency(data.balance)}
                            </h1>
                        </div>
                        <p className="max-w-xl text-muted-foreground mt-4 text-lg/relaxed">
                            O saldo geral da competência reflete todas as suas entradas subtraindo as saídas filtradas com precisão contábil.
                        </p>
                    </motion.section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gráfico de Despesa x Receita */}
                        <motion.section variants={itemVariants} className="border border-border bg-card p-6 rounded-none flex flex-col shadow-sm">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <TrendingUp className="text-emerald-500 w-5 h-5" /> Movimento Financeiro
                            </h3>
                            <div className="h-[250px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.transactionsByDate} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#64748b"
                                            tickFormatter={(val) => val.slice(8, 10)}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#0f172a' }}
                                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '0px' }}
                                            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                                            formatter={(value: any) => [formatCurrency(Number(value) || 0)]}
                                        />
                                        <Bar dataKey="income" name="Receita" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={20} />
                                        <Bar dataKey="expense" name="Despesa" fill="#f43f5e" radius={[0, 0, 0, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.section>

                        {/* Novo Gráfico: Despesas por Categoria (Pie Chart) */}
                        <motion.section variants={itemVariants} className="border border-border bg-card p-6 rounded-none flex flex-col shadow-sm">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <PieChartIcon className="text-rose-500 w-5 h-5" /> Distribuição de Saídas
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono mb-4">ONDE O DINHEIRO FOI GASTO</p>

                            <div className="h-[250px] w-full mt-auto flex items-center justify-center">
                                {data.expensesByCategory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '0px' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                                formatter={(value: any) => formatCurrency(Number(value))}
                                            />
                                            <Pie
                                                data={data.expensesByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {data.expensesByCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="square"
                                                formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono border border-dashed border-border w-full">
                                        Nenhuma despesa para o filtro atual.
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>

                </div>

                {/* LADO DIREITO (30%) - O Smart Money & Highlights */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Smart Money Hero Widget */}
                    <motion.section variants={itemVariants} className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-8 rounded-none flex flex-col justify-center items-start relative overflow-hidden group shadow-sm">
                        <div className="absolute -right-6 -top-6 text-emerald-100 dark:text-emerald-900/20 group-hover:text-emerald-200 dark:group-hover:text-emerald-800/20 transition-colors duration-500">
                            <Scissors className="w-48 h-48 -rotate-12" />
                        </div>
                        <div className="relative z-10 w-full">
                            <h3 className="text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Scissors className="w-3 h-3" /> Economia Obtida no Mês
                            </h3>
                            <p className="text-4xl font-extrabold text-emerald-900 dark:text-emerald-50 tracking-tight my-2">
                                {formatCurrency(data.totalDiscount)}
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-200/60 text-sm">
                                Valores retidos e cupons encontrados no seu fluxo (Smart Money).
                            </p>
                        </div>
                    </motion.section>

                    {/* Listagem Estrita de Receitas e Despesas Globais */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                        <div className="border border-border bg-card p-5 rounded-none shadow-sm">
                            <p className="text-muted-foreground text-xs font-mono uppercase mb-1">Total Receitas</p>
                            <p className="text-xl font-semibold text-emerald-500">{formatCurrency(data.totalRevenue)}</p>
                        </div>
                        <div className="border border-border bg-card p-5 rounded-none shadow-sm">
                            <p className="text-muted-foreground text-xs font-mono uppercase mb-1">Total Despesas</p>
                            <p className="text-xl font-semibold text-rose-500 text-opacity-80">{formatCurrency(data.totalExpenses)}</p>
                        </div>
                    </motion.div>

                    {/* Descontos Recentes Flow */}
                    <motion.section variants={itemVariants} className="mt-4 flex flex-col gap-4">
                        <h3 className="text-foreground font-semibold flex items-center justify-between pb-2 border-b border-border">
                            Maiores Retenções (Top 10)
                        </h3>

                        <div className="flex flex-col gap-3">
                            {data.recentDiscounts.length > 0 ? data.recentDiscounts.map((discount) => (
                                <div key={discount.id} className="group border border-border bg-card p-4 hover:border-emerald-500/40 hover:bg-accent transition-all rounded-none flex flex-col gap-2 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-foreground line-clamp-1 pr-4">{discount.description}</p>
                                        <p className="text-emerald-500 font-bold text-sm shrink-0">-{formatCurrency(discount.discount_amount)}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                                        <span className="line-through decoration-rose-500/50">{formatCurrency(discount.gross_amount)}</span>
                                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-foreground">Pago: {formatCurrency(discount.amount)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-muted-foreground text-sm py-4 italic text-center">Nenhum desconto ou cupom encontrado para este filtro.</div>
                            )}
                        </div>
                    </motion.section>

                </div>
            </div>
        </motion.div>
    );
}
