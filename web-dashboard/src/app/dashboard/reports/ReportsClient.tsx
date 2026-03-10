'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import { type ReportSummary } from './actions';
import { TrendingUp, Scissors, ArrowRight, Filter, PieChart as PieChartIcon } from 'lucide-react';

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
    const router = useRouter();
    const searchParams = useSearchParams();

    // Formatters
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const isPositive = data.balance >= 0;

    // Controllers do Filtro (Via Server Components URL param)
    const handleFilterChange = (type: 'month' | 'category', value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (value && value !== 'all') {
            current.set(type, value);
        } else {
            current.delete(type);
        }
        router.push(`/dashboard/reports?${current.toString()}`);
    };

    // Gera opções de Meses
    const generateMonthOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            options.push({ val, label: label.charAt(0).toUpperCase() + label.slice(1) });
        }
        return options;
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="p-6 md:p-10 min-h-full bg-slate-950 text-slate-50 w-full"
        >
            {/* Header / Filtros */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter className="w-5 h-5 text-emerald-500" />
                    <span className="font-mono text-xs uppercase tracking-widest text-slate-300">Inteligência de Filtragem</span>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <select
                        value={data.currentMonth}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-sm focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none w-full sm:w-auto"
                    >
                        {generateMonthOptions().map(opt => (
                            <option key={opt.val} value={opt.val}>{opt.label}</option>
                        ))}
                    </select>

                    <select
                        value={data.currentCategoryId}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-sm focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none w-full sm:w-auto"
                    >
                        <option value="all">Todas as Categorias</option>
                        {data.categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* LADO ESQUERDO (70%) - Tensão Tipográfica & Gráficos Principais */}
                <div className="lg:col-span-8 flex flex-col gap-12">

                    {/* Hero Typographic Section */}
                    <motion.section variants={itemVariants} className="flex flex-col gap-2">
                        <h2 className="text-slate-400 font-mono text-sm uppercase tracking-widest mb-2">Visão Consolidada ({data.currentMonth})</h2>
                        <div className="flex flex-col md:flex-row items-baseline gap-4">
                            <h1 className={`text-6xl md:text-8xl font-black tracking-tighter ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(data.balance)}
                            </h1>
                        </div>
                        <p className="max-w-xl text-slate-400 mt-4 text-lg/relaxed">
                            O saldo geral da competência reflete todas as suas entradas subtraindo as saídas filtradas com precisão contábil.
                        </p>
                    </motion.section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gráfico de Despesa x Receita */}
                        <motion.section variants={itemVariants} className="border border-slate-800 bg-slate-900/50 p-6 rounded-none flex flex-col">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <TrendingUp className="text-emerald-400 w-5 h-5" /> Movimento Financeiro
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
                        <motion.section variants={itemVariants} className="border border-slate-800 bg-slate-900/50 p-6 rounded-none flex flex-col">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                <PieChartIcon className="text-rose-400 w-5 h-5" /> Distribuição de Saídas
                            </h3>
                            <p className="text-xs text-slate-500 font-mono mb-4">ONDE O DINHEIRO FOI GASTO</p>

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
                                                formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-600 text-sm font-mono border border-dashed border-slate-800 w-full">
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
                    <motion.section variants={itemVariants} className="bg-emerald-950/30 border border-emerald-900/50 p-8 rounded-none flex flex-col justify-center items-start relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 text-emerald-900/20 group-hover:text-emerald-800/20 transition-colors duration-500">
                            <Scissors className="w-48 h-48 -rotate-12" />
                        </div>
                        <div className="relative z-10 w-full">
                            <h3 className="text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Scissors className="w-3 h-3" /> Economia Obtida no Mês
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
                            Maiores Retenções (Top 10)
                        </h3>

                        <div className="flex flex-col gap-3">
                            {data.recentDiscounts.length > 0 ? data.recentDiscounts.map((discount) => (
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
                            )) : (
                                <div className="text-slate-500 text-sm py-4 italic text-center">Nenhum desconto ou cupom encontrado para este filtro.</div>
                            )}
                        </div>
                    </motion.section>

                </div>
            </div>
        </motion.div>
    );
}
