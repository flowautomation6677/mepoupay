import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string, error_description?: string }> }) {
    const params = await searchParams;
    // If running in development, generic messages are less helpful.
    const errorMsg = params?.error_description
        ? decodeURIComponent(params.error_description.replace(/\+/g, " "))
        : "Ocorreu um erro ao validar seu acesso. Isso pode acontecer se o link já foi usado ou expirou.";

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>

                <h1 className="mb-2 text-2xl font-bold text-white">Link Inválido ou Expirado</h1>
                <p className="mb-6 text-slate-400 text-sm">
                    {errorMsg}
                </p>

                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="block w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                        Voltar para Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
