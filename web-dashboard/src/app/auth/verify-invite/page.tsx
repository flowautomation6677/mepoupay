'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button' // Ou seu componente de botão padrão
import Link from 'next/link'
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
                <Link href={target} passHref legacyBehavior>
                    <Button className="w-full text-lg h-12">
                        Confirmar Acesso
                    </Button>
                </Link>

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
