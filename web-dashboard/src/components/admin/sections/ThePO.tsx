'use client';

import { Card, Title, Text, Metric, Grid, BarList, DonutChart, Legend } from "@tremor/react";
import { Users, Clock, Zap, MessageCircle } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

// Mock Funnel Data (Simulated for Demo)
const funnelData = [
    { name: 'Novo Usuário', value: 100 },
    { name: 'Primeira Interação', value: 85 },
    { name: 'Cadastro de Gasto', value: 65 },
    { name: 'Retenção (D+7)', value: 40 },
];

const featuresData = [
    { name: 'Registro Texto', value: 450 },
    { name: 'Registro Áudio', value: 320 },
    { name: 'Upload PDF/Imagem', value: 120 },
    { name: 'Relatórios', value: 80 },
];

export default function ThePO({ behaviorData }: { behaviorData: any[] }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Process Heatmap Data (Transform DB row {day, hour, count} -> Grid)
    const heatmapGrid = useMemo(() => {
        // Initialize 7x24 grid with 0
        const grid = Array(7).fill(0).map(() => Array(24).fill(0));
        let maxVal = 0;

        behaviorData.forEach(item => {
            const d = item.day_of_week;
            const h = item.hour_of_day;
            if (d >= 0 && d <= 6 && h >= 0 && h <= 23) {
                grid[d][h] = item.activity_count;
                if (item.activity_count > maxVal) maxVal = item.activity_count;
            }
        });
        return { grid, maxVal };
    }, [behaviorData]);

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hours = [0, 6, 12, 18, 23];

    // Helper for color intensity
    const getIntensity = (val: number, max: number) => {
        if (val === 0) return 'bg-slate-800/50';
        const ratio = val / (max || 1);
        if (ratio < 0.25) return 'bg-indigo-900/40';
        if (ratio < 0.50) return 'bg-indigo-700/60';
        if (ratio < 0.75) return 'bg-indigo-500/80';
        return 'bg-indigo-400';
    };

    if (!isMounted) return null;

    return (
        <div className="mt-6 space-y-6">

            {/* 1. Heatmap Section */}
            <Card className="glass-card ring-0">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Title className="text-white flex items-center gap-2">
                            <Clock size={20} className="text-indigo-400" />
                            Ritmo Biológico do Usuário
                        </Title>
                        <Text className="text-slate-400">Intensidade de uso por dia da semana e hora.</Text>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        {/* Header Hours */}
                        <div className="flex mb-2 pl-10">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="flex-1 text-[10px] text-slate-500 text-center">
                                    {i % 3 === 0 ? `${i}h` : ''}
                                </div>
                            ))}
                        </div>

                        {/* Grid Rows */}
                        {heatmapGrid.grid.map((row, dayIdx) => (
                            <div key={dayIdx} className="flex items-center mb-1">
                                <div className="w-10 text-xs text-slate-400 font-medium">{days[dayIdx]}</div>
                                <div className="flex-1 flex gap-1">
                                    {row.map((val, hourIdx) => (
                                        <div
                                            key={`${dayIdx}-${hourIdx}`}
                                            title={`${val} interações às ${hourIdx}h`}
                                            className={`h-6 flex-1 rounded-sm transition-all hover:ring-1 ring-white/20 cursor-help ${getIntensity(val, heatmapGrid.maxVal)}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* 2. Funnel & Features */}
            <Grid numItems={1} numItemsMd={2} className="gap-6">
                <Card className="glass-card ring-0">
                    <Title className="text-white mb-4">Funil de Retenção (Semanal)</Title>
                    <BarList
                        data={funnelData}
                        color="indigo"
                        valueFormatter={(val: number) => `${val}%`}
                        className="mt-2"
                    />
                </Card>

                <Card className="glass-card ring-0">
                    <Title className="text-white mb-4">Top Funcionalidades</Title>
                    <div className="flex items-center gap-4">
                        <DonutChart
                            className="h-40 w-40"
                            data={featuresData}
                            category="value"
                            index="name"
                            colors={["indigo", "violet", "fuchsia", "slate"]}
                            showAnimation={true}
                            variant="pie"
                        />
                        <Legend
                            categories={featuresData.map(f => f.name)}
                            colors={["indigo", "violet", "fuchsia", "slate"]}
                            className="max-w-xs"
                        />
                    </div>
                </Card>
            </Grid>
        </div>
    );
}
