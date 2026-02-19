"use server"

import { createClient } from '@/utils/supabase/server'
import { redirect } from "next/navigation"
import AccountForm from "@/components/dashboard/AccountForm"

export default async function AccountPage() {

    // Create Supabase Server Client using project utility
    const supabase = await createClient()

    // Get Auth User
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get Profile Data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Prepare Profile Object (merge auth data if profile is bare)
    const secureProfile = {
        ...profile,
        email: user.email, // Ensure email comes from Auth
        full_name: profile?.full_name || user.user_metadata?.full_name
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-white">Minha Conta</h1>
                <p className="text-slate-400">Gerencie suas informações pessoais.</p>
            </div>

            <div className="max-w-2xl">
                <AccountForm profile={secureProfile} />
            </div>
        </div>
    )
}
