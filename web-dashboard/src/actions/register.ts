'use server'

import { createClient } from '@supabase/supabase-js'

// We need a Service Role client to create users directly without email confirmation
// and to read the invites table securely.
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Key is not configured');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};

export async function completeRegistration(token: string, password: string, name: string, whatsapp: string, initialBalance: number) {
    const supabaseAdmin = getSupabaseAdmin();

    try {
        // 1. Validate Invite
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('supa_invites')
            .select('*')
            .eq('token', token)
            .single();

        if (inviteError || !invite) {
            return { error: 'Convite inválido ou não encontrado.' };
        }

        if (invite.status !== 'pending') {
            return { error: 'Este convite já foi aceito ou expirou.' };
        }

        const expiresAt = new Date(invite.expires_at);
        if (expiresAt < new Date()) {
            return { error: 'O prazo deste convite expirou.' };
        }

        // 2. Create User in Supabase Auth
        // We save whatsapp in user_metadata for easy access, and in phone if we want standardized SMS (requires provider)
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: invite.email,
            password: password,
            email_confirm: true,
            phone: whatsapp, // Assumes masked string is compatible or sanitized? standard is E.164 usually.
            // Let's keep it in metadata to be safe and avoid "invalid phone" errors from Supabase Auth strict validation
            user_metadata: {
                full_name: name,
                whatsapp: whatsapp // Save formatted or raw
            }
        });

        if (authError) {
            console.error("Auth Create Error:", authError);
            return { error: `Erro ao criar usuário: ${authError.message}` };
        }

        if (!authUser.user) {
            return { error: 'Erro inesperado ao criar usuário.' };
        }

        // 3. Create Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authUser.user.id,
                email: invite.email,
                full_name: name,
            });

        if (profileError) {
            console.error("Profile Create Error:", profileError);
            return { success: true, warning: "Usuário criado, mas houve um erro ao configurar o perfil inicial." };
        }

        // 4. Create Initial Account (Carteira Principal)
        const { error: accountError } = await supabaseAdmin
            .from('accounts')
            .insert({
                user_id: authUser.user.id,
                name: 'Carteira Principal',
                type: 'CASH', // or CHECKING
                initial_balance: initialBalance,
                is_active: true
            });

        if (accountError) {
            console.error("Account Create Error:", accountError);
            // Non-fatal, but good to know
        }

        // 5. Mark Invite as Accepted
        await supabaseAdmin
            .from('supa_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id);

        return { success: true };

    } catch (err: any) {
        console.error("Complete Registration Error:", err);
        return { error: err.message || 'Erro interno no servidor.' };
    }
}
