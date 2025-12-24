
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params
    const supabase = await createClient()

    // Get body
    const body = await request.json()

    // Validate Session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update
    // We only allow updating confidence/validation related fields for now for safety, or descriptions
    const { is_validated, is_human_corrected, descricao, valor, categoria } = body

    // Prepare update object dynamically
    const updates: any = {}
    if (is_validated !== undefined) updates.is_validated = is_validated
    if (is_human_corrected !== undefined) updates.is_human_corrected = is_human_corrected
    if (descricao !== undefined) updates.descricao = descricao
    if (valor !== undefined) updates.valor = valor
    if (categoria !== undefined) updates.categoria = categoria

    // Let's rely on RLS if configured properly, but usually manual check is safer in ad-hoc routes.
    // Check profile first.
    const { data: profile } = await supabase.from('perfis').select('id').eq('auth_user_id', user.id).single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { data, error: updateError } = await supabase
        .from('transacoes')
        .update({ is_validated })
        .eq('id', id)
        .eq('user_id', profile.id)
        .select()

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
