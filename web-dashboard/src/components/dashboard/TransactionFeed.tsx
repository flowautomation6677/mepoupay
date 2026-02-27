'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Coffee, ShoppingBag, Car, Home, HeartPulse, MoreHorizontal, GraduationCap, TrendingUp, DollarSign, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react'

// Mapeamento de ícones por categoria simples
const getIcon = (category: string, type: string) => {
    const cat = category?.toLowerCase() || ''

    // Receitas
    if (type === 'INCOME') {
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

const getColor = (category: string, type: string) => {
    if (type === 'INCOME') return 'bg-emerald-500/20 text-emerald-400'

    const cat = category?.toLowerCase() || ''
    if (cat.includes('aliment')) return 'bg-orange-500/20 text-orange-400'
    if (cat.includes('lazer')) return 'bg-pink-500/20 text-pink-400'
    if (cat.includes('transporte')) return 'bg-blue-500/20 text-blue-400'
    if (cat.includes('casa')) return 'bg-purple-500/20 text-purple-400'
    if (cat.includes('educa') || cat.includes('curso')) return 'bg-indigo-500/20 text-indigo-500'

    return 'bg-muted text-muted-foreground'
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

import { Transaction } from '@/types/dashboard'

export default function TransactionFeed({ transactions }: { transactions: Transaction[] }) {
    const router = useRouter()

    const handleApprove = async (id: string) => {
        try {
            await fetch(`/api/transactions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_validated: true }),
            })
            router.refresh()
        } catch (error) {
            console.error(error)
        }
    }

    // Agrupamento por Data
    const groups = transactions.reduce((acc: Record<string, Transaction[]>, t) => {
        const dateKey = t.date.split('T')[0]
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(t)
        return acc
    }, {})

    // Ordenar chaves (datas mais recentes primeiro)
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    return (
        <div className="col-span-1 rounded-[2rem] border border-border bg-card/50 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-card-foreground">Extrato Inteligente</h3>
                <Link href="/dashboard/transactions" className="text-xs font-medium text-primary hover:text-primary/80">Ver todas</Link>
            </div>

            <div className="space-y-8">
                {(!transactions || transactions.length === 0) && (
                    <div className="py-8 text-center text-muted-foreground">
                        <p>Nenhuma transação ainda.</p>
                    </div>
                )}

                {sortedDates.slice(0, 5).map((dateKey) => (
                    <div key={dateKey}>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
                            {formatDateGroup(dateKey)}
                        </h4>

                        <div className="space-y-3">
                            {groups[dateKey].map((t: Transaction, i: number) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative flex items-center justify-between rounded-xl bg-secondary/50 p-3 px-4 transition-all hover:bg-secondary hover:shadow-lg hover:ring-1 hover:ring-primary/30"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon Box */}
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-border shadow-inner ${getColor(t.category, t.type)}`}>
                                            {getIcon(t.category, t.type)}
                                        </div>

                                        <div>
                                            <p className="font-bold text-foreground">{t.description || 'Sem descrição'}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground capitalize">{t.category}</span>

                                                {/* Reliability Badges */}
                                                {!t.is_validated && (t.confidence_score || 0) < 0.8 && (
                                                    <span className="flex items-center gap-1 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500 border border-yellow-500/30">
                                                        <AlertTriangle size={10} /> REVISAR
                                                    </span>
                                                )}

                                                {!t.is_validated && (t.confidence_score || 0) >= 0.8 && (
                                                    <button
                                                        onClick={() => handleApprove(t.id)}
                                                        className="group-hover:opacity-100 opacity-0 transition-opacity flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20"
                                                    >
                                                        APROVAR
                                                    </button>
                                                )}

                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        <span className={`block font-bold text-lg ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-foreground'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {t.is_validated && (
                                                <CheckCircle size={12} className="text-emerald-500/50" />
                                            )}
                                        </div>
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
