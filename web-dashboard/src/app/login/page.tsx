
'use client'

import { startTransition, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { login } from './actions'
import { Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function AuthPage() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)
    const router = useRouter()

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setMessage(null)

        const formData = new FormData(event.currentTarget)

        try {
            const res = await login(formData)
            if (res?.error) {
                setMessage({ text: res.error, type: 'error' })
            }
        } catch (e) {
            setMessage({ text: 'Erro inesperado. Tente novamente.', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full bg-[#020617] text-slate-100">

            {/* Coluna Esquerda: Mensagem / Branding (Desktop) */}
            <div className="hidden w-1/2 flex-col justify-between bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#020617] to-[#020617] p-12 lg:flex">
                <div className="font-bold text-2xl tracking-tighter text-indigo-500">
                    Me <span className="text-white">Poupey</span>
                </div>
                <div className="space-y-6">
                    <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-white">
                        O futuro do seu <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                            dinheiro.
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-md">
                        Controle gastos, visualize metas e economize com inteligência artificial.
                        Tudo conectado ao seu WhatsApp.
                    </p>
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                    <span>© 2024 Me Poupey</span>
                    <span>Termos de Uso</span>
                </div>
            </div>

            {/* Coluna Direita: Formulário */}
            <div className="flex w-full items-center justify-center p-4 lg:w-1/2 bg-[#020617]">
                <div className="w-full max-w-md space-y-8">

                    {/* Logo Mobile */}
                    <div className="flex justify-center lg:hidden mb-8">
                        <span className="text-2xl font-bold tracking-tighter text-indigo-500">
                            Me <span className="text-white">Poupey</span>
                        </span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-bold text-white hidden lg:block">
                                Acesse sua conta
                            </h2>
                            <h2 className="text-2xl font-bold text-white lg:hidden">
                                Entrar
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                Digite seus dados para acessar o painel.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence mode="wait">
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={cn(
                                            "rounded-lg p-3 text-sm font-medium",
                                            message.type === 'error' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        )}
                                    >
                                        {message.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">E-mail</label>
                                <input name="email" type="email" required placeholder="seu@email.com" className="w-full rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Senha</label>
                                <input name="password" type="password" required placeholder="******" className="w-full rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition" />
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/forgot-password')}
                                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors z-10 relative hover:underline"
                                    >
                                        Esqueceu sua senha?
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/30 disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading && <Loader2 className="animate-spin" size={18} />}
                                        Entrar
                                        {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                                    </span>
                                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/10"></div>
                            <span className="text-xs text-slate-500">ou continue com</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>

                        <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
