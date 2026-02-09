import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import TransactionFeed from '@/components/dashboard/TransactionFeed'
import { Transaction } from '@/types/dashboard'

export default async function TransactionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

    if (!profile) return redirect('/dashboard')

    const { data: rawTransactions } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(100)

    // Map to Transaction type
    const transactions: Transaction[] = (rawTransactions || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        amount: t.amount,
        type: t.type,
        description: t.description || '',
        category: t.categories?.name || 'Uncategorized',
        date: t.date,
        created_at: t.created_at,
        is_validated: true,
        metadata: t.metadata
    }))

    return (
        <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/dashboard" className="rounded-full bg-white/5 p-2 transition hover:bg-white/10">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold">Todas as Transações</h1>
                </div>

                <TransactionFeed transactions={transactions} />
            </div>
        </div>
    )
}
