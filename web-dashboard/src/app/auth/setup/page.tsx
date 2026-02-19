'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { completeRegistration } from '@/actions/register'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

function SetupContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [name, setName] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [balance, setBalance] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!token) {
            setError('Token de convite não fornecido.');
        }
    }, [token])

    // Mask for WhatsApp (BR format: (11) 99999-9999)
    const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replaceAll(/\D/g, '')
        if (value.length > 11) value = value.slice(0, 11)

        if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`
        }
        if (value.length > 9) {
            value = `${value.slice(0, 9)}-${value.slice(9)}`
        }
        setWhatsapp(value)
    }

    // Mask for Currency (R$)
    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replaceAll(/\D/g, '')
        const numberValue = Number(value) / 100
        setBalance(new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numberValue))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (!token) {
            setError('Token inválido.');
            setLoading(false);
            return;
        }

        // Validate WhatsApp (11 digits required: DDD + 9 digits)
        const rawPhone = whatsapp.replaceAll(/\D/g, '')
        if (rawPhone.length < 11) {
            setError('WhatsApp inválido. Digite o número com DDD (11 dígitos).');
            setLoading(false);
            return;
        }

        // Parse balance
        const rawBalance = Number(balance.replaceAll(/\D/g, '')) / 100

        try {
            // 1. Call Server Action to create user
            const result = await completeRegistration(token, password, name, rawPhone, rawBalance);

            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            // 2. Auto-login (Optional but nice)
            // Since we just created the user with a known password, we can log them in immediately
            // using the client-side supabase.
            createClient();
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-4 text-white">
                <div className="bg-[#0f172a] p-8 rounded-lg border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Conta Criada!</h1>
                    <p className="text-slate-400">Sua conta foi configurada com sucesso.</p>
                    <div className="flex items-center justify-center gap-2 mt-6 text-sm text-indigo-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecionando para o login...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-4 text-white">
            <div className="bg-[#0f172a] p-8 rounded-lg border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 text-center max-w-md w-full relative overflow-hidden">

                {/* Decorative background gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full"></div>

                <div className="mb-6 flex justify-center">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center ring-1 ring-indigo-500/30">
                        <span className="text-2xl">🚀</span>
                    </div>
                </div>

                <h1 className="text-xl font-bold mb-2">Configurar sua Conta</h1>
                <p className="text-slate-400 text-sm mb-6">Preencha seus dados para finalizar o cadastro.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm flex items-center justify-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label htmlFor="name" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Seu Nome</label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all outline-none"
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    <div>
                        <label htmlFor="whatsapp" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">WhatsApp</label>
                        <input
                            id="whatsapp"
                            type="tel"
                            required
                            value={whatsapp}
                            onChange={handleWhatsappChange}
                            maxLength={15}
                            className="w-full px-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all outline-none"
                            placeholder="(11) 99999-9999"
                        />
                    </div>

                    <div>
                        <label htmlFor="balance" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Saldo Atual</label>
                        <input
                            id="balance"
                            type="text"
                            required
                            value={balance}
                            onChange={handleBalanceChange}
                            className="w-full px-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all outline-none"
                            placeholder="R$ 0,00"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Crie uma Senha</label>
                        <input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#1e293b] border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all outline-none"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Criando conta...
                            </>
                        ) : 'Finalizar Cadastro'}
                    </button>
                </form>

                <p className="mt-6 text-xs text-slate-500">
                    Ao continuar, você concorda com nossos termos de uso.
                </p>
            </div>
        </div>
    )
}

export default function SetupPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-indigo-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Carregando...</p>
            </div>
        }>
            <SetupContent />
        </Suspense>
    )
}
