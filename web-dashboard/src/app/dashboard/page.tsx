
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import WhatsAppLinker from '@/components/dashboard/WhatsAppLinker'
import WelcomeManager from '@/components/dashboard/WelcomeManager'
import { getDashboardData } from '@/services/dashboardService'
import { getDashboardRange } from '@/utils/date-filters'
import DashboardContent from '@/components/dashboard/DashboardContent'

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
            <WelcomeManager userName={user.user_metadata?.full_name || profile?.full_name || "Investidor"} />

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
                    <DashboardContent
                        profile={profile}
                        transactions={transactions}
                        prevTransactions={prevTransactions}
                    />
                )}
            </main>
        </div>
    )
}
