
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Coffee, ShoppingBag, Car, Home, HeartPulse, MoreHorizontal, GraduationCap, TrendingUp, DollarSign, Briefcase } from 'lucide-react'

// Mapeamento de ícones por categoria simples
const getIcon = (categoria: string, tipo: string) => {
    const cat = categoria?.toLowerCase() || ''

    // Receitas
    if (tipo === 'receita') {
        if (cat.includes('salário') || cat.includes('salario')) return <DollarSign size={20} />
        if (cat.includes('invest')) return <TrendingUp size={20} />
        if (cat.includes('freela') || cat.includes('venda')) return <Briefcase size={20} />
        return <DollarSign size={20} />
    }

    // Despesas
    if (cat.includes('aliment')) return <Coffee size={20} />
    if (cat.includes('lazer')) return <ShoppingBag size={20} />
    if (cat.includes('transporte') || cat.includes('uber')) return <Car size={20} />
    if (cat.includes('casa') || cat.includes('contas')) return <Home size={20} />
    if (cat.includes('saúde') || cat.includes('saude')) return <HeartPulse size={20} />
    if (cat.includes('educa') || cat.includes('curso')) return <GraduationCap size={20} />

    return <MoreHorizontal size={20} />
}

const getColor = (categoria: string, tipo: string) => {
    if (tipo === 'receita') return 'bg-emerald-500/20 text-emerald-400'

    const cat = categoria?.toLowerCase() || ''
    if (cat.includes('aliment')) return 'bg-orange-500/20 text-orange-400'
    if (cat.includes('lazer')) return 'bg-pink-500/20 text-pink-400'
    if (cat.includes('transporte')) return 'bg-blue-500/20 text-blue-400'
    if (cat.includes('casa')) return 'bg-purple-500/20 text-purple-400'
    if (cat.includes('educa') || cat.includes('curso')) return 'bg-indigo-500/20 text-indigo-400'

    return 'bg-slate-700/50 text-slate-400'
}


const formatDateGroup = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Resetando horas para comparar apenas datas
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const y = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (d.getTime() === t.getTime()) return 'Hoje'
    if (d.getTime() === y.getTime()) return 'Ontem'

    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default function TransactionFeed({ transactions }: { transactions: any[] }) {
    // Agrupamento por Data
    const groups = transactions.reduce((acc: any, t) => {
        const dateKey = t.data.split('T')[0]
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(t)
        return acc
    }, {})

    // Ordenar chaves (datas mais recentes primeiro)
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    return (
        <div className="col-span-1 rounded-[2rem] border border-white/5 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Extrato Inteligente</h3>
                <Link href="/dashboard/transactions" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">Ver todas</Link>
            </div>

            <div className="space-y-8">
                {(!transactions || transactions.length === 0) && (
                    <div className="py-8 text-center text-slate-500">
                        <p>Nenhuma transação ainda.</p>
                    </div>
                )}

                {sortedDates.slice(0, 5).map((dateKey) => (
                    <div key={dateKey}>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
                            {formatDateGroup(dateKey)}
                        </h4>

                        <div className="space-y-3">
                            {groups[dateKey].map((t: any, i: number) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative flex items-center justify-between rounded-xl bg-white/5 p-3 px-4 transition-all hover:bg-white/10 hover:shadow-lg hover:ring-1 hover:ring-indigo-500/30"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon Box */}
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 shadow-inner ${getColor(t.categoria, t.tipo)}`}>
                                            {getIcon(t.categoria, t.tipo)}
                                        </div>

                                        <div>
                                            <p className="font-bold text-slate-200">{t.descricao || 'Sem descrição'}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 capitalize">{t.categoria}</span>

                                                {/* Mock de Badges Inteligentes (Lógica futura veria se é recorrente) */}
                                                {((t.descricao || '').toLowerCase().includes('netflix') || (t.descricao || '').toLowerCase().includes('spotify')) && (
                                                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">ASSINATURA</span>
                                                )}
                                                {((t.descricao || '').toLowerCase().includes('parcela')) && (
                                                    <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">1/12</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className={`block font-bold text-lg ${t.tipo === 'receita' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                            {t.tipo === 'receita' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        <span className="text-[10px] text-slate-600">
                                            {new Date(t.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
