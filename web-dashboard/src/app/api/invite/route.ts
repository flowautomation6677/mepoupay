
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendInviteEmail } from '@/lib/email'
import { getBaseUrl } from '@/utils/url'

// Lazy-init Admin Client to avoid build-time errors when env vars are unavailable
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Key is not configured');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};


export async function POST(request: Request) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada no servidor (Local ou Railway).");
            return NextResponse.json({ error: 'Configuração de API incompleta (Service Key Missing).' }, { status: 500 });
        }

        const { email, name, whatsapp } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const siteUrl = getBaseUrl();

        // 1. Invite User via Supabase (Uses Supabase's SMTP)
        const { data, error } = await getSupabaseAdmin().auth.admin.inviteUserByEmail(email, {
            redirectTo: `${siteUrl}/auth/finish?next=/setup`,
            data: { full_name: name }
        });

        if (error) {
            console.error('Error sending invite:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // 2. Profile Pre-provisioning
        // Insert/Update profile with Name and Phone immediately
        if (data.user) {
            const updates: any = {
                updated_at: new Date().toISOString()
            };

            // Handle Whatsapp Array
            if (whatsapp) {
                // Determine if we should append or set. For new invite, we set.
                // Since this is a pre-provision, we can set the array.
                updates.whatsapp_numbers = [whatsapp];
            }

            const { error: profileError } = await getSupabaseAdmin()
                .from('profiles') // Updated table
                .upsert({
                    id: data.user.id,
                    email: email, // profiles.email is unique
                    ...updates
                }, { onConflict: 'id' });

            if (profileError) {
                console.warn("⚠️ User invited but profile update failed:", profileError);
            }
        }

        return NextResponse.json({ success: true, user: data.user })

    } catch (err) {
        console.error('Invite API Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
