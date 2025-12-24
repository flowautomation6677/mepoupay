'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Card, TextInput, Button } from "@tremor/react";
import { createBrowserClient } from "@supabase/ssr";
import { Lock, User, Phone, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SetupPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form Data
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Validation Flags
    const hasMinLength = password.length >= 6;
    const isValid = hasMinLength && (password === confirmPassword);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.replace('/login');
            return;
        }

        setEmail(user.email || "");

        // Try to fetch existing profile data to pre-fill
        const { data: profile } = await supabase
            .from('perfis')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

        if (profile) {
            setWhatsapp(profile.whatsapp_number || "");
        }

        // Name comes from Auth Metadata
        if (user.user_metadata?.full_name) {
            setName(user.user_metadata.full_name);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!isValid) return;

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // 1. Update Password & Metadata
            const { error: authError } = await supabase.auth.updateUser({
                password: password,
                data: { full_name: name } // Also update auth metadata
            });

            // Ignore error if it's just "password is same"
            if (authError && !authError.message.includes("different from the old password")) {
                throw authError;
            }

            // 2. Upsert Profile Data (Create or Update)
            const { error: profileError } = await supabase
                .from('perfis')
                .upsert({
                    id: user.id, // Primary Key matches Auth ID
                    auth_user_id: user.id,
                    whatsapp_number: whatsapp,
                    email: email,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (profileError) throw profileError;

            // Success! Redirect to Dashboard with welcome flag
            router.push('/dashboard?welcome=true');

        } catch (error: any) {
            alert("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePhoneChange = (e: any) => {
        // Handle both event (Tremor v3?) and direct value (Tremor v4?)
        // Tremor TextInput onValueChange gives string, onChange gives event.
        // We used onValueChange={handlePhoneChange} in JSX below.
        // So 'e' is the string value.
        const val = typeof e === 'string' ? e : e?.target?.value || '';

        let v = val.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);

        // Mask logic
        if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        if (v.length > 7) v = `${v.slice(0, 5)}-${v.slice(5)}`; // (XX) XXXXX-XXXX (11 digits) or (XX) XXXX-XXXX (10 digits)

        // Adjustment for 9-digit mobile numbers (standard in Brazil)
        if (v.length > 14) {
            // Logic to handle shift from (XX) XXXX-XXXX to (XX) XXXXX-XXXX dynamically is tricky with simple replace.
            // Let's stick to the simplest visual mask that works for 10 or 11 digits.
            // Re-masking fully based on length:
            const clean = val.replace(/\D/g, "").slice(0, 11);
            if (clean.length > 2) v = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
            if (clean.length > 6) v = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        }

        setWhatsapp(v);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="max-w-md w-full glass-card ring-0 p-8 shadow-2xl relative overflow-hidden border-t-4 border-t-indigo-500">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-500/20">
                        <User className="w-8 h-8 text-indigo-400" />
                    </div>
                    <Title className="text-white text-2xl">Bem-vindo(a)!</Title>
                    <Text className="text-slate-400">Vamos finalizar seu cadastro para acessar o painel.</Text>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">Seu E-mail (Confirmado)</label>
                        <TextInput value={email} disabled className="mt-1 opacity-60" />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">Nome Completo</label>
                        <TextInput
                            value={name}
                            onValueChange={setName}
                            placeholder="Como quer ser chamado?"
                            icon={User}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">WhatsApp</label>
                        <TextInput
                            value={whatsapp}
                            onValueChange={handlePhoneChange}
                            placeholder="(xx) xxxxx-xxxx"
                            icon={Phone}
                            className="mt-1"
                        />
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <label className="text-xs text-slate-400 font-medium ml-1">Defina sua Senha</label>
                        <TextInput
                            type="password"
                            value={password}
                            onValueChange={setPassword}
                            placeholder="Mínimo 6 caracteres"
                            icon={Lock}
                            className="mt-1"
                        />
                        {/* Microcopy Rules */}
                        <div className="flex gap-2 mt-2 text-[10px] text-slate-500">
                            <span className={hasMinLength ? "text-emerald-400" : ""}>• Mín. 6 caracteres</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium ml-1">Confirme a Senha</label>
                        <TextInput
                            type="password"
                            value={confirmPassword}
                            onValueChange={setConfirmPassword}
                            placeholder="Repita a senha"
                            icon={Lock}
                            className="mt-1"
                            error={!!(confirmPassword && password !== confirmPassword)}
                            errorMessage="As senhas não coincidem"
                        />
                    </div>

                    <Button
                        size="xl"
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 border-none group"
                        loading={saving}
                        onClick={handleSave}
                        disabled={!isValid || !name || !whatsapp}
                    >
                        <span className="flex items-center gap-2">
                            Ativar Conta e Entrar
                            {!saving && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                        </span>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
