'use client';

import { Card, Title, Text, AreaChart, Metric, Tracker, Color } from "@tremor/react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingDown } from 'lucide-react';

// Gauge Chart Component using Recharts
const Gauge = ({ value }: { value: number }) => {
    const data = [
        { name: 'Used', value: value },
        { name: 'Remaining', value: 100 - value }
    ];
    // Color logic: Green < 50, Yellow < 80, Red > 80
    const color = value < 50 ? '#10b981' : value < 80 ? '#f59e0b' : '#ef4444';

    return (
        <div className="h-40 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell key="used" fill={color} cornerRadius={10} />
                        <Cell key="remaining" fill="#334155" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 text-center">
                <Metric className="text-white text-2xl">{value}%</Metric>
                <Text className="text-xs text-slate-400">Quota Diária</Text>
            </div>
        </div>
    );
};

export default function TheCFO({ financeData }: { financeData: any[] }) {
    // Calculate pseudo-trends
    const currentCost = financeData[financeData.length - 1]?.est_cost_usd || 0;
    const prevCost = financeData[financeData.length - 2]?.est_cost_usd || 0;
    const trend = ((currentCost - prevCost) / prevCost) * 100;

    return (
        <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gauge Card */}
                <Card className="glass-card ring-0 flex flex-col items-center justify-center">
                    <Title className="text-white mb-2">Token Burn Load</Title>
                    <Gauge value={65} /> {/* Simulated 65% load */}
                </Card>

                {/* Metric Card with Sparkline */}
                <Card className="glass-card ring-0 col-span-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <Text className="text-slate-400">Gasto Atual (Hoje)</Text>
                            <Metric className="text-white mt-1">${currentCost.toFixed(4)}</Metric>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-bold ${trend < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {trend < 0 ? <TrendingDown size={16} /> : <DollarSign size={16} />}
                            {Math.abs(trend).toFixed(1)}% vs ontem
                        </div>
                    </div>

                    <div className="mt-6">
                        <Tracker data={financeData.map(d => ({ color: (d.est_cost_usd > 0.8 ? 'rose' : 'emerald') as Color, tooltip: `$${d.est_cost_usd}` }))} className="mt-2" />
                        <Text className="text-xs text-slate-500 mt-2 text-center">Intensidade de uso nos últimos dias</Text>
                    </div>
                </Card>
            </div>

            {/* Main History Chart */}
            <Card className="glass-card ring-0">
                <Title className="text-white">Histórico de Custos (USD)</Title>
                <Text className="text-slate-400">Accumulated cost over time.</Text>
                <AreaChart
                    className="h-80 mt-6"
                    data={financeData}
                    index="date"
                    categories={["est_cost_usd"]}
                    colors={["emerald"]}
                    valueFormatter={(number) => `$${number.toFixed(4)}`}
                    showAnimation={true}
                    curveType="monotone"
                />
            </Card>
        </div>
    );
}
