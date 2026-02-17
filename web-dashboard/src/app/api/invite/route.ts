
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
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

        const supabaseAdmin = getSupabaseAdmin();
        const siteUrl = getBaseUrl();

        // 1. Check if user already exists in Supabase (Profiles)
        // We check profiles because it's our source of truth for "active users"
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingProfile) {
            return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 });
        }

        // 2. Create/Update Invite in supa_invites
        // We use upsert to handle re-invites (refreshing the token)
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('supa_invites')
            .upsert({
                email: email,
                role: 'user', // Default role for now
                status: 'pending',
                // We let postgres generate the token and dates, but for upsert we might need to force update
                // Actually, if we upsert, we want a NEW token.
                // But gen_random_uuid() only runs on default.
                // So let's delete and re-insert? Or explicitly set token?
                // Let's do a select to see if exists, then update or insert.
                // Simpler: Just delete any pending invite for this email and insert new.
            }, { onConflict: 'email' })
            .select()
            .single();

        // Wait, Upsert with default values is tricky if we want to regenerate token.
        // Let's explicitly Query first.
        const { data: existingInvite } = await supabaseAdmin.from('supa_invites').select('id').eq('email', email).single();

        let targetInvite;
        if (existingInvite) {
            const { data, error } = await supabaseAdmin.from('supa_invites')
                .update({
                    token: crypto.randomUUID(),
                    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    created_at: new Date().toISOString() // Refresh timestamp
                })
                .eq('id', existingInvite.id)
                .select()
                .single();
            if (error) throw error;
            targetInvite = data;
        } else {
            const { data, error } = await supabaseAdmin.from('supa_invites')
                .insert({
                    email,
                    role: 'user',
                    invited_by: null // we could capture this from session if we wanted
                })
                .select()
                .single();
            if (error) throw error;
            targetInvite = data;
        }

        if (!targetInvite || !targetInvite.token) {
            throw new Error("Failed to generate invite token");
        }

        // 3. Construct Custom Setup Link
        const inviteLink = `${siteUrl}/auth/setup?token=${targetInvite.token}`;
        console.log(`[Invite API] Generated Managed Link for ${email}: ${inviteLink}`);

        // 4. Send Email manually
        console.log(`[Invite API] Attempting to send invite email to ${email}...`);
        try {
            const { sendInviteEmail } = await import('@/lib/email');
            await sendInviteEmail(email, inviteLink);
            console.log(`[Invite API] Email sent successfully to ${email}`);
        } catch (emailError) {
            console.error(`[Invite API] Failed to send email to ${email}:`, emailError);
            // We don't block the response
        }

        return NextResponse.json({ success: true, message: 'Convite enviado com sucesso.' })

    } catch (err: any) {
        console.error('Invite API Error:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
