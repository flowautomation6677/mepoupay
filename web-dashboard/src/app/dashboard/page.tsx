
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ExpenseChart from '@/components/dashboard/ExpenseChart'
import TransactionFeed from '@/components/dashboard/TransactionFeed'
import WhatsAppLinker from '@/components/dashboard/WhatsAppLinker'
import WelcomeManager from '@/components/dashboard/WelcomeManager'
import { getDashboardData } from '@/services/dashboardService'
import { getDashboardRange } from '@/utils/date-filters'

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Await params FIRST (Next.js 15 Requirement)
    const params = await searchParams

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Filtro de Data
    const customStart = params?.startDate as string
    const customEnd = params?.endDate as string

    const { startDate, endDate, prevStartDate, prevEndDate, currentMonth, currentYear } = getDashboardRange({
        startDate: customStart,
        endDate: customEnd,
        month: params?.month as string,
        year: params?.year as string
    })

    const { profile, transactions, prevTransactions } = await getDashboardData(
        user.id,
        startDate,
        endDate,
        prevStartDate,
        prevEndDate
    )

    return (

        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Logic */}
            <WelcomeManager userName={user.user_metadata?.full_name || profile?.name || "Investidor"} />

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
                                    <h3 className="text-lg font-bold">Me Poupey AI</h3>
                                    <p className="mt-2 text-indigo-100 text-sm opacity-90">
                                        Seu assistente está conectado e monitorando seus gastos pelo número:
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                                        <span className="font-mono text-sm tracking-wide">
                                            {formatPhoneNumber(profile.whatsapp_number)}
                                        </span>
                                    </div>
                                    <a
                                        href="https://wa.me/5521984646902?text=Olá! Quero falar com o Me Poupey."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-indigo-600 transition hover:bg-indigo-50"
                                    >
                                        Abrir no WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}

function formatPhoneNumber(phone: string) {
    if (!phone) return "Sem número";
    const clean = phone.replace('@c.us', '');
    if (clean.length === 12 || clean.length === 13) {
        const ddd = clean.substring(2, 4);
        const part1 = clean.substring(4, 9);
        const part2 = clean.substring(9);
        return `+55 (${ddd}) ${part1}-${part2}`;
    }
    return clean;
}
