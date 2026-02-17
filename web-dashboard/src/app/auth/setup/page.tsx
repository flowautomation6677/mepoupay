'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { completeRegistration } from '@/actions/register'
import { createClient } from '@/utils/supabase/client'

export default function SetupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!token) {
            setError('Token de convite não fornecido.');
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (!token) {
            setError('Token inválido.');
            setLoading(false);
            return;
        }

        try {
            // 1. Call Server Action to create user
            const result = await completeRegistration(token, password, name);

            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            // 2. Auto-login (Optional but nice)
            // Since we just created the user with a known password, we can log them in immediately
            // using the client-side supabase.
            const supabase = createClient();
            // We need the email to login. The server action created the user.
            // But we don't have the email here unless we ask for it or return it from action.
            // Let's ask the user to login, OR return email from action.

            // For now, let's just show success and redirect to login to be safe.
            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Erro ao processar o registro.');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold text-green-600 mb-4">Conta Criada! 🎉</h1>
                    <p className="text-gray-600">Sua conta foi configurada com sucesso.</p>
                    <p className="text-gray-500 text-sm mt-2">Redirecionando para o login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                <h1 className="text-xl font-bold mb-6">Configurar sua Conta</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Crie uma Senha</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                    >
                        {loading ? 'Criando conta...' : 'Finalizar Cadastro'}
                    </button>
                </form>

                <div className="mt-4 text-xs text-gray-400">
                    O acesso será liberado assim que você definir sua senha.
                </div>
            </div>
        </div>
    )
}
