'use client';

import { Card, Title, Text, Metric, Grid, Badge, Button } from "@tremor/react";
import { CheckCircle, ExternalLink, Webhook } from 'lucide-react';
import { useState } from 'react';

export default function SubscriptionPage() {
    const [webhookUrl] = useState("https://api.seubot.com/webhook/kirvano");

    return (
        <div className="space-y-6">
            <header>
                <Title className="text-3xl font-bold text-white">Assinaturas & Pagamentos</Title>
                <Text className="text-slate-400">Gestão de planos e integração com Kirvano.</Text>
            </header>

            {/* INTEGRATION STATUS */}
            <Card className="glass-card ring-0 border-l-4 border-yellow-500">
                <div className="flex justify-between items-center">
                    <div>
                        <Title className="text-white flex items-center gap-2">
                            <Webhook size={20} className="text-yellow-400" />
                            Integração Kirvano
                        </Title>
                        <Text className="text-slate-400 mt-1">Configure este Webhook na Kirvano para receber atualizações de pagamento.</Text>
                        <div className="mt-4 bg-black/50 p-2 rounded border border-white/10 font-mono text-xs text-indigo-400 flex items-center gap-2">
                            {webhookUrl}
                            <Badge size="xs" color="indigo">Click to Copy</Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge color="yellow" size="lg">Aguardando Eventos</Badge>
                    </div>
                </div>
            </Card>

            {/* METRICS */}
            <Grid numItems={1} numItemsSm={3} className="gap-6">
                <Card className="glass-card ring-0">
                    <Text className="text-slate-400">Receita Recorrente (MRR)</Text>
                    <Metric className="text-white">R$ 450,00</Metric>
                </Card>
                <Card className="glass-card ring-0">
                    <Text className="text-slate-400">Assinantes Ativos</Text>
                    <Metric className="text-white">45</Metric>
                </Card>
                <Card className="glass-card ring-0">
                    <Text className="text-slate-400">Taxa de Churn</Text>
                    <Metric className="text-white">2.1%</Metric>
                </Card>
            </Grid>

            {/* PLANS */}
            <Title className="text-white mt-8 mb-4">Planos Ativos</Title>
            <Grid numItems={1} numItemsMd={2} className="gap-6">
                {/* Free Plan */}
                <Card className="glass-card ring-0 opacity-70">
                    <div className="flex justify-between">
                        <Title className="text-white">Gratuito (Beta)</Title>
                        <Metric className="text-slate-400">R$ 0,00</Metric>
                    </div>
                    <ul className="mt-4 space-y-2 text-slate-400 text-sm">
                        <li className="flex gap-2"><CheckCircle size={16} /> 50 mensagens/mês</li>
                        <li className="flex gap-2"><CheckCircle size={16} /> Dashboard Básico</li>
                    </ul>
                </Card>

                {/* Pro Plan */}
                <Card className="glass-card ring-0 border-2 border-indigo-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs px-2 py-1 font-bold">POPULAR</div>
                    <div className="flex justify-between">
                        <Title className="text-white">PRO Nexus</Title>
                        <Metric className="text-indigo-400">R$ 10,00</Metric>
                    </div>
                    <Text className="text-slate-400 text-xs">/mês</Text>

                    <ul className="mt-4 space-y-2 text-slate-300 text-sm">
                        <li className="flex gap-2"><CheckCircle size={16} className="text-indigo-400" /> Mensagens Ilimitadas</li>
                        <li className="flex gap-2"><CheckCircle size={16} className="text-indigo-400" /> Relatórios PDF</li>
                        <li className="flex gap-2"><CheckCircle size={16} className="text-indigo-400" /> Suporte Prioritário</li>
                    </ul>
                    <Button size="xs" variant="secondary" className="mt-6 w-full" icon={ExternalLink}>Editar na Kirvano</Button>
                </Card>
            </Grid>
        </div>
    );
}
