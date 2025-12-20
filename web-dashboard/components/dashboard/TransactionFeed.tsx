
'use client'

import { motion } from 'framer-motion'
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

export default function TransactionFeed({ transactions }: { transactions: any[] }) {
    return (
        <div className="col-span-1 rounded-[2rem] border border-white/5 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Últimas Transações</h3>
                <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300">Ver todas</button>
            </div>

            <div className="space-y-4">
                {(!transactions || transactions.length === 0) && (
                    <div className="py-8 text-center text-slate-500">
                        <p>Nenhuma transação ainda.</p>
                    </div>
                )}

                {transactions.slice(0, 5).map((t, i) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group flex items-center justify-between rounded-xl bg-white/5 p-3 px-4 transition-all hover:bg-white/10 hover:shadow-lg hover:ring-1 hover:ring-indigo-500/30"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getColor(t.categoria, t.tipo)}`}>
                                {getIcon(t.categoria, t.tipo)}
                            </div>
                            <div>
                                <p className="font-medium text-slate-200">{t.descricao || 'Sem descrição'}</p>
                                <p className="text-xs text-slate-500">{new Date(t.data).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                        <span className={`font-bold ${t.tipo === 'receita' ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {t.tipo === 'receita' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
