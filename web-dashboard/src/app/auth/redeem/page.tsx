'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function RedeemPage() {
    const router = useRouter()
    const [status, setStatus] = useState('Processando autenticação...')
    const [debugInfo, setDebugInfo] = useState<string>('');

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient()

            // 1. Check if we have a session (PKCE auto-handled by client lib usually)
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (session) {
                setStatus('Sessão encontrada! Redirecionando...')
                window.location.href = '/setup'; // Force hard redirect
                return
            }

            // 2. Handle Implicit Flow (Access Token in Hash)
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            setDebugInfo(`Hash Length: ${hash.length} | AccessToken: ${accessToken ? 'Yes' : 'No'} | RefreshToken: ${refreshToken ? 'Yes' : 'No'}`);

            if (accessToken && refreshToken) {
                setStatus('Token detectado! Iniciando sessão...');
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (!error) {
                    setStatus('Sessão estabelecida! Redirecionando...');
                    window.location.href = '/setup'; // Force hard redirect
                    return;
                } else {
                    setStatus(`Erro ao estabelecer sessão: ${error.message}`);
                    setDebugInfo(prev => prev + ` | Session Error: ${error.message}`);
                }
            } else if (accessToken && !refreshToken) {
                setStatus('Apenas Access Token detectado (sem Refresh). Tentando getUser...');
                // Try to get user with just access token?
                const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
                if (user) {
                    setStatus('Usuário validado! Redirecionando (sessão temporária)...');
                    // We can't set session easily without refresh token, but maybe we can proceed?
                    // Actually, Supabase setSession usually requires refresh token for auto-refresh.
                    // But let's try setting it anyway
                    const { error: setSessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: accessToken // Hack? No, this will fail refresh.
                    } as any);

                    if (!setSessionError) {
                        window.location.href = '/setup';
                    } else {
                        setStatus(`Erro ao definir sessão parcial: ${setSessionError.message}`);
                    }
                } else {
                    setStatus(`Token inválido: ${userError?.message}`);
                }
            }

            // If auto-detection works (event based)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setStatus('Autenticado com sucesso! Redirecionando...')
                    window.location.href = '/setup';
                } else if (event === 'SIGNED_OUT') {
                    // Check for error in URL only if we are truly stuck
                    const params = new URLSearchParams(window.location.hash.substring(1)); // Remove #
                    const error = params.get('error_description')
                    if (error) {
                        setStatus(`Erro: ${error}`)
                    }
                }
            })

            // 3. Fallback: Check standard URL params for errors
            const queryParams = new URLSearchParams(window.location.search)
            const error = queryParams.get('error_description')
            if (error) {
                setStatus(`Erro: ${error}`)
                return
            }

            // If we are still here after a moment, and no session, maybe prompt or wait
            setTimeout(() => {
                if (!session && !accessToken) {
                    // Sometimes the hash parsing takes a split second
                    supabase.auth.getSession().then(({ data }) => {
                        if (!data.session) {
                            // If still no session, check logs
                        }
                    })
                }
            }, 2000)

            return () => {
                subscription.unsubscribe()
            }
        }

        handleAuth()
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg w-full">
                <h1 className="text-xl font-bold mb-4">Finalizando Convite</h1>
                <p className="text-gray-600 animate-pulse mb-4">{status}</p>

                <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto max-h-32 border border-gray-200">
                    <strong>Debug Info:</strong><br />
                    {debugInfo || 'Nenhuma informação de debug ainda...'}
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )
}
