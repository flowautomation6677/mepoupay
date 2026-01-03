'use client'

import { useState, useEffect } from 'react'
import { bridgeService, Instance } from '@/services/bridgeService'
import { Card, Title, Text, Button, Badge } from '@tremor/react'
import { Plus, Trash2, Smartphone, QrCode } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BridgePage() {
    const [instances, setInstances] = useState<Instance[]>([])
    const [loading, setLoading] = useState(true)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null)

    useEffect(() => {
        loadInstances()
    }, [])

    async function loadInstances() {
        setLoading(true)
        const data = await bridgeService.getInstances()
        // Evolution returns array directly? or object? Assuming array for now based on typical v2
        // Actually usually it returns [{ instance: {...} }, ...]
        setInstances(Array.isArray(data) ? data : [])
        setLoading(false)
    }

    async function handleConnect(name: string) {
        setSelectedInstance(name)
        const data = await bridgeService.connectInstance(name)
        if (data && data.base64) {
            setQrCode(data.base64)
        } else if (data && data.code) {
            setQrCode(data.code) // V2 sometimes
        }
    }

    async function handleCreate() {
        const name = prompt("Nome da nova instância (ex: Production, Test):")
        if (name) {
            await bridgeService.createInstance(name)
            await loadInstances()
        }
    }

    async function handleLogout(name: string) {
        if (confirm(`Tem certeza que deseja desconectar ${name}?`)) {
            await bridgeService.logoutInstance(name)
            await loadInstances()
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Bridge 📱</h1>
                    <p className="text-slate-500">Gestão de Instâncias WhatsApp (Evolution API)</p>
                </div>
                <Button icon={Plus} onClick={handleCreate} color="indigo">Nova Instância</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((item) => (
                    <Card key={item.instance.instanceName} className="relative overflow-hidden group hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Smartphone size={64} />
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Title>{item.instance.instanceName}</Title>
                                <Text className="truncate w-40">{item.instance.owner || "Não conectado"}</Text>
                            </div>
                            <Badge color={item.instance.status === 'open' ? 'emerald' : 'rose'}>
                                {item.instance.status === 'open' ? 'CONECTADO' : 'DESCONECTADO'}
                            </Badge>
                        </div>

                        <div className="mt-4 flex gap-2">
                            {item.instance.status !== 'open' && (
                                <Button
                                    size="xs"
                                    variant="secondary"
                                    icon={QrCode}
                                    onClick={() => handleConnect(item.instance.instanceName)}
                                >
                                    Conectar
                                </Button>
                            )}

                            <Button
                                size="xs"
                                variant="light"
                                color="rose"
                                icon={Trash2}
                                onClick={() => handleLogout(item.instance.instanceName)}
                            >
                                Sair
                            </Button>
                        </div>

                        {/* QR Code Overlay */}
                        {selectedInstance === item.instance.instanceName && qrCode && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 flex flex-col items-center">
                                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                <Button
                                    size="xs"
                                    variant="light"
                                    className="mt-2"
                                    onClick={() => { setQrCode(null); setSelectedInstance(null); loadInstances(); }}
                                >
                                    Fechar
                                </Button>
                            </div>
                        )}
                    </Card>
                ))}

                {instances.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Smartphone className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p>Nenhuma instância encontrada.</p>
                        <Button variant="light" onClick={handleCreate} className="mt-4">Criar Primeira Instância</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
