import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    // Log for debugging
    console.log(`[Auth Callback] Hit with params: ${searchParams.toString()}`);

    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    // Check for errors returned directly from Supabase (e.g., link expired, invalid token)
    const errorParam = searchParams.get('error')
    const errorDescParam = searchParams.get('error_description')

    if (errorParam) {
        console.error(`[Auth Callback] Upstream Error: ${errorParam} - ${errorDescParam}`);
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${errorParam}&error_description=${encodeURIComponent(errorDescParam || 'Erro retornado pelo provedor de autenticação.')}`)
    }

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        // Handle Potential Race Condition (React Strict Mode / Double Request)
        // If the code was just consumed by a parallel request, we might already have a session.
        console.warn("Auth Code Exchange Error:", error.message)
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
            console.log("Session already exists, proceeding despite code exchange error (Double Fire detected).")
            return NextResponse.redirect(`${origin}${next}`)
        }

        // If generic error, pass it to the error page
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error.name}&error_description=${encodeURIComponent(error.message)}`)
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?error_description=Nenhum código de autenticação fornecido. Verifique se o link não foi quebrado.`)
}
