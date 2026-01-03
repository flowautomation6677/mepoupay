// import { Edit2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { Transaction } from '@/types/dashboard'

const TransactionTable = memo(function TransactionTable({ transactions }: { transactions: Transaction[] }) {
    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b">
                <h3 className="text-lg font-bold">Últimas Transações</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 uppercase text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Categoria</th>
                            <th className="px-6 py-3">Descrição</th>
                            <th className="px-6 py-3">Valor</th>
                            {/* <th className="px-6 py-3">Ações</th> */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(t.data).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                        {t.categoria}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{t.descricao}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {formatCurrency(t.valor)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
})

export default TransactionTable
