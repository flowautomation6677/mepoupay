'use client'

import { useState } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { Transaction } from '@/types/dashboard'
import { TransactionDetailsPanel } from './TransactionDetailsPanel'
import { deleteTransaction, updateTransaction } from '@/actions/transactions'

export default function TransactionTable({ transactions }: Readonly<{ transactions: Transaction[] }>) {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [isPanelOpen, setIsPanelOpen] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleRowClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction)
        setIsPanelOpen(true)
    }

    const handleSave = async (id: string, updates: Record<string, any>) => {
        await updateTransaction(id, updates)
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await deleteTransaction(id)
        } finally {
            setDeletingId(null)
            setIsPanelOpen(false)
        }
    }
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-card-foreground">Últimas Transações</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Categoria</th>
                            <th className="px-6 py-3">Descrição</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {transactions.map((t) => (
                            <tr
                                key={t.id}
                                onClick={() => handleRowClick(t)}
                                className="group hover:bg-muted/50 transition-colors cursor-pointer relative"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-foreground">
                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                                        {t.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">{t.description || 'Sem descrição'}</td>
                                <td className="px-6 py-4 text-right">
                                    {/* Default Value Display */}
                                    <span className={`font-bold transition-opacity duration-200 group-hover:opacity-0 ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-foreground'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                                    </span>

                                    {/* Quick Actions (Hover Overlay) */}
                                    <div className="absolute inset-y-0 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                                        <div className="flex bg-background/90 p-1 rounded-md border border-border/50 shadow-sm gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(t) }}
                                                className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
                                                        handleDelete(t.id)
                                                    }
                                                }}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title="Excluir"
                                                disabled={deletingId === t.id}
                                            >
                                                {deletingId === t.id ? <Loader2 size={16} className="animate-spin text-destructive" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <TransactionDetailsPanel
                transaction={selectedTransaction}
                isOpen={isPanelOpen}
                onOpenChange={setIsPanelOpen}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    )
}
