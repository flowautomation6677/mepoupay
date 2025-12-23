
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin (Service Role)
// We need this to bypass RLS and use adminAuth functions
// Initialize Supabase Admin (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);


export async function POST(request: Request) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada no servidor (Local ou Railway).");
            return NextResponse.json({ error: 'Configuração de API incompleta (Service Key Missing).' }, { status: 500 });
        }

        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Invite User via Supabase Auth
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

        if (error) {
            console.error('Error inviting user:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Optional: Create a profile entry immediately if you want, 
        // but usually the user creation trigger handles this or we wait for them to login.
        // For now, let's just return success.

        return NextResponse.json({ success: true, user: data.user })

    } catch (err: any) {
        console.error('Invite API Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
