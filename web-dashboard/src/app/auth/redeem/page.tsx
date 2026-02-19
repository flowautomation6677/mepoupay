'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export default function RedeemPage() {
    const router = useRouter()
    const [status, setStatus] = useState('Processando autenticação...')
    const [debugInfo, setDebugInfo] = useState<string>('');

    // Helpler function: Check for existing session
    const checkExistingSession = async (supabase: SupabaseClient) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            setStatus('Sessão encontrada! Redirecionando...')
            if (typeof globalThis !== 'undefined' && globalThis.window) {
                globalThis.window.location.href = '/setup';
            }
            return true;
        }
        return false;
    };

    // Helper function: Extract hash params
    const getHashParams = () => {
        if (typeof globalThis === 'undefined' || !globalThis.window) return { accessToken: null, refreshToken: null, hashLength: 0 };

        const hash = globalThis.window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        return {
            accessToken: params.get('access_token'),
            refreshToken: params.get('refresh_token'),
            hashLength: hash.length
        };
    };

    // Helper function: Handle full session with refresh token
    const handleFullSession = async (supabase: SupabaseClient, accessToken: string, refreshToken: string) => {
        setStatus('Token detectado! Iniciando sessão...');
        const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        if (error) {
            setStatus(`Erro ao estabelecer sessão: ${error.message}`);
            setDebugInfo(prev => prev + ` | Session Error: ${error.message}`);
        } else {
            setStatus('Sessão estabelecida! Redirecionando...');
            if (typeof globalThis !== 'undefined' && globalThis.window) {
                globalThis.window.location.href = '/setup';
            }
        }
    };

    // Helper function: Handle partial session (access token only)
    const handlePartialSession = async (supabase: SupabaseClient, accessToken: string) => {
        setStatus('Apenas Access Token detectado (sem Refresh). Tentando getUser...');
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

        if (user) {
            setStatus('Usuário validado! Redirecionando (sessão temporária)...');
            const { error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: accessToken // Hack for partial session
            } as any);

            if (setSessionError) {
                setStatus(`Erro ao definir sessão parcial: ${setSessionError.message}`);
            } else if (typeof globalThis !== 'undefined' && globalThis.window) {
                globalThis.window.location.href = '/setup';
            }
        } else {
            setStatus(`Token inválido: ${userError?.message}`);
        }
    };

    // Helper function: Check URL search params for errors
    const checkUrlErrors = () => {
        if (typeof globalThis !== 'undefined' && globalThis.window) {
            const queryParams = new URLSearchParams(globalThis.window.location.search)
            const error = queryParams.get('error_description')
            if (error) {
                setStatus(`Erro: ${error}`)
            }
        }
    };

    useEffect(() => {
        const supabase = createClient()

        const handleAuth = async () => {
            if (await checkExistingSession(supabase)) return;

            const { accessToken, refreshToken, hashLength } = getHashParams();
            setDebugInfo(`Hash Length: ${hashLength} | AccessToken: ${accessToken ? 'Yes' : 'No'} | RefreshToken: ${refreshToken ? 'Yes' : 'No'}`);

            if (accessToken && refreshToken) {
                await handleFullSession(supabase, accessToken, refreshToken);
                return;
            }

            if (accessToken && !refreshToken) {
                await handlePartialSession(supabase, accessToken);
                return;
            }

            checkUrlErrors();
        }

        handleAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setStatus('Autenticado com sucesso! Redirecionando...')
                if (typeof globalThis !== 'undefined' && globalThis.window) {
                    globalThis.window.location.href = '/setup';
                }
            } else if (event === 'SIGNED_OUT') {
                if (typeof globalThis !== 'undefined' && globalThis.window) {
                    const params = new URLSearchParams(globalThis.window.location.hash.substring(1));
                    const error = params.get('error_description')
                    if (error) {
                        setStatus(`Erro: ${error}`)
                    }
                }
            }
        })

        return () => {
            subscription.unsubscribe()
        }
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
                    onClick={() => { if (typeof globalThis !== 'undefined' && globalThis.window) globalThis.window.location.reload() }}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    )
}
