import { formatCurrency } from '@/utils/formatters'
import { Transaction } from '@/types/dashboard'

export default function TransactionTable({ transactions }: { transactions: Transaction[] }) {
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
                            <th className="px-6 py-3">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-foreground">
                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                                        {t.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">{t.description || 'Sem descrição'}</td>
                                <td className="px-6 py-4 font-medium text-foreground">
                                    {formatCurrency(t.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
