
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Calendar, TrendingUp } from 'lucide-react'

// Simple Card replacement since we didn't install Shadcn components via CLI
function SimpleCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium tracking-tight text-gray-500">{title}</h3>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
}

export default function SummaryCards({ transactions }: { transactions: any[] }) {
    if (!transactions) return null

    const today = new Date().toISOString().slice(0, 10)
    const currentMonth = new Date().getMonth()

    const totalMonth = transactions
        .filter(t => new Date(t.data).getMonth() === currentMonth)
        .reduce((acc, t) => acc + t.valor, 0)

    const totalDay = transactions
        .filter(t => t.data.startsWith(today))
        .reduce((acc, t) => acc + t.valor, 0)

    // Total Geral
    const totalAll = transactions.reduce((acc, t) => acc + t.valor, 0)

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <SimpleCard
                title="Gasto Hoje"
                value={totalDay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                icon={Calendar}
                color="text-blue-500"
            />
            <SimpleCard
                title="Gasto Mensal"
                value={totalMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                icon={DollarSign}
                color="text-green-500"
            />
            <SimpleCard
                title="Total Acumulado"
                value={totalAll.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                icon={TrendingUp}
                color="text-purple-500"
            />
        </div>
    )
}
