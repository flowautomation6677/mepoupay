'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Card, TextInput, Button } from "@tremor/react";
import { createBrowserClient } from "@supabase/ssr";
import { Lock, ArrowRight, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpdatePasswordPage() {
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

    // Validation Flags
    const hasMinLength = password.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isValid = hasMinLength && hasLetter && hasNumber && (password === confirmPassword);

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

    const handleSave = async () => {
        if (!isValid) return;

        setSaving(true);
        try {
            const { error: authError } = await supabase.auth.updateUser({ password: password });
            if (authError) throw authError;
            setSuccess(true);
        } catch (error: any) {
            alert("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Card className="max-w-md w-full glass-card ring-0 p-8 shadow-2xl relative overflow-hidden border-t-4 border-t-emerald-500 text-center">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <Title className="text-white text-2xl mb-2">Senha alterada com sucesso!</Title>
                        <Text className="text-slate-400 mb-8">Agora você já pode acessar sua conta normalmente.</Text>

                        <Link href="/login">
                            <Button size="xl" className="w-full bg-indigo-600 hover:bg-indigo-700 border-none">
                                Ir para o login
                            </Button>
                        </Link>
                    </motion.div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="max-w-md w-full glass-card ring-0 p-8 shadow-2xl relative overflow-hidden border-t-4 border-t-indigo-500">
                <div className="mb-8">
                    <Title className="text-white text-2xl mb-1">Criar nova senha</Title>
                    <Text className="text-slate-400">Escolha uma nova senha para acessar sua conta.</Text>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">Nova senha</label>
                        <TextInput
                            type="password"
                            value={password}
                            onValueChange={setPassword}
                            placeholder="Mínimo 8 caracteres"
                            icon={Lock}
                            className="mt-1"
                        />
                        {/* Microcopy Rules */}
                        <div className="flex gap-2 mt-2 text-[10px] text-slate-500">
                            <span className={hasMinLength ? "text-emerald-400" : ""}>• Mín. 8 caracteres</span>
                            <span className={(hasLetter && hasNumber) ? "text-emerald-400" : ""}>• 1 letra e 1 número</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">Confirmar nova senha</label>
                        <TextInput
                            type="password"
                            value={confirmPassword}
                            onValueChange={setConfirmPassword}
                            placeholder="Repita a senha"
                            icon={Lock}
                            className="mt-1"
                            error={confirmPassword && password !== confirmPassword}
                            errorMessage="As senhas não coincidem"
                        />
                    </div>

                    <Button
                        size="xl"
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 border-none group"
                        loading={saving}
                        onClick={handleSave}
                        disabled={!isValid}
                    >
                        <span className="flex items-center gap-2">
                            Salvar nova senha
                            {!saving && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                        </span>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
