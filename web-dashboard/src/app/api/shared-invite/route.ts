import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Checking if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { maxUses, expiresInDays } = body;

    let expiresAt = null;
    if (expiresInDays && !isNaN(expiresInDays)) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(expiresInDays));
      expiresAt = date.toISOString();
    }

    const limit = maxUses ? parseInt(maxUses) : null;

    const { data: linkRecord, error: insertError } = await supabase
      .from('shared_invite_links')
      .insert({
        created_by: user.id,
        role: 'user',
        max_uses: limit,
        expires_at: expiresAt,
        is_active: true
      })
      .select('token')
      .single();

    if (insertError) {
      console.error('Error creating shared link:', insertError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const { token } = linkRecord;
    const baseUrl = req.nextUrl.origin;
    const inviteLink = `${baseUrl}/auth/join?token=${token}`;

    return NextResponse.json({ link: inviteLink }, { status: 200 });

  } catch (error) {
    console.error('API /shared-invite Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
