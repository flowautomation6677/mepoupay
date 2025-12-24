
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendInviteEmail } from '@/lib/email'

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

        const { email, name, whatsapp } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // 1. Generate Invite Link (Do NOT send email via Supabase)
        const { origin } = new URL(request.url);

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                redirectTo: `${origin}/auth/finish?next=/setup`,
                data: { full_name: name }
            }
        });

        if (error) {
            console.error('Error generating invite link:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // 2. Send Custom Email via Resend
        if (data && data.properties && data.properties.action_link) {
            await sendInviteEmail(email, data.properties.action_link);
        }

        // 3. Profile Pre-provisioning
        // Insert/Update profile with Name and Phone immediately
        if (data.user) {
            const updates: any = {
                updated_at: new Date().toISOString()
            };
            // Name is stored in metadata now
            if (whatsapp) updates.whatsapp_number = whatsapp;

            const { error: profileError } = await supabaseAdmin
                .from('perfis')
                .upsert({
                    id: data.user.id,
                    auth_user_id: data.user.id,
                    email: email,
                    ...updates
                }, { onConflict: 'id' });

            if (profileError) {
                console.warn("⚠️ User invited but profile update failed:", profileError);
            }
        }

        return NextResponse.json({ success: true, user: data.user })

    } catch (err: any) {
        console.error('Invite API Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
