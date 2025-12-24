import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import TransactionFeed from '@/components/dashboard/TransactionFeed'

export default async function TransactionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: profile } = await supabase
        .from('perfis')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

    if (!profile) return redirect('/dashboard')

    const { data: transactions } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', profile.id)
        .order('data', { ascending: false })
        .limit(100)

    return (
        <div className="min-h-screen bg-[#0f172a] p-8 text-slate-200">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/dashboard" className="rounded-full bg-white/5 p-2 transition hover:bg-white/10">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold">Todas as Transações</h1>
                </div>

                <TransactionFeed transactions={transactions || []} />
            </div>
        </div>
    )
}
