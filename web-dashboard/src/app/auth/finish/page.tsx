'use client';

import { Suspense, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthContent() {
    const [status, setStatus] = useState('Verificando autenticação...');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Configura o cliente Supabase lado cliente
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const handleAuth = async () => {
            // O cliente do Supabase verifica automaticamente a URL por #access_token ou ?code
            // Mas para garantir, se tiver ?code na URL, tentamos trocar manualmente
            const code = searchParams.get('code');
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error("Manual Exchange Error:", error);
                    setStatus('Link inválido ou expirado.');
                    return;
                }
            }

            // 1. Tenta pegar sessão existente
            const { data: { session: existingSession } } = await supabase.auth.getSession();

            if (existingSession) {
                setStatus('Autenticado! Redirecionando...');
                const next = searchParams.get('next') || '/dashboard';
                setTimeout(() => router.replace(next), 500);
                return;
            }

            // 2. Se não tem sessão, verifica se tem Hash na URL (Recuperação de Senha chega como Hash)
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                try {
                    // Extrai tokens manualmente do hash
                    const params = new URLSearchParams(hash.substring(1)); // remove #
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token) {
                        setStatus('Processando token de recuperação...');
                        const { data, error: setSessionError } = await supabase.auth.setSession({
                            access_token,
                            refresh_token: refresh_token || '',
                        });

                        if (!setSessionError && data.session) {
                            setStatus('Token válido! Redirecionando...');
                            const next = searchParams.get('next') || '/setup'; // Forcing setup for safety/update password
                            router.replace(next);
                            return;
                        } else if (setSessionError) {
                            console.error("Manual SetSession Error:", setSessionError);
                        }
                    }
                } catch (e) {
                    console.error("Hash parsing error:", e);
                }
            }

            // 3. Fallback: Escuta mudanças de estado (ex: se o Supabase processar sozinho depois)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || session) {
                    setStatus('Entrando...');
                    const next = searchParams.get('next') || '/dashboard';
                    router.replace(next);
                }
            });

            return () => subscription.unsubscribe();
        };

        handleAuth();
    }, [router, searchParams, supabase]);

    return (
        <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />
            <p className="text-slate-400 text-sm animate-pulse">{status}</p>
        </div>
    );
}

export default function AuthFinishPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
            <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />}>
                <AuthContent />
            </Suspense>
        </div>
    );
}
