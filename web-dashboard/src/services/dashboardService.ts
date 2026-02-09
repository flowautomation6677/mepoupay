import { createClient } from '@/utils/supabase/server'
import { DashboardData, Transaction, UserProfile } from '@/types/dashboard'

export async function getDashboardData(userId: string, startDate: string, endDate: string, prevStartDate: string, prevEndDate: string): Promise<DashboardData> {
    const supabase = await createClient()

    // 1. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId) // profiles.id is now the auth_user_id
        .single()

    if (!profile) {
        return { profile: null, transactions: [], prevTransactions: [] }
    }

    // 2. Busca paralela de transações (Performance: Promise.all)
    const [currRes, prevRes] = await Promise.all([
        supabase.from('transactions')
            .select('*, categories(name)')
            .eq('user_id', profile.id)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false }),

        supabase.from('transactions')
            .select('amount, type')
            .eq('user_id', profile.id)
            .gte('date', prevStartDate)
            .lte('date', prevEndDate)
    ])

    // Map DB results to Frontend Types
    const transactions: Transaction[] = (currRes.data || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        amount: t.amount,
        type: t.type,
        description: t.description || '',
        category: t.categories?.name || 'Uncategorized',
        date: t.date,
        created_at: t.created_at,
        is_validated: true, // New schema implies validated
        confidence_score: 1.0,
        metadata: t.metadata
    }))

    const prevTransactions: Partial<Transaction>[] = (prevRes.data || []).map((t: any) => ({
        amount: t.amount,
        type: t.type
    }))

    return {
        profile: profile as UserProfile, // Ensure types match
        transactions,
        prevTransactions
    }
}
