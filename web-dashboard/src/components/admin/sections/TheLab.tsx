'use client';

import { Card, Title, Text, BarChart } from "@tremor/react";
import { Zap } from 'lucide-react';
import ConfusionRadar from '@/components/admin/ConfusionRadar';
import ABComparisonCard from '@/components/admin/ABComparisonCard';

export default function TheLab({ efficiencyData }: { efficiencyData: any[] }) {
    return (
        <div className="mt-6">
            {/* Hero Section of Lab */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <Card className="glass-card ring-0 h-full">
                        <Title className="text-white mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-yellow-400" />
                            Batalha de Prompts: V1 vs V2
                        </Title>
                        <ABComparisonCard efficiencyData={efficiencyData} />
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="glass-card ring-0 h-full flex flex-col">
                        <Title className="text-white mb-2">Matriz de Confusão</Title>
                        <Text className="text-slate-400 text-xs mb-4">Onde a IA confunde as categorias?</Text>
                        <div className="flex-1 flex items-center justify-center">
                            <ConfusionRadar />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Detailed Stats */}
            <Card className="glass-card ring-0">
                <Title className="text-white mb-4">Histórico de Precisão</Title>
                <BarChart
                    className="h-64"
                    data={efficiencyData}
                    index="prompt_version"
                    categories={["error_rate_percent", "avg_confidence"]}
                    colors={["rose", "emerald"]}
                    valueFormatter={(number) => `${number}%`}
                    yAxisWidth={48}
                    showAnimation={true}
                />
            </Card>
        </div>
    );
}
