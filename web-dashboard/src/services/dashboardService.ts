import { createClient } from '@/utils/supabase/server'
import { DashboardData, Transaction } from '@/types/dashboard'

export async function getDashboardData(userId: string, startDate: string, endDate: string, prevStartDate: string, prevEndDate: string): Promise<DashboardData> {
    const supabase = await createClient()

    // 1. Get Profile
    const { data: profile } = await supabase
        .from('perfis')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

    if (!profile) {
        return { profile: null, transactions: [], prevTransactions: [] }
    }

    // 2. Get Current Transactions
    const { data: transactions } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', profile.id)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: false })

    // 3. Get Previous Transactions
    const { data: prevTransactions } = await supabase
        .from('transacoes')
        .select('valor, tipo')
        .eq('user_id', profile.id)
        .gte('data', prevStartDate)
        .lte('data', prevEndDate)

    return {
        profile,
        transactions: (transactions as Transaction[]) || [],
        prevTransactions: (prevTransactions as Partial<Transaction>[]) || []
    }
}
