'use client'

import { useSearchParams } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyInviteContent() {
    const searchParams = useSearchParams()
    // Captura o link de destino (gerado pelo Supabase)
    const target = searchParams.get('target')
    const errorCode = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (errorCode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    <h3 className="font-bold">Erro no Convite</h3>
                    <p>{errorDescription || 'Link inválido ou expirado.'}</p>
                </div>
            </div>
        )
    }

    if (!target) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <p>Link de convite inválido (destino ausente).</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Aceitar Convite</h1>
                    <p className="text-gray-500">
                        Clique no botão abaixo para confirmar seu acesso ao Me Poupay.
                    </p>
                </div>

                {/* O robô não clica neste botão, protegendo o token */}
                {/* Link direto com estilo de botão para evitar aninhamento inválido */}
                <a
                    href={target}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-900/90 w-full text-lg h-12"
                >
                    Confirmar Acesso
                </a>

                <p className="text-xs text-gray-400 mt-4">
                    Isso garante que seu link não expire automaticamente.
                </p>
            </div>
        </div>
    )
}

export default function VerifyInvitePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <VerifyInviteContent />
        </Suspense>
    )
}
