'use client';

import { motion, Variants } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import { type ReportSummary } from './actions';
import { TrendingUp, TrendingDown, Scissors, ArrowRight } from 'lucide-react';

interface ReportsClientProps {
    data: ReportSummary;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
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
            className="p-6 md:p-10 min-h-full bg-slate-950 text-slate-50 w-full"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* LADO ESQUERDO (70%) - Tensão Tipográfica & Gráfico Principal */}
                <div className="lg:col-span-8 flex flex-col gap-12">

                    {/* Hero Typographic Section */}
                    <motion.section variants={itemVariants} className="flex flex-col gap-2">
                        <h2 className="text-slate-400 font-mono text-sm uppercase tracking-widest mb-2">Visão Consolidada</h2>
                        <div className="flex flex-col md:flex-row items-baseline gap-4">
                            <h1 className={`text-6xl md:text-8xl font-black tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(data.balance)}
                            </h1>
                        </div>
                        <p className="max-w-xl text-slate-400 mt-4 text-lg/relaxed">
                            O saldo geral representa a diferença bruta exata mapeada entre todas as suas entradas e saídas rastreadas no período.
                        </p>
                    </motion.section>

                    {/* Gráfico de Despesa x Receita (Padrão) */}
                    <motion.section variants={itemVariants} className="border border-slate-800 bg-slate-900/50 p-6 md:p-8 rounded-none">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="text-emerald-400 w-5 h-5" /> Movimentação Diária
                        </h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.transactionsByDate} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#64748b"
                                        tickFormatter={(val) => val.slice(8, 10) + '/' + val.slice(5, 7)}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tickFormatter={(val) => val >= 1000 ? `R$ ${(val / 1000).toFixed(1)}k` : `R$ ${val}`}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#0f172a' }}
                                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '0px' }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                                        formatter={(value: any) => [formatCurrency(Number(value) || 0)]}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="income" name="Receita" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="expense" name="Despesa" fill="#f43f5e" radius={[2, 2, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.section>
                </div>

                {/* LADO DIREITO (30%) - O Smart Money & Highlights */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Smart Money Hero Widget */}
                    <motion.section variants={itemVariants} className="bg-emerald-950/30 border border-emerald-900/50 p-8 rounded-none flex flex-col justify-center items-start relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 text-emerald-900/20 group-hover:text-emerald-800/20 transition-colors duration-500">
                            <Scissors className="w-48 h-48 -rotate-12" />
                        </div>
                        <div className="relative z-10 w-full">
                            <h3 className="text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Scissors className="w-3 h-3" /> Economia Obtida
                            </h3>
                            <p className="text-4xl font-extrabold text-emerald-50 tracking-tight my-2">
                                {formatCurrency(data.totalDiscount)}
                            </p>
                            <p className="text-emerald-200/60 text-sm">
                                Valores retidos e cupons encontrados no seu fluxo (Smart Money).
                            </p>
                        </div>
                    </motion.section>

                    {/* Listagem Estrita de Receitas e Despesas Globais */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                        <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-none">
                            <p className="text-slate-500 text-xs font-mono uppercase mb-1">Total Receitas</p>
                            <p className="text-xl font-semibold text-emerald-400">{formatCurrency(data.totalRevenue)}</p>
                        </div>
                        <div className="border border-slate-800 bg-slate-900/40 p-5 rounded-none">
                            <p className="text-slate-500 text-xs font-mono uppercase mb-1">Total Despesas</p>
                            <p className="text-xl font-semibold text-rose-400 text-opacity-80">{formatCurrency(data.totalExpenses)}</p>
                        </div>
                    </motion.div>

                    {/* Descontos Recentes Flow */}
                    <motion.section variants={itemVariants} className="mt-4 flex flex-col gap-4">
                        <h3 className="text-slate-300 font-semibold flex items-center justify-between pb-2 border-b border-slate-800/80">
                            Maiores Retenções <span className="text-xs text-slate-500 font-normal cursor-pointer hover:text-emerald-400 transition-colors flex items-center">Ver todas <ArrowRight className="w-3 h-3 ml-1" /></span>
                        </h3>

                        <div className="flex flex-col gap-3">
                            {data.recentDiscounts.map((discount) => (
                                <div key={discount.id} className="group border border-slate-800/60 bg-slate-920 p-4 hover:border-emerald-800/40 hover:bg-slate-900/80 transition-all rounded-none flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-slate-200 line-clamp-1 pr-4">{discount.description}</p>
                                        <p className="text-emerald-400 font-bold text-sm shrink-0">-{formatCurrency(discount.discount_amount)}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                                        <span className="line-through decoration-rose-900/50">{formatCurrency(discount.gross_amount)}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-700" />
                                        <span className="text-slate-300">Pago: {formatCurrency(discount.amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                </div>
            </div>
        </motion.div>
    );
}
