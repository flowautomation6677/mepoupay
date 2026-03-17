'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button, TextInput, Title, Text } from '@tremor/react';

function JoinContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setErrorMsg("Link de convite inválido ou ausente.");
                setIsValidating(false);
                return;
            }

            const supabase = createClient();
            // The RLS policy guarantees we only get a row if it's active, unexpired, and has uses left.
            const { data, error } = await supabase
                .from('shared_invite_links')
                .select('id')
                .eq('token', token)
                .single();

            if (error || !data) {
                setErrorMsg("Este link de convite expirou ou atingiu o limite de usos. Solicite um novo link ao administrador.");
                setIsValid(false);
            } else {
                setIsValid(true);
            }
            setIsValidating(false);
        };

        validateToken();
    }, [token]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!fullName || !email || !password || !confirmPassword) {
            setErrorMsg("Preencha todos os campos.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("As senhas não coincidem.");
            return;
        }

        if (password.length < 6) {
            setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/auth/register-via-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, password, fullName })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Success! Supabase session is created for this user automatically in the backend?
                // Actually the backend `admin.createUser` doesn't sign the client in automatically usually.
                // We must log them in using the password they just provided.
                const supabase = createClient();
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInError) {
                    setErrorMsg("Conta criada, mas falha ao logar. Vá para a tela de login.");
                    setTimeout(() => router.push('/'), 2000);
                } else {
                    router.push('/dashboard');
                }
            } else {
                if (res.status === 409) {
                    setErrorMsg("Este e-mail já possui uma conta. Faça login.");
                } else if (res.status === 429) {
                    setErrorMsg("Infelizmente a última vaga deste link foi preenchida agora.");
                } else {
                    setErrorMsg(data.error || "Ocorreu um erro ao criar a conta.");
                }
            }
        } catch (err) {
            setErrorMsg("Erro de conexão. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
                <Text className="text-muted-foreground animate-pulse">Validando convite...</Text>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
                <div className="bg-destructive/10 text-destructive border border-destructive/20 p-6 rounded-xl max-w-md w-full text-center shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Convite Inválido</h3>
                    <p className="text-sm">{errorMsg}</p>
                    <Button variant="secondary" className="mt-6 w-full" onClick={() => router.push('/')}>
                        Ir para Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-12">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
                <div className="space-y-2 text-center">
                    <Title className="text-2xl font-bold text-foreground">Você foi convidado!</Title>
                    <Text className="text-muted-foreground">
                        Preencha seus dados reais abaixo para criar sua conta no MePoupay e acessar o workspace.
                    </Text>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-xs text-muted-foreground font-medium ml-1">Nome Completo</label>
                        <TextInput
                            placeholder="Seu nome real"
                            value={fullName}
                            onValueChange={setFullName}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground font-medium ml-1">E-mail</label>
                        <TextInput
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onValueChange={setEmail}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground font-medium ml-1">Senha</label>
                        <TextInput
                            type="password"
                            placeholder="Min 6 caracteres"
                            value={password}
                            onValueChange={setPassword}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground font-medium ml-1">Confirmação de Senha</label>
                        <TextInput
                            type="password"
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onValueChange={setConfirmPassword}
                            className="mt-1"
                        />
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        color="indigo"
                        className="w-full mt-6"
                        loading={isSubmitting}
                    >
                        Criar Conta
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><span className="animate-pulse text-muted-foreground">Carregando...</span></div>}>
            <JoinContent />
        </Suspense>
    );
}
