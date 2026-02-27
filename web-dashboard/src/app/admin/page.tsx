'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Grid, Card, Flex, Metric, Icon, Badge } from "@tremor/react";
import { createBrowserClient } from "@supabase/ssr";
import { Activity, DollarSign, Cpu, Users } from 'lucide-react';

import ThePO from '@/components/admin/sections/ThePO';

interface BehaviorItem {
    day_of_week: number;
    hour_of_day: number;
    activity_count: number;
}

export default function AdminDashboard() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [behaviorData, setBehaviorData] = useState<BehaviorItem[]>([]);

    // KPIs (Simulated for Overview)
    const kpis = [
        { title: "Usuários Ativos (24h)", metric: "128", icon: Users, color: "indigo" },
        { title: "Receita Mensal (MRR)", metric: "R$ 1,250", icon: DollarSign, color: "emerald" },
        { title: "Precisão Global IA", metric: "94.2%", icon: Activity, color: "blue" },
    ];

    // Load Overview Data
    useEffect(() => {
        async function load() {
            const { data: beh } = await supabase.from('view_user_behavior_heatmap').select('*');

            if (beh && beh.length > 0) setBehaviorData(beh);
            else {
                // Mock Heatmap Data
                const mockBeh = [];
                for (let d = 0; d < 7; d++) {
                    for (let h = 8; h < 22; h++) {
                        if (Math.random() > 0.6) {
                            mockBeh.push({ day_of_week: d, hour_of_day: h, activity_count: Math.floor(Math.random() * 50) });
                        }
                    }
                }
                setBehaviorData(mockBeh);
            }
        }
        load();
    }, [supabase]);

    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <Text className="text-emerald-400 font-mono text-xs tracking-wider uppercase">System Operational</Text>
                    </div>
                    <Title className="text-3xl font-bold mt-1 tracking-tight text-slate-900 dark:text-white">
                        Visão Geral
                    </Title>
                    <Text className="text-slate-500 dark:text-slate-400">Resumo operacional do Nexus.</Text>
                </div>
                <Badge color="indigo" size="lg" icon={Cpu}>v2.1.0</Badge>
            </div>

            {/* --- TOP KPIs --- */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                {kpis.map((item) => (
                    <Card key={item.title} className="glass-card ring-0 border-t-4 border-indigo-500">
                        <Flex alignItems="start">
                            <div>
                                <Text className="text-slate-500 dark:text-slate-400 uppercase text-xs font-bold tracking-widest">{item.title}</Text>
                                <Metric className="text-slate-900 dark:text-white mt-2">{item.metric}</Metric>
                            </div>
                            <Icon icon={item.icon} variant="solid" color={item.color as any} size="lg" className="shadow-lg rounded-xl" />
                        </Flex>
                    </Card>
                ))}
            </Grid>

            {/* --- ACTIVITY HEATMAP (ThePO) --- */}
            <div className="w-full overflow-x-auto pb-4">
                <div className="min-w-[800px]">
                    <ThePO behaviorData={behaviorData} />
                </div>
            </div>

        </div>
    );
}
