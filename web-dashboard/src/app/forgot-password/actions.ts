'use server';

import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/email';

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'E-mail é obrigatório.' };
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        // Generate Link manually and send via our internal mailer (Resend or Mock)
        // Note: We use /auth/finish (Client Side) for robustness against Hash (#) vs Query (?) params.
        const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/finish?next=/update-password`
            }
        });

        if (linkError) {
            console.error('Link Generation Error:', linkError);
            // Return success to UI for security/UX to prevent enumeration
            return { success: true };
        }

        if (data && data.properties && data.properties.action_link) {
            await sendPasswordResetEmail(email, data.properties.action_link);
        }

        return { success: true };

    } catch (err) {
        console.error('Unexpected error:', err);
        return { error: 'Ocorreu um erro inesperado.' };
    }
}
