
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    try {
        // 1. Fetch all Auth Users (Email, Metadata)
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // 2. Fetch all Profiles (WhatsApp, Goal, Role)
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('perfis')
            .select('*');
        if (profileError) throw profileError;

        // 3. Merge Data
        const mergedUsers = users.map(authUser => {
            const profile = profiles.find(p => p.id === authUser.id) || {};
            return {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Sem Nome',
                whatsapp_number: profile.whatsapp_number || '',
                financial_goal: profile.financial_goal || '',
                is_admin: !!profile.is_admin,
                created_at: authUser.created_at, // Use Auth creation date as master
                last_sign_in: authUser.last_sign_in_at
            };
        });

        return NextResponse.json({ users: mergedUsers });

    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { userId, isAdmin } = body;

        if (!userId) return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });

        // Update Profile
        const { error } = await supabaseAdmin
            .from('perfis')
            .update({ is_admin: isAdmin })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error updating role:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ Erro CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não definida.");
            return NextResponse.json({ error: 'Configuração de Servidor incompleta (Sem Key de Admin).' }, { status: 500 });
        }

        // 1. Delete Profile first (to avoid FK constraints if no CASCADE)
        const { error: dbError } = await supabaseAdmin
            .from('perfis')
            .delete()
            .eq('id', userId);

        if (dbError) {
            console.warn("Profile delete warning:", dbError);
            // If profile delete fails (e.g. other dependencies), we might want to stop or proceed?
            // Usually best to throw if we want strict consistency, but let's try to proceed to auth delete
            // unless it's a constraint error.
        }

        // 2. Delete from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
