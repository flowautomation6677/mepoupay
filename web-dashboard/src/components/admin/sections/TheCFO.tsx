'use client';

import { AreaChart, Tracker, Color } from "@tremor/react";
import { TrendingDown, TrendingUp, Zap } from 'lucide-react';
import React from 'react';

interface FinanceItem {
    est_cost_usd: number;
    date: string;
}

export default function TheCFO({ financeData }: Readonly<{ financeData: FinanceItem[] }>) {
    // Current data analysis
    const currentCost = financeData.at(-1)?.est_cost_usd || 0;
    const prevCost = financeData.at(-2)?.est_cost_usd || 0;
    const trend = prevCost > 0 ? ((currentCost - prevCost) / prevCost) * 100 : 0;

    // Hardcoded burn for demonstration, typical in this view
    const tokenBurnPct = 65;
    const burnBarsTotal = 40;
    const burnBarsActive = Math.floor((tokenBurnPct / 100) * burnBarsTotal);

    // Create a brutalist progress bar string: [||||||||||....................]
    const renderBurnBar = () => {
        let bars = '';
        for (let i = 0; i < burnBarsTotal; i++) {
            bars += i < burnBarsActive ? '|' : '·';
        }
        return `[${bars}]`;
    };

    return (
        <div className="mt-8 space-y-12 font-mono selection:bg-[#ccff00] selection:text-black">

            {/* HERO METRICS - Asymmetric 90/10 Layout with Extreme Typography */}
            <div className="flex flex-col lg:flex-row gap-8 items-stretch border-t-2 border-b-2 border-[#333] py-8">

                {/* 90% Primary Focus: Métrica Crua */}
                <div className="flex-grow lg:w-[85%] flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-[#ccff00] mb-6">
                        <Zap size={24} className="animate-pulse" />
                        <span className="uppercase tracking-widest text-sm font-bold">System Load / Token Burn</span>
                    </div>

                    <div>
                        <div className="text-8xl md:text-[140px] font-black leading-none tracking-tighter text-white">
                            {tokenBurnPct}<span className="text-5xl md:text-[80px] text-[#ccff00]">%</span>
                        </div>
                        <div className="text-[#666] text-xl md:text-3xl tracking-[0.2em] mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                            {renderBurnBar()}
                        </div>
                        <p className="text-sm text-[#888] uppercase tracking-widest mt-6 max-w-md border-l-2 border-[#ccff00] pl-4">
                            Consumo da Cota Diária de Tokens. Operando dentro das margens seguras.
                        </p>
                    </div>
                </div>

                {/* 10% Secondary Focus: Gasto Atual (Compressed, Vertical Impact) */}
                <div className="lg:w-[15%] flex flex-col justify-end border-l-2 border-[#333] pl-8">
                    <div className="mb-4">
                        <p className="text-[#666] uppercase text-xs tracking-widest mb-1">Custo Atual (Hoje)</p>
                        <p className="text-4xl font-bold text-white tracking-tight">${currentCost.toFixed(4)}</p>
                    </div>

                    <div className={`flex items-center gap-2 p-3 border-2 ${trend <= 0 ? 'border-[#ccff00] text-[#ccff00]' : 'border-red-500 text-red-500'}`}>
                        {trend <= 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                        <span className="font-bold text-sm tracking-widest">{Math.abs(trend).toFixed(1)}% vs ont</span>
                    </div>
                </div>
            </div>

            {/* TRACKER LINE - Minimalist Status */}
            <div className="group">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[#888] uppercase text-xs tracking-widest">Intensidade de Uso Contínua</span>
                    <span className="text-[#ccff00] uppercase text-xs opacity-0 group-hover:opacity-100 transition-opacity">Sistema Online</span>
                </div>
                {/* Substituindo os cantos arredondados por cantos afiados via override */}
                <div className="[&>div]:rounded-none">
                    <Tracker data={financeData.map(d => ({
                        color: (d.est_cost_usd > 0.8 ? 'rose' : 'emerald') as Color,
                        tooltip: `$${d.est_cost_usd} em ${d.date}`
                    }))} />
                </div>
            </div>

            {/* HISTORY CHART - Stark & Angular */}
            <div className="border-2 border-[#333] p-6 bg-[#0a0a0a]">
                <div className="flex justify-between items-start mb-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">Histórico Acumulado (USD)</h2>
                    <span className="px-2 py-1 bg-[#333] text-[#ccff00] text-xs font-bold tracking-widest">LIVE DATA</span>
                </div>

                <AreaChart
                    className="h-96"
                    data={financeData}
                    index="date"
                    categories={["est_cost_usd"]}
                    colors={["emerald"]}
                    valueFormatter={(number) => `$${number.toFixed(4)}`}
                    showAnimation={true}
                    // Mudando para step para um visual mais técnico/brutal e menos "fofinho"
                    curveType="step"
                    showGridLines={false}
                    yAxisWidth={60}
                />
            </div>
        </div>
    );
}
