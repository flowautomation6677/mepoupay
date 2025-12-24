'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { requestPasswordReset } from './actions';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);

        try {
            const res = await requestPasswordReset(formData);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(true);
            }
        } catch (e) {
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#020617] p-4 text-slate-100">
            <div className="w-full max-w-md">

                {/* Brand Logo (Optional, keeps consistency) */}
                <div className="mb-8 flex justify-center">
                    <div className="bg-indigo-500/10 p-3 rounded-2xl ring-1 ring-indigo-500/20">
                        <span className="text-2xl font-bold tracking-tighter text-indigo-500">
                            Me <span className="text-white">Poupey</span>
                        </span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
                >
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-white">
                                    Verifique seu e-mail
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha.
                                </p>
                            </div>

                            <div className="bg-slate-900/50 rounded-xl p-4 text-xs text-slate-500 border border-white/5">
                                <p className="mb-2">O link pode levar alguns minutos para chegar.</p>
                                <p>Verifique também a caixa de spam.</p>
                            </div>

                            <Link
                                href="/login"
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10 ring-1 ring-white/10"
                            >
                                <ArrowLeft size={16} />
                                Voltar para o login
                            </Link>

                        </div>
                    ) : (
                        <>
                            <div className="mb-8 text-center">
                                <h2 className="text-2xl font-bold text-white">
                                    Recuperar senha
                                </h2>
                                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                    Informe o e-mail cadastrado para receber o link de redefinição de senha.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-400 border border-red-500/20"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="seu@email.com"
                                            className="w-full rounded-xl bg-slate-900/50 border border-white/10 pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/30 disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading && <Loader2 className="animate-spin" size={18} />}
                                        Enviar link de recuperação
                                        {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                                    </span>
                                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} />
                                    Voltar para o login
                                </Link>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
