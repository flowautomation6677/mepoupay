'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteTransaction(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Não autorizado')
    }

    // Obter o perfil do usuário
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (!profile) {
        throw new Error('Perfil não encontrado')
    }

    // Segurança: Garantir que a transação pertença ao usuário logado (RLS)
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', profile.id)

    if (error) {
        console.error('Erro ao excluir transação:', error)
        throw new Error('Falha ao excluir a transação. Tente novamente.')
    }

    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/reports') // Opcional se os relatórios mudarem
}

export async function updateTransaction(id: string, updates: Record<string, any>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Não autorizado')
    }

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (!profile) {
        throw new Error('Perfil não encontrado')
    }

    const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', profile.id)

    if (error) {
        console.error('Erro ao atualizar transação:', error)
        throw new Error('Falha ao atualizar a transação. Tente novamente.')
    }

    revalidatePath('/dashboard/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/reports') // Opcional se os relatórios mudarem
}
