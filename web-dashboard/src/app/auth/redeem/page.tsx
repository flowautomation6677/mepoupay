'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function RedeemPage() {
    const router = useRouter()
    const [status, setStatus] = useState('Processando autenticação...')

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient()

            // 1. Check if we have a session (PKCE auto-handled by client lib usually)
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (session) {
                setStatus('Sessão encontrada! Redirecionando...')
                router.push('/setup') // Or check for 'next' param
                return
            }

            // 2. Handle Implicit Flow (Access Token in Hash)
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
                setStatus('Token detectado! Iniciando sessão...');
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (!error) {
                    setStatus('Sessão estabelecida! Redirecionando...');
                    router.push('/setup');
                    return;
                } else {
                    setStatus(`Erro ao estabelecer sessão: ${error.message}`);
                }
            }

            // If auto-detection works (event based)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setStatus('Autenticado com sucesso! Redirecionando...')
                    router.push('/setup')
                } else if (event === 'SIGNED_OUT') {
                    // Maybe the link was invalid
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
                            // If still no session, maybe the link was consumed or invalid
                            // But we don't want to error prematurely
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
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-xl font-bold mb-4">Finalizando Convite</h1>
                <p className="text-gray-600 animate-pulse">{status}</p>
            </div>
        </div>
    )
}
