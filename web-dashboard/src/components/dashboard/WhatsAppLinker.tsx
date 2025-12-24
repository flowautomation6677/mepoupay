
'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function WhatsAppLinker() {
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    async function handleLink() {
        setLoading(true)
        setError('')

        // Formata para apenas números e adiciona 55 se não tiver
        let cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
            cleanPhone = '55' + cleanPhone
        }
        // Adiciona o sufixo do whatsapp-web.js (geralmente @c.us ou @lid)
        // O bot salva como "5521990149660@c.us".
        // Vamos tentar buscar com like ou o usuário tem que digitar exato?
        // Melhor tentar assumir @c.us primeiro.
        const fullPhone = cleanPhone + '@c.us'

        // Chama a função RPC (Procedure do Banco) que vamos pedir para o usuário criar
        const { error: rpcError } = await supabase.rpc('link_whatsapp', { phone_input: fullPhone })

        if (rpcError) {
            console.error(rpcError)
            setError('Erro: ' + rpcError.message)
        } else {
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="rounded-lg bg-yellow-50 p-6 shadow-sm border border-yellow-200">
            <h3 className="mb-2 text-lg font-semibold text-yellow-800">Vincular WhatsApp</h3>
            <p className="mb-4 text-sm text-yellow-700">
                Para ver seus gastos, digite seu número (com DDD) que você usa para falar com o bot.
            </p>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Ex: 21999998888"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="flex-1 rounded border border-gray-300 p-2"
                />
                <button
                    onClick={handleLink}
                    disabled={loading}
                    className="rounded bg-yellow-600 px-4 py-2 font-bold text-white hover:bg-yellow-700 disabled:opacity-50"
                >
                    {loading ? 'Vinculando...' : 'Vincular'}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    )
}
