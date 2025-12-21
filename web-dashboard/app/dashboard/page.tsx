
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ExpenseChart from '@/components/dashboard/ExpenseChart'
import TransactionFeed from '@/components/dashboard/TransactionFeed'
import WhatsAppLinker from '@/components/dashboard/WhatsAppLinker'

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile } = await supabase
        .from('perfis')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    // Filtro de Data
    const today = new Date()
    const customStart = searchParams?.startDate as string
    const customEnd = searchParams?.endDate as string

    // Cálculo do range do mês selecionado (Atual)
    let startDate: string
    let endDate: string
    let currentMonth = today.getMonth() + 1
    let currentYear = today.getFullYear()

    // Cálculo do range do mês anterior (Contexto)
    let prevStartDate: string
    let prevEndDate: string

    if (customStart && customEnd) {
        // Modo Personalizado
        startDate = new Date(customStart + 'T00:00:00').toISOString()
        endDate = new Date(customEnd + 'T23:59:59').toISOString()

        // Contexto: Período anterior com mesma duração? (Simplificação: Mês anterior ao start)
        const startD = new Date(startDate)
        prevStartDate = new Date(startD.getFullYear(), startD.getMonth() - 1, 1).toISOString()
        prevEndDate = new Date(startD.getFullYear(), startD.getMonth(), 0, 23, 59, 59).toISOString()

    } else {
        // Modo Mensal (Padrão)
        const year = searchParams?.year ? parseInt(searchParams.year as string) : currentYear
        const month = searchParams?.month ? parseInt(searchParams.month as string) : currentMonth

        currentMonth = month
        currentYear = year

        startDate = new Date(year, month - 1, 1).toISOString()
        endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

        // Mês Anterior
        prevStartDate = new Date(year, month - 2, 1).toISOString()
        prevEndDate = new Date(year, month - 1, 0, 23, 59, 59).toISOString()
    }

    let transactions: any[] = []
    let prevTransactions: any[] = []

    if (profile) {
        // Busca transações Atuais
        const valOutput = await supabase
            .from('transacoes')
            .select('*')
            .eq('user_id', profile.id)
            .gte('data', startDate)
            .lte('data', endDate)
            .order('data', { ascending: false })

        if (valOutput.data) transactions = valOutput.data

        // Busca transações Anteriores (Para comparação)
        const prevOutput = await supabase
            .from('transacoes')
            .select('valor, tipo')
            .eq('user_id', profile.id)
            .gte('data', prevStartDate)
            .lte('data', prevEndDate)

        if (prevOutput.data) prevTransactions = prevOutput.data
    }

    return (
        <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200">
            <div className="mx-auto max-w-7xl p-4 md:p-8">

                {/* Header Inteligente com Filtro */}
                {/* Header Inteligente com Filtro */}
                <DashboardHeader
                    userEmail={user.email}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    customStart={customStart}
                    customEnd={customEnd}
                />

                <main className="space-y-8">
                    {!profile ? (
                        // Estado: Sem Vínculo (Mostra apenas o linker)
                        <div className="mx-auto max-w-lg mt-20">
                            <WhatsAppLinker />
                        </div>
                    ) : (
                        <>
                            {/* Bento Grid Principal (Zone 1: KPIs) */}
                            <StatsGrid
                                transactions={transactions}
                                prevTransactions={prevTransactions}
                                financialGoal={profile.financial_goal || 0}
                            />

                            {/* Gráficos Neon */}
                            <ExpenseChart transactions={transactions} />

                            {/* Feed e Widget Lateral (GridLayout) */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="md:col-span-2">
                                    <TransactionFeed transactions={transactions} />
                                </div>

                                <div className="md:col-span-1 space-y-6">
                                    {/* Card de Conexão */}
                                    <div className="rounded-[2rem] bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-600/20">
                                        <h3 className="text-lg font-bold">Porquim IA</h3>
                                        <p className="mt-2 text-indigo-100 text-sm opacity-90">
                                            Seu assistente está conectado e monitorando seus gastos pelo número:
                                        </p>
                                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                                            <span className="font-mono text-sm tracking-wide">
                                                {profile.whatsapp_number.replace('@c.us', '')}
                                            </span>
                                        </div>
                                        <button className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50">
                                            Abrir no WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
