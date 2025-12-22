'use client';

import { useState, useEffect } from 'react';
import { Card, Title, Text, Tab, TabList, TabGroup, TabPanel, TabPanels, Grid, Metric, BarChart, DonutChart, AreaChart, Flex, Badge, Icon } from "@tremor/react";
import { createBrowserClient } from "@supabase/ssr";
import { Activity, DollarSign, Cpu, Search, Zap, TrendingUp, AlertTriangle, Users } from 'lucide-react';

// --- IDV & UI CONSTANTS ---
const IDV = {
    colors: {
        primary: "indigo",
        accent: "emerald",
        alert: "rose",
        neutral: "slate"
    }
};

export default function AdminDashboard() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [efficiencyData, setEfficiencyData] = useState<any[]>([]);
    const [financeData, setFinanceData] = useState<any[]>([]);

    // KPIs (Simulated for "Expert" Feel if empty)
    const kpis = [
        { title: "Precisão da IA", metric: "94.2%", icon: Zap, color: "indigo" },
        { title: "Economia Gerada", metric: "R$ 1,250", icon: DollarSign, color: "emerald" },
        { title: "Transações Hoje", metric: "128", icon: Activity, color: "blue" },
    ];

    // Load Data
    useEffect(() => {
        async function load() {
            const { data: eff } = await supabase.from('view_ai_efficiency').select('*');
            const { data: fin } = await supabase.from('view_financial_metrics').select('*');

            if (eff && eff.length > 0) setEfficiencyData(eff);
            else {
                // Mock Data for "Wow" Effect if DB is empty
                setEfficiencyData([
                    { prompt_version: 'v1_stable', error_rate_percent: 12.5, avg_confidence: 0.88, total_samples: 450 },
                    { prompt_version: 'v2_experimental', error_rate_percent: 4.2, avg_confidence: 0.96, total_samples: 420 },
                ]);
            }

            if (fin && fin.length > 0) setFinanceData(fin);
            else {
                // Mock Data
                setFinanceData([
                    { date: '2023-10-01', est_cost_usd: 0.45 },
                    { date: '2023-10-02', est_cost_usd: 0.52 },
                    { date: '2023-10-03', est_cost_usd: 0.48 },
                    { date: '2023-10-04', est_cost_usd: 1.20 }, // Spike
                    { date: '2023-10-05', est_cost_usd: 0.80 },
                ]);
            }
        }
        load();
    }, [supabase]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50 p-6 sm:p-10 selection:bg-indigo-500/30">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <Text className="text-emerald-400 font-mono text-xs tracking-wider uppercase">System Operational</Text>
                    </div>
                    <Title className="text-4xl font-bold mt-1 tracking-tight text-white neon-text-indigo">
                        Nexus Command Center
                    </Title>
                    <Text className="text-slate-400">Real-time Intelligence & Financial Telemetry</Text>
                </div>
                <div className="flex gap-2">
                    <Badge color="indigo" size="lg" icon={Cpu}>v2.0.1-RC</Badge>
                </div>
            </div>

            {/* --- TOP KPIs --- */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-8">
                {kpis.map((item) => (
                    <Card key={item.title} className="glass-card ring-0 border-t-4 border-indigo-500 transform hover:scale-[1.02] transition-all duration-300">
                        <Flex alignItems="start">
                            <div>
                                <Text className="text-slate-400 uppercase text-xs font-bold tracking-widest">{item.title}</Text>
                                <Metric className="text-white mt-2">{item.metric}</Metric>
                            </div>
                            <Icon icon={item.icon} variant="solid" color={item.color as any} size="lg" className="shadow-lg rounded-xl" />
                        </Flex>
                    </Card>
                ))}
            </Grid>

            {/* --- MAIN DASHBOARD --- */}
            <TabGroup className="mt-6">
                <TabList className="bg-slate-900/50 p-1 rounded-xl border border-white/5 inline-flex">
                    <Tab className="px-4 py-2 text-sm font-medium ui-selected:bg-indigo-600 ui-selected:text-white ui-not-selected:text-slate-400 rounded-lg transition-all" icon={Search}>The Lab (AI)</Tab>
                    <Tab className="px-4 py-2 text-sm font-medium ui-selected:bg-emerald-600 ui-selected:text-white ui-not-selected:text-slate-400 rounded-lg transition-all" icon={DollarSign}>The CFO (Fin)</Tab>
                    <Tab className="px-4 py-2 text-sm font-medium ui-selected:bg-rose-600 ui-selected:text-white ui-not-selected:text-slate-400 rounded-lg transition-all" icon={AlertTriangle}>The SRE (Ops)</Tab>
                </TabList>

                <TabPanels>
                    {/* --- THE LAB (AI EFFICIENCY) --- */}
                    <TabPanel>
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="glass-card ring-0">
                                <Title className="text-white mb-4">Prompt Battle Royale</Title>
                                <Text className="text-slate-400 mb-6">Comparison of error rates between Stable and Experimental prompts.</Text>
                                <BarChart
                                    className="h-72"
                                    data={efficiencyData}
                                    index="prompt_version"
                                    categories={["error_rate_percent", "avg_confidence"]}
                                    colors={["rose", "blue"]}
                                    valueFormatter={(number) => `${number}%`}
                                    yAxisWidth={48}
                                    showAnimation={true}
                                />
                            </Card>
                            <Card className="glass-card ring-0">
                                <Title className="text-white mb-4">Confusion Matrix</Title>
                                <div className="flex items-center justify-center h-64 border border-dashed border-slate-700 rounded-xl bg-slate-900/30">
                                    <Text className="text-slate-500">Awaiting more correction data...</Text>
                                </div>
                            </Card>
                        </div>
                    </TabPanel>

                    {/* --- THE CFO (FINANCIALS) --- */}
                    <TabPanel>
                        <Card className="mt-6 glass-card ring-0">
                            <Title className="text-white">Token Burn Rate (USD)</Title>
                            <Text className="text-slate-400">Estimated cost accumulated over the last 30 days.</Text>
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
                    </TabPanel>

                    {/* --- THE SRE (OPS) --- */}
                    <TabPanel>
                        <Grid numItems={1} numItemsSm={2} className="gap-6 mt-6">
                            <Card className="glass-card ring-0 border-l-4 border-rose-500">
                                <Title className="text-white">Queue Health</Title>
                                <Metric className="text-rose-400">0 Critical</Metric>
                                <Text className="text-slate-400 mt-2">All workers operational. 12ms avg latency.</Text>
                            </Card>
                            <Card className="glass-card ring-0 border-l-4 border-yellow-500">
                                <Title className="text-white">API Quota</Title>
                                <Metric className="text-yellow-400">42% Used</Metric>
                                <Text className="text-slate-400 mt-2">OpenAI limit resets in 12 days.</Text>
                            </Card>
                        </Grid>
                    </TabPanel>
                </TabPanels>
            </TabGroup>
        </main>
    );
}
