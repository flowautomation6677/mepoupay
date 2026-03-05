'use server'

import { createClient } from '@supabase/supabase-js'

/**
 * Normalizes a Brazilian phone number to the canonical format:
 * 55 (country) + 2-digit DDD + 9 (9th digit) + 8 digits = 13 digits total.
 * e.g. "61996761655" → "5561996761655"
 *      "6196761655"  → "5561996761655"  (adds the 9)
 *      "5561996761655" → "5561996761655" (already canonical)
 */
function normalizeBrazilianPhone(raw: string): string {
    const digits = raw.replaceAll(/\D/g, '');

    // Remove country code if present to work with local number
    const local = digits.startsWith('55') ? digits.slice(2) : digits;

    // local should be: DDD (2) + optional 9 + 8 digits = 10 or 11 digits
    if (local.length === 10) {
        // Missing the 9th digit — add it after DDD
        const withNinth = local.slice(0, 2) + '9' + local.slice(2);
        return `55${withNinth}`;
    }

    if (local.length === 11) {
        // Already has 9th digit
        return `55${local}`;
    }

    // Unknown format — return as-is with country code
    return digits.startsWith('55') ? digits : `55${digits}`;
}

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

        // Normalize to canonical BR format: 55 + DDD (2) + 9 + 8 digits = 13 chars
        const formattedPhone = normalizeBrazilianPhone(whatsapp);

        // 2. Create User in Supabase Auth
        // We save whatsapp in user_metadata for easy access, and in phone if we want standardized SMS (requires provider)
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: invite.email,
            password: password,
            email_confirm: true,
            // phone: formattedPhone, // Temporarily disabled to avoid Supabase strict format errors if unexpected formats arrive
            user_metadata: {
                full_name: name,
                whatsapp: formattedPhone // Save formatted or raw
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
                whatsapp_numbers: [formattedPhone]
            });

        if (profileError) {
            console.error("Profile Create Error:", profileError);
            // Rollback: delete the auth user to avoid orphan accounts
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            return { error: `Erro ao configurar o perfil (${profileError.message}). Por favor, entre em contato com o suporte.` };
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
