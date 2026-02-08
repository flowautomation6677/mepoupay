

import { createClient } from '@supabase/supabase-js'
import 'server-only'
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


export async function GET() {
    try {
        console.log("🔍 API Debug: Start fetching users");
        console.log("🔑 Service Key Length:", process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : "UNDEFINED");

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in process.env");
        }
        const { data: { users }, error: authError } = await getSupabaseAdmin().auth.admin.listUsers();
        if (authError) throw authError;

        // 2. Fetch all Profiles (WhatsApp, Goal, Role)
        const { data: profiles, error: profileError } = await getSupabaseAdmin()
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

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error fetching users:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

import { z } from 'zod'

// Validation Schemas
const updateRoleSchema = z.object({
    userId: z.string().uuid(),
    isAdmin: z.boolean()
})

const deleteUserSchema = z.object({
    userId: z.string().uuid()
})

export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        // Zod Validation
        const validation = updateRoleSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid Input', details: validation.error.format() }, { status: 400 });
        }

        const { userId, isAdmin } = validation.data;

        // Update Profile
        const { error } = await getSupabaseAdmin()
            .from('perfis')
            .update({ is_admin: isAdmin })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error updating role:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rawUserId = searchParams.get('userId');

        // Zod Validation
        const validation = deleteUserSchema.safeParse({ userId: rawUserId });
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid Input', details: validation.error.format() }, { status: 400 });
        }

        const { userId } = validation.data;

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ Erro CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não definida.");
            return NextResponse.json({ error: 'Configuração de Servidor incompleta (Sem Key de Admin).' }, { status: 500 });
        }

        // 1. Delete Profile first (to avoid FK constraints if no CASCADE)
        const { error: dbError } = await getSupabaseAdmin()
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
        const { error: authError } = await getSupabaseAdmin().auth.admin.deleteUser(userId);
        if (authError) throw authError;

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error deleting user:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
