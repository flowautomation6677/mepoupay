import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Lazy-init Admin Client to avoid build-time errors when env vars are unavailable
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Key is not configured');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};


export async function GET(request: Request) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const { searchParams, origin } = new URL(request.url);
    const email = searchParams.get('email') || `teste_${Date.now()}@exemplo.com`;

    try {
        const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                redirectTo: `${origin}/auth/callback?next=/update-password`
            }
        });

        if (error) throw error;

        return NextResponse.json({
            message: "Link gerado com sucesso! Clique abaixo para simular o fluxo de convite.",
            action_required: "Copie e cole o link no navegador ou clique se o visualizador permitir JSON.",
            generated_email: email,
            invite_link: data.properties.action_link
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
