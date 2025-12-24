
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const email = (formData.get('email') as string).trim()
    const password = (formData.get('password') as string).trim()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        let msg = error.message
        if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos.'
        if (msg.includes('Email not confirmed')) msg = 'E-mail não confirmado.'
        return { error: msg }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const email = (formData.get('email') as string).trim()
    const password = (formData.get('password') as string).trim()
    const full_name = (formData.get('name') as string)?.trim() || ''
    const whatsapp = (formData.get('whatsapp') as string)?.replace(/\D/g, '') || ''

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name,
                whatsapp_number: whatsapp, // Salvando no metadata por enquanto
            }
        }
    })

    if (error) {
        let msg = error.message
        if (msg.includes('User already registered')) msg = 'Este e-mail já está cadastrado.'
        if (msg.includes('Password should be at least')) msg = 'A senha deve ter pelo menos 6 caracteres.'
        return { error: msg }
    }

    return { success: 'Conta criada! Faça login para continuar.' }
}
