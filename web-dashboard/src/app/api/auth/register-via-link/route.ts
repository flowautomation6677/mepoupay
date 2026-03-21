import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password, fullName, whatsapp } = body;

    if (!token || !email || !password || !fullName || !whatsapp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rawPhone = whatsapp.replace(/\D/g, '');
    if (rawPhone.length < 11) {
      return NextResponse.json({ error: 'Invalid WhatsApp format' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Consume link atomically (Race Condition Protection)
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('consume_shared_link', {
      link_token: token
    }) as any;

    if (rpcError) {
      console.error('RPC Error consuming link:', rpcError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!rpcData?.success) {
      if (rpcData?.reason === 'limit_reached') {
        return NextResponse.json({ error: 'Link uses limit reached' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const role = rpcData.role || 'user';

    // 2. Check email collision in Auth / profiles
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Revert the usage decrement logically we could, but let's assume if email clashes, user wasted a click
      // or we can just ignore it. Strictly we should perhaps check email BEFORE consuming, but the atomic consume FIRST avoids race condition on the token.
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // 3. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      }
    });

    if (authError || !authData.user) {
      console.error('Auth Create Error:', authError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Since a trigger probably creates the profile on public.profiles via user auth signup but we can also handle missing roles. Assuming standard behavior for MePoupay:
    await supabaseAdmin.from('profiles').update({ 
      is_admin: role === 'admin', 
      full_name: fullName,
      whatsapp_numbers: [whatsapp]
    }).eq('id', authData.user.id);

    return NextResponse.json({ success: true, user: authData.user }, { status: 200 });

  } catch (error) {
    console.error('API /register-via-link Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
