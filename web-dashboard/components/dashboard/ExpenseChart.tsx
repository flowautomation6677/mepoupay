
'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'

const PIE_COLORS = ['#6366f1', '#34d399', '#f472b6', '#a78bfa', '#fbbf24', '#94a3b8']

export default function ExpenseChart({ transactions }: { transactions: any[] }) {
    if (!transactions || transactions.length === 0) return null

    // Dados para Gráfico de Área (Linha do tempo - últimos 7 dias)
    // Agrupa por data simples
    const groups = transactions.reduce((acc: any, t) => {
        const date = t.data.split('T')[0]
        if (!acc[date]) {
            acc[date] = { receita: 0, despesa: 0 }
        }

        if (t.tipo === 'receita') {
            acc[date].receita += t.valor
        } else {
            acc[date].despesa += t.valor
        }
        return acc
    }, {})

    // Ordena por data e formata
    const areaData = Object.keys(groups)
        .sort()
        .map(date => ({
            name: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            receita: groups[date].receita,
            despesa: groups[date].despesa
        }))

    // Se tiver muitos dias (mais de 14), pega apenas os últimos para não poluir, ou deixa tudo se for do mês
    // Por enquanto vou deixar mostrar tudo que vier da query (que será filtrada por mês)

    // Dados para Donut Chart (Categorias)
    const categoryData = transactions
        .filter(t => t.tipo !== 'receita') // Apenas despesas no gráfico de pizza
        .reduce((acc: any, t) => {
            const found = acc.find((i: any) => i.name === t.categoria)
            if (found) {
                found.value += t.valor
            } else {
                acc.push({ name: t.categoria, value: t.valor })
            }
            return acc
        }, [])

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Gráfico de Área */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="col-span-1 md:col-span-2 rounded-[2rem] border border-white/5 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white">Evolução de Entradas e Saídas</h3>
                    <p className="text-sm text-slate-500">Fluxo do período selecionado</p>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaData}>
                            <defs>
                                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#475569"
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ padding: 0 }}
                                formatter={(value: number, name: string) => [
                                    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                    name === 'receita' ? 'Entradas' : 'Saídas'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="receita"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorReceita)"
                                name="receita"
                            />
                            <Area
                                type="monotone"
                                dataKey="despesa"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorDespesa)"
                                name="despesa"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Gráfico Donut */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-[2rem] border border-white/5 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md"
            >
                <h3 className="mb-4 text-lg font-bold text-white">Categorias</h3>
                <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0)" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Texto Central */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white">{categoryData.length}</span>
                        <span className="text-xs text-slate-500">Categorias</span>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {categoryData.slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                            {c.name}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
