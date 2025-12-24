'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Title, Card, TextInput, Button } from "@tremor/react";
import { createBrowserClient } from "@supabase/ssr";
import { Lock, CheckCircle, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form Data
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.replace('/login');
            return;
        }
        setLoading(false);
    };

    const validatePassword = (pass: string) => {
        if (pass.length < 8) return false;
        if (!/[a-zA-Z]/.test(pass)) return false;
        if (!/[0-9]/.test(pass)) return false;
        return true;
    };

    const handleSave = async () => {
        setError(null);
        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        if (!validatePassword(password)) {
            setError("Sua senha deve ter no mínimo 8 caracteres, contendo letras e números.");
            return;
        }

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError("Sessão expirada. Faça login novamente.");
            return;
        }

        try {
            const { error: authError } = await supabase.auth.updateUser({ password: password });
            if (authError) throw authError;

            setSuccess(true);
        } catch (error: any) {
            setError("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#020617] p-4 text-slate-100">
            <div className="w-full max-w-md">

                {/* Brand Logo */}
                <div className="mb-8 flex justify-center">
                    <div className="bg-indigo-500/10 p-3 rounded-2xl ring-1 ring-indigo-500/20">
                        <span className="text-2xl font-bold tracking-tighter text-indigo-500">
                            Me <span className="text-white">Poupey</span>
                        </span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
                >
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-white">
                                    Senha alterada com sucesso!
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Agora você já pode acessar sua conta normalmente.
                                </p>
                            </div>

                            <Link
                                href="/login"
                                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/30"
                            >
                                Ir para o login
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8 text-center">
                                {/* Desktop Title */}
                                <h2 className="hidden text-2xl font-bold text-white md:block">
                                    Criar nova senha
                                </h2>
                                {/* Mobile Title */}
                                <h2 className="block text-2xl font-bold text-white md:hidden">
                                    Nova senha
                                </h2>

                                <p className="hidden text-slate-400 text-sm mt-2 leading-relaxed md:block">
                                    Escolha uma nova senha para acessar sua conta.
                                </p>
                            </div>

                            <div className="space-y-5">
                                {error && (
                                    <div className="rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-400 border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {/* Responsive Label */}
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 hidden md:block">Nova senha</label>
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 md:hidden">Nova senha</label>

                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="******"
                                            className="w-full rounded-xl bg-slate-900/50 border border-white/10 pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                        />
                                    </div>
                                    <ul className="mt-2 space-y-1 pl-1 hidden md:block">
                                        <li className={`text-xs flex items-center gap-1.5 ${password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                            Mínimo de 8 caracteres
                                        </li>
                                        <li className={`text-xs flex items-center gap-1.5 ${(/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            <div className={`w-1 h-1 rounded-full ${(/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                            Pelo menos 1 letra e 1 número
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 md:hidden">Confirmar senha</label>
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1 hidden md:block">Confirmar nova senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="******"
                                            className="w-full rounded-xl bg-slate-900/50 border border-white/10 pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving || !password || !confirmPassword}
                                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/30 disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {saving && <Loader2 className="animate-spin" size={18} />}
                                        <span className="md:hidden">Confirmar</span>
                                        <span className="hidden md:inline">Salvar nova senha</span>
                                        {!saving && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                                    </span>
                                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
