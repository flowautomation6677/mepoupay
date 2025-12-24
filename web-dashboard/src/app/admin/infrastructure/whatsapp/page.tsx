'use client';
import { Title, Text, Card, Metric, Badge } from "@tremor/react";
import { Smartphone, RefreshCw, QrCode } from 'lucide-react';

export default function WhatsAppPage() {
    return (
        <div className="space-y-6">
            <header>
                <Title className="text-3xl font-bold text-white">The Bridge 📱</Title>
                <Text className="text-slate-400">Gestão de Instâncias WhatsApp</Text>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-card ring-0 border-l-4 border-emerald-500">
                    <div className="flex justify-between">
                        <div>
                            <Title className="text-white">Instância Principal</Title>
                            <Badge className="mt-2" color="emerald" icon={Smartphone}>CONECTADO</Badge>
                        </div>
                        <div className="text-right">
                            <Text className="text-slate-400 text-xs">Bateria</Text>
                            <Metric className="text-emerald-400">98%</Metric>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button className="bg-slate-800 text-white px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-slate-700">
                            <RefreshCw size={14} /> Reiniciar
                        </button>
                    </div>
                </Card>

                <Card className="glass-card ring-0 border-dashed border-2 border-slate-700 opacity-50 flex items-center justify-center min-h-[150px]">
                    <div className="text-center">
                        <QrCode className="mx-auto text-slate-500 mb-2" />
                        <Text className="text-slate-500">Adicionar Nova Instância</Text>
                    </div>
                </Card>
            </div>
        </div>
    );
}
